//SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {MintableToken} from "./MintableToken.sol";

/**
 * @title TokenFactory
 * @dev Factory contract for creating ERC20 tokens on Injective.
 * Charges 2 INJ total fee per token creation (1 INJ platform fee + 1 INJ for bank module).
 * Owner can withdraw accumulated platform fees.
 */
contract TokenFactory {
    address public owner;

    uint256 public constant PLATFORM_FEE = 1 ether; // 1 INJ platform fee
    uint256 public constant BANK_MODULE_FEE = 1 ether; // 1 INJ for bank module
    uint256 public constant TOTAL_FEE = PLATFORM_FEE + BANK_MODULE_FEE; // 2 INJ total

    event TokenCreated(
        address indexed tokenAddress,
        address indexed creator,
        string name,
        string symbol,
        uint256 initialSupply
    );

    event FeesWithdrawn(address indexed to, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "TokenFactory: caller is not the owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @dev Creates a new token. Requires 2 INJ total (1 INJ platform fee + 1 INJ for bank module).
     * @param name Token name
     * @param symbol Token symbol
     * @param decimals Token decimals (typically 18)
     * @param initialSupply Initial supply to mint to the caller
     * @return tokenAddress Address of the newly created token
     */
    function createToken(
        string memory name,
        string memory symbol,
        uint8 decimals,
        uint256 initialSupply
    ) external payable returns (address tokenAddress) {
        // Require exactly 2 INJ (1 INJ platform fee + 1 INJ for bank module)
        require(
            msg.value >= TOTAL_FEE,
            "TokenFactory: send 2 INJ (1 INJ platform fee + 1 INJ bank module)"
        );

        // Deploy new token with bank module fee forwarded
        MintableToken newToken = new MintableToken{value: BANK_MODULE_FEE}(
            name,
            symbol,
            decimals,
            initialSupply,
            msg.sender
        );

        tokenAddress = address(newToken);

        emit TokenCreated(
            tokenAddress,
            msg.sender,
            name,
            symbol,
            initialSupply
        );

        return tokenAddress;
    }

    /**
     * @dev Withdraws all accumulated INJ platform fees to the factory owner.
     */
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "TokenFactory: no fees to withdraw");

        (bool success, ) = payable(owner).call{value: balance}("");
        require(success, "TokenFactory: withdrawal failed");

        emit FeesWithdrawn(owner, balance);
    }

    /**
     * @dev Withdraws INJ platform fees to a specific address.
     */
    function withdrawFeesTo(address to) external onlyOwner {
        require(
            to != address(0),
            "TokenFactory: cannot withdraw to zero address"
        );
        uint256 balance = address(this).balance;
        require(balance > 0, "TokenFactory: no fees to withdraw");

        (bool success, ) = payable(to).call{value: balance}("");
        require(success, "TokenFactory: withdrawal failed");

        emit FeesWithdrawn(to, balance);
    }

    /**
     * @dev Transfers factory ownership.
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(
            newOwner != address(0),
            "TokenFactory: new owner is zero address"
        );
        owner = newOwner;
    }

    /**
     * @dev Returns the contract's current INJ balance (accumulated platform fees).
     */
    function getAccumulatedFees() external view returns (uint256) {
        return address(this).balance;
    }

    // Allow contract to receive native INJ for bank module
    receive() external payable {}
}
