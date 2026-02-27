// stellar.js - Stellar SDK helpers for Testnet

import * as StellarSdk from '@stellar/stellar-sdk';

const HORIZON_URL = 'https://horizon-testnet.stellar.org';
const NETWORK_PASSPHRASE = StellarSdk.Networks.TESTNET;

export const server = new StellarSdk.Horizon.Server(HORIZON_URL);

/**
 * Fetch XLM balance for a given public key
 */
export async function fetchBalance(publicKey) {
  try {
    const account = await server.loadAccount(publicKey);
    const xlmBalance = account.balances.find(
      (b) => b.asset_type === 'native'
    );
    return xlmBalance ? parseFloat(xlmBalance.balance).toFixed(4) : '0.0000';
  } catch (err) {
    throw new Error('Failed to fetch balance. Account may not be funded on testnet.');
  }
}

/**
 * Send XLM from connected wallet to destination
 * Returns transaction hash on success
 */
export async function sendXLM(sourcePublicKey, destinationAddress, amount, memo = '') {
  // Validate destination address
  try {
    StellarSdk.Keypair.fromPublicKey(destinationAddress);
  } catch {
    throw new Error('Invalid destination address.');
  }

  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    throw new Error('Amount must be a positive number.');
  }

  // Check if destination account exists; if not, use createAccount
  let destinationExists = true;
  try {
    await server.loadAccount(destinationAddress);
  } catch (err) {
    if (err.response && err.response.status === 404) {
      destinationExists = false;
    } else {
      throw new Error('Could not verify destination account.');
    }
  }

  const sourceAccount = await server.loadAccount(sourcePublicKey);

  const transactionBuilder = new StellarSdk.TransactionBuilder(sourceAccount, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  });

  if (destinationExists) {
    transactionBuilder.addOperation(
      StellarSdk.Operation.payment({
        destination: destinationAddress,
        asset: StellarSdk.Asset.native(),
        amount: parsedAmount.toFixed(7),
      })
    );
  } else {
    // Minimum 1 XLM to create a new account
    if (parsedAmount < 1) {
      throw new Error('Minimum 1 XLM required to activate a new account.');
    }
    transactionBuilder.addOperation(
      StellarSdk.Operation.createAccount({
        destination: destinationAddress,
        startingBalance: parsedAmount.toFixed(7),
      })
    );
  }

  if (memo && memo.trim()) {
    transactionBuilder.addMemo(StellarSdk.Memo.text(memo.trim().slice(0, 28)));
  }

  const transaction = transactionBuilder.setTimeout(180).build();
  const xdr = transaction.toXDR();

  // Sign via Freighter
  const { signTransaction } = await import('@stellar/freighter-api');
  const signedResult = await signTransaction(xdr, {
    networkPassphrase: NETWORK_PASSPHRASE,
  });

  const signedXdr = typeof signedResult === 'string' ? signedResult : signedResult.signedTxXdr;
  const signedTx = StellarSdk.TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);
  const response = await server.submitTransaction(signedTx);

  return response.hash;
}

/**
 * Fetch recent transactions for a given public key
 */
export async function fetchTransactions(publicKey, limit = 5) {
  try {
    const records = await server
      .transactions()
      .forAccount(publicKey)
      .order('desc')
      .limit(limit)
      .call();

    return records.records.map((tx) => ({
      hash: tx.hash,
      createdAt: tx.created_at,
      successful: tx.successful,
      ledger: tx.ledger,
    }));
  } catch {
    return [];
  }
}

export { NETWORK_PASSPHRASE };