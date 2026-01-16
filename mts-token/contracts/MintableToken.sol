//SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {BankERC20} from "./BankERC20.sol";

/**
 * @title MintableToken
 * @dev ERC20 token with minting capabilities on Injective EVM.
 */
contract MintableToken is BankERC20 {
    address public owner;
    address public factory;

    modifier onlyOwner() {
        require(msg.sender == owner, "MintableToken: caller is not the owner");
        _;
    }

    constructor(
        string memory name_,
        string memory symbol_,
        uint8 decimals_,
        uint256 initialSupply,
        address tokenOwner
    ) payable BankERC20(name_, symbol_, decimals_) {
        factory = msg.sender;
        owner = tokenOwner;
        if (initialSupply > 0) {
            _mint(tokenOwner, initialSupply);
        }
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }

    function burnFrom(address from, uint256 amount) external {
        _spendAllowance(from, msg.sender, amount);
        _burn(from, amount);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(
            newOwner != address(0),
            "MintableToken: new owner is zero address"
        );
        owner = newOwner;
    }
}
