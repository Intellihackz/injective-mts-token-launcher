//SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {MintableToken} from "./MintableToken.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title TokenFactory
 * @dev Factory contract for creating ERC20 tokens on Injective.
 * Charges 1 wINJ fee per token creation. Owner can withdraw fees.
 */
contract TokenFactory {
    address public owner;

    // Hardcoded wINJ contract address on Injective testnet
    address public constant WINJ = 0x0000000088827d2d103ee2d9A6b781773AE03FfB;
    uint256 public constant CREATION_FEE = 1 ether; // 1 wINJ (18 decimals)
    uint256 public constant BANK_MODULE_FEE = 1 ether; // 1 INJ for bank module

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
     * @dev Creates a new token. Requires 1 wINJ fee + 1 INJ for bank module.
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
        // Require exactly 1 INJ for bank module registration
        require(
            msg.value >= BANK_MODULE_FEE,
            "TokenFactory: send 1 INJ for bank module"
        );

        // Collect 1 wINJ fee (user must approve this contract first)
        require(
            IERC20(WINJ).transferFrom(msg.sender, address(this), CREATION_FEE),
            "TokenFactory: wINJ transfer failed (approve first)"
        );

        // Deploy new token with forwarded value for bank module registration
        MintableToken newToken = new MintableToken{value: msg.value}(
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
     * @dev Withdraws all accumulated wINJ fees to the factory owner.
     */
    function withdrawFees() external onlyOwner {
        uint256 balance = IERC20(WINJ).balanceOf(address(this));
        require(balance > 0, "TokenFactory: no fees to withdraw");

        require(
            IERC20(WINJ).transfer(owner, balance),
            "TokenFactory: withdrawal failed"
        );

        emit FeesWithdrawn(owner, balance);
    }

    /**
     * @dev Withdraws wINJ fees to a specific address.
     */
    function withdrawFeesTo(address to) external onlyOwner {
        require(
            to != address(0),
            "TokenFactory: cannot withdraw to zero address"
        );
        uint256 balance = IERC20(WINJ).balanceOf(address(this));
        require(balance > 0, "TokenFactory: no fees to withdraw");

        require(
            IERC20(WINJ).transfer(to, balance),
            "TokenFactory: withdrawal failed"
        );

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
     * @dev Returns the contract's current wINJ balance (accumulated fees).
     */
    function getAccumulatedFees() external view returns (uint256) {
        return IERC20(WINJ).balanceOf(address(this));
    }

    // Allow contract to receive native INJ for bank module
    receive() external payable {}
}
