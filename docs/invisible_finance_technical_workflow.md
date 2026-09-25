# Technical Workflow: Invisible Finance & Micro-Payments via Base and ERC-4337

This document explains the technical architecture, operational workflow, and economic rationale behind **AWallet's Invisible Finance engine**, powered by the **Base (Layer 2)** network and **ERC-4337 (Account Abstraction)**.

---

## 1. Architectural Overview

Traditional Web3 payments require users to manually manage seed phrases, hold native gas tokens (ETH), calculate gas fees, and review cryptographic hex signatures. 

**Invisible Finance** abstracts these friction points by separating user intent from execution using a multi-layer pipeline:

```
[User Intent / BLE Proximity / Tive ◉AI]
                   │
                   ▼
       [Deterministic Policy Engine]
       (Tier 1: Auto | Tier 2: BLE Tap | Tier 3: Biometric)
                   │
                   ▼
        [ERC-4337 UserOperation]
       (Packed Intent + Paymaster + Signature)
                   │
                   ▼
          [Base Layer 2 Network]
       (EntryPoint Contract -> Bundler -> ~2s Settlement)
```

1. **Intent Orchestration (Tive ◉AI)**: Interprets voice, conversational text, or POS terminal proximity without holding raw private keys or execution rights.
2. **Deterministic Policy Engine**: Evaluates spending limits, destination integrity, and risk tiers prior to execution.
3. **ERC-4337 Account Abstraction**: Packages the transaction into a `UserOperation` (UserOp) sponsored or gasless via a Paymaster.
4. **Base L2 Settlement**: Executes with near-zero gas costs ($0.001) and sub-2-second finality.

---

## 2. Technical Workflow: Step-by-Step

### Step 1: Intent Capture & Tier Classification
When a payment is initiated (e.g., a 480 JPY / ~3.15 USDC coffee purchase at a POS or a peer-to-peer tip):
- The Policy Engine evaluates the transaction against predefined rules:
  - **Tier 1 (Zero-Friction / Automated)**: Small recurring transfers or pre-authorized micro-streams (< 500 JPY / $3 USD) execute with zero prompts.
  - **Tier 2 (Ambient / BLE Proximity Tap)**: In-store payments require proximity validation (Bluetooth Low Energy / NFC) or a single haptic confirmation.
  - **Tier 3 (Biometric Authentication)**: First-time counterparties or transfers exceeding threshold limits require Passkey (Face ID / Touch ID) authorization.
  - **Tier 4 (Circuit Breaker / Escalation)**: Anomalous volume or flagged addresses are hard-blocked deterministically.

### Step 2: ERC-4337 UserOperation Construction
Instead of standard EOA transactions, AWallet constructs a standard ERC-4337 `UserOperation`:

```typescript
interface UserOperation {
  sender: string;               // Smart Account address (ERC-4337)
  nonce: bigint;                // Sequential replay-protected counter
  initCode: bytes;              // Account creation bytecode (if deploying just-in-time)
  callData: bytes;              // Encoded USDC transfer(to, amount)
  callGasLimit: bigint;         // Gas required for execution
  verificationGasLimit: bigint; // Gas required for signature verification
  preVerificationGas: bigint;   // Static overhead compensation
  maxFeePerGas: bigint;         // EIP-1559 base fee on Base
  maxPriorityFeePerGas: bigint; // Miner tip
  paymasterAndData: bytes;      // Paymaster address + sponsorship metadata
  signature: bytes;             // Passkey (WebAuthn) or session key signature
}
```

### Step 3: Gasless Experience via ERC-4337 Paymaster
- In traditional wallets, users must hold ETH to transfer USDC. If they have zero ETH, the transaction fails.
- AWallet utilizes an **ERC-4337 Paymaster**:
  - **Gas Sponsorship**: Micro-payments can have gas sponsored entirely by the merchant or dApp.
  - **Pay Gas in USDC**: The Paymaster automatically converts a fraction of a cent in USDC to cover the Base gas fee, eliminating the need for the user to ever acquire or hold ETH.

### Step 4: Bundler & EntryPoint Execution on Base
1. The UserOp is dispatched to the Base alternative mempool via an ERC-4337 Bundler.
2. The Bundler batches multiple user actions and submits them to the canonical `EntryPoint` contract (`0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789`).
3. The `EntryPoint` verifies the Paymaster balance and smart account signature, executing the ERC-20 `transfer` cleanly in a single on-chain transaction.

---

## 3. Why It Is Faster & Cheaper Than Traditional Bank Transfers

| Dimension | Traditional Bank Transfer | Credit Card Networks (Visa/Mastercard) | AWallet (Base + ERC-4337 USDC) |
| :--- | :--- | :--- | :--- |
| **Settlement Time** | **Hours to 3 business days** (slowed by cut-offs and weekends) | **Instant auth, 14–30 days settlement** for merchants | **~2 seconds** (Instant cryptographic finality) |
| **Transaction Fee** | **$1.50 – $3.00** (domestic) / **$25 – $50** (international wire) | **2.5% – 3.5% + $0.30** fixed interchange fee | **<$0.005 (Fraction of a cent)** via Base L2 |
| **Micro-Payment Viability** | **Impossible** (fees exceed transfer value) | **Unviable** (fixed $0.30 fee makes $0.50 charges prohibitive) | **Native support** ($0.05 – $5.00 transfers fully economical) |
| **Global Borders** | Disjointed clearinghouses (SWIFT, ACH, Zengin) with heavy forex spreads | Requires cross-border currency conversion fees (1–3%) | **Border-free**: Same cost and speed worldwide |
| **User Onboarding** | Branch verification, IDs, paper forms, multi-day wait | Credit scoring, physical card shipment, CVV/OTP hurdles | **Instant Smart Wallet creation** via device Passkey (Face ID) |
| **Chargeback / Fraud Risk** | Wire recalls, account freezes | High fraud & friendly chargeback liability for merchants | **Deterministic & Irreversible**: No merchant chargeback penalties |

---

## 4. Key End-User Benefits

1. **True Micro-Payments & Streaming Payments**: Enables novel economic models like paying fractions of a cent per API call, reading a single article for 10 JPY (~$0.07), or streaming wages per second.
2. **No Crypto Complexity**: Users hold a stable, dollar-backed digital currency (USDC) and pay without ever seeing gas fee dialogs, calculating Gwei, or copying 42-character hexadecimal addresses.
3. **High Security Without Seed Phrases**: Biometric Passkeys backed by Secure Enclave hardware eliminate the danger of lost paper seed phrases and phishing attacks.
4. **Merchant Efficiency**: Merchants receive direct, final settlement in seconds, saving up to 95% on processing fees compared to traditional credit card rails.
