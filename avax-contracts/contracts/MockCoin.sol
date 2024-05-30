// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockCoin is ERC20 {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {}

    // Function to mint tokens
    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }

    // Function to burn tokens
    function burn(address from, uint256 amount) public {
        _burn(from, amount);
    }
}
