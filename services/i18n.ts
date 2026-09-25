export type SupportedLocale = 'EN' | 'JA' | 'FR' | 'KO';

export interface I18nContent {
  backToWallet: string;
  tunnelStatus: string;
  auditResources: string;
  modelSubtitle: string;
  placeholder: string;
  sendTooltip: string;
  auditLogFooter: string;
  paymentBackendLabel: string;
  actionCardCategory: string;
  actionCardDefaultTitle: string;
  actionCardDefaultReason: string;
  gaslessLabel: string;
  slideLabelDefault: string;
  slideConfirmedLabel: string;
  slideFooterRpc: string;
  slideFooterHint: string;
  advancedTitle: string;
  advancedBadge: string;
  advancedDesc: string;
  customCheckPlaceholder: string;
  customCheckBtn: string;
  secPassLabel: string;
  readyStatus: string;
  addressLabel: string;
  rpcPingLabel: string;
  codeHashLabel: string;
  sanctionLabel: string;
  sanctionClear: string;
  closeBtn: string;
  modalTitle: string;
  modalSeparationTitle: string;
  modalSeparationText: string;
  modalDockerTitle: string;
  modalDockerText: string;
  sampleUserMsg: string;
  sampleAssistantMsg: string;
  sampleActionAmount: string;
  sampleActionReason: string;
  sampleActionWhy: string;
  confirmExecutionText: (desc: string) => string;
}

export const I18N_DICTIONARY: Record<SupportedLocale, I18nContent> = {
  EN: {
    backToWallet: 'Wallet',
    tunnelStatus: 'Tunnel: butterfly-api:8090',
    auditResources: 'Audit Log / Resources',
    modelSubtitle: 'qwen2.5:14b · local (ollama) + butterfly-api',
    placeholder: 'Type a message...',
    sendTooltip: 'Send',
    auditLogFooter: 'Audit log / Resources',
    paymentBackendLabel: 'awallet-payment-backend',
    actionCardCategory: 'Agent Action',
    actionCardDefaultTitle: 'Automated Smart Contract Verification',
    actionCardDefaultReason: 'One-step validation based on user intent & deterministic Policy Engine',
    gaslessLabel: 'Base L2 Gasless',
    slideLabelDefault: 'Slide to execute',
    slideConfirmedLabel: 'A✓ Verified & Ready',
    slideFooterRpc: '1-Step RPC Connectivity & SC Verification',
    slideFooterHint: 'Slide to complete',
    advancedTitle: 'Advanced Details & Custom Checker',
    advancedBadge: 'Developer Mode',
    advancedDesc: 'Only use when inspecting arbitrary contract bytecode directly. Normal transactions complete via slider above.',
    customCheckPlaceholder: 'Enter 0x... or name.base.eth',
    customCheckBtn: 'Check',
    secPassLabel: 'Security & Bytecode Pass',
    readyStatus: 'Ready',
    addressLabel: 'Address',
    rpcPingLabel: 'RPC Ping',
    codeHashLabel: 'Code Hash',
    sanctionLabel: 'Sanction List',
    sanctionClear: 'CLEAR (OFAC Passed)',
    closeBtn: 'Close',
    modalTitle: 'Butterfly Effect × Cloudflare Tunnel Spec',
    modalSeparationTitle: 'Isolation Policy',
    modalSeparationText: '• Butterfly Effect runs on a completely separate account/deployment from AWallet CDK stack.\n• Payment backend identifier: awallet-payment-backend',
    modalDockerTitle: 'Docker & Tunnel Configuration',
    modalDockerText: '• ollama: Local LLM runtime (internal only, port 11434 blocked externally)\n• butterfly-api: Port 8090 (FastAPI ABC feature selection & labeling engine)\n• Cloudflare Tunnel: Keeps Ollama port closed, only tunnels butterfly-api (8090) outbound securely.\n• Auth: project_key per client (NetSuite / Anthem / AI map)\n• Audit Log: Filter Function compatible hash-chain scheme',
    sampleUserMsg: 'Can you summarize this document in English?',
    sampleAssistantMsg: 'Certainly. Processing locally in memory; no data or keys are transmitted outside the secure boundary.',
    sampleActionAmount: '¥480 (~3.15 USDC)',
    sampleActionReason: 'Triggered by user intent for in-store coffee payment checkout.',
    sampleActionWhy: 'Policy Engine Tier 2: Micro POS payment under ¥1,000. 1-step slide approval.',
    confirmExecutionText: (desc: string) => `[A✓ Complete] "${desc}" RPC connectivity and contract verification succeeded. Safely dispatched to awallet-payment-backend.`,
  },
  JA: {
    backToWallet: 'ウォレット',
    tunnelStatus: 'Tunnel: butterfly-api:8090',
    auditResources: '監査ログ / リソース',
    modelSubtitle: 'qwen2.5:14b · local (ollama) + butterfly-api',
    placeholder: 'メッセージを入力...',
    sendTooltip: '送信',
    auditLogFooter: 'Audit log / Resources',
    paymentBackendLabel: 'awallet-payment-backend',
    actionCardCategory: '操作代行アクション',
    actionCardDefaultTitle: 'スマートコントラクト自動検証・実行',
    actionCardDefaultReason: 'ユーザー意図とPolicy Engine検証ルールに基づく1ステップ承認',
    gaslessLabel: 'Base L2 Gasless',
    slideLabelDefault: 'スライドして承認を実行',
    slideConfirmedLabel: 'A✓ 検証完了 · 準備完了',
    slideFooterRpc: '1ステップ RPC接続確認 & SC検証',
    slideFooterHint: 'Slide to complete',
    advancedTitle: 'Advanced Details & Custom Checker',
    advancedBadge: '上級者・開発者向け',
    advancedDesc: '任意のアドレスやスマートコントラクトを直接検証したい場合のみご利用ください。通常操作ではスライダーのみで完結します。',
    customCheckPlaceholder: '0x... または name.base.eth を入力',
    customCheckBtn: '検証',
    secPassLabel: 'Security & Bytecode Pass',
    readyStatus: 'Ready',
    addressLabel: 'アドレス',
    rpcPingLabel: 'RPC 応答速度',
    codeHashLabel: 'コードハッシュ',
    sanctionLabel: '制裁リスト照合',
    sanctionClear: 'CLEAR (OFAC 通過済)',
    closeBtn: '閉じる',
    modalTitle: 'Butterfly Effect × Cloudflare Tunnel 構成',
    modalSeparationTitle: '分離方針',
    modalSeparationText: '• Butterfly EffectはAWalletのCDKスタックとは完全に別アカウント・別デプロイ。\n• 決済バックエンド呼称: awallet-payment-backend',
    modalDockerTitle: 'Docker & Tunnel 構成',
    modalDockerText: '• ollama: 既存ローカルLLM（外部非公開・ポート完全遮断）\n• butterfly-api: ポート8090 (FastAPI/ABC群知能ラベリング)\n• Cloudflare Tunnel: Ollamaは塞いだまま、butterfly-api(8090)のみセキュアに外向け公開。\n• 認証: project_key（NetSuite / Anthem / AI map単位）\n• 監査ログ: Filter Function互換スキーマ・ハッシュチェーン保持',
    sampleUserMsg: 'カウンターでコーヒーの決済¥480をお願い。あと金CFDの変動枠も確認したい。',
    sampleAssistantMsg: 'もちろん対応可能です。Tive ◉AIはローカル安全境界で処理し、生の秘密鍵や署名権限は外部へ一切送信されません。店頭決済（¥480）およびエグゼクティブ金CFD変動リターン枠（$5,000）の検証プロポーザルを生成しました。',
    sampleActionAmount: '¥480 (~3.15 USDC)',
    sampleActionReason: 'ユーザーが「カウンターでコーヒーの決済¥480をお願い」と発言したため店頭POSへの決済を生成。',
    sampleActionWhy: 'Policy Engine Tier 2: 1,000円未満の対面決済。スライドで1ステップ承認。',
    confirmExecutionText: (desc: string) => `【A✓ 実行完了】「${desc}」のRPC接続確認およびスマートコントラクト検証が1ステップで完了しました。awallet-payment-backendへ安全にハンドオフされました。`,
  },
  FR: {
    backToWallet: 'Portefeuille',
    tunnelStatus: 'Tunnel: butterfly-api:8090',
    auditResources: "Journal d'audit / Ressources",
    modelSubtitle: 'qwen2.5:14b · local (ollama) + butterfly-api',
    placeholder: 'Tapez un message...',
    sendTooltip: 'Envoyer',
    auditLogFooter: "Journal d'audit / Ressources",
    paymentBackendLabel: 'awallet-payment-backend',
    actionCardCategory: "Action de l'Agent",
    actionCardDefaultTitle: 'Vérification automatisée des Smart Contracts',
    actionCardDefaultReason: "Validation en une étape selon l'intention de l'utilisateur et le Policy Engine",
    gaslessLabel: 'Base L2 Sans Frais de Gaz',
    slideLabelDefault: 'Glisser pour exécuter',
    slideConfirmedLabel: 'A✓ Vérifié et Prêt',
    slideFooterRpc: 'Connexion RPC et vérification SC en 1 étape',
    slideFooterHint: 'Glisser pour terminer',
    advancedTitle: 'Détails avancés et vérificateur personnalisé',
    advancedBadge: 'Mode Développeur',
    advancedDesc: "À utiliser uniquement pour inspecter directement les contrats. Les opérations courantes se font via le curseur ci-dessus.",
    customCheckPlaceholder: 'Entrez 0x... ou nom.base.eth',
    customCheckBtn: 'Vérifier',
    secPassLabel: 'Sécurité et Bytecode Validés',
    readyStatus: 'Prêt',
    addressLabel: 'Adresse',
    rpcPingLabel: 'Latence RPC',
    codeHashLabel: 'Hash du Code',
    sanctionLabel: 'Listes de Sanctions',
    sanctionClear: 'CONFORME (OFAC Validé)',
    closeBtn: 'Fermer',
    modalTitle: 'Configuration Butterfly Effect × Cloudflare Tunnel',
    modalSeparationTitle: "Politique d'isolement",
    modalSeparationText: "• Butterfly Effect est déployé sur un compte totalement séparé de la pile CDK AWallet.\n• Identifiant du backend de paiement: awallet-payment-backend",
    modalDockerTitle: 'Configuration Docker & Tunnel',
    modalDockerText: '• ollama: LLM local (accès interne uniquement, port 11434 bloqué vers l\'extérieur)\n• butterfly-api: Port 8090 (moteur de sélection de fonctionnalités ABC)\n• Cloudflare Tunnel: Maintient le port Ollama fermé et expose uniquement butterfly-api (8090) vers l\'extérieur.\n• Authentification: project_key par client (NetSuite / Anthem / AI map)\n• Journal d\'audit: Schéma de chaîne de hash compatible Filter Function',
    sampleUserMsg: 'Peux-tu résumer ce document en anglais ?',
    sampleAssistantMsg: 'Bien sûr. Le traitement s\'effectue localement en mémoire sans transmission de données ou de clés vers l\'extérieur.',
    sampleActionAmount: '¥480 (~3.15 USDC)',
    sampleActionReason: 'Généré d\'après l\'intention de paiement pour le café au comptoir.',
    sampleActionWhy: 'Policy Engine Tier 2: Micro-paiement en point de vente inférieur à 1 000 JPY. Approbation en 1 glissement.',
    confirmExecutionText: (desc: string) => `[A✓ Terminé] La connectivité RPC et la vérification du contrat pour "${desc}" ont réussi. Transmis en toute sécurité à awallet-payment-backend.`,
  },
  KO: {
    backToWallet: '지갑',
    tunnelStatus: 'Tunnel: butterfly-api:8090',
    auditResources: '감사 로그 / 리소스',
    modelSubtitle: 'qwen2.5:14b · local (ollama) + butterfly-api',
    placeholder: '메시지를 입력하세요...',
    sendTooltip: '전송',
    auditLogFooter: 'Audit log / Resources',
    paymentBackendLabel: 'awallet-payment-backend',
    actionCardCategory: '에이전트 작업',
    actionCardDefaultTitle: '스마트 컨트랙트 자동 검증 및 실행',
    actionCardDefaultReason: '사용자 의도 및 Policy Engine 검증 규칙에 기반한 1단계 승인',
    gaslessLabel: 'Base L2 가스비 무료',
    slideLabelDefault: '슬라이드하여 실행 승인',
    slideConfirmedLabel: 'A✓ 검증 완료 · 준비 완료',
    slideFooterRpc: '1단계 RPC 연결 확인 및 스마트 컨트랙트 검증',
    slideFooterHint: '슬라이드하여 완료',
    advancedTitle: '상세 정보 및 맞춤 검증 도구',
    advancedBadge: '개발자 모드',
    advancedDesc: '스마트 컨트랙트 바이트코드를 직접 검사할 때만 사용하세요. 일반 작업은 위 슬라이더로 완료됩니다.',
    customCheckPlaceholder: '0x... 또는 name.base.eth 입력',
    customCheckBtn: '검증',
    secPassLabel: '보안 및 바이트코드 검증 통과',
    readyStatus: '준비됨',
    addressLabel: '주소',
    rpcPingLabel: 'RPC 지연 시간',
    codeHashLabel: '코드 해시',
    sanctionLabel: '제재 목록 조회',
    sanctionClear: '통과 (OFAC 확인 완료)',
    closeBtn: '닫기',
    modalTitle: 'Butterfly Effect × Cloudflare Tunnel 구성 사양',
    modalSeparationTitle: '분리 방침',
    modalSeparationText: '• Butterfly Effect는 AWallet CDK 스택과 완전히 분리된 별도 계정/배포로 실행됩니다.\n• 결제 백엔드 식별자: awallet-payment-backend',
    modalDockerTitle: 'Docker & Tunnel 구성',
    modalDockerText: '• ollama: 로컬 LLM 런타임 (내부 전용, 11434 포트 외부 차단)\n• butterfly-api: 8090 포트 (FastAPI ABC 특성 선택 및 레이블링 엔진)\n• Cloudflare Tunnel: Ollama 포트는 닫은 채 butterfly-api (8090)만 안전하게 외부 공개.\n• 인증: 클라이언트별 project_key (NetSuite / Anthem / AI map)\n• 감사 로그: Filter Function 호환 해시체인 방식',
    sampleUserMsg: '이 문서를 영어로 요약해 줄 수 있나요?',
    sampleAssistantMsg: '물론입니다. 로컬에서 처리하며 외부로 전송되지 않습니다.',
    sampleActionAmount: '¥480 (~3.15 USDC)',
    sampleActionReason: '카운터 커피 결제를 요청한 사용자 의도에 따라 POS 결제 생성.',
    sampleActionWhy: 'Policy Engine Tier 2: 1,000엔 미만 소액 오프라인 결제. 1회 슬라이드로 승인.',
    confirmExecutionText: (desc: string) => `[A✓ 완료] "${desc}"의 RPC 연결 확인 및 컨트랙트 검증이 완료되었습니다. awallet-payment-backend로 안전하게 전달되었습니다.`,
  }
};
