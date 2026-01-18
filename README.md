# inject.fun - Injective Token Launcher

A decentralized token creation platform built on **Injective EVM** that allows users to easily create and deploy custom ERC20 tokens with a sleek, user-friendly interface.

## 🌟 Overview

inject.fun is a comprehensive token factory application that combines smart contracts with a modern React frontend, enabling users to:

- **Create custom ERC20 tokens** with configurable name, symbol, decimals, and initial supply
- **Wrap/Unwrap INJ tokens** to wINJ (Wrapped INJ) for use in the ecosystem
- **Manage token ownership** with built-in minting and burning capabilities

## 🏗️ Project Structure

```
injective-tutorials/
├── mts-frontend/          # React + TypeScript frontend
│   ├── src/
│   │   ├── App.tsx        # Main application with token creation UI
│   │   ├── App.css        # Styling
│   │   └── assets/        # Images and assets
│   └── package.json       # Frontend dependencies
│
└── mts-token/             # Smart contracts (Hardhat)
    ├── contracts/
    │   ├── TokenFactory.sol      # Factory contract for creating tokens
    │   ├── MintableToken.sol     # ERC20 token with mint/burn capabilities
    │   ├── BankERC20.sol         # Injective bank module integration
    │   └── Bank.sol              # Bank module interface
    ├── script/                   # Deployment scripts
    └── package.json              # Contract dependencies
```

## 🚀 Features

### Token Factory Smart Contract
- **Dual Fee System**: Requires 1 wINJ + 1 INJ for token creation
  - 1 wINJ: Factory creation fee (transferable to contract owner)
  - 1 INJ: Bank module registration fee (for Injective compatibility)
- **Owner Management**: Factory owner can withdraw accumulated fees
- **OpenZeppelin Integration**: Built on secure, audited ERC20 standards

### Mintable Token Features
- **Flexible Minting**: Token owners can mint additional supply
- **Burn Capabilities**: Users can burn their own tokens or approved amounts
- **Ownership Transfer**: Token ownership can be transferred
- **Injective Bank Module**: Automatic registration with Injective's bank module for seamless DeFi integration

### Frontend Application
- **Wallet Integration**: MetaMask connection with automatic network switching
- **Live Balance Display**: Real-time INJ and wINJ balance tracking
- **Token Creation Interface**: Simple form-based token creation
- **Wrap/Unwrap Functionality**: Convert between INJ ↔ wINJ
- **Transaction Status**: Clear feedback on all operations
- **MetaMask Integration**: Add created tokens directly to MetaMask

## 🛠️ Technology Stack

### Smart Contracts
- **Solidity** ^0.8.20
- **Hardhat** - Development environment
- **OpenZeppelin Contracts** - Secure ERC20 implementation
- **Injective EVM** - Deployment target

### Frontend
- **React** 19.2.0
- **TypeScript** 5.9.3
- **Vite** 7.2.4 - Build tool
- **ethers.js** 6.16.0 - Ethereum library

## 📦 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MetaMask browser extension
- Some testnet INJ tokens

### Backend (Smart Contracts)

```bash
cd mts-token
npm install

# Configure environment variables
# Create .env file with:
# PRIVATE_KEY=your_private_key
# INJECTIVE_RPC=https://k8s.testnet.json-rpc.injective.network/

# Compile contracts
npx hardhat compile

# Deploy to Injective testnet
npx hardhat run script/deploy.js --network injectiveTestnet
```

### Frontend

```bash
cd mts-frontend
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 🔧 Configuration

### Network Details (Injective EVM Testnet)
- **Chain ID**: 1439 (0x59f)
- **RPC URL**: https://k8s.testnet.json-rpc.injective.network/
- **Explorer**: https://testnet.blockscout.injective.network/blocks
- **Currency**: INJ (18 decimals)

### Contract Addresses
- **wINJ Token**: `0x0000000088827d2d103ee2d9A6b781773AE03FfB`
- **Token Factory**: `0xeF0AAFB18e12296A074Df9EaE10DCEBF22EA060e`

## 💡 Usage

### Creating a Token

1. **Connect Wallet**: Click "Connect Wallet" to connect MetaMask
2. **Get wINJ**: Use the wrap function to convert 1+ INJ to wINJ
3. **Fill Token Details**:
   - Name: Full token name
   - Ticker: Token symbol (e.g., "TKN")
   - Supply: Initial token supply
   - Decimal: Token decimals (typically 18)
4. **Create Token**: Click "create token" and approve transactions
5. **Add to Wallet**: Use the modal to add your new token to MetaMask

### Wrapping/Unwrapping INJ

- **Wrap**: Convert INJ → wINJ (needed for token creation fee)
- **Unwrap**: Convert wINJ → INJ

## 📝 Smart Contract Functions

### TokenFactory.sol

```solidity
// Create a new token (requires 1 wINJ approval + 1 INJ msg.value)
createToken(string name, string symbol, uint8 decimals, uint256 initialSupply)

// View functions
getAccumulatedFees() returns (uint256)

// Owner functions
withdrawFees()
transferOwnership(address newOwner)
```

### MintableToken.sol

```solidity
// ERC20 standard functions + extensions
mint(address to, uint256 amount)         // Owner only
burn(uint256 amount)                     // Anyone can burn their tokens
burnFrom(address from, uint256 amount)   // Burn with allowance
transferOwnership(address newOwner)      // Owner only
```

## 🔒 Security Features

- **OpenZeppelin Standards**: Uses battle-tested ERC20 implementation
- **Access Control**: Owner-only functions for critical operations
- **Fee Requirements**: Enforced dual-fee system prevents spam
- **Approval Mechanism**: wINJ transfer requires prior user approval
- **Bank Module Integration**: Automatic Injective ecosystem compatibility

## 🎨 UI/UX Highlights

- **Modern Black & White Theme**: Clean, professional aesthetic
- **Responsive Design**: Works on desktop and mobile
- **Real-time Feedback**: Loading states and transaction status
- **Network Auto-Switch**: Automatically adds Injective network to MetaMask
- **Error Handling**: Clear error messages for common issues

## 🧪 Testing

```bash
# Run contract tests
cd mts-token
npx hardhat test

# Run frontend in dev mode
cd mts-frontend
npm run dev
```

## 📄 License

MIT

## 🤝 Contributing

This is a tutorial/demonstration project for the Injective ecosystem. Feel free to fork and build upon it!

## 🔗 Resources

- [Injective Documentation](https://docs.injective.network/)
- [Injective EVM Testnet Explorer](https://testnet.blockscout.injective.network/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Hardhat Documentation](https://hardhat.org/docs)

## 💬 Support

For issues or questions related to Injective development, visit the [Injective Discord](https://discord.gg/injective) or check the [official documentation](https://docs.injective.network/).

---

**Built with ❤️ for the Injective ecosystem**
