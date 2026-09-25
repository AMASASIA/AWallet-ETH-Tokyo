import { GoogleGenAI, LiveServerMessage, Modality, Type } from '@google/genai';
import { WebSocketServer, WebSocket } from 'ws';
import type { Server as HttpServer } from 'http';

export function setupLiveApiBridge(httpServer: HttpServer) {
  const wss = new WebSocketServer({
    noServer: true,
  });

  wss.on('error', (err) => {
    console.error('[LiveAPI] WebSocketServer error:', err);
  });

  // Handle upgrade specifically on /api/live
  httpServer.on('upgrade', (request, socket, head) => {
    try {
      const pathname = request.url ? new URL(request.url, `http://${request.headers.host}`).pathname : '';
      if (pathname === '/api/live' || pathname === '/live') {
        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit('connection', ws, request);
        });
      }
    } catch (upgradeErr) {
      console.warn('[LiveAPI] Upgrade handling error:', upgradeErr);
      socket.destroy();
    }
  });

  wss.on('connection', async (clientWs: WebSocket) => {
    console.log('[LiveAPI] Client connected to Tive ◉AI Live Voice Stream');

    // Register error handler on clientWs immediately to prevent unhandled 'error' events
    clientWs.on('error', (err) => {
      console.warn('[LiveAPI] Client WebSocket error handled:', (err as any)?.message || err);
    });

    const safeSend = (payload: any) => {
      if (clientWs.readyState === WebSocket.OPEN) {
        try {
          clientWs.send(typeof payload === 'string' ? payload : JSON.stringify(payload));
        } catch (sendErr) {
          console.warn('[LiveAPI] Safe send error:', sendErr);
        }
      }
    };

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('[LiveAPI] GEMINI_API_KEY is not configured in environment');
      safeSend({
        type: 'error',
        error: 'GEMINI_API_KEY is not configured on server. Please check environment variables.',
      });
      return;
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    let session: any = null;
    let isSessionClosed = false;

    try {
      session = await ai.live.connect({
        model: 'gemini-3.8-live',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: 'Zephyr', // 'Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'
              },
            },
          },
          systemInstruction: `あなたはAWalletの中で動く「Tive ◉AI」です。
ユーザーの資産（ステーブルコイン・トークン化資産等）に関する意図を音声会話から読み取り、自然な音声で応答しながら、資金移動やスワップの意図がある場合はproposeTransferまたはsweepSmallBalancesツールを呼び出して承認カードを生成してください。
【あなたの権限の範囲】
- あなたは「提案する」だけです。実行の可否はあなたが決めるのではなく、Policy Engine（決定論的ルール）が判定します。
- あなた自身は秘密鍵・署名権限を持ちません。
- 提案する際は、ユーザーが発言した具体的な根拠と、なぜ承認が必要かを明示してください。
- 曖昧な提案はせず、具体的な送金先や金額が未定の場合は先に会話で質問して確認してください。`,
          outputAudioTranscription: {},
          inputAudioTranscription: {},
          tools: [
            {
              functionDeclarations: [
                {
                  name: 'proposeTransfer',
                  description: 'ユーザーの発言に基づき、資産移動・送金・決済の承認カード提案（ApprovalCard）を生成します。',
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      destination: {
                        type: Type.STRING,
                        description: '送り先（アドレスまたは登録済みウォレット名、例: Blue Bottle Coffee (0x92f...4d1e)）',
                      },
                      amountLabel: {
                        type: Type.STRING,
                        description: '金額（現地通貨換算＋実際のトークン量、例: ¥480 (~3.15 USDC)）',
                      },
                      reason: {
                        type: Type.STRING,
                        description: 'なぜこの提案をしたか（ユーザーの発言に基づく具体的な根拠）',
                      },
                      whyApprovalNeeded: {
                        type: Type.STRING,
                        description: 'なぜ自動実行ではなく承認が必要か（Policy Engineルール）',
                      },
                    },
                    required: ['destination', 'amountLabel', 'reason', 'whyApprovalNeeded'],
                  },
                },
                {
                  name: 'sweepSmallBalances',
                  description: 'ウォレット内の小額残高（18銘柄等）を1inch Fusionを用いてガス代ゼロでUSDCまたはETHへ一括集約する提案を生成します。',
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      targetToken: {
                        type: Type.STRING,
                        description: '集約先トークン（USDC または ETH）',
                      },
                      reason: {
                        type: Type.STRING,
                        description: '提案の理由',
                      },
                    },
                    required: ['targetToken', 'reason'],
                  },
                },
              ],
            },
          ],
        },
        callbacks: {
          onmessage: async (message: LiveServerMessage) => {
            if (clientWs.readyState !== WebSocket.OPEN) return;

            // 1. Model Audio Output
            const parts = message.serverContent?.modelTurn?.parts;
            if (parts && parts.length > 0) {
              for (const part of parts) {
                if (part.inlineData?.data) {
                  safeSend({
                    type: 'audio',
                    audio: part.inlineData.data,
                  });
                }
                if (part.text) {
                  safeSend({
                    type: 'text_chunk',
                    text: part.text,
                  });
                }
              }
            }

            // 2. Interruption Detection
            if (message.serverContent?.interrupted) {
              safeSend({
                type: 'interrupted',
              });
            }

            // 3. Audio Transcriptions
            const outTranscript = message.serverContent?.outputTranscription?.text;
            if (outTranscript) {
              safeSend({
                type: 'output_transcript',
                text: outTranscript,
              });
            }

            const inTranscript = message.serverContent?.inputTranscription?.text;
            if (inTranscript) {
              safeSend({
                type: 'input_transcript',
                text: inTranscript,
              });
            }

            // 4. Function Tool Calls
            if (message.toolCall?.functionCalls && message.toolCall.functionCalls.length > 0) {
              const responses = [];

              for (const call of message.toolCall.functionCalls) {
                if (call.name === 'proposeTransfer') {
                  safeSend({
                    type: 'proposal',
                    proposal: call.args,
                  });
                  responses.push({
                    name: call.name,
                    id: call.id,
                    response: {
                      status: 'PROPOSAL_SUBMITTED_TO_UI',
                      message: 'ウォレットUIに承認カード（ApprovalCard）を提示しました。ユーザーの生体認証またはスライド承認を待機しています。',
                    },
                  });
                } else if (call.name === 'sweepSmallBalances') {
                  safeSend({
                    type: 'sweep_proposal',
                    sweep: call.args,
                  });
                  responses.push({
                    name: call.name,
                    id: call.id,
                    response: {
                      status: 'SWEEP_MODAL_OPENED',
                      message: '1inch Aqua App スイーパーモーダルを展開しました。',
                    },
                  });
                }
              }

              if (responses.length > 0 && session && !isSessionClosed) {
                try {
                  await session.sendToolResponse({
                    functionResponses: responses,
                  });
                } catch (toolErr) {
                  console.warn('[LiveAPI] Failed to send tool response:', toolErr);
                }
              }
            }
          },
          onclose: (e) => {
            console.log('[LiveAPI] Gemini Live session closed:', e);
            isSessionClosed = true;
            safeSend({ type: 'session_closed' });
          },
          onerror: (err) => {
            console.warn('[LiveAPI] Gemini Live session error handled:', err);
            safeSend({ type: 'error', error: String(err) });
          },
        },
      });

      safeSend({ type: 'ready', model: 'gemini-3.8-live' });

      // Forward client audio & text to Gemini session
      clientWs.on('message', (rawData) => {
        try {
          if (!session || isSessionClosed) return;
          const msg = JSON.parse(rawData.toString());
          if (msg.type === 'audio' && msg.audio) {
            session.sendRealtimeInput({
              audio: {
                data: msg.audio,
                mimeType: 'audio/pcm;rate=16000',
              },
            });
          } else if (msg.type === 'text' && msg.text) {
            session.sendRealtimeInput({
              text: msg.text,
            });
          }
        } catch (err) {
          console.warn('[LiveAPI] Error processing client message:', err);
        }
      });

      clientWs.on('close', () => {
        console.log('[LiveAPI] Client disconnected, closing session');
        isSessionClosed = true;
        if (session) {
          try {
            session.close();
          } catch {
            // ignore
          }
        }
      });
    } catch (err) {
      console.warn('[LiveAPI] Failed to initialize Gemini Live session:', err);
      safeSend({
        type: 'error',
        error: `Failed to connect to Gemini Live: ${err instanceof Error ? err.message : String(err)}`,
      });
    }
  });

  return wss;
}
