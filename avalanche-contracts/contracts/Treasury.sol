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
     * @param fromToken The address of the token to be transferred from the sender.
     * @param toToken The address of the token to be transferred to the receiver.
     * @param from The address from which the tokens will be transferred.
     * @param to The address to which the tokens will be transferred.
     * @param amount The amount of tokens to be transferred.
     */
    function transferTokens(address fromToken, address toToken, address from, address to, uint256 amount) public onlyRole(CONTROLLER_ROLE) {
        require(supportedTokens[fromToken], "From token not supported");
        require(supportedTokens[toToken], "To token not supported");
        require(IERC20(fromToken).balanceOf(from) >= amount, "Insufficient liquidity from sender");

        // Get the latest exchange rate from Chainlink
        (uint256 exchangeRate, uint8 decimals) = getLatestPrice(fromToken, toToken);

        // Calculate the amount of tokens to receive
        uint256 amountOut = (amount * exchangeRate) / (10 ** decimals);

        require(IERC20(toToken).balanceOf(address(this)) >= amountOut, "Insufficient liquidity in the Treasury");
        
        // Transfer tokens using contract liquidity
        require(IERC20(fromToken).transferFrom(from, address(this), amount), "From token transfer failed");
        require(IERC20(toToken).transfer(to, amountOut), "To token transfer failed");

        emit TokensTransferred(toToken, from, to, amountOut);
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
    function getLatestPrice(address fromToken, address toToken) public view returns (uint256, uint8) {
        AggregatorV3Interface priceFeed = priceFeeds[fromToken][toToken];
        require(address(priceFeed) != address(0), "Price feed not set for this token pair");

        (, int price, , , ) = priceFeed.latestRoundData();
        return (uint256(price), priceFeed.decimals());
    }
}
