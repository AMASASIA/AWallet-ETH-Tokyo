# AWallet A2A Economy & AI Agent Sub-Account アーキテクチャ仕様書

## 1. 概要: 人間1人（Anchor ID）と自律AIエージェント（Sub-Account）の関係

AWallet は、**人間1人の本人確認（DID / Soulbound Token）を根本の「Anchor ID（アンカーID）」**とし、その直下に**目的別の「AI専用スマートアカウント（AI Agent Sub-Account / ERC-4337）」**を発行・管理できる二層構造のアカウント抽象化（Account Abstraction）アーキテクチャを採用しています。

```
[ 人間 (Human Owner) ]
       │
       ▼
【 Anchor ID 】 did:ion:base:0x71C... (SBT認証 / 最終的所有権)
       │
       ├─ [ AI Worker 1: Tive Research Agent ] 0x8a92... (リサーチ・データ売買専用)
       │     └─ Balance: 14.50 USDC
       │     └─ Policy: Single Max 5 USDC / Daily 25 USDC
       │
       ├─ [ AI Worker 2: Arbitrage & Rebalancer ] 0x4f11... (DeFi運用・自動清算)
       │     └─ Balance: 32.80 USDC
       │     └─ Policy: Single Max 20 USDC / Daily 100 USDC
       │
       └─ [ Policy Engine & Secret Vault ]
             └─ 鍵は直接渡さない（セッション署名権限 / TTL付き一時キー）
```

---

## 2. AIが暗号資産を自律して稼ぐ（Earning）メカニズム: HTTP 402 + Micro-Tasks

AIエージェントは、人間から資金を支給されるだけでなく、**インターネット上のタスク市場（AI Work Market）から自律的にジョブを受注し、暗号資産（USDC等）のマイクロペイメントを獲得**します。

### 技術フロー
1. **タスク検知 & 入札**:
   AIエージェントが、外部AIやプロトコルが掲示する「要約・データスクレイピング・推論・検証」ジョブを検知。
2. **HTTP 402 Payment Required 決済プロトコル**:
   AIがタスクを実行後、APIプロバイダまたは依頼元AIエージェントから**Baseネットワーク経由でUSDCマイクロペイメント（例: 0.15 USDC〜2.50 USDC）**を直接受領。
3. **Sub-Accountへの即時着金**:
   受領した暗号資産はAI専用口座に直接貯蓄され、AI自身のリソース費用（LLM推論API代、クラウドホスティング代）に充当されます。

---

## 3. A2A（AI-to-AI）直接決済プロトコル

AIエージェントが他のAIエージェント（例: 翻訳AI、画像生成AI、オンチェーン検証AI）のリソースを利用する際、人間の承認を待たずに**Policy Engineのセッション枠内（例: 1回最大5ドル、1日最大25ドル）でミリ秒単位の即時A2A送金**を実行します。

- **Peer-to-Peer AI Settlement**:
  - `0x8a92...` (リサーチAI) → `0x9c31...` (翻訳AI): 0.12 USDC
- **決定論的セーフティネット (Policy Engine Tier 1〜2)**:
  - 枠内（マイクロペイメント）は完全自動・瞬時決済。
  - 上限超過または未知のアドレスへの大口送金は即座に**Tier 3（人間のスマホへの承認カード通知）**または**Tier 4（サーキットブレーカー発動）**へとエスカレーション。

---

## 4. 人間オーナーへの収益還元（Sweep to Anchor）

AIエージェントが稼ぎ出した利益は、設定した「保持クッション額（Cushion Balance、例: 5 USDC）」を超えた分を、ワンタップ（または定時自動バッチ）で**人間のメインアカウント（Anchor IDウォレット）へ一括掃引送金（Sweep）**できます。

これにより：
- **「AIが働き、暗号資産を稼ぎ、人間のウォレットへ利益を納める」**という次世代の自律エージェント経済圏が安全に成立します。
