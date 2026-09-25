# AWallet Interoperability & Standards Guide (EIP-1193 & EIP-681)

This guide explains how **AWallet** interoperates with standard Web3 wallets (including **Coinbase Wallet**, **MetaMask**, and **Rabby**), adheres to Ethereum Improvement Proposals (**EIP-1193** and **EIP-681**), and enables seamless interaction with Base (Layer 2) dApps.

---

## 1. Architectural Overview

AWallet is engineered as a **security-first, policy-governed Web3 client and AI orchestration layer**. Rather than exposing raw, unencrypted private keys to browser storage or AI models, AWallet implements a dual-layer architecture:

1. **Policy Engine & Anti-Hacking Firewall (Pre-execution Gate)**:
   - Evaluates all transaction intents deterministically before signing.
   - Enforces daily spend limits, zero-width character sanitization, anti-poisoning vanity address detection, and EIP-55 checksum verification.
2. **Standard Provider & Signer Layer (Execution Gate)**:
   - Delegates cryptographic transaction signing to standard EIP-1193 signers (e.g., Coinbase Smart Wallet with Passkeys, MetaMask, or WalletConnect).
   - Never exposes raw seed phrases or private keys to the AI orchestration layer (**Tive ◉AI**).

---

## 2. EIP-1193: Ethereum Provider JavaScript API Integration

[EIP-1193](https://eips.ethereum.org/EIPS/eip-1193) defines the standard interface for Ethereum client providers (`window.ethereum`). AWallet fully complies with EIP-1193 for account discovery, network switching, and transaction signing.

### 2.1 Provider Handshake & Account Import

When you connect an existing wallet, AWallet performs an EIP-1193 handshake:

```typescript
// Requesting account connection
const accounts: string[] = await window.ethereum.request({
  method: 'eth_requestAccounts',
});
const userAddress = accounts[0]; // Imported Base account address
```

### 2.2 Base Network Switching (`wallet_switchEthereumChain`)

AWallet targets the **Base (L2)** ecosystem. If the connected wallet is on another network (e.g., Ethereum Mainnet), AWallet issues a standard EIP-3326/EIP-1193 chain switch request:

```typescript
// Base Mainnet (Chain ID: 8453 / Hex: 0x2105)
try {
  await window.ethereum.request({
    method: 'wallet_switchEthereumChain',
    params: [{ chainId: '0x2105' }],
  });
} catch (switchError: any) {
  // Chain not yet added: invoke wallet_addEthereumChain (EIP-3085)
  if (switchError.code === 4902) {
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: '0x2105',
        chainName: 'Base',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: ['https://mainnet.base.org'],
        blockExplorerUrls: ['https://basescan.org'],
      }],
    });
  }
}
```

### 2.3 Transaction Signing Pipeline

Before any transaction is submitted to the EIP-1193 provider via `eth_sendTransaction` or `personal_sign`, AWallet runs it through:
1. **Input Sanitization**: Zero-width unicode filtering (`\u200B`, `\u200C`, `\u202E`).
2. **Policy Engine**: Validates daily spending cap and circuit breaker status.
3. **EIP-55 Checksum**: Confirms destination address integrity.

---

## 3. EIP-681: Standard URL Format for QR Codes & Deep Links

[EIP-681](https://eips.ethereum.org/EIPS/eip-681) specifies the standard URI scheme for Ethereum transactions, used by QR codes and mobile deep links:

$$\text{ethereum:}[address][@chain\_id][/function\_name][?parameters]$$

### 3.1 Supported EIP-681 URI Formats

AWallet's QR Scanner (`QrScannerModal.tsx`) and recipient resolver natively parse and sanitize all standard EIP-681 variants:

| Format Type | Example URI | AWallet Handling |
| :--- | :--- | :--- |
| **Standard Ethereum** | `ethereum:0x1234...abcd` | Strips prefix, validates 40-hex chars, checks EIP-55 |
| **Base Specific** | `base:0x1234...abcd` | Strips prefix, targets Base chain |
| **With Amount Parameter** | `ethereum:0x1234...abcd?value=1.5e18` | Resolves recipient and auto-fills amount |
| **Token Transfer** | `ethereum:0xTokenAddress/transfer?address=0xRecipient` | Extracts recipient and token contract |
| **ENS / Base Name** | `ethereum:alex.base.eth` | Auto-resolves domain to controller address |

### 3.2 Anti-Spoofing QR Sanitization

Malicious QR codes can embed hidden homoglyphs or bidirectional override characters (`\u202E`) to display a legitimate address on screen while executing against an attacker's address. AWallet's scanner checks:
- Rejects any QR code containing non-printable or bidirectional control codes.
- Warns against vanity address poisoning (addresses matching the first 4 and last 4 characters of frequent counterparties).

---

## 4. How Users Can Import Existing Base Accounts

### Option A: Coinbase Smart Wallet (Passkey / WebAuthn)
1. In AWallet, open the wallet connection modal.
2. Select **Coinbase Wallet**.
3. Choose **Create / Connect with Passkey**.
4. Authorize using Face ID, Touch ID, or Windows Hello. Your Base Smart Wallet is linked with zero seed phrase friction.

### Option B: Coinbase Wallet Mobile App
1. Select **Coinbase Wallet** -> **Mobile App**.
2. Scan the on-screen QR code using the Coinbase Wallet app on your iOS or Android device.
3. Approve the connection request.

### Option C: MetaMask / Browser Extensions (EIP-1193)
1. Ensure the MetaMask or Rabby browser extension is installed.
2. Click **Connect Wallet** in AWallet.
3. Select **MetaMask / Injected Provider**.
4. Confirm the connection prompt in the extension. Your account is imported into AWallet.

---

## 5. Interacting with Standard Base dApps

Users can leverage AWallet alongside the broader Base dApp ecosystem (Aerodrome, Uniswap, OpenSea, BasePaint):
- **Incoming Transactions**: Send funds from any external wallet to your AWallet address or `.base.eth` name.
- **Outgoing Transactions**: Use AWallet's Send and Swap sheets with 1inch Fusion gasless routing and Policy Engine protection.
- **Standard Verification**: Every executed transaction produces a verifiable BaseScan transaction hash conforming to standard EVM receipt specifications.

---

## 6. Summary Comparison

| Feature | Standard Self-Custodial Wallet | AWallet + EIP-1193 / EIP-681 |
| :--- | :--- | :--- |
| **Private Key Exposure** | Raw seed phrase stored in browser | Delegated to Secure Enclave / Passkeys / Vault |
| **Address Poisoning Guard** | None or basic visual tag | Cryptographic matching of prefix & suffix |
| **Invisible Character Filter**| None (vulnerable to bidi spoofing) | Multi-stage regex sanitization |
| **QR Code Compatibility** | Basic EIP-681 | EIP-681 + EIP-55 + Sanitized URI parser |
| **Policy Engine** | None (user manual confirmation) | Configurable daily spend caps & circuit breaker |
