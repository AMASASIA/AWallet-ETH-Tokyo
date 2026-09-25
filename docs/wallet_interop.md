# AWallet Specification & Standards Guide: EIP-1193 & EIP-681

This document outlines the architecture, standards compliance, and procedures for integrating and operating **AWallet** alongside standard Web3 wallets like **MetaMask**, **Coinbase Wallet**, and other EVM-compatible clients on the **Base** Layer 2 network.

---

## 1. Executive Architecture: Security-First Wallet Client

AWallet is engineered as an **identity-native smart wallet client and AI orchestration layer**. Rather than exposing raw, unencrypted seed phrases or private keys directly to client-side storage or AI language models, AWallet uses a dual-boundary architecture:

1. **Deterministic Policy & Pre-Execution Firewall**:
   - Inspects and validates transaction intents before reaching cryptographic signing.
   - Enforces daily spending limits, circuit breakers, EIP-55 checksum validation, and anti-poisoning vanity address detection.
2. **Standard Provider Interface (EIP-1193)**:
   - Interfaces directly with external injected signers (MetaMask, Coinbase Wallet, Rabby) or hardware/Passkey enclaves.
   - The AI layer (**Tive ◉AI**) holds no signing privileges and operates strictly via user-approved function calls.

---

## 2. EIP-1193: Ethereum Provider JavaScript API

[EIP-1193](https://eips.ethereum.org/EIPS/eip-1193) standardizes how decentralized applications communicate with Ethereum and Base providers through `window.ethereum`.

### 2.1 Provider Handshake & Account Connection

When connecting an existing external wallet, AWallet executes standard RPC discovery:

```typescript
// Requesting account connection from injected provider (MetaMask / Coinbase Wallet)
try {
  const accounts = (await window.ethereum.request({
    method: 'eth_requestAccounts',
  })) as string[];

  const activeAddress = accounts[0];
  console.log('Connected Base account:', activeAddress);
} catch (error: any) {
  if (error.code === 4001) {
    // User rejected the connection request
    console.warn('User declined wallet connection.');
  }
}
```

### 2.2 Base Network Switching & Discovery (`wallet_switchEthereumChain`)

AWallet operates on **Base Mainnet** (Chain ID: `8453` / `0x2105`) and **Base Sepolia** (Chain ID: `84532` / `0x14a34`). When an imported account is on Ethereum L1 or another L2, AWallet automatically triggers a network switch conforming to EIP-3326:

```typescript
const BASE_MAINNET_PARAMS = {
  chainId: '0x2105', // 8453 in decimal
  chainName: 'Base',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: ['https://mainnet.base.org'],
  blockExplorerUrls: ['https://basescan.org'],
};

async function ensureBaseNetwork(provider: any) {
  try {
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: BASE_MAINNET_PARAMS.chainId }],
    });
  } catch (error: any) {
    // Error code 4902 indicates that the chain has not yet been added to the wallet
    if (error.code === 4902) {
      await provider.request({
        method: 'wallet_addEthereumChain',
        params: [BASE_MAINNET_PARAMS],
      });
    } else {
      throw error;
    }
  }
}
```

---

## 3. Importing Existing Base Accounts

Users can bring their existing assets and transaction history into AWallet using three primary flows:

### Option 1: Coinbase Smart Wallet (Passkey / WebAuthn)
- **Mechanism**: Modern smart account powered by ERC-4337 and Passkeys.
- **Steps**:
  1. Click **Connect Wallet** in the top navigation of AWallet.
  2. Select **Coinbase Wallet** -> **Passkey / Smart Wallet**.
  3. Authenticate with device biometrics (Face ID, Touch ID, or Windows Hello).
  4. Your Base Smart Wallet address is imported immediately without requiring a 12-word seed phrase.

### Option 2: Coinbase Wallet Mobile App
- **Mechanism**: Secure QR pairing via `@coinbase/wallet-sdk`.
- **Steps**:
  1. In the connection sheet, choose **Coinbase Wallet** -> **Mobile App**.
  2. Scan the on-screen pairing QR code with the Coinbase Wallet app on iOS or Android.
  3. Confirm the session request. All transactions initiated in AWallet will request biometric approval on your mobile device.

### Option 3: MetaMask & Browser Extensions (Injected EIP-1193)
- **Mechanism**: Injected `window.ethereum` provider.
- **Steps**:
  1. Ensure the MetaMask or Rabby extension is unlocked in your browser.
  2. Click **Connect Wallet** -> **MetaMask / Injected**.
  3. Select your desired Base account in the MetaMask prompt and click **Connect**.
  4. AWallet syncs your native ETH balance, USDC balance, and Base Name (`.base.eth`).

---

## 4. EIP-681: Standard Transaction URIs & QR Generation

[EIP-681](https://eips.ethereum.org/EIPS/eip-681) standardizes URI formats for payment requests, QR codes, and deep links across the EVM ecosystem.

### 4.1 URI Syntax Specification

Standard payment request structure:
```text
ethereum:<address>[@<chain_id>][/<function_name>][?<parameters>]
```

### 4.2 Standard URI Generation by AWallet

When you open **Receive** in AWallet (`ReceiveSheet.tsx`), it generates standard EIP-681 URIs formatted for maximum cross-wallet compatibility:

1. **Native ETH Transfer on Base**:
   ```text
   ethereum:0x3914e6c3F66C2c0BDeF160dE53F9a9F661274F5A@8453
   ```
   *Any external wallet scanning this QR code automatically sets the target network to Base (8453) and fills the recipient address.*

2. **Pre-filled Amount Request**:
   ```text
   ethereum:0x3914e6c3F66C2c0BDeF160dE53F9a9F661274F5A@8453?value=1.5e18
   ```
   *Specifies an exact payment amount (1.5 ETH in wei scientific notation).*

3. **ERC-20 Token Transfer (e.g., USDC on Base)**:
   ```text
   ethereum:0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913@8453/transfer?address=0x3914e6c3F66C2c0BDeF160dE53F9a9F661274F5A&uint256=50000000
   ```
   *Invokes the ERC-20 `transfer(address,uint256)` contract call on Base USDC (`0x8335...2913`) for 50.00 USDC (6 decimals).*

### 4.3 Inbound EIP-681 Parsing & Security Sanitization

When scanning QR codes with AWallet's QR Scanner (`QrScannerModal.tsx`), the inbound URI is sanitized and resolved through multiple verification steps:

```typescript
export function parseEip681Uri(rawText: string): { address: string; chainId?: number; amount?: string } | null {
  // 1. Anti-Spoofing: Discard strings containing zero-width or bidirectional control characters
  if (/[\u200B-\u200D\uFEFF\u202A-\u202E]/.test(rawText)) {
    throw new Error('Malicious invisible characters detected in QR payload.');
  }

  let sanitized = rawText.trim();

  // 2. Strip URI schemes
  if (sanitized.toLowerCase().startsWith('ethereum:')) {
    sanitized = sanitized.slice('ethereum:'.length);
  } else if (sanitized.toLowerCase().startsWith('base:')) {
    sanitized = sanitized.slice('base:'.length);
  }

  // 3. Extract parameters and contract paths
  const [target, queryString] = sanitized.split('?');
  const [recipientOrContract] = target.split('/');
  const [address, chainId] = recipientOrContract.split('@');

  // 4. Validate EVM address integrity
  if (/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return {
      address,
      chainId: chainId ? parseInt(chainId, 10) : undefined,
    };
  }

  return null;
}
```

---

## 5. Security Guardrails Comparison

| Security Layer | Standard Self-Custodial Wallet | AWallet Interop Layer |
| :--- | :--- | :--- |
| **Signing Authority** | Injected provider / Hardware key | Injected provider (EIP-1193) |
| **Private Key Exposure** | Kept in browser storage extension | Never handled or stored in AWallet |
| **Address Poisoning Detection** | None (user manual visual check) | Automated vanity prefix/suffix matching |
| **Invisible Character Blocker**| None (vulnerable to visual spoofing)| Pre-flight regex rejection |
| **EIP-55 Checksum Verification**| Warning only in some wallets | Strict enforcement on all transaction inputs |
| **Circuit Breakers & Daily Limits**| None | Deterministic Policy Engine |

---

## 6. Testing Interoperability in AWallet

- **Interactive Modal**: Go to **More** -> **Interoperability & Standards (EIP-1193 / 681)** in the AWallet UI to inspect live status and integration tabs.
- **Instant Sandbox**: Test Base transfer simulation, biometric confirmations, and QR generation without connecting external funds.
- **BaseScan Verification**: All live transactions executed via connected EIP-1193 providers emit standard EVM receipts verifiable on [BaseScan](https://basescan.org).
