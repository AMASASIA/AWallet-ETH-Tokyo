# A\Wallet — Identity-Native Smart Wallet Operating System

[![Network](https://img.shields.io/badge/Network-Base%20%7C%20EVM-blue.svg)](https://base.org)
[![Account Abstraction](https://img.shields.io/badge/ERC--4337-Account%20Abstraction-blueviolet.svg)](https://eips.ethereum.org/EIPS/eip-4337)
[![Identity](https://img.shields.io/badge/W3C-Decentralized%20Identifier%20%28DID%29-green.svg)](https://www.w3.org/TR/did-core/)
[![Credential](https://img.shields.io/badge/EIP--5114-Soulbound%20Tokens%20%28SBT%29-orange.svg)](https://eips.ethereum.org/EIPS/eip-5114)
[![AI Orchestration](https://img.shields.io/badge/Tive%20◉AI-Gemini%20Liaison%20Engine-black.svg)](#tive-ai-automated-portfolio-management-system)

**A\Wallet** is an enterprise-grade, identity-native smart wallet operating system designed for the EVM ecosystem (anchored on Base). It bridges on-chain account abstraction (**ERC-4337**), self-sovereign identity (**DID** & **Soulbound Tokens**), hardware-attested biometric authorization (**Pico W / WebAuthn**), and deterministic policy automation with **Tive ◉AI**—an invisible finance orchestration layer for automated, risk-gated portfolio management.

---

## 📑 Table of Contents

1. [Architecture Overview](#-architecture-overview)
2. [Identity-Native OS Core](#-identity-native-os-core)
   - [Decentralized Identifiers (DID)](#decentralized-identifiers-did)
   - [Soulbound Tokens (SBTs) & Verifiable Credentials](#soulbound-tokens-sbts--verifiable-credentials)
3. [Smart Account & ERC-4337 Account Abstraction](#-smart-account--erc-4337-account-abstraction)
   - [UserOperations & Paymasters](#useroperations--paymasters)
   - [Granular Session Keys](#granular-session-keys)
   - [1inch Fusion Gasless Resolvers](#1inch-fusion-gasless-resolvers)
4. [Tive ◉AI: Automated Portfolio Management System](#-tive-ai-automated-portfolio-management-system)
   - [Zero-Key-Access Orchestration Architecture](#zero-key-access-orchestration-architecture)
   - [Structured Function Calling JSON & ApprovalCards](#structured-function-calling-json--approvalcards)
   - [Butterfly Effect AutoML & ABC Swarm Optimization](#butterfly-effect-automl--abc-swarm-optimization)
5. [Deterministic Policy Engine (5-Tier Safety Model)](#-deterministic-policy-engine-5-tier-safety-model)
   - [Tier 1: Autonomous Micro-Execution](#tier-1-autonomous-micro-execution)
   - [Tier 2: Hardware Tap (Raspberry Pi Pico W BLE)](#tier-2-hardware-tap-raspberry-pi-pico-w-ble)
   - [Tier 3: Passkey / WebAuthn Biometrics](#tier-3-passkey--webauthn-biometrics)
   - [Tier 4: Circuit Breaker & Safety Halt](#tier-4-circuit-breaker--safety-halt)
   - [Tier 5: Regulatory Product Pre-Gate (STO & Variable-Return Assets)](#tier-5-regulatory-product-pre-gate-sto--variable-return-assets)
6. [Multi-Signature Governance & Treasury Safes](#-multi-signature-governance--treasury-safes)
7. [System Architecture Diagram](#-system-architecture-diagram)
8. [Directory Structure](#-directory-structure)
9. [Getting Started & Development](#-getting-started--development)
10. [Compliance, Security & Safety Guarantees](#-compliance-security--safety-guarantees)

---

## 🏛️ Architecture Overview

Traditional Web3 wallets treat identity as a mere public-private keypair: losing the seed phrase wipes out identity, assets, and reputation. A\Wallet shifts this paradigm by decoupling:

- **Identity Layer**: W3C-compliant Decentralized Identifiers (`did:ion:`, `did:key:`) and Soulbound non-transferable attestations.
- **Execution Layer**: ERC-4337 Smart Contract Account on Base with programmable verification logic, custom paymasters, and session keys.
- **Orchestration Layer**: **Tive ◉AI**, an AI assistant powered by Gemini that interprets natural language and automated telemetry, outputting strictly structured proposals.
- **Policy & Security Layer**: A deterministic, math-grounded **Policy Engine** that evaluates risk tiers and executes hardware/biometric gates without AI discretion.

---

## 🪪 Identity-Native OS Core

### Decentralized Identifiers (DID)
A\Wallet anchors user accounts to persistent, self-sovereign DIDs:
- Native DID resolution (e.g., `did:ion:EiD...` or `did:key:z6Mk...`).
- Decouples user reputation and verifiable identity from rotatable ephemeral signing keys.
- Binds on-chain BaseName handles with multi-chain verifiable credentials.

### Soulbound Tokens (SBTs) & Verifiable Credentials
Reputation and compliance qualifications are anchored using non-transferable ERC-5114 Soulbound Tokens:
- **Executive Membership SBT**: Unlocks Tier 5 institutional allocation pools (e.g., variable-return digital bonds, commodity CFDs).
- **KYC/AML Attestation SBT**: Issued by licensed verifiers for regulatory suitability checks.
- **Audit & Governance SBT**: Grants voting thresholds on Treasury Safe proposals.

---

## ⚡ Smart Account & ERC-4337 Account Abstraction

A\Wallet eliminates seed phrase friction and raw gas overhead through full ERC-4337 compatibility:

### UserOperations & Paymasters
- Converts raw transactions into bundled `UserOperations`.
- Supported by custom Paymaster services enabling gasless transactions sponsored in USDC or protocol subsidies.

### Granular Session Keys
Session keys allow authorized automated agents (such as Tive ◉AI's autonomous rebalancing routines) to execute restricted operations:
- **Scope Limitations**: Bound to whitelisted smart contracts and liquidity pools.
- **Spending Caps**: Enforced maximum single-transaction and cumulative daily volume.
- **Time-to-Live (TTL)**: Automatic expiration preventing stale key exploitation.

### 1inch Fusion Gasless Resolvers
Integrated with 1inch Fusion protocol:
- MEV-protected Dutch auctions.
- Resolvers execute fill transactions and pay network gas, ensuring zero balance friction for newly onboarded accounts.

---

## 🤖 Tive ◉AI: Automated Portfolio Management System

### Zero-Key-Access Orchestration Architecture
Tive ◉AI operates strictly as a liaison and portfolio orchestration engine:
> **Zero-Key Principle**: Tive ◉AI **never** holds, observes, or manages raw private keys, seed phrases, or unmediated execution privileges. All cryptographic authorization is delegated to the client Secret Vault and Policy Engine.

### Structured Function Calling JSON & ApprovalCards
Whenever Tive ◉AI recommends a transaction (rebalance, hedge, STO issuance, or swap), it generates a strictly typed Function Calling JSON payload rendered directly onto an interactive **ApprovalCard**:

```json
{
  "destination": "Licensed Commodity Vault (0x7aa...3c81)",
  "amountLabel": "$5,000 (~33.5g Au equiv / 5,000 USDC)",
  "reason": "User requested 'Allocate $5,000 to Gold variable-return strategy under executive membership'.",
  "whyApprovalNeeded": "Policy Engine Tier 5 Gate Passed. Regulatory product requires biometric sign."
}
```

Every proposal must contain:
1. `reason`: Grounded strictly in verified user intent or portfolio thresholds.
2. `whyApprovalNeeded`: Transparent explanation of why the action cannot run autonomously.

### Butterfly Effect AutoML & ABC Swarm Optimization
For portfolio rebalancing and algorithmic strategies, Tive ◉AI leverages the **Butterfly Effect Engine**—an Artificial Bee Colony (ABC) swarm intelligence algorithm:
- **Adaptive Feature Selection**: Dynamically scans feature groups (`spot_price_`, `volatility_`, `spread_`, `macro_`).
- **Circuit-Breaker Protected**: Enforces wall-clock limits (`--max-seconds`) and iteration limits to prevent compute runaway.
- **Strict Anti-Hype Filter**: Filters out unverified fixed-yield claims and enforces variable-return compliance on all datasets.

---

## 🛡️ Deterministic Policy Engine (5-Tier Safety Model)

AI models are probabilistic; security rules must be **deterministic**. The Policy Engine sits between Tive ◉AI and on-chain execution, sorting every action into one of 5 distinct tiers:

```
[User Request / Automated Signal]
             │
             ▼
      [Tive ◉AI Model]
             │ Function Calling JSON
             ▼
    ┌─────────────────┐
    │  Tier 5 Gate?   │ ── FAIL ──► [REJECTED] (Terminates immediately)
    └────────┬────────┘
             │ PASS
             ▼
    ┌─────────────────┐
    │  Tiers 1 to 4   │
    └────────┬────────┘
             ├── Tier 1 (Micro/Reversible) ────► [AUTO-EXECUTION]
             ├── Tier 2 (Standard Swaps)  ────► [PICO W HARDWARE TAP]
             ├── Tier 3 (High-Value DeFi) ────► [BIOMETRIC WEBAUTHN]
             └── Tier 4 (Anomalies/Halt)  ────► [SAFETY HALT & ESCALATION]
```

### Tier 1: Autonomous Micro-Execution
- **Criteria**: Transactions under low threshold (e.g. <$50), within daily quota, and fully reversible or routine (gas refill, micropayments).
- **Execution**: Automatically executed via session keys without interrupting the user.

### Tier 2: Hardware Tap (Raspberry Pi Pico W BLE)
- **Criteria**: Medium-sized operations ($50–$100), standard stablecoin rebalancing, whitelisted protocol swaps.
- **Execution**: Physical confirmation via a Bluetooth Low Energy (BLE) paired Raspberry Pi Pico W. User presses a tactile switch wired to **GP15** to physically authorize the transaction.

### Tier 3: Passkey / WebAuthn Biometrics
- **Criteria**: Large transactions (>$100), first-time destination addresses, new liquidity pool deposits.
- **Execution**: High-assurance biometric passkey signature (Touch ID, Face ID, FIDO2) requested in-app.

### Tier 4: Circuit Breaker & Safety Halt
- **Criteria**: Unrecognized contract interaction, sudden slippage spikes, suspicious velocity, or repeated failed operations.
- **Execution**: Emergency circuit breaker trips (`TRIPPED`), freezing automated execution until manual human concierge review.

### Tier 5: Regulatory Product Pre-Gate (STO & Variable-Return Assets)
Tier 5 is an **amount-agnostic pre-gate** enforced before any STO, digital bond, electricity CFD, or warrant exercise can proceed:
- **Mandatory Variable-Return Tag**: Strictly forbids fixed-yield promises ("guaranteed return", "元本保証", "確定利回り").
- **8-Day Cooling-Off Window**: For new issuances (`issuance`), users retain an unconditional, deterministic right to cancel without fee or penalty.
- **Solvency Check & Atomic Reservation**: For redemptions (`redemption`), available treasury liquidity is locked atomically using `ConditionExpression` concurrency control to prevent double-spend race conditions.
- **Pre-Execution Sanity Scan**: Double-checks marketing copy and smart contract parameters directly before final on-chain dispatch.

---

## 🏛️ Multi-Signature Governance & Treasury Safes

For institutional treasury operations and large-scale asset redemptions exceeding `governance_threshold`:
- **Platform Safe (2-of-3)**: Co-signs primary STO allocations and platform-level settlements.
- **Treasury Safe (3-of-5)**: Independent governance board quorum for high-volume liquidity disbursements.
- **On-Chain Audit Trails**: Every state transition produces SHA-256 verifiable logs anchored directly to Base.

---

## 🗺️ System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                 Multi-Modal User Interaction                │
│             (Voice, Touch, Passkey, Pico W BLE)             │
└──────────────────────────────┬──────────────────────────────┘
                               │ Natural language / Command
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Tive ◉AI Orchestration Layer                │
│         • Gemini Engine             • Intent Parser         │
│         • ABC Swarm AutoML          • JSON Proposal Card    │
└──────────────────────────────┬──────────────────────────────┘
                               │ Structured JSON (Zero-Key)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│              Policy Engine Tier 5 Pre-Gate                  │
│     • Regulatory License      • Variable Return Profile     │
│     • Suitability Match       • Statutory Disclaimer Scan   │
└──────────────┬───────────────────────────────┬──────────────┘
         PASS  │                               │ FAIL
               ▼                               ▼
┌─────────────────────────────┐   ┌───────────────────────────┐
│     Policy Engine Tiers 1–4 │   │     Statutory Block       │
│  (Risk / Volume / Velocity) │   │     (REJECTED_TIER5)      │
└──────────────┬──────────────┘   └───────────────────────────┘
               │ Dynamic TTL Token
               ▼
┌─────────────────────────────────────────────────────────────┐
│                     Execution Bridges                       │
│  • Tier 1: ERC-4337 Session Key Bundler                     │
│  • Tier 2: Raspberry Pi Pico W (GP15 Tactile Switch BLE)    │
│  • Tier 3: FIDO2 / WebAuthn Biometric Passkey               │
│  • Tier 5: Safe Multi-Sig Quorum + Cooling-Off Machine      │
└──────────────────────────────┬──────────────────────────────┘
                               │ Validated UserOperation
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 On-Chain Settlement (Base)                  │
│       • Smart Contract Wallet        • Paymaster Service    │
│       • Treasury Safe Multi-Sig      • Verifiable SBT State │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Directory Structure

```
├── components/                 # Reusable UI component modules
│   ├── BiometricAuthModal.tsx  # FIDO2 / WebAuthn Passkey modal
│   ├── Navbar.tsx              # Dynamic network & wallet top bar
│   ├── SendModal.tsx           # ERC-20 / Native token transfer modal
│   └── SwapModal.tsx           # 1inch Fusion / DEX swap interface
├── pages/                      # Application view controllers
│   ├── InvisibleFinanceView.tsx # Tive ◉AI ApprovalCards & Tier 1–5 monitoring
│   ├── PolicyEngineView.tsx    # Policy Engine parameters & session key config
│   ├── TiveDashboard.tsx       # Tive ◉AI analytics & portfolio dashboard
│   ├── GovernanceView.tsx      # Multi-signature proposal workflow
│   ├── HistoryView.tsx         # Tamper-evident transaction logs
│   ├── MoreView.tsx            # Decentralized Identity (DID), SBTs, settings
│   └── WalletView.tsx          # Multi-asset balances & token breakdown
├── services/                   # Business logic, simulation & protocol clients
│   ├── mockChain.ts            # Policy Engine evaluation & mock data state
│   └── picoBle.ts              # Raspberry Pi Pico W Web Bluetooth driver
├── types.ts                    # Core TypeScript definitions (ERC-4337, Tier 5, DID)
├── TIVE.md                     # Complete Tive ◉AI architecture & system prompt
├── TIER5_SPEC.md               # Tier 5 state machine & regulatory specification
├── App.tsx                     # Top-level state coordinator & root component
├── main.tsx                    # Vite entry point
└── package.json                # Project dependencies and build scripts
```

---

## 🚀 Getting Started & Development

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **Package Manager**: npm, pnpm, or yarn
- **Browser**: Modern Chromium-based browser supporting Web Bluetooth (for Pico W) and WebAuthn (for Passkeys)

### Installation
```bash
# Clone repository
git clone https://github.com/your-org/a-wallet.git
cd a-wallet

# Install dependencies
npm install
```

### Development Server
```bash
# Start Vite development server on port 3000
npm run dev
```
Open `http://localhost:3000` to view the application.

### Quality Assurance & Build
```bash
# Run TypeScript typecheck and ESLint
npm run lint

# Build production bundle
npm run build
```

---

## ⚖️ Compliance, Security & Safety Guarantees

1. **Non-Custodial Integrity**:
   Neither Tive ◉AI nor any remote backend service stores user private keys. Cryptographic authorizations occur client-side via hardware-bound WebAuthn or physical Pico W switches.
2. **Deterministic Pre-Emption over AI Judgment**:
   Tive ◉AI cannot bypass, alter, or override Policy Engine decisions. If an asset fails Tier 5 compliance, the transaction is rejected at the engine level with no override mechanism.
3. **Statutory Investment Protection**:
   All institutional and STO operations strictly mandate the variable-return profile, rejecting any marketing promises of guaranteed principal or guaranteed yields in compliance with global financial regulations.
4. **Physical Air-Gap Security**:
   The Raspberry Pi Pico W integration ensures that even in the event of a compromised client browser, funds cannot be moved without manual tactile switch depression on an independent hardware device.
