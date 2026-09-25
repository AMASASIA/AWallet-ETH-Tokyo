/**
 * Pico W Hardware Tap Confirmation Manager
 * Records physical button tap events from Raspberry Pi Pico W hardware switches.
 */

export interface TapRecord {
  id: string;
  deviceId: string;
  actionId?: string;
  timestamp: string;
  consumed: boolean;
}

class TapConfirmationManager {
  private taps: TapRecord[] = [];
  private expectedSecret = process.env.TAP_DEVICE_SECRET || 'a-wallet-pico-secret-2026';

  public verifySecret(providedSecret: string): boolean {
    if (!providedSecret) return false;
    return providedSecret === this.expectedSecret;
  }

  public recordTap(deviceId: string, secret: string, actionId?: string): { success: boolean; tap?: TapRecord; error?: string } {
    if (!this.verifySecret(secret)) {
      return { success: false, error: 'Unauthorized: Invalid TAP_DEVICE_SECRET' };
    }

    const tap: TapRecord = {
      id: `tap_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      deviceId: deviceId || 'pico-w-switch-01',
      actionId,
      timestamp: new Date().toISOString(),
      consumed: false,
    };

    this.taps.unshift(tap);
    if (this.taps.length > 50) {
      this.taps.pop();
    }

    return { success: true, tap };
  }

  public checkTapStatus(actionId?: string): { confirmed: boolean; tap?: TapRecord } {
    // Check if any recent unconsumed tap matches actionId or is a generic broadcast tap within last 30 seconds
    const now = Date.now();
    const match = this.taps.find((t) => {
      if (t.consumed) return false;
      const tapTime = new Date(t.timestamp).getTime();
      const isFresh = now - tapTime < 30000; // 30s TTL
      if (!isFresh) return false;
      if (actionId && t.actionId) return t.actionId === actionId;
      return true;
    });

    return { confirmed: Boolean(match), tap: match };
  }

  public consumeTap(tapId: string): boolean {
    const tap = this.taps.find((t) => t.id === tapId);
    if (tap) {
      tap.consumed = true;
      return true;
    }
    return false;
  }

  public getRecentTaps(): TapRecord[] {
    return [...this.taps.slice(0, 10)];
  }

  public resetTaps() {
    this.taps = [];
  }
}

export const tapConfirmManager = new TapConfirmationManager();
