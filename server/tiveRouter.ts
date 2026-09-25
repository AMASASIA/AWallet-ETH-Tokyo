import { Router, Request, Response } from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import { InvisibleAction } from '../types.ts';

export const tiveRouter = Router();

// Tive ◉AI System Prompt based on AGENTS.md & GEMINI.md
const TIVE_SYSTEM_INSTRUCTION = `
You are "Tive ◉AI" operating inside AWallet.
You coordinate with Gemini, but do NOT hold raw private keys or execution authority.
Your role is to read the user's intent regarding assets (stablecoins, tokenized assets, daily payments, etc.) from their voice command or text, and generate an executable proposal in structured JSON.
You do NOT execute funds yourself. Execution is done by the Automation Engine, and permission is deterministically decided by the Policy Engine.

Your permissions:
- You ONLY propose. Policy Engine determines whether execution is allowed or blocked.
- You have no private keys or signing authority.
- If the proposal falls under Tier 2, Tier 3, Tier 4, or Tier 5, you MUST clearly explain "why approval is needed" (whyApprovalNeeded).

Rules:
1. destination: Counterparty name, registered wallet name, or 0x address.
2. amountLabel: Exact amount with local currency and crypto equivalent (e.g. "¥650 (~4.20 USDC)" or "$50 (50 USDC)").
3. amount: Short amount representation (e.g. "¥650" or "$50").
4. reason: Concrete reason based EXCLUSIVELY on what the user actually said. Never fabricate user intent.
5. whyApprovalNeeded: Explanation of why human approval is required under Policy Engine rules.
   - Tier 1: Auto execution (< $5 micro-readings, internal cache)
   - Tier 2: Micro POS checkout (< ¥1,000 / $10) -> 1-step slide approval
   - Tier 3: Standard transaction ($10 - $500) -> Slide or tap approval
   - Tier 4: Large or high-risk transaction (> $500) -> WebAuthn Passkey Biometric sign
   - Tier 5: Regulated STO, electricity power strategy, or variable return -> Tier 5 compliance check & Biometric signature
6. tier: integer 1, 2, 3, 4, or 5.
7. category: "Payment" | "Transfer" | "Swap" | "Yield" | "STO/Power" | "STO/Bond".
8. Do not propose asset transfers not requested by the user.
`;

tiveRouter.post('/parse-voice-command', async (req: Request, res: Response) => {
  try {
    const { commandText, userAddress, locale = 'ja' } = req.body;

    if (!commandText || typeof commandText !== 'string' || !commandText.trim()) {
      res.status(400).json({ error: 'commandText is required' });
      return;
    }

    const trimmedCommand = commandText.trim();
    const apiKey = process.env.GEMINI_API_KEY;

    // If no API key is set, use deterministic fallback parser
    if (!apiKey) {
      console.warn('[TiveRouter] GEMINI_API_KEY is not set, falling back to deterministic local rule parser');
      const fallbackAction = generateDeterministicAction(trimmedCommand, locale);
      res.json({ action: fallbackAction, rawTranscript: trimmedCommand, source: 'rule_fallback' });
      return;
    }

    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `Analyze this user natural language voice command and extract an InvisibleAction proposal for AWallet.\nUser Voice Command: "${trimmedCommand}"\nTarget Locale: ${locale}\nUser Wallet: ${userAddress || '0x8453B47c0a9B5B2E8102dCe883f3eD872659dC01'}`,
            },
          ],
        },
      ],
      config: {
        systemInstruction: TIVE_SYSTEM_INSTRUCTION,
        temperature: 0.1,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            desc: { type: Type.STRING, description: 'Short summary of the action in the user language' },
            descEn: { type: Type.STRING, description: 'Short summary in English' },
            amount: { type: Type.STRING, description: 'Amount string, e.g. ¥650 or $50' },
            amountLabel: { type: Type.STRING, description: 'Detailed amount label e.g. ¥650 (~4.20 USDC)' },
            destination: { type: Type.STRING, description: 'Destination name or address' },
            reason: { type: Type.STRING, description: 'Concrete basis strictly derived from user voice command' },
            reasonEn: { type: Type.STRING, description: 'Concrete basis in English' },
            whyApprovalNeeded: { type: Type.STRING, description: 'Why human approval is required by Policy Engine' },
            whyApprovalNeededEn: { type: Type.STRING, description: 'Why approval is required in English' },
            tier: { type: Type.INTEGER, description: 'Policy Engine Tier (1 to 5)' },
            category: { type: Type.STRING, description: 'Action category' },
          },
          required: ['desc', 'amount', 'amountLabel', 'destination', 'reason', 'whyApprovalNeeded', 'tier', 'category'],
        },
      },
    });

    const parsedJsonText = response.text?.trim() || '{}';
    let data;
    try {
      data = JSON.parse(parsedJsonText);
    } catch {
      data = generateDeterministicAction(trimmedCommand, locale);
    }

    const actionId = `act-voice-${Date.now()}`;
    const constructedAction: InvisibleAction = {
      id: actionId,
      tier: (Math.min(5, Math.max(1, Number(data.tier) || 2))) as 1 | 2 | 3 | 4 | 5,
      desc: data.desc || `Voice Command: ${trimmedCommand.slice(0, 30)}`,
      descEn: data.descEn || data.desc,
      amount: data.amount || '¥500',
      amountLabel: data.amountLabel || `${data.amount || '¥500'} (~3.25 USDC)`,
      destination: data.destination || 'Merchant POS (0x8453...4d1e)',
      reason: data.reason || `音声発話「${trimmedCommand}」に基づきTive ◉AIが生成`,
      reasonEn: data.reasonEn || `Generated from voice command "${trimmedCommand}"`,
      whyApprovalNeeded: data.whyApprovalNeeded || 'Policy Engineによる承認ポリシー検証が必要です。',
      whyApprovalNeededEn: data.whyApprovalNeededEn || 'Policy Engine verification required.',
      initiatedBy: 'Tive ◉AI Voice',
      status: 'awaiting',
      timestamp: 'たった今',
      category: data.category || 'Payment',
    };

    res.json({
      success: true,
      action: constructedAction,
      rawTranscript: trimmedCommand,
      source: 'gemini-3.8-flash',
    });
  } catch (error: any) {
    console.error('[TiveRouter] Error parsing voice command:', error);
    // Fallback to deterministic rule generator
    const fallback = generateDeterministicAction(req.body?.commandText || '', req.body?.locale || 'ja');
    res.json({
      success: true,
      action: fallback,
      rawTranscript: req.body?.commandText || '',
      source: 'fallback_error_recovery',
      error: error?.message,
    });
  }
});

// Multi-turn Chat Endpoint with Gemini, Models selection, and Maps Grounding
tiveRouter.post('/chat', async (req: Request, res: Response) => {
  try {
    const { 
      messages, 
      model = 'gemini-3.5-flash', 
      useMaps = false, 
      userLocation, 
      locale = 'en' 
    } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: 'messages array is required' });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // Fallback if no key configured
      const lastMsg = messages[messages.length - 1]?.content || '';
      res.json({
        reply: `[Tive ◉AI Simulation] I received: "${lastMsg}". (GEMINI_API_KEY is not configured on server)`,
        model: 'simulation',
        groundingChunks: []
      });
      return;
    }

    const ai = new GoogleGenAI({ apiKey });

    // Validate and pick model
    // Allowed models per specification:
    // 'gemini-3.1-pro-preview' (complex tasks)
    // 'gemini-3.5-flash' (general tasks & Maps Grounding)
    // 'gemini-3.1-flash-lite' (fast tasks)
    let selectedModel = 'gemini-3.5-flash';
    if (model === 'gemini-3.1-pro-preview' || model === 'gemini-3.1-flash-lite') {
      selectedModel = model;
    }

    // Force gemini-3.5-flash if useMaps is requested (as per Maps Grounding rule)
    const lastUserText = messages[messages.length - 1]?.content || '';
    const isMapQuery = useMaps || /(where|near|nearby|place|cafe|coffee|store|shop|atm|location|address|station|tokyo|shibuya|shinjuku|近く|場所|店|カフェ)/i.test(lastUserText);

    if (isMapQuery) {
      selectedModel = 'gemini-3.5-flash';
    }

    // Format multi-turn contents
    const contents = messages.map((m: any) => ({
      role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
      parts: [{ text: String(m.content || m.text || '') }]
    }));

    // System prompt with Tive ◉AI guidelines
    const systemPrompt = `
You are "Tive ◉AI" operating inside AWallet.
You coordinate with Gemini, but do NOT hold raw private keys or execution authority.
Your role is to read the user's intent regarding assets (stablecoins, tokenized assets, daily payments, etc.) from conversation, and generate executable proposals in structured format when appropriate.
You do NOT execute funds yourself. Execution is done by the Automation Engine, and permission is deterministically decided by the Policy Engine.

When proposing a payment, transfer, or swap, you must output a proposal JSON block in your response using this structure:
\`\`\`json
{
  "destination": "Recipient address or name",
  "amountLabel": "Amount in fiat + crypto (e.g. ¥650 (~4.20 USDC))",
  "reason": "Concrete reason based strictly on user statement",
  "whyApprovalNeeded": "Why human approval is required under Policy Engine rules"
}
\`\`\`
- reason MUST be based strictly on what the user said. Never fabricate user intent.
- Be concise, direct, helpful, and natural.
- Respond in the user's preferred language (Default is English, or Japanese if addressed in Japanese).
${isMapQuery ? 'The user is inquiring about places, merchants, or locations. Provide accurate, helpful place details and references.' : ''}
`;

    const config: any = {
      systemInstruction: systemPrompt,
      temperature: 0.3,
    };

    // When Maps Grounding is active: Use gemini-3.5-flash with googleMaps tool
    if (isMapQuery) {
      config.tools = [{ googleMaps: {} }];
      if (userLocation && typeof userLocation.latitude === 'number' && typeof userLocation.longitude === 'number') {
        config.toolConfig = {
          retrievalConfig: {
            latLng: {
              latitude: userLocation.latitude,
              longitude: userLocation.longitude
            }
          }
        };
      }
    }

    const response = await ai.models.generateContent({
      model: selectedModel,
      contents,
      config,
    });

    const replyText = response.text || '';
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    // Extract action proposal JSON if present in model output
    let actionProposal: any = null;
    const jsonMatch = replyText.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        if (parsed.destination && parsed.amountLabel) {
          actionProposal = {
            destination: parsed.destination,
            amountLabel: parsed.amountLabel,
            reason: parsed.reason || 'Requested by user',
            whyApprovalNeeded: parsed.whyApprovalNeeded || 'Policy Engine verification required',
          };
        }
      } catch (err) {
        console.warn('Could not parse actionProposal JSON from chat response:', err);
      }
    }

    // Extract web and maps URLs from groundingChunks
    const extractedLinks: { title: string; uri: string }[] = [];
    if (Array.isArray(groundingChunks)) {
      for (const chunk of groundingChunks as any[]) {
        if (chunk.maps?.uri) {
          extractedLinks.push({
            title: chunk.maps.title || 'Google Maps Location',
            uri: chunk.maps.uri
          });
        }
        if (chunk.web?.uri) {
          extractedLinks.push({
            title: chunk.web.title || 'Web Source',
            uri: chunk.web.uri
          });
        }
      }
    }

    res.json({
      reply: replyText,
      model: selectedModel,
      groundingChunks,
      extractedLinks,
      actionProposal,
      isMapGrounded: isMapQuery && groundingChunks.length > 0
    });
  } catch (err: any) {
    console.error('[TiveRouter] Chat endpoint error:', err);
    res.status(500).json({
      error: err?.message || 'Chat generation error',
      reply: 'An error occurred while connecting to Tive ◉AI. Please try again.',
      model: req.body?.model || 'gemini-3.5-flash',
      groundingChunks: []
    });
  }
});

function generateDeterministicAction(command: string, locale: string): InvisibleAction {
  const isJp = locale === 'ja';
  const id = `act-voice-${Date.now()}`;

  if (/コーヒー|coffee|スタバ|starbucks|カフェ|cafe/i.test(command)) {
    return {
      id,
      tier: 2,
      desc: isJp ? 'カフェ店頭決済 (マイクロPOS)' : 'Cafe Counter Payment (Micro POS)',
      descEn: 'Cafe Counter Payment (Micro POS)',
      amount: '¥650',
      amountLabel: '¥650 (~4.25 USDC)',
      destination: 'Blue Bottle Coffee (0x92f...4d1e)',
      reason: isJp
        ? `ユーザーの音声指示「${command}」に基づき店頭決済枠を生成しました。`
        : `Generated payment from user voice command: "${command}".`,
      reasonEn: `Generated payment from user voice command: "${command}".`,
      whyApprovalNeeded: isJp
        ? 'Policy Engine Tier 2: 1,000円未満の店頭マイクロ決済のため1ステップスライド承認が必要です。'
        : 'Policy Engine Tier 2: Micro POS checkout under ¥1,000 requires 1-step slide approval.',
      whyApprovalNeededEn: 'Policy Engine Tier 2: Micro POS checkout under ¥1,000 requires 1-step slide approval.',
      initiatedBy: 'Tive ◉AI Voice',
      status: 'awaiting',
      timestamp: 'たった今',
      category: 'Payment',
    };
  }

  if (/電力|power|jepx|sto|ボラティリティ|戦略/i.test(command)) {
    return {
      id,
      tier: 5,
      desc: isJp ? 'JEPXスポット電力 連動型変動ポジション' : 'JEPX Spot Power Variable Strategy',
      descEn: 'JEPX Spot Power Variable Strategy',
      amount: '¥300,000',
      amountLabel: '¥300,000 (~2,000 USDC)',
      destination: 'Regulated Power Settlement Vault (0x51c...8821)',
      reason: isJp
        ? `ユーザーの音声指示「${command}」に基づき配分枠を生成しました。`
        : `Generated allocation from user voice command: "${command}".`,
      reasonEn: `Generated allocation from user voice command: "${command}".`,
      whyApprovalNeeded: isJp
        ? 'Policy Engine Tier 5: 変動リターン型規制商品のため適合性原則と生体パスキー承認が必要です。'
        : 'Policy Engine Tier 5: Regulated variable-return strategy requires WebAuthn biometric passkey.',
      whyApprovalNeededEn: 'Policy Engine Tier 5: Regulated variable-return strategy requires WebAuthn biometric passkey.',
      initiatedBy: 'Tive ◉AI Voice',
      status: 'awaiting',
      timestamp: 'たった今',
      category: 'STO/Power',
    };
  }

  // Generic transfer / payment fallback
  return {
    id,
    tier: 3,
    desc: isJp ? 'Tive ◉AI 音声指示決済' : 'Tive ◉AI Voice Transfer',
    descEn: 'Tive ◉AI Voice Transfer',
    amount: '$25.00',
    amountLabel: '$25.00 (25 USDC)',
    destination: 'Authorized Agent Sub-Account (0x8453...2a8b)',
    reason: isJp
      ? `ユーザーの発話「${command}」に基づき安全なトランザクションを提案しました。`
      : `Proposed safe transaction based on user speech: "${command}".`,
    reasonEn: `Proposed safe transaction based on user speech: "${command}".`,
    whyApprovalNeeded: isJp
      ? 'Policy Engine Tier 3: 資産保全ルールに基づきユーザー確認が必要です。'
      : 'Policy Engine Tier 3: User approval required under standard asset protection policy.',
    whyApprovalNeededEn: 'Policy Engine Tier 3: User approval required under standard asset protection policy.',
    initiatedBy: 'Tive ◉AI Voice',
    status: 'awaiting',
    timestamp: 'たった今',
    category: 'Transfer',
  };
}
