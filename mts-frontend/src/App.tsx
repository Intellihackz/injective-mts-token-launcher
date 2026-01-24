import { useState } from 'react'
import { BrowserProvider, formatEther, Contract } from 'ethers'
import TOKEN_FACTORY_ABI from './abis/TOKENFACTORY.json'
declare global {
  interface Window {
    ethereum?: any
  }
}
import './App.css'
import logo from './assets/logo.png'

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

// Token Factory Contract Address (Updated Deployment)
const TOKEN_FACTORY_ADDRESS = '0x715513b13Aa8118827167Dc5B51E3d6DE492417E'


function App() {
  const [tokenName, setTokenName] = useState('')
  const [ticker, setTicker] = useState('')
  const [supply, setSupply] = useState('1000000')
  const [decimal, setDecimal] = useState('18')
  const [isWalletConnected, setIsWalletConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState('')
  const [walletBalance, setWalletBalance] = useState('')
  const [isConnecting, setIsConnecting] = useState(false)
  const [isCreatingToken, setIsCreatingToken] = useState(false)
  const [tokenStatus, setTokenStatus] = useState<{ type: 'success' | 'error' | 'pending' | ''; message: string }>({ type: '', message: '' })
  const [showTokenModal, setShowTokenModal] = useState(false)
  const [createdToken, setCreatedToken] = useState<{ address: string; name: string; symbol: string; decimals: number; supply: string } | null>(null)

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const formatBalance = (balance: string) => {
    const num = parseFloat(balance)
    return num.toFixed(4)
  }

  const handleWalletClick = async () => {
    if (isWalletConnected) {
      // Disconnect wallet
      setIsWalletConnected(false)
      setWalletAddress('')
      setWalletBalance('')
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

        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [INJECTIVE_EVM_PARAMS],
        })

        await provider.send('eth_requestAccounts', [])
        const signer = await provider.getSigner()
        const address = await signer.getAddress()

        // Fetch native INJ balance
        const balance = await provider.getBalance(address)
        const formattedBalance = formatEther(balance)

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

      // Get total creation fee (2 INJ total: 1 INJ platform fee + 1 INJ bank module fee)
      const totalFee = await tokenFactory.TOTAL_FEE()
      console.log('Total creation fee (INJ):', formatEther(totalFee))

      setTokenStatus({ type: 'pending', message: `Creating token (${formatEther(totalFee)} INJ)...` })

      // Calculate initial supply with token decimals
      const initialSupply = BigInt(supply) * BigInt(10 ** decimalsNum)
      console.log('Initial supply (with decimals):', initialSupply.toString())

      // Create token - send 2 INJ as msg.value
      console.log('Calling createToken with:', { tokenName, ticker, decimalsNum, initialSupply: initialSupply.toString(), nativeValue: totalFee.toString() })
      const tx = await tokenFactory.createToken(
        tokenName,
        ticker,
        decimalsNum,
        initialSupply,
        { value: totalFee }
      )

      setTokenStatus({ type: 'pending', message: 'Transaction sent, waiting for confirmation...' })
      const receipt = await tx.wait()

      // Get the token address from the transaction receipt
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

      // Refresh wallet balance after token creation
      const updatedBalance = await provider.getBalance(await signer.getAddress())
      const formattedBalance = formatEther(updatedBalance)
      setWalletBalance(formatBalance(formattedBalance))
      console.log('Updated INJ Balance:', formattedBalance)

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

  const closeModal = () => {
    setShowTokenModal(false)
    setCreatedToken(null)
  }

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
              ? `${walletBalance} INJ | ${walletAddress}`
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
            <span className="fee-text">payment of 2 INJ is required for token creation</span>
          </div>

          {tokenStatus.message && (
            <div className={`status-message ${tokenStatus.type}`} style={{ marginTop: '16px' }}>
              {tokenStatus.message}
            </div>
          )}
        </section>
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
                <button
                  className="modal-btn add-wallet-btn"
                  onClick={addToMetaMask}
                >
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
