import React, { useState, useEffect, useCallback } from 'react';
import { fetchBalance, sendXLM, fetchTransactions } from './stellar';
import './App.css';

// ─── Freighter Helpers ──────────────────────────────────────────────────────

async function isFreighterInstalled() {
  try {
    const { isConnected } = await import('@stellar/freighter-api');
    const result = await isConnected();
    return result === true || result?.isConnected === true;
  } catch {
    return false;
  }
}

async function getFreighterPublicKey() {
  const freighter = await import('@stellar/freighter-api');
  
  // Try new API first
  if (freighter.requestAccess) {
    const result = await freighter.requestAccess();
    if (result?.address) return result.address;
    if (result?.publicKey) return result.publicKey;
  }

  // Fallback to old API
  if (freighter.getPublicKey) {
    const result = await freighter.getPublicKey();
    if (typeof result === 'string') return result;
    if (result?.publicKey) return result.publicKey;
  }

  throw new Error('Could not retrieve public key. Please unlock Freighter.');
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function Spinner() {
  return <span className="spinner" aria-label="Loading" />;
}

function StatusBadge({ connected }) {
  return (
    <div className={`status-badge ${connected ? 'connected' : 'disconnected'}`}>
      <span className="status-dot" />
      {connected ? 'Testnet' : 'Not Connected'}
    </div>
  );
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button className="copy-btn" onClick={handleCopy} title="Copy">
      {copied ? '✓' : '⧉'}
    </button>
  );
}

function WalletCard({ publicKey, balance, onDisconnect, onRefresh, refreshing }) {
  const short = `${publicKey.slice(0, 6)}...${publicKey.slice(-6)}`;
  return (
    <div className="wallet-card fade-in">
      <div className="wallet-card-header">
        <div className="wallet-label">Connected Wallet</div>
        <button className="disconnect-btn" onClick={onDisconnect}>Disconnect</button>
      </div>
      <div className="wallet-address-row">
        <span className="wallet-address" title={publicKey}>{short}</span>
        <CopyButton text={publicKey} />
      </div>
      <div className="balance-section">
        <div className="balance-label">XLM Balance</div>
        <div className="balance-amount">
          {refreshing ? <Spinner /> : <><span className="balance-num">{balance}</span><span className="balance-unit"> XLM</span></>}
        </div>
        <button className="refresh-btn" onClick={onRefresh} disabled={refreshing}>
          {refreshing ? 'Refreshing...' : '↻ Refresh'}
        </button>
      </div>
    </div>
  );
}

function SendForm({ publicKey, onSuccess }) {
  const [destination, setDestination] = useState('');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSend = async (e) => {
    e.preventDefault();
    setError('');
    if (!destination.trim()) return setError('Destination address is required.');
    if (!amount || parseFloat(amount) <= 0) return setError('Enter a valid amount.');

    setLoading(true);
    try {
      const hash = await sendXLM(publicKey, destination.trim(), amount, memo);
      onSuccess(hash, destination.trim(), amount);
      setDestination('');
      setAmount('');
      setMemo('');
    } catch (err) {
      setError(err.message || 'Transaction failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="send-card fade-in">
      <div className="card-title">
        <span className="card-icon">⟡</span> Send XLM
      </div>
      <form onSubmit={handleSend} noValidate>
        <div className="form-group">
          <label htmlFor="destination">Destination Address</label>
          <input
            id="destination"
            className="form-input"
            type="text"
            placeholder="G..."
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            disabled={loading}
            autoComplete="off"
            spellCheck="false"
          />
        </div>

        <div className="form-group">
          <label htmlFor="amount">Amount (XLM)</label>
          <div className="amount-input-wrapper">
            <input
              id="amount"
              className="form-input"
              type="number"
              placeholder="0.00"
              min="0.0000001"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={loading}
            />
            <span className="amount-suffix">XLM</span>
          </div>
        </div>

      {/*}  <div className="form-group">
          <label htmlFor="memo">Memo <span className="optional">(optional)</span></label>
          <input
            id="memo"
            className="form-input"
            type="text"
            placeholder="Add a note..."
            maxLength={28}
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            disabled={loading}
          />
          <span className="char-count">{memo.length}/28</span>
        </div> */}

        {error && (
          <div className="error-msg slide-in">
            <span>⚠</span> {error}
          </div>
        )}

        <button className="send-btn" type="submit" disabled={loading}>
          {loading ? <><Spinner /> Sending...</> : 'Send XLM →'}
        </button>
      </form>
    </div>
  );
}

function TxSuccess({ hash, destination, amount, onDismiss }) {
  const short = `${destination.slice(0, 6)}...${destination.slice(-6)}`;
  const explorerUrl = `https://stellar.expert/explorer/testnet/tx/${hash}`;
  return (
    <div className="tx-success fade-in">
      <div className="success-icon">✓</div>
      <div className="success-title">Transaction Sent!</div>
      <div className="success-detail">
        <span className="success-amount">{amount} XLM</span> sent to <span className="success-addr">{short}</span>
      </div>
      <div className="tx-hash-row">
        <span className="tx-hash-label">TX Hash:</span>
        <span className="tx-hash-val">{hash.slice(0, 16)}...{hash.slice(-8)}</span>
        <CopyButton text={hash} />
      </div>
      <div className="success-actions">
        <a className="explorer-link" href={explorerUrl} target="_blank" rel="noreferrer">
          View on Explorer ↗
        </a>
        <button className="dismiss-btn" onClick={onDismiss}>Send Another</button>
      </div>
    </div>
  );
}

function TxHistory({ transactions }) {
  if (!transactions.length) return null;
  return (
    <div className="tx-history fade-in">
      <div className="card-title">
        <span className="card-icon">◈</span> Recent Transactions
      </div>
      <div className="tx-list">
        {transactions.map((tx) => (
          <div key={tx.hash} className="tx-item">
            <div className="tx-item-left">
              <span className={`tx-dot ${tx.successful ? 'success' : 'fail'}`} />
              <div>
                <div className="tx-item-hash">
                  {tx.hash.slice(0, 12)}...{tx.hash.slice(-8)}
                  <CopyButton text={tx.hash} />
                </div>
                <div className="tx-item-date">
                  {new Date(tx.createdAt).toLocaleString()}
                </div>
              </div>
            </div>
            <a
              className="tx-explorer-link"
              href={`https://stellar.expert/explorer/testnet/tx/${tx.hash}`}
              target="_blank"
              rel="noreferrer"
            >
              ↗
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

function ConnectScreen({ onConnect, loading, error }) {
  return (
    <div className="connect-screen fade-in">
      <div className="hero-logo">𝔖𝔓 </div>
      <h1 className="hero-title">S✧ellarPay</h1>
      <p className="hero-sub">Send XLM Instantly On Stellar</p>
      <div className="hero-features">
       <span> Near-instant settlement</span>
        <span> Fraction-of-a-cent fees</span>
        <span> Non-custodial</span> 
      </div>
      {error && <div className="error-msg slide-in"><span>⚠</span> {error}</div>}
      <button className="connect-btn" onClick={onConnect} disabled={loading}>
        {loading ? <><Spinner /> Connecting...</> : 'Connect Freighter Wallet'}
      </button>
      <p className="freighter-note">
        Don't have Freighter?{' '}
        <a href="https://freighter.app" target="_blank" rel="noreferrer">
          Install it here ↗
        </a>
      </p>
      {/*<div className="testnet-badge">🧪 Testnet Only</div>*/}
    </div>
  );
}

// ─── Main App ────────────────────────────────────────────────────────────────

export default function App() {
  const [publicKey, setPublicKey] = useState(null);
  const [balance, setBalance] = useState('—');
  const [transactions, setTransactions] = useState([]);
  const [connectLoading, setConnectLoading] = useState(false);
  const [connectError, setConnectError] = useState('');
  const [balanceRefreshing, setBalanceRefreshing] = useState(false);
  const [txResult, setTxResult] = useState(null); // { hash, destination, amount }

  const loadAccountData = useCallback(async (key) => {
    try {
      const [bal, txs] = await Promise.all([
        fetchBalance(key),
        fetchTransactions(key, 5),
      ]);
      setBalance(bal);
      setTransactions(txs);
    } catch {
      setBalance('Error');
    }
  }, []);

  const handleConnect = async () => {
    setConnectError('');
    setConnectLoading(true);
    try {
      const installed = await isFreighterInstalled();
      if (!installed) {
        throw new Error('Freighter wallet not found. Please install it first.');
      }
      const key = await getFreighterPublicKey();
      if (!key) throw new Error('No public key returned. Make sure Freighter is unlocked.');
      setPublicKey(key);
      await loadAccountData(key);
    } catch (err) {
      setConnectError(err.message || 'Connection failed.');
    } finally {
      setConnectLoading(false);
    }
  };

  const handleDisconnect = () => {
    setPublicKey(null);
    setBalance('—');
    setTransactions([]);
    setTxResult(null);
    setConnectError('');
  };

  const handleRefreshBalance = async () => {
    setBalanceRefreshing(true);
    try {
      await loadAccountData(publicKey);
    } finally {
      setBalanceRefreshing(false);
    }
  };

  const handleTxSuccess = async (hash, destination, amount) => {
    setTxResult({ hash, destination, amount });
    // Refresh balance & tx history after success
    await loadAccountData(publicKey);
  };

  const handleDismissTx = () => setTxResult(null);

  return (
    <div className="app">
      {/* Background grid */}
      <div className="bg-grid" aria-hidden="true" />

      {/* Header */}
      <header className="header">
        <div className="header-logo">✦ StellarPay</div>
        <StatusBadge connected={!!publicKey} />
      </header>

      <main className="main">
        {!publicKey ? (
          <ConnectScreen
            onConnect={handleConnect}
            loading={connectLoading}
            error={connectError}
          />
        ) : (
          <div className="dashboard">
            <WalletCard
              publicKey={publicKey}
              balance={balance}
              onDisconnect={handleDisconnect}
              onRefresh={handleRefreshBalance}
              refreshing={balanceRefreshing}
            />

            {txResult ? (
              <TxSuccess
                hash={txResult.hash}
                destination={txResult.destination}
                amount={txResult.amount}
                onDismiss={handleDismissTx}
              />
            ) : (
              <SendForm publicKey={publicKey} onSuccess={handleTxSuccess} />
            )}

            <TxHistory transactions={transactions} />
          </div>
        )}
      </main>

      <footer className="footer">
          | Send XLM anywhere in seconds | Powered by Stellar Network | 
      </footer>
    </div>
  );
}