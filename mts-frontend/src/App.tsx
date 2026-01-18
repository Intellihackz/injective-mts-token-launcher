import { useState } from 'react'
import { BrowserProvider, formatEther, parseEther, Contract, MaxUint256 } from 'ethers'
import WINJ_ABI from './abis/WINJ.json'
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

// wINJ Contract Address on Injective Testnet
const WINJ_CONTRACT_ADDRESS = '0x0000000088827d2d103ee2d9A6b781773AE03FfB'

// Token Factory Contract Address 
const TOKEN_FACTORY_ADDRESS = '0x5c68BDa376ed8eBcc96a5FA9D721772c16dF5f06'


function App() {
  const [activeTab, setActiveTab] = useState<'wrap' | 'unwrap'>('wrap')
  const [tokenName, setTokenName] = useState('')
  const [ticker, setTicker] = useState('')
  const [supply, setSupply] = useState('1000000')
  const [decimal, setDecimal] = useState('18')
  const [amount, setAmount] = useState('')
  const [isWalletConnected, setIsWalletConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState('')
  const [walletBalance, setWalletBalance] = useState('')
  const [winjBalance, setWinjBalance] = useState('')
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'pending' | ''; message: string }>({ type: '', message: '' })
  const [isLoading, setIsLoading] = useState(false)
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
      setWinjBalance('')
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

        // Create wINJ contract instance
        const winjContract = new Contract(WINJ_CONTRACT_ADDRESS, WINJ_ABI, signer)

        // Check allowance and request approval only if needed
        try {
          const currentAllowance = await winjContract.allowance(address, TOKEN_FACTORY_ADDRESS)
          console.log('Current wINJ allowance:', formatEther(currentAllowance))

          // Only request approval if allowance is less than a reasonable threshold
          if (currentAllowance < BigInt('1000000000000000000000000000000')) { // Less than 1e30
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
              ? `${walletBalance} INJ | ${winjBalance} wINJ | ${walletAddress}`
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
