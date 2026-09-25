import { AgentAccount, A2ATransaction, AiWorkerMarketTask } from '../types';

export const a2aService = {
  async getAgentAccount(ownerDid?: string, ownerAddress?: string): Promise<{
    agentAccount: AgentAccount;
    marketTasks: AiWorkerMarketTask[];
  }> {
    try {
      const params = new URLSearchParams();
      if (ownerDid) params.set('ownerDid', ownerDid);
      if (ownerAddress) params.set('ownerAddress', ownerAddress);

      const res = await fetch(`/api/a2a/agent-account?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch agent account');
      const data = await res.json();
      return {
        agentAccount: data.agentAccount,
        marketTasks: data.marketTasks,
      };
    } catch (err) {
      console.warn('Backend /api/a2a/agent-account fetch failed, using fallback:', err);
      // Resilient fallback
      return {
        agentAccount: {
          id: 'agent-tive-01',
          name: 'Tive ◉AI Worker #01',
          agentDid: 'did:agent:tive:8453:0x892a78BFe912A346C898302A04bB5C2d38eA6091',
          ownerAnchorDid: ownerDid || 'did:ion:EiD...AnchorHuman',
          ownerAddress: ownerAddress || '0x3210...946d',
          subAddress: '0x892a78BFe912A346C898302A04bB5C2d38eA6091',
          balanceUsdc: 42.85,
          totalEarnedUsdc: 128.50,
          totalSpentUsdc: 85.65,
          sessionPolicy: {
            dailyLimitUsd: 50.0,
            dailySpentUsd: 12.40,
            singleTxLimitUsd: 20.0,
            expiresAt: Date.now() + 86400000 * 7,
            autoSweepThresholdUsd: 100.0,
            allowedTaskTypes: ['CREATIVE_ART', 'DEEP_RESEARCH', 'CODE_AUDIT', 'DATA_ORCHESTRATION', 'MULTI_LINGUAL'],
          },
          status: 'active',
          createdAt: '2026-09-01T10:00:00Z',
        },
        marketTasks: [],
      };
    }
  },

  async executeTask(taskId: string): Promise<{
    success: boolean;
    message: string;
    transaction: A2ATransaction;
    updatedAccount: AgentAccount;
  }> {
    const res = await fetch('/api/a2a/execute-task', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to execute task');
    }
    return data;
  },

  async payAgent(payload: {
    targetAgentName: string;
    targetAgentDid?: string;
    targetAddress?: string;
    taskType: string;
    taskTitle: string;
    amountUsdc: number;
  }): Promise<{
    success: boolean;
    message: string;
    transaction: A2ATransaction;
    updatedAccount: AgentAccount;
  }> {
    const res = await fetch('/api/a2a/pay-agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to pay agent');
    }
    return data;
  },

  async sweepToOwner(amountUsdc?: number): Promise<{
    success: boolean;
    message: string;
    transaction: A2ATransaction;
    updatedAccount: AgentAccount;
    sweptAmount: number;
  }> {
    const res = await fetch('/api/a2a/sweep-to-owner', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amountUsdc }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to sweep funds to owner');
    }
    return data;
  },

  async getTransactions(): Promise<A2ATransaction[]> {
    try {
      const res = await fetch('/api/a2a/transactions');
      if (!res.ok) throw new Error('Failed to fetch transactions');
      const data = await res.json();
      return data.transactions || [];
    } catch {
      return [];
    }
  },

  async updatePolicy(policy: {
    dailyLimitUsd?: number;
    singleTxLimitUsd?: number;
    autoSweepThresholdUsd?: number;
  }): Promise<void> {
    const res = await fetch('/api/a2a/update-policy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(policy),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to update policy');
    }
  },
};
