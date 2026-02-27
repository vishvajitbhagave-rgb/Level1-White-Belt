# StellarPay — White Belt Submission
A simple, user-friendly XLM Payment dApp built on the "Stellar Testnet" using React.

# Project Description
  
  StellarPay is a decentralized payment application that allows users to:
- Connect their **Freighter** wallet to the Stellar Testnet
- View their real-time XLM balance
- Send XLM to any Stellar address on testnet with optional memo
- View transaction history with links to Stellar Expert explorer
- See clear success/failure feedback including the transaction hash
Built as part of the Stellar Journey to Mastery — White Belt(Level 1) challenge.


# Tech Stack

- React 18 (JavaScript)
- @stellar/stellar-sdk — Stellar network interactions
- @stellar/freighter-api — Wallet connection & transaction signing
- Stellar Testnet via Horizon API

Setup Instructions (Run Locally)

1. Prerequisites
- Node.js v16+
- [Freighter Wallet](https://freighter.app) browser extension installed
- Freighter set to Testnet network

2. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/stellar-payment-dapp.git
cd stellar-payment-dapp
npm install
```

3. Start the App

```bash
npm start
```
The app runs at `http://localhost:3000`

4. Fund Your Testnet Wallet
Use the [Stellar Testnet Friendbot](https://laboratory.stellar.org/#account-creator?network=test) to fund your wallet with test XLM.


# How to Use

1. Open the app in your browser
2. Click **"Connect Freighter Wallet"**
3. Approve the connection in the Freighter extension
4. Your **XLM balance** is displayed instantly
5. Fill in a **destination address**, **amount**, and optional **memo**
6. Click **"Send XLM →"** and sign in Freighter
7. View the transaction result and hash on screen


# White Belt Requirements Met

| Requirement                                      |Status|
| Freighter wallet setup on Testnet                | ✅  |
| Wallet connect / disconnect                      | ✅  |
| Fetch & display XLM balance                      | ✅  |
| Send XLM transaction on testnet                  | ✅  |
| Transaction success/failure feedback             | ✅  |
| Transaction hash shown                           | ✅  |
| Public GitHub repository                         | ✅  |
| README with setup instructions                   | ✅  |
| Screenshots included                             | ✅  |


# Screenshots
<img width="1906" height="875" alt="Screenshot 2026-02-27 152315" src="https://github.com/user-attachments/assets/7b24b2e8-b150-451a-9c41-0ac82f234d49" />
<img width="1906" height="875" alt="Screenshot 2026-02-27 152315" src="https://github.com/user-attachments/assets/7b24b2e8-b150-451a-9c41-0ac82f234d49" />




# Resources

- [Stellar Testnet Explorer](https://stellar.expert/explorer/testnet)
- [Freighter Wallet](https://freighter.app)
- [Stellar Horizon Testnet](https://horizon-testnet.stellar.org)
- [Stellar Laboratory](https://laboratory.stellar.org)
