# Part 2: Frontend Development

Welcome to the frontend development section! Your environment is already set up from the main tutorial, so we can jump straight into building the UI.

## Table of Contents

* [Building the Base UI](#building-the-base-ui)
* [Connecting to MetaMask](#connecting-to-metamask)
* [Implementing Wrap/Unwrap Functionality](#implementing-wrapunwrap-functionality)
* [Creating Tokens](#creating-tokens)
* [Adding Tokens to MetaMask](#adding-tokens-to-metamask)

---

## Building the Base UI

We'll start by building the complete user interface with mock data and state management. This lets us see how everything will look before adding blockchain complexity.

### Project Structure

Your frontend folder should have this structure:

```
mts-frontend/
├── src/
│   ├── App.tsx         # Main app component (we'll build this)
│   ├── App.css         # Styling
│   └── main.tsx        # Entry point
├── public/
│   └── assets/
│       └── logo.png    # inject.fun logo
└── package.json
```

### Installing Dependencies

Make sure you have ethers.js installed:

```bash
cd mts-frontend
npm install ethers
```

### Setting Up TypeScript Interfaces

Open `src/App.tsx` and start with the imports and TypeScript setup:

```typescript
import { useState } from 'react'
import './App.css'
import logo from './assets/logo.png'

declare global {
  interface Window {
    ethereum?: any
  }
}
```

The `declare global` block tells TypeScript that `window.ethereum` exists (added by MetaMask).

### Creating State Variables

Now let's set up all the state we'll need:

```typescript
function App() {
  // Wallet connection state
  const [isWalletConnected, setIsWalletConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState('')
  const [walletBalance, setWalletBalance] = useState('0.0000')
  const [winjBalance, setWinjBalance] = useState('0.0000')
  const [isConnecting, setIsConnecting] = useState(false)

  // Token creation state
  const [tokenName, setTokenName] = useState('')
  const [ticker, setTicker] = useState('')
  const [supply, setSupply] = useState('1000000')
  const [decimal, setDecimal] = useState('18')
  const [isCreatingToken, setIsCreatingToken] = useState(false)
  const [tokenStatus, setTokenStatus] = useState<{ type: 'success' | 'error' | 'pending' | ''; message: string }>({ 
    type: '', 
    message: '' 
  })

  // Token modal state
  const [showTokenModal, setShowTokenModal] = useState(false)
  const [createdToken, setCreatedToken] = useState<{
    address: string
    name: string
    symbol: string
    decimals: number
    supply: string
  } | null>(null)

  // Wrap/Unwrap state
  const [activeTab, setActiveTab] = useState<'wrap' | 'unwrap'>('wrap')
  const [amount, setAmount] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'pending' | ''; message: string }>({ 
    type: '', 
    message: '' 
  })
```

### Helper Functions

Add utility functions for formatting:

```typescript
  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const formatBalance = (balance: string) => {
    const num = parseFloat(balance)
    return num.toFixed(4)
  }
```

### Mock Event Handlers

For now, let's create placeholder functions that just log to the console:

```typescript
  const handleWalletClick = async () => {
    if (isWalletConnected) {
      // Disconnect wallet
      setIsWalletConnected(false)
      setWalletAddress('')
      setWalletBalance('0.0000')
      setWinjBalance('0.0000')
      console.log('Wallet disconnected')
    } else {
      // Mock wallet connection
      console.log('Connect wallet clicked')
      setIsWalletConnected(true)
      setWalletAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb')
      setWalletBalance('5.2500')
      setWinjBalance('2.1000')
    }
  }

  const handleCreateToken = async () => {
    console.log('Create token:', { tokenName, ticker, supply, decimal })
    setTokenStatus({ type: 'success', message: 'Token creation will be implemented next!' })
  }

  const handleWrap = async () => {
    console.log(`${activeTab}:`, amount)
    setStatus({ type: 'success', message: 'Wrap/unwrap will be implemented next!' })
  }

  const closeModal = () => {
    setShowTokenModal(false)
    setCreatedToken(null)
  }
```

### Building the UI Structure

Now let's create the complete JSX for our app:

<details>
<summary>Click to view complete UI JSX</summary>

```typescript
  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="logo">
          <img src={logo} alt="Inject logo" className="logo-img" />
          <span className="logo-text">inject.fun</span>
        </div>
        <span
          className={`wallet-address ${isWalletConnected ? 'connected' : ''} ${isConnecting ? 'connecting' : ''}`}
          onClick={isConnecting ? undefined : handleWalletClick}
          title={isConnecting ? 'Connecting...' : (isWalletConnected ? 'Click to disconnect' : 'Click to connect wallet')}
          style={{ cursor: isConnecting ? 'not-allowed' : 'pointer', opacity: isConnecting ? 0.6 : 1 }}
        >
          {isConnecting
            ? 'Connecting...'
            : (isWalletConnected
              ? `${walletBalance} INJ | ${winjBalance} wINJ | ${shortenAddress(walletAddress)}`
              : 'Connect Wallet')}
        </span>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {/* Create Token Card */}
        <section className="create-token-card">
          <div className="form-group">
            <label>name</label>
            <input
              type="text"
              value={tokenName}
              onChange={(e) => setTokenName(e.target.value)}
              placeholder=""
            />
          </div>

          <div className="form-group">
            <label>ticker</label>
            <input
              type="text"
              value={ticker}
              onChange={(e) => setTicker(e.target.value)}
              placeholder=""
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>supply</label>
              <input
                type="text"
                value={supply}
                onChange={(e) => setSupply(e.target.value)}
              />
            </div>
            <div className="form-group decimal">
              <label>decimal</label>
              <input
                type="text"
                value={decimal}
                onChange={(e) => setDecimal(e.target.value)}
              />
            </div>
          </div>

          <button className="create-token-btn" onClick={handleCreateToken} disabled={isCreatingToken}>
            {isCreatingToken ? 'Creating...' : 'create token'}
          </button>
          <div className="fee-notice">
            <span className="fee-text">payment of 1 INJ and 1 wINJ is required for token creation</span>
          </div>

          {tokenStatus.message && (
            <div className={`status-message ${tokenStatus.type}`} style={{ marginTop: '16px' }}>
              {tokenStatus.message}
            </div>
          )}
        </section>

        {/* Wrap/Unwrap Card */}
        <aside className="wrap-card">
          <div className="tab-container">
            <button
              className={`tab ${activeTab === 'wrap' ? 'active' : ''}`}
              onClick={() => setActiveTab('wrap')}
            >
              wrap
            </button>
            <button
              className={`tab ${activeTab === 'unwrap' ? 'active' : ''}`}
              onClick={() => setActiveTab('unwrap')}
            >
              unwrap
            </button>
          </div>

          <div className="amount-group">
            <label className="amount-label">amount</label>
            <div className="amount-input-wrapper">
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder=""
              />
              <span className="amount-suffix">{activeTab === 'wrap' ? 'INJ' : 'wINJ'}</span>
            </div>
          </div>

          <button className="transfer-btn" onClick={handleWrap} disabled={isLoading}>
            {isLoading ? 'Processing...' : activeTab}
          </button>

          {status.message && (
            <div className={`status-message ${status.type}`}>
              {status.message}
            </div>
          )}
        </aside>
      </main>

      {/* Token Created Modal */}
      {showTokenModal && createdToken && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Token Created!</h2>

            <div className="modal-content">
              <div className="token-info">
                <div className="info-row">
                  <span className="label">Name:</span>
                  <span className="value">{createdToken.name}</span>
                </div>
                <div className="info-row">
                  <span className="label">Symbol:</span>
                  <span className="value">{createdToken.symbol}</span>
                </div>
                <div className="info-row">
                  <span className="label">Decimals:</span>
                  <span className="value">{createdToken.decimals}</span>
                </div>
                <div className="info-row">
                  <span className="label">Supply:</span>
                  <span className="value">{createdToken.supply}</span>
                </div>
                <div className="info-row address-row">
                  <span className="label">Address:</span>
                  <span className="value address">{createdToken.address}</span>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  className="modal-btn copy-btn"
                  onClick={() => {
                    navigator.clipboard.writeText(createdToken.address)
                  }}
                >
                  Copy Address
                </button>
                <button className="modal-btn add-wallet-btn">
                  Add to MetaMask
                </button>
              </div>

              <button className="modal-close-btn" onClick={closeModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
```

</details>

### Understanding the UI Components

Let's break down what we've built:

**Header Section**
- App logo and branding
- Wallet connection button
- Shows balances when connected (mock data for now)

**Token Creation Form**
- Name input
- Ticker/symbol input
- Supply and decimals (in a row)
- Create button
- Fee notice
- Status message area

**Wrap/Unwrap Card**
- Tab switcher (wrap/unwrap)
- Amount input with currency suffix
- Action button
- Status message area

**Token Modal**
- Displays created token details
- Copy address button
- Add to MetaMask button
- Close button

### Adding the CSS

Copy the complete CSS from your repository to `src/App.css`. The CSS provides:

- Black & white minimalist theme
- Responsive grid layout
- Form styling
- Button hover effects
- Modal styling
- Status message colors

### Testing the Base UI

Start the development server:

```bash
npm run dev
```

You should see:

✅ A working UI with all components visible  
✅ Clickable connect/disconnect (with mock data)  
✅ Tab switching between wrap/unwrap  
✅ Form inputs that update state  
✅ Buttons that log to console  

Everything works visually, but nothing connects to the blockchain yet!

---

## Connecting to MetaMask

Now let's replace our mock wallet connection with real MetaMask integration.

### Adding Ethers.js

Update your imports to include ethers:

```typescript
import { BrowserProvider, formatEther, MaxUint256, Contract } from 'ethers'
```

### Network Configuration

Add the Injective EVM network configuration:

```typescript
const INJECTIVE_EVM_PARAMS = {
  chainId: '0x59f', // 1439 in hexadecimal
  chainName: 'Injective EVM',
  rpcUrls: ['https://k8s.testnet.json-rpc.injective.network/'],
  nativeCurrency: {
    name: 'Injective',
    symbol: 'INJ',
    decimals: 18,
  },
  blockExplorerUrls: ['https://testnet.blockscout.injective.network/blocks'],
}
```

This tells MetaMask how to connect to Injective EVM.

### Contract Addresses

Add these constants above your component:

```typescript
// wINJ Contract Address on Injective Testnet
const WINJ_CONTRACT_ADDRESS = '0x0000000088827d2d103ee2d9A6b781773AE03FfB'

// Token Factory Contract Address
const TOKEN_FACTORY_ADDRESS = '0x5c68BDa376ed8eBcc96a5FA9D721772c16dF5f06'
```

### Getting Contract ABIs

Before we implement the connection, we need the contract ABIs.

**Create `src/abis/WINJ.json`:**

The wINJ contract is a standard WETH-like contract. You'll need the ABI with these functions:
- `deposit()` - Wrap INJ to wINJ
- `withdraw(uint256)` - Unwrap wINJ to INJ
- `approve(address, uint256)` - Approve spending
- `balanceOf(address)` - Check balance
- `allowance(address, address)` - Check allowance

**Create `src/abis/TOKENFACTORY.json`:**

From your compiled contracts:
```bash
cd mts-token/artifacts/contracts/TokenFactory.sol/
# Copy the "abi" array from TokenFactory.json
```

### Importing ABIs

Add to your imports:

```typescript
import WINJ_ABI from './abis/WINJ.json'
import TOKEN_FACTORY_ABI from './abis/TOKENFACTORY.json'
```

### Implementing Real Wallet Connection

Now replace the mock `handleWalletClick` with the real implementation:

<details>
<summary>Click to view complete handleWalletClick function</summary>

```typescript
const handleWalletClick = async () => {
  if (isWalletConnected) {
    // Disconnect wallet
    setIsWalletConnected(false)
    setWalletAddress('')
    setWalletBalance('0.0000')
    setWinjBalance('0.0000')
    console.log('Wallet disconnected')
  } else {
    // Connect wallet using MetaMask with ethers v6
    if (typeof window.ethereum === 'undefined') {
      alert('MetaMask not installed!')
      return
    }

    try {
      setIsConnecting(true)
      const provider = new BrowserProvider(window.ethereum)

      // Add/Switch to Injective EVM network
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [INJECTIVE_EVM_PARAMS],
      })

      // Request account access
      await provider.send('eth_requestAccounts', [])
      const signer = await provider.getSigner()
      const address = await signer.getAddress()

      // Fetch native INJ balance
      const balance = await provider.getBalance(address)
      const formattedBalance = formatEther(balance)

      // Create wINJ contract instance
      const winjContract = new Contract(WINJ_CONTRACT_ADDRESS, WINJ_ABI, signer)

      // Check and request approval if needed
      try {
        const currentAllowance = await winjContract.allowance(address, TOKEN_FACTORY_ADDRESS)
        console.log('Current wINJ allowance:', formatEther(currentAllowance))

        // Only request approval if allowance is less than threshold
        if (currentAllowance < BigInt('1000000000000000000000000000000')) {
          console.log('Requesting wINJ approval...')
          const approveTx = await winjContract.approve(TOKEN_FACTORY_ADDRESS, MaxUint256)
          console.log('Approval tx sent:', approveTx.hash)
          await approveTx.wait()
          console.log('wINJ approval confirmed!')
        } else {
          console.log('wINJ already approved, skipping approval request')
        }
      } catch (approveErr) {
        console.error('wINJ approval check/request failed:', approveErr)
      }

      // Query wINJ balance
      try {
        const winjBalanceRaw = await winjContract.balanceOf(address)
        const formattedWinjBalance = formatEther(winjBalanceRaw)
        setWinjBalance(formatBalance(formattedWinjBalance))
        console.log('wINJ Balance:', formattedWinjBalance)
      } catch (balanceErr) {
        console.error('Failed to fetch wINJ balance:', balanceErr)
        setWinjBalance('0.0000')
      }

      setWalletAddress(shortenAddress(address))
      setWalletBalance(formatBalance(formattedBalance))
      setIsWalletConnected(true)
      console.log('Connected address:', address)
      console.log('INJ Balance:', formattedBalance)
    } catch (err) {
      console.error('MetaMask connection failed:', err)
    } finally {
      setIsConnecting(false)
    }
  }
}
```

</details>

### Understanding the Connection Flow

**1. Check MetaMask**
```typescript
if (typeof window.ethereum === 'undefined') {
  alert('MetaMask not installed!')
  return
}
```

**2. Add/Switch Network**
```typescript
await window.ethereum.request({
  method: 'wallet_addEthereumChain',
  params: [INJECTIVE_EVM_PARAMS],
})
```
Automatically adds Injective EVM to MetaMask or switches to it.

**3. Request Accounts**
```typescript
await provider.send('eth_requestAccounts', [])
const signer = await provider.getSigner()
const address = await signer.getAddress()
```
Prompts user to connect and gets their address.

**4. Get INJ Balance**
```typescript
const balance = await provider.getBalance(address)
const formattedBalance = formatEther(balance)
```

**5. Auto-Approve wINJ**
```typescript
if (currentAllowance < BigInt('1000000000000000000000000000000')) {
  const approveTx = await winjContract.approve(TOKEN_FACTORY_ADDRESS, MaxUint256)
  await approveTx.wait()
}
```
This is the magic! On first connection, we automatically approve the TokenFactory to spend wINJ. Users won't need to approve again later.

**6. Get wINJ Balance**
```typescript
const winjBalanceRaw = await winjContract.balanceOf(address)
const formattedWinjBalance = formatEther(winjBalanceRaw)
setWinjBalance(formatBalance(formattedWinjBalance))
```

### Testing the Connection

Save and test:

1. Click "Connect Wallet"
2. MetaMask should pop up
3. If not on Injective EVM, it asks to add/switch
4. Approve connection
5. Approve wINJ spending (first time only)
6. See real balances in header

You now have a real wallet connection with automatic token approval!

---

## Implementing Wrap/Unwrap Functionality

Now let's make the wrap/unwrap feature actually work with the blockchain.

### Adding More Ethers Imports

Update your ethers import to include `parseEther`:

```typescript
import { BrowserProvider, formatEther, parseEther, MaxUint256, Contract } from 'ethers'
```

### Implementing the Wrap/Unwrap Handler

Replace the mock `handleWrap` function with this real implementation:

<details>
<summary>Click to view complete handleWrap function</summary>

```typescript
const handleWrap = async () => {
  if (!isWalletConnected) {
    setStatus({ type: 'error', message: 'Please connect your wallet first!' })
    return
  }

  if (!amount || parseFloat(amount) <= 0) {
    setStatus({ type: 'error', message: 'Please enter a valid amount!' })
    return
  }

  try {
    setIsLoading(true)
    setStatus({ type: 'pending', message: `${activeTab === 'wrap' ? 'Wrapping' : 'Unwrapping'}...` })

    const provider = new BrowserProvider(window.ethereum)
    const signer = await provider.getSigner()
    const address = await signer.getAddress()
    const winjContract = new Contract(WINJ_CONTRACT_ADDRESS, WINJ_ABI, signer)

    if (activeTab === 'wrap') {
      // Wrap INJ to wINJ - call deposit() with INJ value
      const tx = await winjContract.deposit({
        value: parseEther(amount)
      })
      setStatus({ type: 'pending', message: 'Transaction sent, waiting for confirmation...' })
      await tx.wait()
      setStatus({ type: 'success', message: `Successfully wrapped ${amount} INJ to wINJ!` })
    } else {
      // Unwrap wINJ to INJ - call withdraw() with amount
      const tx = await winjContract.withdraw(parseEther(amount))
      setStatus({ type: 'pending', message: 'Transaction sent, waiting for confirmation...' })
      await tx.wait()
      setStatus({ type: 'success', message: `Successfully unwrapped ${amount} wINJ to INJ!` })
    }

    // Refresh balances after transaction
    const newBalance = await provider.getBalance(address)
    const newWinjBalance = await winjContract.balanceOf(address)
    setWalletBalance(formatBalance(formatEther(newBalance)))
    setWinjBalance(formatBalance(formatEther(newWinjBalance)))
    setAmount('') // Clear the input

  } catch (err: any) {
    console.error('Transaction failed:', err.message || err)
    setStatus({ type: 'error', message: `Transaction failed: ${err.message || 'Unknown error'}` })
  } finally {
    setIsLoading(false)
  }
}
```

</details>

### Understanding Wrap vs Unwrap

**Wrapping (INJ → wINJ)**
```typescript
const tx = await winjContract.deposit({
  value: parseEther(amount)
})
```
Sends native INJ to the wINJ contract's `deposit()` function. The contract mints equivalent wINJ to your address.

**Unwrapping (wINJ → INJ)**
```typescript
const tx = await winjContract.withdraw(parseEther(amount))
```
Burns your wINJ tokens and sends native INJ back to your address.

### Testing Wrap/Unwrap

1. Connect wallet
2. Enter amount (e.g., "0.1")
3. Click "wrap"
4. Approve in MetaMask
5. Wait for confirmation
6. See balances update
7. Try unwrapping

You should see:
- Transaction status updates
- Balance refreshes automatically
- Input clears after success

---

## Creating Tokens

Now for the main feature - let's implement the token creation!

### Implementing Token Creation

Replace the mock `handleCreateToken` with the real implementation:

<details>
<summary>Click to view complete handleCreateToken function</summary>

```typescript
const handleCreateToken = async () => {
  if (!isWalletConnected) {
    setTokenStatus({ type: 'error', message: 'Please connect your wallet first!' })
    return
  }

  if (!tokenName.trim()) {
    setTokenStatus({ type: 'error', message: 'Please enter a token name!' })
    return
  }

  if (!ticker.trim()) {
    setTokenStatus({ type: 'error', message: 'Please enter a ticker symbol!' })
    return
  }

  const decimalsNum = parseInt(decimal)
  if (isNaN(decimalsNum) || decimalsNum < 0 || decimalsNum > 18) {
    setTokenStatus({ type: 'error', message: 'Decimals must be between 0 and 18!' })
    return
  }

  const supplyNum = parseFloat(supply)
  if (isNaN(supplyNum) || supplyNum <= 0) {
    setTokenStatus({ type: 'error', message: 'Please enter a valid supply!' })
    return
  }

  try {
    setIsCreatingToken(true)
    setTokenStatus({ type: 'pending', message: 'Preparing token creation...' })

    const provider = new BrowserProvider(window.ethereum)
    const signer = await provider.getSigner()
    const tokenFactory = new Contract(TOKEN_FACTORY_ADDRESS, TOKEN_FACTORY_ABI, signer)

    // Get creation fees
    // CREATION_FEE (1 wINJ) - pulled via transferFrom (requires prior approval)
    // BANK_MODULE_FEE (1 INJ) - sent as msg.value for bank module registration
    const creationFee = await tokenFactory.CREATION_FEE()
    const bankModuleFee = await tokenFactory.BANK_MODULE_FEE()
    console.log('Creation fee (wINJ):', formatEther(creationFee), 'Bank module fee (native INJ):', formatEther(bankModuleFee))

    setTokenStatus({ type: 'pending', message: `Creating token (${formatEther(creationFee)} wINJ + ${formatEther(bankModuleFee)} INJ)...` })

    // Calculate initial supply with token decimals
    const initialSupply = BigInt(supply) * BigInt(10 ** decimalsNum)
    console.log('Initial supply (with decimals):', initialSupply.toString())

    // Create token - only send BANK_MODULE_FEE as native value
    // The contract will pull CREATION_FEE in wINJ via transferFrom
    console.log('Calling createToken with:', { tokenName, ticker, decimalsNum, initialSupply: initialSupply.toString(), nativeValue: bankModuleFee.toString() })
    const tx = await tokenFactory.createToken(
      tokenName,
      ticker,
      decimalsNum,
      initialSupply,
      { value: bankModuleFee }
    )

    setTokenStatus({ type: 'pending', message: 'Transaction sent, waiting for confirmation...' })
    const receipt = await tx.wait()

    // Get the token address from the transaction receipt
    // The createToken function returns the address, which is also in the TokenCreated event
    const tokenAddress = receipt.logs[1]?.address || ''
    console.log('Token created! Address:', tokenAddress, 'Receipt:', receipt)

    // Store the created token info for the modal
    const createdTokenInfo = {
      address: tokenAddress,
      name: tokenName,
      symbol: ticker,
      decimals: decimalsNum,
      supply: supply
    }
    setCreatedToken(createdTokenInfo)
    setShowTokenModal(true)
    setTokenStatus({ type: 'success', message: `Token "${tokenName}" (${ticker}) created successfully!` })

    // Clear form
    setTokenName('')
    setTicker('')
    setSupply('1000000')
    setDecimal('18')

  } catch (err: any) {
    console.error('Token creation failed:', err)
    setTokenStatus({ type: 'error', message: `Token creation failed: ${err.message || 'Unknown error'}` })
  } finally {
    setIsCreatingToken(false)
  }
}
```

</details>

### Understanding the Fee Structure

```typescript
const creationFee = await tokenFactory.CREATION_FEE() // 1 wINJ
const bankModuleFee = await tokenFactory.BANK_MODULE_FEE() // 1 INJ
```

Two fees are required:
1. **1 wINJ** - Factory fee (automatically pulled because we approved on connection)
2. **1 INJ** - Bank module registration fee (sent as `msg.value`)

### Understanding the Supply Calculation

```typescript
const initialSupply = BigInt(supply) * BigInt(10 ** decimalsNum)
```

If user enters supply of `1000000` with `18` decimals:
- Actual minted amount = 1000000 × 10^18
- This gives the user 1,000,000.000000000000000000 tokens

### Testing Token Creation

1. Connect wallet (approval happens automatically)
2. Fill in token details:
   - Name: "My Test Token"
   - Ticker: "MTT"
   - Supply: 1000000
   - Decimal: 18
3. Click "create token"
4. Approve transaction (1 INJ + 1 wINJ)
5. Wait for confirmation
6. Modal appears with token details!

---

## Adding Tokens to MetaMask

The final piece - let users add their created tokens to MetaMask with one click.

### Implementing Add to MetaMask

Add this function:

```typescript
const addToMetaMask = async () => {
  if (!createdToken) return

  try {
    await window.ethereum.request({
      method: 'wallet_watchAsset',
      params: {
        type: 'ERC20',
        options: {
          address: createdToken.address,
          symbol: createdToken.symbol,
          decimals: createdToken.decimals,
        },
      },
    })
    console.log('Token added to MetaMask!')
  } catch (err) {
    console.error('Failed to add token to MetaMask:', err)
  }
}
```

### Connecting to the Button

Update the "Add to MetaMask" button in your modal to call this function:

```typescript
<button
  className="modal-btn add-wallet-btn"
  onClick={addToMetaMask}
>
  Add to MetaMask
</button>
```

### Testing the Complete Flow

1. Create a token
2. Modal appears
3. Click "Add to MetaMask"
4. MetaMask prompts to add token
5. Approve
6. Token now visible in MetaMask!

---

## Congratulations! 🎉

You've built a complete Token Launcher DApp on Injective EVM!

### What You've Built

✅ Modern React + TypeScript interface  
✅ MetaMask integration with auto-network switching  
✅ Automatic wINJ approval on connection  
✅ Wrap/unwrap functionality (INJ ↔ wINJ)  
✅ Token creation with bank module integration  
✅ One-click MetaMask token addition  
✅ Real-time balance updates  
✅ Transaction status feedback  

### Testing Your Complete App

Run through the full flow:

1. **Connect** → Auto-switches network, approves wINJ
2. **Wrap** → Get wINJ from INJ
3. **Create Token** → Deploy your ERC20 (costs 1 INJ + 1 wINJ)
4. **Add to MetaMask** → Track your new token
5. **See Balances** → All tokens visible in MetaMask

### Production Deployment

Build for production:

```bash
npm run build
```

Deploy the `dist` folder to Vercel, Netlify, or any static hosting.

### Next Steps

- Add token management UI (mint/burn)
- Build token explorer page
- Add analytics dashboard
- Implement token search
- Create token marketplace

Happy building! 🚀
