# Policy Engine Tier 5 仕様書（改訂版）
## STO・新株予約権行使・償還・二次譲渡の状態遷移と承認カード要件

- **対象システム**: ARTFACT / AWallet (`artfact-payment-backend`)
- **仕様改訂日**: 2026-09-12 (Rev. 2.0 - 自己レビュー反映版)
- **スキーマバージョン**: `policy-engine.tier5.v2`
- **関連基盤**:
  - Tier 1〜4: 金額・可逆性・不審度による通常決済・資金移動の段階リスク分岐（既存）
  - Tier 5: 規制商品（STO・新株予約権・業績連動型デジタル社債・電力・貴金属CFD）としての適格性を**金額・可逆性に関係なく最前段で決定論的検証**するゲート
  - Confusion Detector: プロンプト・意図解釈レイヤーでのAI誤認・プロンプトインジェクション防御回路
  - Treasury Solvency Engine: 流動性チェックと引当予約をアトミックに実施（ConditionExpression型排他制御）

---

## 1. 全体ステートマシン（修正・完全版）

```
[PROPOSED]
    │  Tive ◉AI (Liaison Model) が Function Calling JSON で提案
    │  ※ 行使価格・償還条件等はスマートコントラクトに既定済みの値のみ参照。
    │     Tive ◉AI が金額・条件を独自に生成することは厳格禁止。
    ▼
[CONFUSION_DETECTOR] (Human-in-the-Loop 回路)
    │  ユーザー意図の曖昧さ・プロンプトインジェクション・不自然な誘導を検知
    ├─ DETECTED ─────────────────────────────► [ESCALATED_HUMAN] (コンシェルジュ確認)
    ▼ CLEAR
[TIER5_GATE] (最前段決定論的検証 / AI上書き不可)
    │  決定論的チェック項目:
    │    1. ライセンス状態 (第一種金商/電子記録移転権利/小売電気事業者)
    │    2. 適合性原則 (アンカーリスク許容度 × 商品リスク区分)
    │    3. 表示文言スキャン (確定利回り・元本保証語の機械的完全遮断)
    │    4. compliance_profile = variable_return_only タグ必須
    ├─ FAIL ────────────────────────────────► [REJECTED] (終端: 理由を明示・再申請不可)
    ▼ PASS
[ACTION_CLASSIFIED]
    │
    ├─ action_type = ISSUANCE (新規発行)
    │       │
    │       ▼
    │   [COOLING_OFF_WINDOW]
    │       │ アンカーは無条件・無理由でキャンセル可能（決定論的権利）
    │       ├─ CANCEL ──────────────────────► [CANCELLED] (終端: ペナルティなし)
    │       ▼ 期間満了
    │   [TIER5_RE_VERIFY] (ライセンス失効・文言再チェック)
    │       ├─ FAIL ────────────────────────► [REJECTED] (終端)
    │       ▼ PASS
    │   [MULTISIG_APPROVAL] (アンカー本人 + platform Safe 2-of-3)
    │
    ├─ action_type = WARRANT_EXERCISE (新株予約権行使)
    │       │ ※ クーリングオフなし（既存契約上の権利行使）
    │       │ ※ exerciseDeadline (権利行使期限) 内か決定論的検証
    │       ├─ 期限超過 ────────────────────► [EXPIRED] (終端)
    │       ▼ 期限内
    │   [MULTISIG_APPROVAL] (アンカー本人 + platform Safe 1-of-2)
    │
    ├─ action_type = REDEMPTION (償還・流動性払戻)
    │       │
    │       ▼
    │   [TREASURY_SOLVENCY_RESERVE] (アトミック流動性引当 / ConditionExpression)
    │       │ 決定論的検証: 償還必要額 ≦ 利用可能流動性 (残高から即時アトミック予約)
    │       ├─ FAIL (流動性不足) ───────────► [SUSPENDED] (Tier4相当・人間エスカレーション)
    │       │                                     │ 人間運用担当者による流動性補充後
    │       │                                     ├─ 補充完了 ──► [TREASURY_SOLVENCY_RESERVE] 再試行
    │       │                                     └─ 履行不能 ──► [REJECTED]
    │       ▼ PASS (引当ロック成功)
    │   [MULTISIG_APPROVAL] (アンカー本人 + platform Safe 2-of-3)
    │       │ 規模が governance_threshold 超過の場合:
    │       └─ 大口超過 ────────────────────► [GOVERNANCE_APPROVAL] (Treasury Safe 3-of-5)
    │                                              ├─ REJECT (拒絶) ──► [REJECTED] (引当解除)
    │                                              ▼ APPROVE
    │
    └─ action_type = SECONDARY_TRANSFER (二次譲渡・OKE転売)
            │
            ▼
        [BUYER_TIER5_ELIGIBILITY] (買い手の投資家適格性・適合性を毎回検証)
            ├─ FAIL ────────────────────────► [REJECTED] (終端)
            ▼ PASS
        [MULTISIG_APPROVAL] (売り手アンカー + platform Safe 1-of-2)

[MULTISIG_APPROVAL]
    │
    ├─ 明示的拒絶 (アンカーまたはSafe署名者がReject) ──► [REJECTED] (終端: 即時終了)
    ├─ 署名未達のままTTL満了 ────────────────────────► [EXPIRED] (終端: 再提案扱い)
    ▼ 署名充足
[PRE_EXECUTION_SANITY_SCAN] (実行直前二重スキャン)
    │ Automation Engine 投入直前に、トランザクションペイロードと表示文言を最終照合
    ├─ 異常検知 ─────────────────────────────► [REJECTED] (サーキットブレーカー作動)
    ▼ PASS
[EXECUTION_WINDOW] (Automation Engine によるオンチェーン約定)
    ├─ 実行失敗 / Revert ───────────────────► [EXECUTION_FAILED] (人間エスカレーション)
    ▼ 成功
[SETTLED] (終端: Artifact監査ログに改ざん不能なSHA-256ハッシュで記録)
```

---

## 2. 状態（State）一覧と終端定義

| ステータスコード | 分類 | 意味 | 再開・再申請可否 |
|---|---|---|---|
| `PROPOSED` | 進行中 | Tive ◉AI による Function Calling JSON 提案完了 | — |
| `CONFUSION_CHECK` | 検証中 | AI誤解釈・誘導・インジェクションの監査中 | — |
| `TIER5_GATE` | 判定中 | 規制商品適格性の決定論的監査中 | — |
| `COOLING_OFF` | 待機中 | 新規発行の取消猶予期間（アンカーは無条件取消可能） | 取消時は CANCELLED |
| `SOLVENCY_RESERVE` | 判定中 | 償還資金のアトミック引当検証中 | — |
| `MULTISIG_PENDING` | 承認待 | 必要署名（Safeおよび本人）の収集待ち | 拒絶時は REJECTED / 満期は EXPIRED |
| `GOVERNANCE_PENDING`| 承認待 | 大口償還の Treasury Safe 3-of-5 審査待ち | 拒絶時は REJECTED |
| `EXECUTING` | 実行中 | Automation Engine によるブロックチェーン約定処理中 | — |
| `SETTLED` | **終端** | オンチェーン約定完了・監査ログ記録完了 | 完了 |
| `CANCELLED` | **終端** | クーリングオフ期間中にアンカーが自発取消 | 無条件で再申請可能 |
| `REJECTED` | **終端** | Tier 5 不適合・明示的拒絶・ガバナンス否決 | 要件充足後のみ新規申請可 |
| `EXPIRED` | **終端** | 署名TTLまたは権利行使期限の満了 | 再提案として新規起票可 |
| `SUSPENDED` | 一時停止 | 流動性不足による待機（引当失敗） | トレジャリー補充後に自動再試行 |
| `EXECUTION_FAILED` | 異常停止 | コントラクト実行失敗（Revert） | 人間エスカレーション・手動調査 |

---

## 3. アクション別マルチシグ閾値・ガバナンス一覧

| action_type | 必須署名 | 追加ゲート・検証 | 法的・運用上の理由 |
|---|---|---|---|
| `ISSUANCE`<br>(新規STO発行) | アンカー本人 + platform Safe **2-of-3** | クーリングオフ + 満了時Tier5再検証 | 新たな出資・社債契約を創出するため最大級の閾値 |
| `WARRANT_EXERCISE`<br>(新株予約権行使) | アンカー本人 + platform Safe **1-of-2** | 行使可能期間 (`exerciseDeadline`) 検証 | 既存契約に基づく権利行使であり新規債務を生まないため軽量化 |
| `REDEMPTION`<br>(一般償還) | アンカー本人 + platform Safe **2-of-3** | アトミック流動性引当 (`TREASURY_SOLVENCY`) | プラットフォームからの資金流出を伴うため厳格保護 |
| `REDEMPTION_LARGE`<br>(大口償還: 基準超過) | アンカー + platform Safe 2-of-3<br>+ **Treasury Safe 3-of-5** | ガバナンス承認 (`GOVERNANCE_APPROVAL`) | 全体流動性に与える影響を遮断するための独立審査 |
| `SECONDARY_TRANSFER`<br>(二次譲渡・転売) | 売り手アンカー + platform Safe **1-of-2** | 買い手Tier5適格性 (`BUYER_TIER5_ELIGIBILITY`) | 転売ごとに保有者が変わるため、毎回投資家適格性を検証 |

---

## 4. 自己レビュー指摘事項への解決策（設計詳細）

### 4.1 二次譲渡（SECONDARY_TRANSFER）の毎回検証
- **解決策**: OKE・デジタル社債の二次譲渡では、売り手だけでなく**買い手（新保有者）がTier5適格（エグゼクティブ会員ステータス・適合性チェック・本人確認）をパスしていること**を前提条件とする。
- 買い手アドレスが不適合の場合、トランザクションは即座に `REJECTED` となる。

### 4.2 償還レースコンディション対策（アトミック引当）
- **脆弱性**: 複数リクエストが同時に `TREASURY_SOLVENCY_CHECK` を通過し、後から実行されて残高不足（リバート）に陥る。
- **解決策**: 単なる「残高チェック」ではなく、**アトミックな「引当予約（Lock Reserve）」**を行う。
  - バックエンド/コントラクト側で `available_liquidity >= requested_amount` の条件付き更新（DynamoDB ConditionExpression / スマートコントラクトの `reserveLiquidity` 関数）を実行し、引当枠を即座に減少させる。
  - 審査否決（REJECTED）やキャンセル時は、引当枠を直ちに解放（Rollback）する。

### 4.3 署名者の「明示的拒絶（Reject）」パス
- 署名者が承認を待たずに「拒否（Reject）」した場合、TTLを待たずに直ちに `REJECTED` 状態へ遷移させ、ロックされた引当資金を即座に解放する。

### 4.4 クーリングオフ満了後の「Tier 5 再検証」
- 発行申込からクーリングオフ期間（数日〜数週間）の間に、提携金融機関のライセンス失効や法改正が発生する可能性がある。
- クーリングオフ期間満了後、署名収集へ進む直前に**「Tier 5 再検証（TIER5_RE_VERIFY）」**を決定論的に自動実行する。

### 4.5 実行直前二重スキャン（PRE_EXECUTION_SANITY_SCAN）
- マルチシグが揃った後、オンチェーンへのトランザクション送信直前に、スマートコントラクトの呼び出し引数と免責事項を自動二重検査し、改ざんやインジェクションを物理的にブロックする。

---

## 5. ApprovalCard 要件仕様（拡張完全版）

```json
{
  "schemaVersion": "policy-engine.tier5.v2",
  "actionType": "issuance | warrant_exercise | redemption | secondary_transfer",
  
  "destination": "0x7aa...3c81 (Licensed Commodity/STO Vault)",
  "amountLabel": "¥500,000 (~3,350 USDC / 100 STO Units)",
  "reason": "ユーザーの『エグゼクティブ枠で業績連動型デジタル社債を50万円申込』の発言に基づく提案",
  "whyApprovalNeeded": "Policy Engine Tier 5: 規制商品（STO）の新規発行申込のため、クーリングオフ権利の付与および Safe 2-of-3 マルチシグ承認が必要です。",

  "regulatoryDisclaimer": "本商品は業績連動型の変動リターン商品であり、将来の運用成果、元本および利回りを保証するものではありません。市場・信用リスクを伴います。",
  "disclaimerAcknowledged": false,
  "disclaimerAcknowledgedAt": null,

  "coolingOffDeadline": "2026-09-20T12:00:00Z",
  "exerciseDeadline": null,

  "multisigStatus": {
    "required": "2-of-3",
    "signedCount": 1,
    "threshold": 2,
    "pendingSignerLabels": ["platform_safe_operator_1", "platform_safe_operator_2"]
  },

  "governanceStatus": {
    "required": false,
    "threshold": "3-of-5",
    "status": "not_applicable"
  },

  "licenseReference": "LIC-ST-2026-X884 (Type-1 Financial Instruments / Electronic Record Transfer Rights Partner)",

  "cancellationRight": {
    "available": true,
    "description": "2026-09-20 12:00 UTC まで、手数料なしで無条件・無理由でキャンセル可能です。"
  },

  "irreversibilityNotice": "クーリングオフ期間満了後は、法令で定められた客観的不正アクセス等の例外を除き、出資契約の取消はできません。"
}
```

---

## 6. 未確定事項の整理と決定計画

1. **`governance_threshold` の基準値**:
   - 初期値: 単一取引で **¥5,000,000 ($35,000相当)**、またはプラットフォーム内STO総残高の **5%** を超える償還。
2. **クーリングオフ期間の日数**:
   - 電子記録移転権利（STO）の一般的な募集要件に合わせ、**「申込受付日を含めて8日間」** をデフォルト値として設定ファイル化。
3. **Treasury Safe (3-of-5) の構成**:
   - コンプライアンス責任者 (1) / リスク管理担当 (1) / 財務トレジャリー責任者 (1) / システム管理者 (1) / 独立社外監査枠 (1)。
4. **ライセンス状態フラグの管理**:
   - 改ざん防止のため、Policy Engineが参照する設定はオンチェーンの検証済みオラクル（または署名付きガバナンスConfig）からTTL付きで供給。
