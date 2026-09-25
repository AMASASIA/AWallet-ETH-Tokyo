// Web Speech API Service for capturing user natural language voice commands
// Supports both modern browsers (SpeechRecognition) and WebKit (webkitSpeechRecognition)

// Type declarations for Web Speech API
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

export function isSpeechRecognitionSupported(): boolean {
  return typeof window !== 'undefined' && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export interface WebSpeechOptions {
  lang?: 'ja-JP' | 'en-US';
  continuous?: boolean;
  interimResults?: boolean;
  onStart?: () => void;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
}

export class WebSpeechRecognizer {
  private recognition: any | null = null;
  private isListening = false;
  private currentTranscript = '';

  constructor(private options: WebSpeechOptions = {}) {
    const SpeechRecognitionClass = 
      typeof window !== 'undefined' 
        ? window.SpeechRecognition || window.webkitSpeechRecognition 
        : null;

    if (SpeechRecognitionClass) {
      this.recognition = new SpeechRecognitionClass();
      this.recognition.lang = options.lang || 'ja-JP';
      this.recognition.continuous = options.continuous ?? false;
      this.recognition.interimResults = options.interimResults ?? true;

      this.recognition.onstart = () => {
        this.isListening = true;
        this.currentTranscript = '';
        this.options.onStart?.();
      };

      this.recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            final += item[0].transcript;
          } else {
            interim += item[0].transcript;
          }
        }

        const combined = final || interim;
        this.currentTranscript = combined;
        this.options.onResult?.(combined, Boolean(final));
      };

      this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.warn('[WebSpeechRecognizer] Speech recognition error:', event.error);
        this.isListening = false;
        this.options.onError?.(event.error);
      };

      this.recognition.onend = () => {
        this.isListening = false;
        this.options.onEnd?.();
      };
    }
  }

  public setLanguage(lang: 'ja-JP' | 'en-US') {
    if (this.recognition) {
      this.recognition.lang = lang;
    }
    this.options.lang = lang;
  }

  public start(): boolean {
    if (!this.recognition) {
      this.options.onError?.('Web Speech API is not supported in this browser');
      return false;
    }

    if (this.isListening) {
      return true;
    }

    try {
      this.currentTranscript = '';
      this.recognition.start();
      return true;
    } catch (err: any) {
      console.warn('[WebSpeechRecognizer] Error starting recognition:', err);
      // Sometimes start is called when already active
      return false;
    }
  }

  public stop(): void {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (err) {
        console.warn('[WebSpeechRecognizer] Error stopping recognition:', err);
      }
    }
    this.isListening = false;
  }

  public abort(): void {
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch (err) {
        console.warn('[WebSpeechRecognizer] Error aborting recognition:', err);
      }
    }
    this.isListening = false;
  }

  public getTranscript(): string {
    return this.currentTranscript;
  }

  public getIsListening(): boolean {
    return this.isListening;
  }
}

/**
 * Sends speech transcript to server Gemini parser to produce a structured InvisibleAction
 */
export async function parseVoiceCommandWithGemini(
  commandText: string,
  userAddress?: string,
  locale: string = 'ja'
): Promise<{ success: boolean; action: any; rawTranscript: string; source: string; error?: string }> {
  const response = await fetch('/api/tive/parse-voice-command', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ commandText, userAddress, locale }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Server error');
    throw new Error(`Failed to parse voice command with Gemini: ${errorText}`);
  }

  return response.json();
}
