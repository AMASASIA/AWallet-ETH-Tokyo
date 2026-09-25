import { Router } from 'express';
import crypto from 'crypto';
import { AgentAccount, A2ATransaction, AiWorkerMarketTask } from '../types.ts';

export const a2aRouter = Router();

// In-memory state for persistent agent accounts and A2A transactions
let agentAccountState: AgentAccount = {
  id: 'agent-tive-01',
  name: 'Tive ◉AI Worker #01',
  agentDid: 'did:agent:tive:8453:0x892a78BFe912A346C898302A04bB5C2d38eA6091',
  ownerAnchorDid: 'did:ion:EiD...AnchorHuman',
  ownerAddress: '0x3210...946d',
  subAddress: '0x892a78BFe912A346C898302A04bB5C2d38eA6091',
  balanceUsdc: 42.85,
  totalEarnedUsdc: 128.50,
  totalSpentUsdc: 85.65,
  sessionPolicy: {
    dailyLimitUsd: 50.0,
    dailySpentUsd: 12.40,
    singleTxLimitUsd: 20.0,
    expiresAt: Date.now() + 86400000 * 7, // 7 days session
    autoSweepThresholdUsd: 100.0,
    allowedTaskTypes: ['CREATIVE_ART', 'DEEP_RESEARCH', 'CODE_AUDIT', 'DATA_ORCHESTRATION', 'MULTI_LINGUAL'],
  },
  status: 'active',
  createdAt: '2026-09-01T10:00:00Z',
};

let a2aTransactions: A2ATransaction[] = [
  {
    id: 'a2a-tx-991',
    type: 'EARN_REVENUE',
    fromEntity: {
      name: 'Synthetix Research DAO (AI Hub)',
      did: 'did:agent:synthetix:8453:0x412d...892e',
      address: '0x412d26f25413346d871780447aC5389659b9892e',
      isAiAgent: true,
    },
    toEntity: {
      name: 'Tive ◉AI Worker #01 (Your Sub-Account)',
      did: agentAccountState.agentDid,
      address: agentAccountState.subAddress,
      isAiAgent: true,
    },
    taskType: 'DEEP_RESEARCH',
    taskTitle: 'Base L2 流動性プール裁定モデルのリアルタイム検証',
    taskOutputSnippet: 'Base Uniswap v3 & Aerodrome間のスプレッド分析完了 (スプレッド 0.38% 検出)',
    amountUsdc: 8.50,
    status: 'settled',
    protocol: 'HTTP_402_A2A',
    txHash: '0x7e8b912a5cf34891b2c4516d9e034a7812bc8f4510e82c617b4395a140d3f281',
    timestamp: '15分前',
    blockNumber: 22481920,
    feeUsdc: 0.0008,
  },
  {
    id: 'a2a-tx-990',
    type: 'A2A_PAY_OUT',
    fromEntity: {
      name: 'Tive ◉AI Worker #01 (Your Sub-Account)',
      did: agentAccountState.agentDid,
      address: agentAccountState.subAddress,
      isAiAgent: true,
    },
    toEntity: {
      name: 'DeepSeek Audit Agent v3',
      did: 'did:agent:deepseek:8453:0x904a...117f',
      address: '0x904af46123490b345ef201476b7134981123117f',
      isAiAgent: true,
    },
    taskType: 'CODE_AUDIT',
    taskTitle: 'ERC-4337 抽象化ペイロードの再入可能性監査',
    taskOutputSnippet: 'No reentrancy detected. CEI (Checks-Effects-Interactions) pattern passed.',
    amountUsdc: 3.20,
    status: 'settled',
    protocol: 'HTTP_402_A2A',
    txHash: '0x32ab912fec8203491823abce1287349104829103849120348912384912384912',
    timestamp: '1時間前',
    blockNumber: 22481410,
    feeUsdc: 0.0005,
  },
  {
    id: 'a2a-tx-989',
    type: 'EARN_REVENUE',
    fromEntity: {
      name: 'ArtBlocks Autonomous Curator',
      did: 'did:agent:artblocks:8453:0x189d...3321',
      address: '0x189d047391942048590123958930129381023321',
      isAiAgent: true,
    },
    toEntity: {
      name: 'Tive ◉AI Worker #01 (Your Sub-Account)',
      did: agentAccountState.agentDid,
      address: agentAccountState.subAddress,
      isAiAgent: true,
    },
    taskType: 'CREATIVE_ART',
    taskTitle: 'Generative Canvas Vector Palette (ART credit)',
    taskOutputSnippet: 'High-dimensional latent vector mapped to SVG shader mesh on Base',
    amountUsdc: 15.00,
    status: 'settled',
    protocol: 'HTTP_402_A2A',
    txHash: '0x9182049182304918230948120938401923840192834019283401928340192834',
    timestamp: '4時間前',
    blockNumber: 22479210,
    feeUsdc: 0.0011,
  },
];

// Available market tasks for AI Worker to earn crypto
export const marketTasks: AiWorkerMarketTask[] = [
  {
    id: 'task-market-01',
    title: 'Base L2 Gas & Swap Route 最適化リサーチ',
    clientName: 'Aerodrome Autonomous Router AI',
    clientDid: 'did:agent:aerodrome:8453:0x712a...093c',
    taskType: 'DEEP_RESEARCH',
    rewardUsdc: 6.50,
    difficulty: 'Quick',
    prompt: 'Base L2上でのUSDC/ETHスワップにおけるスリッページ最小ルートを特定し、JSONレシートを返却せよ。',
  },
  {
    id: 'task-market-02',
    title: 'ジェネレーティブ・ベクターロゴ制作 (ART credit)',
    clientName: 'CyberArt Collective (Agent DAO)',
    clientDid: 'did:agent:cyberart:8453:0x883b...551d',
    taskType: 'CREATIVE_ART',
    rewardUsdc: 12.00,
    difficulty: 'Medium',
    prompt: 'サイバーパンクとミニマリズムを融合したSVGアートワークを生成し、Base IPFSハッシュを納品せよ。',
  },
  {
    id: 'task-market-03',
    title: 'スマートアカウント・セッションキー権限ポリシー検証',
    clientName: 'Biconomy Agent Verifier',
    clientDid: 'did:agent:biconomy:8453:0x334e...881a',
    taskType: 'CODE_AUDIT',
    rewardUsdc: 18.50,
    difficulty: 'Complex',
    prompt: 'ERC-4337 Session Key 仕様における単一TX上限と有効期限TTLの境界値テストを実行せよ。',
  },
  {
    id: 'task-market-04',
    title: '多言語クロスボーダー決済レシートのローカライズ',
    clientName: 'Tokyo Web3 Global Chamber',
    clientDid: 'did:agent:twgc:8453:0x991f...224b',
    taskType: 'MULTI_LINGUAL',
    rewardUsdc: 4.20,
    difficulty: 'Quick',
    prompt: '日・米・欧の各管轄向けに、DID Anchorに付帯する税務・免責注記を3言語でフォーマットせよ。',
  },
];

// 1. Get or Initialize AI Sub-Account
a2aRouter.get('/agent-account', (req, res) => {
  const { ownerDid, ownerAddress } = req.query;
  if (ownerDid && typeof ownerDid === 'string') {
    agentAccountState.ownerAnchorDid = ownerDid;
  }
  if (ownerAddress && typeof ownerAddress === 'string') {
    agentAccountState.ownerAddress = ownerAddress;
  }
  res.json({
    success: true,
    agentAccount: agentAccountState,
    marketTasks,
  });
});

// 2. Execute Task to Earn Crypto (Worker API - HTTP 402 Protocol)
a2aRouter.post('/execute-task', (req, res) => {
  try {
    const { taskId, customClient } = req.body;
    const task = marketTasks.find((t) => t.id === taskId);
    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    // Simulate Work Output
    const outputs = [
      'Task executed with 100% deterministic precision. Proof-of-Work hash generated.',
      'Base L2 micro-transaction verified. Output artifact dispatched via x402 header.',
      'Analysis completed. Validated under Tive ◉AI Policy Engine constraints.',
    ];
    const snippet = outputs[Math.floor(Math.random() * outputs.length)];

    const reward = task.rewardUsdc;
    const txHash = '0x' + crypto.randomBytes(32).toString('hex');
    const newTx: A2ATransaction = {
      id: `a2a-tx-${Date.now().toString().slice(-6)}`,
      type: 'EARN_REVENUE',
      fromEntity: {
        name: customClient?.name || task.clientName,
        did: customClient?.did || task.clientDid,
        address: '0x' + crypto.randomBytes(20).toString('hex'),
        isAiAgent: true,
      },
      toEntity: {
        name: agentAccountState.name,
        did: agentAccountState.agentDid,
        address: agentAccountState.subAddress,
        isAiAgent: true,
      },
      taskType: task.taskType,
      taskTitle: task.title,
      taskOutputSnippet: snippet,
      amountUsdc: reward,
      status: 'settled',
      protocol: 'HTTP_402_A2A',
      txHash,
      timestamp: 'たった今',
      blockNumber: 22482000 + Math.floor(Math.random() * 500),
      feeUsdc: 0.0006,
    };

    // Credit AI Sub-Account
    agentAccountState.balanceUsdc = Number((agentAccountState.balanceUsdc + reward).toFixed(2));
    agentAccountState.totalEarnedUsdc = Number((agentAccountState.totalEarnedUsdc + reward).toFixed(2));
    a2aTransactions.unshift(newTx);

    res.json({
      success: true,
      message: `タスク完了！ AI口座へ ${reward} USDC が着金しました。`,
      transaction: newTx,
      updatedAccount: agentAccountState,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: msg });
  }
});

// 3. AI-to-AI Payment (A2A Autonomous Outbound Transfer)
a2aRouter.post('/pay-agent', (req, res) => {
  try {
    const { targetAgentName, targetAgentDid, targetAddress, taskType, taskTitle, amountUsdc } = req.body;

    const amount = Number(amountUsdc);
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid amount' });
    }

    // Policy Engine Verification on Session Key Limits
    const policy = agentAccountState.sessionPolicy;
    if (amount > policy.singleTxLimitUsd) {
      return res.status(403).json({
        success: false,
        error: `Policy Engine 制限: 1回の自律送金上限 ($${policy.singleTxLimitUsd} USDC) を超過しています。本人承認が必要です。`,
      });
    }

    if (policy.dailySpentUsd + amount > policy.dailyLimitUsd) {
      return res.status(403).json({
        success: false,
        error: `Policy Engine 制限: 1日の自律支払枠 ($${policy.dailyLimitUsd} USDC) を超過します。`,
      });
    }

    if (agentAccountState.balanceUsdc < amount) {
      return res.status(400).json({
        success: false,
        error: `AI口座の残高不足です (現在残高: ${agentAccountState.balanceUsdc} USDC, 必要: ${amount} USDC)`,
      });
    }

    const txHash = '0x' + crypto.randomBytes(32).toString('hex');
    const newTx: A2ATransaction = {
      id: `a2a-tx-${Date.now().toString().slice(-6)}`,
      type: 'A2A_PAY_OUT',
      fromEntity: {
        name: agentAccountState.name,
        did: agentAccountState.agentDid,
        address: agentAccountState.subAddress,
        isAiAgent: true,
      },
      toEntity: {
        name: targetAgentName || 'External Autonomous Agent',
        did: targetAgentDid || 'did:agent:external:8453:0x...' ,
        address: targetAddress || '0x' + crypto.randomBytes(20).toString('hex'),
        isAiAgent: true,
      },
      taskType: taskType || 'DATA_ORCHESTRATION',
      taskTitle: taskTitle || 'A2A Autonomous Compute / Data Task',
      taskOutputSnippet: 'HTTP 402 Payment settled on Base L2. Remote agent delivered response payload.',
      amountUsdc: amount,
      status: 'settled',
      protocol: 'HTTP_402_A2A',
      txHash,
      timestamp: 'たった今',
      blockNumber: 22482100 + Math.floor(Math.random() * 200),
      feeUsdc: 0.0005,
    };

    // Deduct from AI balance & update spent
    agentAccountState.balanceUsdc = Number((agentAccountState.balanceUsdc - amount).toFixed(2));
    agentAccountState.totalSpentUsdc = Number((agentAccountState.totalSpentUsdc + amount).toFixed(2));
    agentAccountState.sessionPolicy.dailySpentUsd = Number((agentAccountState.sessionPolicy.dailySpentUsd + amount).toFixed(2));
    a2aTransactions.unshift(newTx);

    res.json({
      success: true,
      message: `A2A決済成功！ 外部AI (${targetAgentName}) へ ${amount} USDC を支払いました。`,
      transaction: newTx,
      updatedAccount: agentAccountState,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: msg });
  }
});

// 4. Sweep AI Earnings to Anchor Account
a2aRouter.post('/sweep-to-owner', (req, res) => {
  try {
    const { amountUsdc } = req.body;
    const sweepAmount = amountUsdc ? Number(amountUsdc) : agentAccountState.balanceUsdc;

    if (sweepAmount <= 0 || sweepAmount > agentAccountState.balanceUsdc) {
      return res.status(400).json({ success: false, error: 'Invalid sweep amount' });
    }

    const txHash = '0x' + crypto.randomBytes(32).toString('hex');
    const sweepTx: A2ATransaction = {
      id: `a2a-tx-${Date.now().toString().slice(-6)}`,
      type: 'SWEEP_TO_OWNER',
      fromEntity: {
        name: agentAccountState.name,
        did: agentAccountState.agentDid,
        address: agentAccountState.subAddress,
        isAiAgent: true,
      },
      toEntity: {
        name: 'Anchor Account (DID)',
        did: agentAccountState.ownerAnchorDid,
        address: agentAccountState.ownerAddress,
        isAiAgent: false,
      },
      taskType: 'DATA_ORCHESTRATION',
      taskTitle: 'AI収益の親Anchor口座への還元 (Revenue Sweep)',
      taskOutputSnippet: `AIサブ口座から親Anchorウォレット (${agentAccountState.ownerAddress}) へ全額送金完了`,
      amountUsdc: sweepAmount,
      status: 'settled',
      protocol: 'ERC4337_SESSION',
      txHash,
      timestamp: 'たった今',
      blockNumber: 22482300,
      feeUsdc: 0.0004,
    };

    agentAccountState.balanceUsdc = Number((agentAccountState.balanceUsdc - sweepAmount).toFixed(2));
    a2aTransactions.unshift(sweepTx);

    res.json({
      success: true,
      message: `還元完了！ 親Anchorアカウントへ ${sweepAmount} USDC を送金しました。`,
      transaction: sweepTx,
      updatedAccount: agentAccountState,
      sweptAmount: sweepAmount,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: msg });
  }
});

// 5. Update Session Policy
a2aRouter.post('/update-policy', (req, res) => {
  try {
    const { dailyLimitUsd, singleTxLimitUsd, autoSweepThresholdUsd } = req.body;
    if (dailyLimitUsd !== undefined) agentAccountState.sessionPolicy.dailyLimitUsd = Number(dailyLimitUsd);
    if (singleTxLimitUsd !== undefined) agentAccountState.sessionPolicy.singleTxLimitUsd = Number(singleTxLimitUsd);
    if (autoSweepThresholdUsd !== undefined) agentAccountState.sessionPolicy.autoSweepThresholdUsd = Number(autoSweepThresholdUsd);

    res.json({
      success: true,
      message: 'Policy Engine セッションポリシーを更新しました。',
      sessionPolicy: agentAccountState.sessionPolicy,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: msg });
  }
});

// 6. Get Transactions
a2aRouter.get('/transactions', (req, res) => {
  res.json({
    success: true,
    transactions: a2aTransactions,
  });
});
