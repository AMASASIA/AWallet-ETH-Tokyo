# Tive ◉AI — System Architecture & Specification

## 1. Overview & Core Philosophy

**Tive ◉AI** is an orchestration and conversational intelligence layer designed for **AWallet** (Invisible Finance & Smart Wallet). Operating on top of foundation models such as Google Gemini, Tive ◉AI extracts user intentions regarding stablecoins and tokenized assets from natural conversation, formulating deterministic, actionable proposals.

> **Zero-Key-Access Principle**: Tive ◉AI itself is an orchestration layer. It possesses **zero raw private keys, zero signature credentials, and zero execution privileges**. 

Asset execution is strictly carried out by the **Automation Engine**, while transaction permission and security validation are enforced deterministically by the **Policy Engine**.

```
┌─────────────────────────────────────────────────────────────┐
│                       User Interface                        │
│             (Chat, Voice, Audio, Gesture, Tap)              │
└──────────────────────────────┬──────────────────────────────┘
                               │ User Intent & Dialogue
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Tive ◉AI Orchestration Layer                │
│    (Gemini Foundation Model + Creative Base & Labeling)     │
│   • Context Extraction   • Structured Function Calling      │
│   • Intent Explanation   • No Private Keys or Signing Auth  │
└──────────────────────────────┬──────────────────────────────┘
                               │ Proposed Action (JSON)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                        Policy Engine                        │
│            (Deterministic Rule-Based Governance)            │
│   • Tier 1: Autonomous Auto-Approval (Micro / Queries)      │
│   • Tier 2: Pico W Hardware Tap (BLE / GP15 switch)         │
│   • Tier 3: Biometric Passkey / WebAuthn Sign               │
│   • Tier 4: Circuit Breaker & Safety Escalation             │
└───────────┬───────────────────────────────────┬─────────────┘
            │ Verified Authorization Token      │ Requires Hardware
            ▼                                   ▼
┌─────────────────────────────┐   ┌───────────────────────────┐
│     Secret Vault Engine     │   │ Raspberry Pi Pico W / BLE │
│  (TTL Ephemeral Token Auth) │   │  (Physical Tap / Tact SW) │
└───────────┬─────────────────┘   └───────────────────────────┘
            │ Signed Transaction Payload
            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Automation Engine                      │
│     (Execution & Settlement: Base / EVM / Stablecoins)      │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Design Principles for 'Tive ◉AI'

### 2.1 Non-Custodial Orchestration
- **No Secret Key Storage**: Neither API secrets nor mnemonic phrases are ever exposed to the agent or injected into model context.
- **Role Separation**: Tive ◉AI proposes; Policy Engine judges; Secret Vault issues short-lived session grants; Automation Engine broadcasts.

### 2.2 User-Intent Grounding & Anti-Hallucination
- Every proposed action must have an explicit `reason` rooted directly in user utterances. The AI must never invent financial intent out of unverified conjecture.
- If a target destination or asset amount is ambiguous, Tive ◉AI must initiate a clarifying inquiry rather than issuing a speculative transaction proposal.

### 2.3 Transparent Explainability
- For any transaction gated behind human confirmation (Tier 2, Tier 3, or Tier 4), Tive ◉AI is obligated to clearly articulate `whyApprovalNeeded` without obfuscation.

### 2.4 Multilingual & Localization Standards
- Fixed UI labels and controls are managed by the application's localized dictionaries (`i18n`).
- Dynamic AI explanations (`reason`, `whyApprovalNeeded`) are generated natively in the requester's locale (`ja`, `en`, `zh`), honoring local currency standards and polite honorific conventions.

---

## 3. Four-Tier Policy Engine Governance

| Tier | Name | Risk / Conditions | Authorization Mechanism | User Experience |
| :--- | :--- | :--- | :--- | :--- |
| **Tier 1** | **Autonomous** | Read-only queries, portfolio rebalancing within pre-signed daily thresholds (< $5.00), gas optimizations | Pre-signed session policy in Policy Engine | Completely invisible; executed autonomously with audit log |
| **Tier 2** | **Physical Tap** | Daily counter payments, micro-transfers (< ¥1,000 / $10), verified vendors | Physical Pico W tactile switch press via BLE/UART | Single physical button press; zero screen friction |
| **Tier 3** | **Biometric Auth** | Recurring subscription threshold changes (> $100), smart contract deposits | WebAuthn / Passkey biometric signature (Touch ID / Face ID) | Protective modal with cryptographic challenge sign |
| **Tier 4** | **Circuit Breaker** | Unverified new recipient addresses, anomalous high amounts (> $1,000), velocity spikes | Hard safety freeze; manual escalation & security unlock | Blocked by default; requires explicit multi-step verification |

---

## 4. Communication Protocols

### 4.1 AI Agent ↔ Policy Engine Protocol (Function Calling JSON)

When Tive ◉AI identifies an actionable asset intent, it emits a structured payload matching the standard ApprovalCard schema:

```json
{
  "destination": "0x92f...4d1e (Blue Bottle Coffee POS)",
  "amountLabel": "¥480 (~3.15 USDC)",
  "reason": "ユーザーが「カフェで支払いを済ませて」と発言したため、店頭端末POSへの小額決済を生成しました。",
  "whyApprovalNeeded": "Policy Engine Tier 2: 1,000円未満の日常対面決済のため、Pico Wハードウェアでのワンタップ物理承認が必要です。"
}
```

#### JSON Field Definitions
- `destination` *(string, required)*: Target recipient address, ENS/DID identifier, or registered merchant entity.
- `amountLabel` *(string, required)*: User-facing currency representation alongside exact token quantities (e.g. `¥480 (~3.15 USDC)`).
- `reason` *(string, required)*: Specific conversational grounding justifying why Tive ◉AI generated this proposal.
- `whyApprovalNeeded` *(string, required)*: Concrete explanation of the deterministic Policy Engine rule enforcing confirmation.

---

### 4.2 Policy Engine ↔ Secret Vault Protocol

To prevent key leakage, the Policy Engine communicates with the Secret Vault using time-bounded (TTL) ephemeral grants:

1. **Authorization Request**: Policy Engine validates Tier requirements and user proof (Pico W signature or WebAuthn assertion).
2. **Ephemeral Token Grant**:
   ```json
   {
     "grantId": "grant_8f92a10c",
     "actionHash": "0x4c2b9a77...e91",
     "ttlSeconds": 30,
     "maxSpend": "3.15 USDC",
     "recipient": "0x92f...4d1e",
     "issuedAt": 1789214300
   }
   ```
3. **Execution**: Automation Engine executes the transaction using the ephemeral token within the 30-second window. The token expires immediately post-execution.

---

### 4.3 AWallet Client ↔ Raspberry Pi Pico W Hardware Protocol

The Raspberry Pi Pico W acts as a physical security authenticator for Tier 2 invisible payments via Web Bluetooth (BLE) or Web Serial (USB UART fallback).

```
 ┌──────────────────────┐                     ┌──────────────────────┐
 │    AWallet Client    │                     │  Raspberry Pi Pico W │
 │  (Browser / WebBLE)  │                     │ (RP2040 + CYW43439)  │
 └──────────┬───────────┘                     └──────────┬───────────┘
            │                                            │
            │ 1. BLE GATT Connect & MTU Exchange         │
            ├───────────────────────────────────────────>│
            │                                            │
            │ 2. TX Pending Notification (CMD: PROPOSE)  │
            ├───────────────────────────────────────────>│ [LED Blinks Amber]
            │    Payload: { id, tier: 2, amount, nonce } │
            │                                            │
            │                                            │ [User Presses GP15]
            │                                            │ [Hardware Debounce]
            │ 3. Physical Tap Confirmation               │
            │<───────────────────────────────────────────┤ [LED Solid Emerald]
            │    "TAP_CONFIRMED:GP15:<nonce>:<sig>"      │
            │                                            │
            │ 4. Settlement Complete Notification        │
            ├───────────────────────────────────────────>│ [Buzzer / Chime]
            │                                            │
```

#### Bluetooth Low Energy (BLE) GATT Profile
- **Service UUID**: `6E400001-B5A3-F393-E0A9-E50E24DCCA9E` (Nordic UART Service Compatible)
- **RX Characteristic (Write)**: `6E400002-B5A3-F393-E0A9-E50E24DCCA9E`
  - Sends transaction proposal digest and challenge nonce from browser to Pico W.
- **TX Characteristic (Notify)**: `6E400003-B5A3-F393-E0A9-E50E24DCCA9E`
  - Emits tap confirmation event upon physical tactile button press.

#### Hardware Pinout Configuration (Raspberry Pi Pico W)
- **GP15**: Push Button / Tactile Switch (Configured with internal pull-up `PULL_UP`, active-low logic).
- **GP16**: Status Indicator LED (Amber = Awaiting Tap, Emerald/Blue = Approved, Red = Rejected/Timeout).
- **GP14**: Piezo Buzzer / Haptic Trigger (Optional confirmation feedback tone).

#### Message Packet Framing
```
// Client -> Pico W: Announce awaiting transaction
{"cmd":"PROPOSE","id":"act_01","amt":"¥480","nonce":"a9f82d1c"}

// Pico W -> Client: Button pressed on GP15
TAP_CONFIRMED:GP15:a9f82d1c:SIG_OK
```

---

## 5. System Prompt Specification (Reference)

```markdown
# Tive ◉AI — システムプロンプト（Google AI Studio用・日本語版）

Tive ◉AIは大規模なAIではGeminiと連携するが、クリエイティブクラス、クリエイティブべースや絵文字などや独自のラベリング技術を有する情報管理や出力形式に特許技術を有する音声情報における付帯する情報インターフェイスのあり方である。

> Tive ◉AI自体はGeminiベースのオーケストレーション層であり、生の秘密鍵・実行権限を持たない。

あなたはAWalletの中で動く「Tive ◉AI」です。ユーザーの資産（ステーブルコイン・トークン化資産等）に関する意図を会話から読み取り、実行可能な提案をJSON形式で出力する役割を持ちます。あなた自身は資金を動かしません。実行はAutomation Engineが、可否の判定はPolicy Engineが決定論的に行います。

## あなたの権限の範囲
- あなたは「提案する」だけです。実行の可否はあなたが決めるのではなく、Policy Engine（決定論的ルール、あなたによる上書き不可）が判定します。
- あなたは秘密鍵・APIキー・署名権限を一切持ちません。これらはSecret VaultがTTL付きの動的トークンとして必要な時だけ発行します。
- 提案がPolicy EngineのTier3（本人承認が必要）またはTier4（人間へ即エスカレーション）に該当する場合、あなたはユーザーに対して「なぜ承認が必要か」を明確に説明する義務があります。理由を隠したり曖昧にしてはいけません。

## 出力形式（Function Calling JSON）
資金移動・スワップ等を提案する際は、必ず以下の4項目を含めてください。これはUI側の承認カード（ApprovalCard）にそのまま渡されます。

```json
{
  "destination": "送り先（アドレスまたは登録済みウォレット名）",
  "amountLabel": "金額（現地通貨換算＋実際のトークン量）",
  "reason": "なぜこの提案をしたか（ユーザーの発言に基づく具体的な根拠）",
  "whyApprovalNeeded": "なぜ自動実行ではなく承認が必要か"
}
```

- `reason` は必ずユーザーが実際に会話で述べたことに基づかせること。会話にない意図を推測で作らない。
- 曖昧な提案（「何か資産を動かしましょう」等）は禁止。具体的な金額・送り先が定まらない場合は、先に確認の質問をする。

## 多言語対応の原則
- UIの固定文言（ボタンラベル、ラベル名）はアプリ側のi18n辞書が担当し、AIは動的な説明文（`reason` 等）のみ生成する。
- 動的な説明文は渡されたロケール（`ja` / `en` / `zh` 等）に応じた自然な文章で生成する。

## 禁止事項
- ユーザーの発言にない資産移動を提案しない。
- Policy Engineの判定結果を覆すような文言を出力しない。
- 曖昧な通知（金額・理由を伏せた「確認が必要です」等）を生成しない。常に具体を出す。
- 自分がPolicy Engineやセキュリティ判断そのものであるかのように振る舞わない。
```

---

## 6. Audit & Recovery Flow

1. **Deterministic Logging**: Every action processed through Tier 1–4 generates an immutable hash logged to the wallet's Activity stream.
2. **Revocation & Timeout**: Any pending Tier 2 or Tier 3 action unconfirmed after 120 seconds automatically expires with its challenge nonce invalidated.
3. **Fail-Safe Mode**: If BLE disconnects or the Policy Engine service fails health check, the wallet reverts to strict cold-lock mode (Tier 4 behavior).

---

## 7. Amane Protocol Liaison Model & Butterfly Effect Technology

### 7.1 Overall Concept & City OS (都市OS) Architecture
Under the **Amane Protocol**, **Tive ◉AI** is formally designated as the **Liaison Model** connecting disparate entities within the urban and economic operating system.

- **Butterfly Effect Technology (バタフライエフェクト技術)**: Interactively connects seemingly unrelated and disjoint elements by discerning underlying regularities, universal rules, causal relationships, and multidirectional influences.
- **Creation of Informal Communication (インフォーマル・コミュニケーションの創出)**: Within an IoT-connected City OS where humans, animals, plants, and cross-industry nodes interlink, the AI generates serendipitous matching opportunities.
- **Cultivating Cooperation & Trust (協調性と信頼関係の構築)**: Connects distributed peers living across separated physical domains, providing the catalyst and awareness necessary for organic cooperation and mutual trust.
- **Generation of Constructive Positive Emotion (プラスの感情の生成)**: Operates a Primal Adaptive System (プライマル・アダクティヴ・システム) designed to cultivate collective, constructive positive sentiment.
- **The Spirit of WA (和の精神を持つAI)**: Embodies the four dimensions of **WA (和)**:
  - **輪 (Connection)**: The continuous circle and network of people.
  - **和 (Harmony & Cooperation)**: Mutually supportive and respectful relationships.
  - **話 (Dialogue)**: Empathetic, continuous, and clear communication.
  - **環 (Environment & Circularity)**: Sustainable, closed-loop economic and ecological balance.

---

## 8. ABC-AutoML Engine (`tive_abc_automl.py`) & Automation Roadmap

### 8.1 Artificial Bee Colony (ABC) Swarm Intelligence
Tive ◉AI integrates an in-house **ABC-AutoML** engine that operates independently of third-party external AutoML libraries. Inspired by the natural foraging behaviors of honeybees, it orchestrates three distinct iterative phases:
1. **Employed Bees (働き蜂)**: Exploit local food sources, refining feature selection masks and hyperparameter candidate vectors.
2. **Onlooker Bees (追従蜂)**: Probabilistically recruit to superior food sources based on fitness values (accuracy, yield risk-return ratios).
3. **Scout Bees (偵察蜂)**: Abandon exhausted solutions and randomly forage across new solution spaces, escaping local optima.

### 8.2 Resolved Multi-Core Automation (`n_jobs`)
To maximize execution throughput on multicore hardware environments (4–8 cores) without artificial stalls or hardcoded constraints, the model training lifecycle dynamically resolves `n_jobs`:

```python
# 解決された n_jobs を使用して最終モデルを構築し学習を実行
final_model = build_model(hp, task, n_jobs=n_jobs)
final_model.fit(X[:, mask], y)
```

Empirical benchmarks (e.g. `colony_size=8, max_iter=5`) with timeout-protected execution verify ultra-low latency and scalable stability, ready for scaling up to colony sizes of 20–30.

### 8.3 Daemon Automation Roadmap: Watchdog Folder Monitoring
To transition into full hands-free operational automation:
- **File System Watcher (`watchdog`)**: A resident background daemon automatically detects new CSV asset or IoT data drops.
- **Zero-Touch Execution**: Upon detection, Tive ◉AI autonomously runs data preprocessing, ABC feature selection, Random Forest hyperparameter tuning, model serialization, and automated yield rebalancing without human manual commands.

---

## 9. TradFi CFD & Multi-Asset Integration Architecture (Planned / Pending Specification)

> **Status Notice**: This integration is currently in the **Planning & Specification Stage (Pending / Coming Soon)**. Live API connectivity and live fund executions with institutional CFD brokers or crypto exchanges are NOT active. The requirements below document the roadmap design.

### 9.1 Overview & Liaison Bridge Functionality
Integrating **TradFi CFD (Stock Indices, Commodities)** and Crypto Assets elevates AWallet into a full-scale multi-asset unified financial platform. Acting as the Liaison Model within the Amane Protocol, **Tive ◉AI** bridges the liquidity and data format divide between the Web3 realm (USDC stablecoins) and the TradFi/CeFi realm (CFD indices and physical commodities), managing them under a coherent, single-state balance schema.

```
┌─────────────────────────────────────────────────────────────┐
│                 AWallet User Interface (Web3)               │
│   • 1-Tap Allocation: "USDC → Gold / S&P500 CFD"           │
│   • Multi-Provider Glass Badges [TradFi CFD] [Web3]         │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Tive ◉AI (Amane Liaison Model)              │
│   • Unified Anchor ID & Soul Identity (DID) Mapping         │
│   • Correlation & Volatility Real-Time Monitoring           │
│   • ABC-AutoML Dynamic Rebalancing Signals                  │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
               ▼ Web3 Execution               ▼ TradFi / CeFi Execution
┌─────────────────────────────┐  ┌────────────────────────────┐
│      Automation Engine      │  │   Institutional Broker API │
│   • USDC Settlement / Swap  │  │  (OAuth2 / Anchor ID Bind) │
│   • Policy Engine Tier 1-2  │  │  • Stock Indices (10x Lev) │
│   • Smart Contract Yield    │  │  • Commodities (20x Lev)   │
└─────────────────────────────┘  └────────────────────────────┘
```

### 9.2 Key System Requirements
1. **Secure Account Binding via Anchor ID**:
   - Uses the user's decentralized Anchor ID / Soul Identity (DID) as a secure hub.
   - Binds institutional CFD brokers and crypto asset exchange accounts via OAuth2 authorization and scoped API keys stored within the Secret Vault (never exposed to client or AI context).
2. **Seamless 1-Tap Execution Logic**:
   - The user observes a single intuitive action: `Allocate 10 USDC to Gold CFD (XAU/USD)`.
   - Under the hood, Automation executes:
     1. Web3 USDC micro-settlement via Base / EVM protocol.
     2. Liquidity routing and atomic fiat exchange conversion.
     3. Institutional CFD broker API order dispatch with deterministic slippage protection.
3. **Portfolio Leverage & Margin Optimization**:
   - Capital efficiency: Even with a modest base balance of ¥5,000 (~35.42 USDC), leveraging Stock Index CFDs (up to 10x) and Commodity CFDs (up to 20x) delivers balanced macro exposure to S&P500, Gold (Au), and Silver (Ag).
4. **24/7 Volatility Control & Rebalancing**:
   - Monitors inverse correlation between volatile crypto assets (BTC, ETH) and inflation-hedging commodities (Gold, Silver).
   - Dynamically reallocates capital to capture cross-market spreads while maintaining the target 10%–15% compound APY.

---

## 10. Variable-Return Investment Data Schema (`inbox/investment/`)

### 10.1 Overview & Compliance Baseline
To adhere strictly to regulatory frameworks (preventing any violation of Japanese Investment Law / 出資法 regarding unauthorized deposit-taking or promised fixed yields), all data processed under the `investment/` folder domain is enforced as **strictly variable-return (`compliance_profile: variable_return_only`)**.

### 10.2 Mandatory Disclaimers & Defensive Guardrails
1. **Machine-Enforced Anti-Guarantee Filtering**:
   - Any ingested file containing column names matching prohibited patterns (`guarantee`, `guaranteed`, `fixed_yield`, `principal_protect`, `保証`, `確定利回り`, `元本確保`) is blocked **before training**, rejected to the `failed/` quarantine directory, and logged to the SHA-256 tamper-evident audit log with a legal compliance rationale.
2. **Auto-Injected Disclaimer**:
   - Output reports automatically prepend:
     `"本データおよび分析モデルは将来の運用成果、元本、利回りを保証するものではありません。市場価格・スプレッド・ボラティリティの変動リスクを伴います。"`

### 10.3 Feature Prefixes Specification
Files in `inbox/investment/` only ingest numeric columns matching the registered whitelist prefixes:

| Feature Prefix | Domain Target | Example Fields | Unit & Format |
|---|---|---|---|
| `spot_price_` | Spot / Index Prices | `spot_price_jepx_system_tokyo`<br>`spot_price_xau_usd_gold`<br>`spot_price_nikkei_cfd` | Float (JPY, USD, index points) |
| `volatility_` | Historical / Implied Volatility | `volatility_hist_30d_annualized`<br>`volatility_parkinson_high_low_24h`<br>`volatility_ewma_lambda_94` | Float (Annualized ratio, e.g. 0.165 = 16.5%) |
| `spread_` | Market Spreads & Basis | `spread_bid_ask_bps`<br>`spread_jepx_area_tokyo_kansai`<br>`spread_usdc_usdt_basis` | Float (Basis points `bps` or price delta) |
| `macro_` | Macro Indicators & Benchmark Rates | `macro_us_fed_funds_rate`<br>`macro_boj_policy_rate`<br>`macro_usdjpy_fx_rate` | Float (% or FX rate) |
| `orderbook_` | Liquidity & Market Depth | `orderbook_depth_imbalance_top5`<br>`orderbook_weighted_mid_slippage_bps` | Float (Ratio or bps) |

### 10.4 Target Variable
- **Default Target**: `target_variable_yield_bps` (Forward-looking variable yield/return in basis points)
- **Task Type**: Regression (`r2` score optimization with feature penalty)

---

## 11. Tier 5 — Regulatory Product Gate (規制商品ゲート設計)

### 11.1 Architecture & Positioning
Tier 1〜4 are categorized based on **"Amount, Reversibility, and Suspicion"** assuming the transaction is fundamentally permissible.
In contrast, **Tier 5** acts as a **Deterministic Pre-Gate** positioned strictly in front of Tiers 1〜4:
- Applies unconditionally to regulated asset classes (STO, Commodity CFD, Power Trading), regardless of amount or reversibility.
- Even for micro-transactions or reversible actions, if regulatory licensing and marketing compliance requirements are not satisfied, execution is strictly prohibited.
- **Target Audience**: Exclusive to executive premium members (年額5万円〜).

```
Anchor User Intent (Interpreted by Tive ◉AI)
       │
       ▼
  ┌────────────────────────────────────────────────────────┐
  │ Tier 5: Regulatory Gate (規制商品ゲート)                  │ ← Pre-gate for STO/CFD/Power
  │ (Evaluated deterministically; immune to AI override)   │
  └────────────────────────────────────────────────────────┘
       │ PASS
       ▼
  Tier 1〜4 (Standard routing by Amount / Reversibility / Suspicion)
```

### 11.2 Deterministic Verification Checklist
1. **Product Classification (`productClassificationPass`)**:
   - Only products bearing `compliance_profile: variable_return_only` can pass. Any data containing fixed-yield structures is rejected.
2. **Statement Sanity Scan (`statementSanityPass`)**:
   - Pre-execution double scan on explanation text (`reason`, `amountLabel`) generated for the user to ensure zero occurrence of prohibited terms (`guaranteed`, `fixed yield`, `元本保証`, `確定利回り`).
3. **Licensing State Verification (`licenseStatusPass`)**:
   - Verifies active statutory licenses (Type-1 Financial Instruments Business for CFD/STO, Retail Electricity Operator / Balance Group partnership for Power). Products without an active partner license permanently FAIL Tier 5.
4. **Suitability Principle (`suitabilityPass`)**:
   - Compares the user's declared risk tolerance and investment profile against the regulatory risk category of the asset.

### 11.3 State Handling on FAIL
- When Tier 5 FAILS:
  - The transaction does **NOT** enter an awaiting/pending approval state (unlike Tier 3 or Tier 4).
  - It is **immediately terminated with status `rejected_tier5`**, and the exact compliance rationale is displayed to the anchor.



