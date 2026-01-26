# Part 1: Smart Contract Development

Welcome to the smart contract development section! Your environment is already set up from the main tutorial, so we can jump straight into understanding the contracts.

## Table of Contents

* [Understanding the Contracts](#understanding-the-contracts)
* [TokenFactory Contract](#tokenfactory-contract)
* [MintableToken Contract](#mintabletoken-contract)
* [Bank Module Integration](#bank-module-integration)
* [Deploying to Testnet](#deploying-to-testnet)
* [Verifying Your Contract](#verifying-your-contract)

---

## Understanding the Contracts

Our Token Launcher uses three main smart contracts:

1. **TokenFactory** - The main contract that creates new tokens
2. **MintableToken** - The ERC20 token template
3. **BankERC20** - Integrates tokens with Injective's bank module

Let's explore each one in detail.

---

## TokenFactory Contract

The TokenFactory is the heart of our token launcher. It handles token creation, fee collection, and deployment.

### Complete TokenFactory Code

<details>
<summary>Click to view complete TokenFactory.sol</summary>

```solidity
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
     * @dev Returns the contract's current INJ balance (accumulated platform fees).
     */
    function getAccumulatedFees() external view returns (uint256) {
        return address(this).balance;
    }

    // Allow contract to receive native INJ
    receive() external payable {}
}
```

</details>

### Key Features Explained

#### Fee Structure

```solidity
uint256 public constant PLATFORM_FEE = 1 ether; // 1 INJ platform fee
uint256 public constant BANK_MODULE_FEE = 1 ether; // 1 INJ for bank module
uint256 public constant TOTAL_FEE = PLATFORM_FEE + BANK_MODULE_FEE; // 2 INJ total
```

* **PLATFORM_FEE**: 1 INJ kept by the factory (can be withdrawn by owner)
* **BANK_MODULE_FEE**: 1 INJ forwarded for bank module registration
* **TOTAL_FEE**: 2 INJ total that users must send

#### Token Creation Function

```solidity
function createToken(
    string memory name,
    string memory symbol,
    uint8 decimals,
    uint256 initialSupply
) external payable returns (address tokenAddress)
```

This is the main function users call to create their tokens. Here's how it works:

1. **Validates Native INJ Payment**:
   ```solidity
   require(
       msg.value >= TOTAL_FEE,
       "TokenFactory: send 2 INJ (1 INJ platform fee + 1 INJ bank module)"
   );
   ```
   The user must send at least 2 INJ as native value.

2. **Deploys New Token**:
   ```solidity
   MintableToken newToken = new MintableToken{value: BANK_MODULE_FEE}(
       name,
       symbol,
       decimals,
       initialSupply,
       msg.sender
   );
   ```
   Creates a new MintableToken contract, forwarding 1 INJ for bank registration. The remaining 1 INJ stays in the factory as the platform fee.

3. **Emits Event**:
   ```solidity
   emit TokenCreated(
       tokenAddress,
       msg.sender,
       name,
       symbol,
       initialSupply
   );
   ```
   Logs the creation for off-chain tracking.

#### Events

```solidity
event TokenCreated(
    address indexed tokenAddress,
    address indexed creator,
    string name,
    string symbol,
    uint256 initialSupply
);
```

The `TokenCreated` event allows the frontend to:
* Track all created tokens
* Display token addresses to users
* Build a token registry

---

## MintableToken Contract

Each token created by the factory is an instance of MintableToken - a full ERC20 token with additional mint and burn capabilities.

### Complete MintableToken Code

<details>
<summary>Click to view complete MintableToken.sol</summary>

```solidity
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
```

</details>

### Key Features Explained

#### State Variables

```solidity
address public owner;
address public factory;
```

* **owner**: The account that can mint new tokens (initially the creator)
* **factory**: Records which factory created this token

#### Constructor

```solidity
constructor(
    string memory name_,
    string memory symbol_,
    uint8 decimals_,
    uint256 initialSupply,
    address tokenOwner
) payable BankERC20(name_, symbol_, decimals_)
```

The constructor:
1. Calls `BankERC20` constructor to register with the bank module
2. Sets the factory address to `msg.sender` (the TokenFactory)
3. Sets the owner to `tokenOwner` (the user who created it)
4. Mints the initial supply to the owner

#### Mint Function

```solidity
function mint(address to, uint256 amount) external onlyOwner {
    _mint(to, amount);
}
```

Only the token owner can mint new tokens. This allows for controlled supply expansion.

#### Burn Functions

```solidity
function burn(uint256 amount) external {
    _burn(msg.sender, amount);
}

function burnFrom(address from, uint256 amount) external {
    _spendAllowance(from, msg.sender, amount);
    _burn(from, amount);
}
```

* **burn**: Anyone can burn their own tokens
* **burnFrom**: Burn tokens from another address (requires allowance)

---

## Bank Module Integration

The `BankERC20` contract is what makes tokens work seamlessly with Injective's native bank module.

### What is the Bank Module?

Injective's bank module is a precompiled contract at address `0x0000000000000000000000000000000000000064` that manages token stat e. When tokens use `BankERC20`, they:

* Store balances in the bank module (not in the contract)
* Can be transferred via native Injective transactions
* Are visible in Injective wallets
* Work with IBC (Inter-Blockchain Communication)

### Key Functions

```solidity
function balanceOf(address account) public view virtual override returns (uint256) {
    return bank.balanceOf(address(this), account);
}

function totalSupply() public view virtual override returns (uint256) {
    return bank.totalSupply(address(this));
}
```

Instead of storing data in mappings, these functions query the bank module.

---

## Deploying to Testnet

Now let's deploy the TokenFactory to Injective EVM testnet.

### Deployment Script

Your project already has a deployment script at `script/deploy.js`:

<details>
<summary>Click to view deploy script</summary>

```javascript
const hre = require("hardhat");

async function main() {
    console.log("Deploying TokenFactory...\\n");

    const TokenFactory = await hre.ethers.getContractFactory("TokenFactory");
    const factory = await TokenFactory.deploy();

    await factory.waitForDeployment();
    const factoryAddress = await factory.getAddress();
    const [deployer] = await hre.ethers.getSigners();

    console.log("✅ TokenFactory deployed successfully!");
    console.log(`  Contract Address: ${factoryAddress}`);
    console.log(`  Owner (you): ${deployer.address}`);
    console.log("\\n📋 Factory Features:");
    console.log("  - Users pay 2 INJ total to create tokens");
    console.log("  - 1 INJ platform fee + 1 INJ bank module registration");
    console.log("  - Owner can withdraw accumulated platform fees");
    console.log("\\n📝 To create a token, users must:");
    console.log("  - Call createToken() with 2 INJ as msg.value");
    console.log(`\\nrun npx hardhat verify --network inj_testnet ${factoryAddress}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
```

</details>

### Prerequisites

Before deploying, ensure you have:

1. **Private key** in `.env` file:
   ```env
   PRIVATE_KEY=your_private_key_here
   INJECTIVE_RPC=https://k8s.testnet.json-rpc.injective.network/
   ```

2. **Testnet INJ** for gas fees:
   * Visit [Injective Testnet Faucet](https://testnet.faucet.injective.network/)
   * Get at least 1-2 INJ for deployment

### Compile Contracts

First, compile all contracts:

```bash
cd mts-token
npx hardhat compile
```

You should see:

```bash
Compiled 5 Solidity files successfully
```

### Deploy TokenFactory

Run the deployment script:

```bash
npx hardhat run script/deploy.js --network inj_testnet
```

You should see:

```bash
Deploying TokenFactory...

✅ TokenFactory deployed successfully!
  Contract Address: 0x5c68BDa376ed8eBcc96a5FA9D721772c16dF5f06
  Owner (you): 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb

📋 Factory Features:
  - Users pay 2 INJ total to create tokens
  - 1 INJ platform fee + 1 INJ bank module registration
  - Owner can withdraw accumulated platform fees

📝 To create a token, users must:
  - Call createToken() with 2 INJ as msg.value

run npx hardhat verify --network inj_testnet 0x5c68BDa376ed8eBcc96a5FA9D721772c16dF5f06
```

**Save your contract address!** You'll need it for the frontend configuration.

---

## Verifying Your Contract

Contract verification allows anyone to view your source code on BlockScout and interact with it directly.

### Verify TokenFactory

Using the address from your deployment output:

```bash
npx hardhat verify --network inj_testnet <YOUR_FACTORY_ADDRESS>
```

Example:

```bash
npx hardhat verify --network inj_testnet 0x5c68BDa376ed8eBcc96a5FA9D721772c16dF5f06
```

You should see:

```bash
Successfully verified contract TokenFactory on BlockScout.
https://testnet.blockscout.injective.network/address/0x5c68BDa376ed8eBcc96a5FA9D721772c16dF5f06#code
```

### Viewing on BlockScout

Visit your contract on BlockScout:

```
https://testnet.blockscout.injective.network/address/<YOUR_FACTORY_ADDRESS>
```

You should see:
* ✅ Contract verified (green checkmark)
* Source code viewable under "Code" tab
* Read/Write contract functions available
* All constants visible (WINJ address, fees, etc.)

---

## Next Steps

Congratulations! Your TokenFactory is now live on Injective EVM testnet. 

**What you've accomplished:**
* ✅ Deployed TokenFactory contract
* ✅ Verified contract on BlockScout  
* ✅ Ready to create tokens programmatically

**What's next:**
* Build the frontend to interact with your factory
* Allow users to create tokens through a beautiful UI
* Enable users to add tokens to MetaMask automatically

**[Continue to Part 2: Frontend Development →](TUTORIAL-frontend.md)**

In Part 2, we'll:

* Build the React UI
* Connect to MetaMask
* Interact with your deployed contract
* Create a complete user interface