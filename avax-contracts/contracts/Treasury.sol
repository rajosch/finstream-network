// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

/**
 * @title Treasury
 * @dev Treasury contract to handle ERC-20 token transfers and liquidity management.
 */
contract Treasury is AccessControl {
    mapping(address => bool) public supportedTokens;
    mapping(address => mapping(address => AggregatorV3Interface)) public priceFeeds;
    mapping(address => mapping(address => uint256)) public borrowedAmounts;
    mapping(address => mapping(address => uint256)) public maxLiquidityPerUser;

    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");
    bytes32 public constant CONTROLLER_ROLE = keccak256("CONTROLLER_ROLE");

    /**
     * @dev Emitted when a token is added to the supported list.
     * @param token The address of the token.
     */
    event TokenAdded(address indexed token);

    /**
     * @dev Emitted when a token is removed from the supported list.
     * @param token The address of the token.
     */
    event TokenRemoved(address indexed token);

    /**
     * @dev Emitted when liquidity is added.
     * @param token The address of the token.
     * @param amount The amount of tokens added.
     */
    event LiquidityAdded(address indexed token, uint256 amount);

    /**
     * @dev Emitted when liquidity is removed.
     * @param token The address of the token.
     * @param amount The amount of tokens removed.
     */
    event LiquidityRemoved(address indexed token, uint256 amount);

    /**
     * @dev Emitted when tokens are transferred.
     * @param token The address of the token.
     * @param from The address from which the tokens were transferred.
     * @param to The address to which the tokens were transferred.
     * @param amount The amount of tokens transferred.
     */
    event TokensTransferred(address indexed token, address indexed from, address indexed to, uint256 amount);

    /**
     * @dev Emitted when tokens are exchanged.
     * @param fromToken The address of the token being exchanged from.
     * @param toToken The address of the token being exchanged to.
     * @param amountIn The amount of tokens exchanged.
     * @param amountOut The amount of tokens received.
     */
    event TokensExchanged(address indexed fromToken, address indexed toToken, uint256 amountIn, uint256 amountOut);

    /**
     * @dev Emitted when liquidity is borrowed.
     * @param borrower The address of the borrower.
     * @param token The address of the token.
     * @param amount The amount of tokens borrowed.
     */
    event LiquidityBorrowed(address indexed borrower, address indexed token, uint256 amount);

    /**
     * @dev Emitted when liquidity is repaid.
     * @param borrower The address of the borrower.
     * @param token The address of the token.
     * @param amount The amount of tokens repaid.
     */
    event LiquidityRepaid(address indexed borrower, address indexed token, uint256 amount);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MANAGER_ROLE, msg.sender);
        _grantRole(CONTROLLER_ROLE, msg.sender);
    }

    /**
     * @dev Function to add a token to the supported list.
     * @param token The address of the token to be added.
     */
    function addSupportedToken(address token) public onlyRole(MANAGER_ROLE) {
        supportedTokens[token] = true;
        emit TokenAdded(token);
    }

    /**
     * @dev Function to remove a token from the supported list.
     * @param token The address of the token to be removed.
     */
    function removeSupportedToken(address token) public onlyRole(MANAGER_ROLE) {
        supportedTokens[token] = false;
        emit TokenRemoved(token);
    }

    /**
     * @dev Function to set a price feed for a token pair.
     * @param fromToken The address of the token to exchange from.
     * @param toToken The address of the token to exchange to.
     * @param priceFeed The address of the Chainlink price feed aggregator.
     */
    function setPriceFeed(address fromToken, address toToken, address priceFeed) public onlyRole(MANAGER_ROLE) {
        priceFeeds[fromToken][toToken] = AggregatorV3Interface(priceFeed);
    }

    /**
     * @dev Transfer tokens on behalf of a client.
     * @param token The address of the token to be transferred.
     * @param from The address from which the tokens will be transferred.
     * @param to The address to which the tokens will be transferred.
     * @param amount The amount of tokens to be transferred.
     * @param client The address of the client on whose behalf the transfer is made.
     */
    function transferTokens(address token, address from, address to, uint256 amount, address client) public onlyRole(CONTROLLER_ROLE) {
        require(supportedTokens[token], "Token not supported");

        // Check if the client holds enough of the token
        if (IERC20(token).balanceOf(client) >= amount) {
            // Client has enough tokens, transfer them directly
            require(IERC20(token).transferFrom(client, to, amount), "Token transfer failed");
        } else {
            // Check if the contract has enough liquidity to cover the amount
            uint256 tokenBalance = IERC20(token).balanceOf(address(this));
            require(tokenBalance >= amount, "Insufficient liquidity in the Treasury");

            uint256 maxBorrowAmount = maxLiquidityPerUser[client][token];
            require(amount <= maxBorrowAmount, "Borrow amount exceeds allowed limit");

            // Transfer tokens using contract liquidity
            require(IERC20(token).transfer(to, amount), "Token transfer failed");

            // Update borrowed amount
            borrowedAmounts[client][token] += amount;
            emit LiquidityBorrowed(client, token, amount);
        }

        emit TokensTransferred(token, from, to, amount);
    }

    /**
     * @dev Add liquidity to the pool.
     * @param token The address of the token to add.
     * @param amount The amount of tokens to add.
     */
    function addLiquidity(address token, uint256 amount) public onlyRole(MANAGER_ROLE) {
        require(supportedTokens[token], "Token not supported");
        IERC20(token).transferFrom(msg.sender, address(this), amount);
        emit LiquidityAdded(token, amount);
    }

    /**
     * @dev Remove liquidity from the pool.
     * @param token The address of the token to remove.
     * @param amount The amount of tokens to remove.
     */
    function removeLiquidity(address token, uint256 amount) public onlyRole(MANAGER_ROLE) {
        require(supportedTokens[token], "Token not supported");
        IERC20(token).transfer(msg.sender, amount);
        emit LiquidityRemoved(token, amount);
    }

    /**
     * @dev Get the current exchange rate from Chainlink.
     * @param fromToken The address of the token to exchange from.
     * @param toToken The address of the token to exchange to.
     * @return The latest price.
     */
    function getLatestPrice(address fromToken, address toToken) public view returns (uint256) {
        AggregatorV3Interface priceFeed = priceFeeds[fromToken][toToken];
        require(address(priceFeed) != address(0), "Price feed not set for this token pair");

        (, int price, , , ) = priceFeed.latestRoundData();
        return uint256(price);
    }

    /**
     * @dev Exchange tokens on behalf of a client using an external DEX, with additional checks.
     * @param fromToken The address of the token to exchange from.
     * @param toToken The address of the token to exchange to.
     * @param amountIn The amount of tokens to be exchanged.
     * @param minAmountOut The minimum amount of tokens to receive from the exchange.
     * @param client The address of the client on whose behalf the exchange is made.
     */
    function exchangeTokens(address fromToken, address toToken, uint256 amountIn, uint256 minAmountOut, address client) public onlyRole(CONTROLLER_ROLE) {
        require(supportedTokens[fromToken], "From token not supported");
        require(supportedTokens[toToken], "To token not supported");

        // Get the latest exchange rate from Chainlink
        uint256 exchangeRate = getLatestPrice(fromToken, toToken);

        // Calculate the amount of tokens to receive
        uint256 amountOut = (amountIn * exchangeRate) / (10 ** 18);

        require(amountOut >= minAmountOut, "Insufficient output amount");

        // Check if the client holds enough of the 'to' token
        if (IERC20(toToken).balanceOf(client) >= amountOut) {
            // Client has enough 'to' token, transfer it directly
            require(IERC20(toToken).transferFrom(client, address(this), amountOut), "To token transfer failed");
            IERC20(toToken).transfer(client, amountOut);
        } else if (IERC20(fromToken).balanceOf(client) >= amountIn) {
            // Client has enough 'from' token, swap it with the 'to' amount handled by the contract
            require(IERC20(fromToken).transferFrom(client, address(this), amountIn), "From token transfer failed");
            require(IERC20(toToken).transfer(client, amountOut), "To token transfer failed");
        } else {
            // Check liquidity provided by the contract
            uint256 fromTokenBalance = IERC20(fromToken).balanceOf(address(this));
            uint256 toTokenBalance = IERC20(toToken).balanceOf(address(this));

            require(fromTokenBalance >= amountIn, "Insufficient fromToken liquidity in the Treasury");
            require(toTokenBalance >= amountOut, "Insufficient toToken liquidity in the Treasury");

            uint256 maxBorrowAmount = maxLiquidityPerUser[client][fromToken];
            require(amountOut <= maxBorrowAmount, "Borrow amount exceeds allowed limit");

            // Transfer tokens using contract liquidity
            require(IERC20(fromToken).transfer(address(this), amountIn), "From token transfer failed");
            require(IERC20(toToken).transfer(client, amountOut), "To token transfer failed");

            // Update borrowed amount
            borrowedAmounts[client][toToken] += amountOut;
            emit LiquidityBorrowed(client, toToken, amountOut);
        }

        emit TokensExchanged(fromToken, toToken, amountIn, amountOut);
    }

    /**
     * @dev Repay borrowed tokens.
     * @param token The address of the token to repay.
     * @param amount The amount of tokens to repay.
     * @param client The address of the client repaying the borrowed tokens.
     */
    function repayBorrowedTokens(address token, uint256 amount, address client) public onlyRole(CONTROLLER_ROLE) {
        require(supportedTokens[token], "Token not supported");
        require(borrowedAmounts[client][token] >= amount, "Repay amount exceeds borrowed amount");

        // Transfer tokens back to the contract
        require(IERC20(token).transferFrom(client, address(this), amount), "Repay token transfer failed");

        // Update borrowed amount
        borrowedAmounts[client][token] -= amount;
        emit LiquidityRepaid(client, token, amount);
    }

    /**
     * @dev Set the maximum liquidity that can be borrowed per user per token.
     * @param user The address of the user.
     * @param token The address of the token.
     * @param amount The maximum amount that can be borrowed.
     */
    function setMaxLiquidityPerUser(address user, address token, uint256 amount) public onlyRole(MANAGER_ROLE) {
        maxLiquidityPerUser[user][token] = amount;
    }
}
