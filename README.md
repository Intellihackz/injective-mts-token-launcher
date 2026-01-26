# 🏭 inject.fun - Injective Token Launcher

A decentralized token creation platform built on the Injective EVM testnet, allowing users to easily create and deploy custom ERC20 tokens with a sleek, user-friendly interface.

![inject.fun Interface](./assets/./final-ui.png)

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Architecture](#️-architecture)
- [Tech Stack](#️-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Usage](#-usage)
- [Smart Contracts](#-smart-contracts)
- [Project Structure](#-project-structure)

## 🌟 Overview

inject.fun is a token factory application that demonstrates seamless token creation on the Injective EVM. Users can create custom ERC20 tokens with configurable parameters and automatically add them to MetaMask with just a few clicks.

📖 **Want to build this yourself?** Check out our [step-by-step tutorial](TUTORIAL.md) to learn how to create this application from scratch!

## ✨ Features

### Core Functionality

- 🪙 **Custom Token Creation**: Deploy ERC20 tokens with custom name, ticker, supply, and decimals
- 💳 **Simple Payment**: Pay 2 INJ to create and deploy your token
- 🔐 **MetaMask Integration**: Seamless wallet connection and transaction signing
- ➕ **One-Click Token Import**: Automatically add your created token to MetaMask

### User Experience

- 🎨 Clean, minimalist black & white theme
- ⚡ Real-time INJ balance display
- 📱 Simple, intuitive token creation form
- 🔔 Live transaction status updates
- ✅ Success modal with token details and MetaMask import

## 🏗️ Architecture

The project consists of three main components:

1. **Smart Contracts**: TokenFactory contract for deploying new ERC20 tokens
2. **Frontend** (React + TypeScript): User interface for token creation
3. **Deployment Scripts**: Hardhat scripts for deploying contracts

### How It Works

```text
User Wallet → Connect MetaMask → Create Token (2 INJ) → Add to MetaMask
```

1. User connects MetaMask wallet to Injective EVM testnet
2. User fills in token parameters (name, ticker, supply, decimals)
3. User pays 2 INJ creation fee and confirms transaction
4. TokenFactory deploys a new ERC20 token contract
5. Success modal displays token details with copy and MetaMask import options

## 🛠️ Tech Stack

### Smart Contracts

- **Solidity** ^0.8.20
- **Hardhat** - Development environment
- **OpenZeppelin** contracts for secure ERC20 implementation

### Frontend

- **React** 19.2.0
- **TypeScript** 5.9.3
- **Vite** 7.2.4
- **Ethers.js** 6.16.0

### Network

- **Injective EVM Testnet**
- Chain ID: `0x59f` (1439)
- RPC: `https://k8s.testnet.json-rpc.injective.network/`

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **MetaMask** browser extension
- **Git**

You'll also need:

- Test INJ tokens from the [Injective Testnet Faucet](https://testnet.faucet.injective.network/)
- At least 2 INJ for token creation

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/inject-fun.git
cd injective-tutorials
```

### 2. Install Contract Dependencies

```bash
cd mts-token
npm install
```

### 3. Install Frontend Dependencies

```bash
cd ../mts-frontend
npm install
```

### 4. Configure Environment Variables

Create a `.env` file in the `mts-token` directory:

```env
PRIVATE_KEY=your_wallet_private_key_here
INJECTIVE_RPC=https://k8s.testnet.json-rpc.injective.network/
```

> ⚠️ **Security Warning**: Never commit your `.env` file or share your private key!

## 💻 Usage

### Compile Smart Contracts

```bash
cd mts-token
npx hardhat compile
```

### Deploy to Injective Testnet

```bash
npx hardhat run script/deploy.js --network inj_testnet
```

After deployment, note the contract addresses displayed in the console.

### Run Frontend Development Server

```bash
cd mts-frontend
npm run dev
```

The application will be available at `http://localhost:5173`

### Connect Your Wallet

1. Open the app in your browser
2. Click "Connect Wallet" in the top right
3. Approve the MetaMask connection
4. Switch to Injective EVM testnet (automatic prompt)

### Create a Token

1. Fill in token details:
   - **name**: Full token name (e.g., "My Awesome Token")
   - **ticker**: Token symbol (e.g., "MAT")
   - **supply**: Initial token supply (e.g., 1000000)
   - **decimal**: Token decimals (typically 18)
2. Click "create token"
3. Confirm the transaction in MetaMask (2 INJ payment)
4. Wait for confirmation
5. Success modal appears with token details
6. Click "Add to MetaMask" to import your new token
7. Click "Copy Address" to copy the token contract address

## 📂 Project Structure

```text
injective-tutorials/
├── mts-token/
│   ├── contracts/
│   │   ├── TokenFactory.sol       # Factory contract for creating tokens
│   │   ├── MintableToken.sol      # ERC20 token with mint/burn capabilities
│   │   ├── BankERC20.sol          # Injective bank module integration
│   │   └── Bank.sol               # Bank module interface
│   ├── script/
│   │   └── deploy.js              # Deployment script
│   ├── hardhat.config.js          # Hardhat configuration
│   └── package.json
├── mts-frontend/
│   ├── src/
│   │   ├── App.tsx                # Main application component
│   │   ├── App.css                # Styling
│   │   └── assets/                # Static assets
│   ├── vite.config.ts             # Vite configuration
│   └── package.json
└── README.md                       # This file
```

## 🔍 Key Files

- [mts-token/contracts/TokenFactory.sol](mts-token/contracts/TokenFactory.sol): The factory contract that deploys new tokens
- [mts-token/contracts/MintableToken.sol](mts-token/contracts/MintableToken.sol): The ERC20 token template
- [mts-frontend/src/App.tsx](mts-frontend/src/App.tsx): React application with token creation interface
- [mts-token/script/deploy.js](mts-token/script/deploy.js): Contract deployment script
- [mts-token/hardhat.config.js](mts-token/hardhat.config.js): Network and compiler configuration

## 🧪 Testing

Run contract tests:

```bash
cd mts-token
npx hardhat test
```

## 🌐 Network Configuration

### Injective EVM Testnet

- **Chain ID**: 1439 (0x59f)
- **RPC URL**: <https://k8s.testnet.json-rpc.injective.network/>
- **Block Explorer**: <https://testnet.blockscout.injective.network/blocks>
- **Faucet**: <https://testnet.faucet.injective.network/>

📖 **Want to build this yourself?** Check out our [step-by-step tutorial](TUTORIAL.md) to learn how to create this application from scratch!

**Built with ❤️ for the Injective ecosystem**
