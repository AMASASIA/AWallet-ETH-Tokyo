import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { 
  ArrowLeft, 
  X, 
  Coffee, 
  Palette, 
  Camera, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw, 
  Sparkles,
  UploadCloud,
  QrCode
} from 'lucide-react';

interface TipScannerProps {
  onTipRecipientDetected: (recipient: string, defaultAmountUsd?: number, meta?: { type: 'coffee' | 'art'; label: string }) => void;
  onClose: () => void;
}

export const TipScanner: React.FC<TipScannerProps> = ({
  onTipRecipientDetected,
  onClose,
}) => {
  const [cameraState, setCameraState] = useState<'requesting' | 'active' | 'denied' | 'error'>('requesting');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<{ amount: number; type: 'coffee' | 'art'; label: string }>({
    amount: 3.15,
    type: 'coffee',
    label: 'Specialty Coffee Tip (¥480 / ~3.15 USDC)',
  });

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isStoppingRef = useRef(false);
  const hasDetectedRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize html5-qrcode scanner
  const startScanner = async () => {
    setCameraState('requesting');
    setErrorMessage(null);
    hasDetectedRef.current = false;

    // Wait for DOM element mount
    await new Promise((resolve) => setTimeout(resolve, 80));

    const elementId = 'tip-qr-reader-container';
    const container = document.getElementById(elementId);
    if (!container) return;

    // Clean existing scanner instance if present
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
      } catch {
        // Ignore clearing errors
      }
      scannerRef.current = null;
    }

    try {
      const html5QrCode = new Html5Qrcode(elementId);
      scannerRef.current = html5QrCode;

      const config = {
        fps: 15,
        qrbox: { width: 240, height: 240 },
        aspectRatio: 1.0,
      };

      await html5QrCode.start(
        { facingMode: 'environment' },
        config,
        (decodedText) => {
          if (hasDetectedRef.current) return;
          hasDetectedRef.current = true;
          handleScanSuccess(decodedText);
        },
        () => {
          // Frame failure callback (ignored during scanning loop)
        }
      );

      setCameraState('active');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('html5-qrcode start failed:', msg);

      if (
        msg.includes('NotAllowedError') ||
        msg.includes('Permission') ||
        msg.includes('denied')
      ) {
        setCameraState('denied');
        setErrorMessage('Camera access was denied. Please grant permission in browser settings or upload a QR image.');
      } else {
        setCameraState('error');
        setErrorMessage(`Camera initialization error: ${msg}. You can still upload a QR photo or choose a preset.`);
      }
    }
  };

  // Safe scanner shutdown
  const stopScanner = async () => {
    if (isStoppingRef.current) return;
    isStoppingRef.current = true;

    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
      } catch (err) {
        console.warn('Scanner stop error:', err);
      }
      scannerRef.current = null;
    }
  };

  // Handle successful QR detection
  const handleScanSuccess = async (rawDecodedText: string) => {
    // Sanitize recipient address / URI
    let cleaned = rawDecodedText.trim();
    if (cleaned.toLowerCase().startsWith('ethereum:')) {
      cleaned = cleaned.slice('ethereum:'.length);
    } else if (cleaned.toLowerCase().startsWith('base:')) {
      cleaned = cleaned.slice('base:'.length);
    }
    if (cleaned.includes('?')) {
      cleaned = cleaned.split('?')[0];
    }
    if (cleaned.includes('/')) {
      cleaned = cleaned.split('/')[0];
    }
    cleaned = cleaned.trim();

    setScannedResult(cleaned);

    // Audio/haptic feedback if available
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([40, 20, 40]);
    }

    // Give visual confirmation for 700ms before forwarding
    setTimeout(async () => {
      await stopScanner();
      onTipRecipientDetected(cleaned, selectedPreset.amount, {
        type: selectedPreset.type,
        label: selectedPreset.label,
      });
    }, 700);
  };

  // Image file upload fallback using html5-qrcode scanFile
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setCameraState('requesting');
    setErrorMessage(null);

    try {
      const html5QrCode = scannerRef.current || new Html5Qrcode('tip-qr-reader-container');
      scannerRef.current = html5QrCode;

      const decodedText = await html5QrCode.scanFile(file, true);
      handleScanSuccess(decodedText);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(`Could not find a valid QR code in the uploaded image: ${msg}`);
      setCameraState('error');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    startScanner();
    return () => {
      stopScanner();
    };
  }, []);

  const handleClose = async () => {
    await stopScanner();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col text-white animate-fade-in select-none">
      {/* Hidden File Picker for fallback QR images */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-zinc-900 bg-black shrink-0">
        <button
          type="button"
          onClick={handleClose}
          className="p-2 -ml-2 text-zinc-400 hover:text-white transition-colors"
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Coffee size={13} />
          </div>
          <span className="font-semibold text-sm tracking-tight text-white">
            Coffee Tipping / ART credit
          </span>
        </div>

        <button
          type="button"
          onClick={handleClose}
          className="p-2 -mr-2 text-zinc-400 hover:text-white transition-colors"
          aria-label="Close"
        >
          <X size={20} />
        </button>
      </div>

      {/* Main View Area */}
      <div className="flex-1 flex flex-col items-center justify-between p-4 max-w-sm w-full mx-auto overflow-y-auto">
        {/* Banner Explainer */}
        <div className="text-center space-y-1 pt-1 pb-3">
          <p className="text-xs font-medium text-zinc-200">
            Scan Counter QR to Send Instant Tip on Base
          </p>
          <p className="text-[11px] text-zinc-500">
            Zero-gas micro-transfers with sub-second finality
          </p>
        </div>

        {/* Viewfinder Frame with HTML5-QRCode Mount */}
        <div className="relative w-full aspect-square max-w-[270px] rounded-3xl overflow-hidden bg-zinc-950 border border-zinc-800 shadow-2xl flex items-center justify-center">
          {/* html5-qrcode Target DOM Element */}
          <div
            id="tip-qr-reader-container"
            className="w-full h-full object-cover [&>video]:w-full [&>video]:h-full [&>video]:object-cover"
          />

          {/* Visual Feedback Loop: Scanning Laser & Reticle */}
          {cameraState === 'active' && !scannedResult && (
            <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-7 z-10">
              {/* Corner Reticles */}
              <div className="flex justify-between">
                <div className="w-5 h-5 border-t-2 border-l-2 border-amber-400 rounded-tl-sm" />
                <div className="w-5 h-5 border-t-2 border-r-2 border-amber-400 rounded-tr-sm" />
              </div>

              {/* Animated Laser Scanning Line */}
              <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_12px_#f59e0b] animate-bounce" />

              <div className="flex justify-between">
                <div className="w-5 h-5 border-b-2 border-l-2 border-amber-400 rounded-bl-sm" />
                <div className="w-5 h-5 border-b-2 border-r-2 border-amber-400 rounded-br-sm" />
              </div>
            </div>
          )}

          {/* Scanned Success Feedback State */}
          {scannedResult && (
            <div className="absolute inset-0 bg-emerald-950/90 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center space-y-2 z-20 animate-fade-in">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <CheckCircle2 size={28} />
              </div>
              <p className="text-xs font-semibold text-white">QR Code Detected!</p>
              <p className="text-[10px] font-mono text-emerald-300 break-all px-2">
                {scannedResult}
              </p>
            </div>
          )}

          {/* Camera Permission Denied / Error State */}
          {(cameraState === 'denied' || cameraState === 'error') && !scannedResult && (
            <div className="absolute inset-0 bg-zinc-950 flex flex-col items-center justify-center p-6 text-center space-y-3 z-20">
              <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-amber-400">
                <AlertCircle size={22} />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-white">Camera Access Blocked</p>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  {errorMessage || 'Camera could not be started in this browser context.'}
                </p>
              </div>

              <div className="flex flex-col w-full space-y-2 pt-2">
                <button
                  type="button"
                  onClick={startScanner}
                  className="w-full py-2 px-3 bg-zinc-800 hover:bg-zinc-700 text-xs text-white rounded-xl flex items-center justify-center space-x-1.5 transition-colors"
                >
                  <RefreshCw size={13} />
                  <span>Retry Camera</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2 px-3 bg-amber-500/20 hover:bg-amber-500/30 text-xs text-amber-300 border border-amber-500/40 rounded-xl flex items-center justify-center space-x-1.5 transition-colors"
                >
                  <UploadCloud size={13} />
                  <span>Upload QR Photo</span>
                </button>
              </div>
            </div>
          )}

          {/* Requesting State Spinner */}
          {cameraState === 'requesting' && (
            <div className="absolute inset-0 bg-zinc-950 flex flex-col items-center justify-center space-y-2 z-20">
              <RefreshCw size={24} className="text-amber-400 animate-spin" />
              <span className="text-xs font-mono text-zinc-400">Starting Scanner...</span>
            </div>
          )}
        </div>

        {/* Real-time Status Indicator */}
        <div className="flex items-center space-x-2 py-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <span className="text-[11px] font-mono text-zinc-400">
            {cameraState === 'active' ? 'Align QR inside frame' : 'Scanner ready'}
          </span>
        </div>

        {/* Preset Tip / Credit Selection */}
        <div className="w-full space-y-2 pt-2">
          <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
            <span>Select Tip / Credit Category:</span>
            <span className="text-amber-400 font-semibold">{selectedPreset.amount} USDC</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setSelectedPreset({
                amount: 3.15,
                type: 'coffee',
                label: 'Specialty Coffee Tip (¥480 / ~3.15 USDC)',
              })}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                selectedPreset.type === 'coffee' && selectedPreset.amount === 3.15
                  ? 'bg-amber-950/40 border-amber-500/70 text-amber-200'
                  : 'bg-zinc-950 border-zinc-900 text-zinc-400 hover:border-zinc-800'
              }`}
            >
              <div className="flex items-center space-x-1.5 mb-1">
                <Coffee size={13} className="text-amber-400" />
                <span className="text-xs font-semibold text-white">Coffee Tipping</span>
              </div>
              <p className="text-[10px] text-zinc-400">¥480 (~3.15 USDC)</p>
            </button>

            <button
              type="button"
              onClick={() => setSelectedPreset({
                amount: 5.0,
                type: 'art',
                label: 'Creator ART Credit ($5.00 USDC)',
              })}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                selectedPreset.type === 'art'
                  ? 'bg-purple-950/40 border-purple-500/70 text-purple-200'
                  : 'bg-zinc-950 border-zinc-900 text-zinc-400 hover:border-zinc-800'
              }`}
            >
              <div className="flex items-center space-x-1.5 mb-1">
                <Palette size={13} className="text-purple-400" />
                <span className="text-xs font-semibold text-white">ART Credit</span>
              </div>
              <p className="text-[10px] text-zinc-400">Patron Tip (~5.00 USDC)</p>
            </button>
          </div>

          {/* Quick Demo Test Buttons for Immediate Verification */}
          <div className="pt-2 border-t border-zinc-900 flex items-center justify-between text-[11px]">
            <span className="text-zinc-500">Quick Demo:</span>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => handleScanSuccess('0x92fC84A3B18d2E48948D93Fc99A041d1d9124d1E')}
                className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 rounded text-zinc-300 font-mono transition-colors"
              >
                ☕ Barista POS
              </button>
              <button
                type="button"
                onClick={() => handleScanSuccess('0x4D2aF486a635848e028b1B637DeDeFa6A4B8b082')}
                className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 rounded text-purple-300 font-mono transition-colors"
              >
                🎨 ART Creator
              </button>
            </div>
          </div>
        </div>

        {/* Clear Action Footer */}
        <div className="w-full pt-4 pb-2 space-y-2">
          <button
            type="button"
            onClick={handleClose}
            className="w-full py-3 px-4 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold rounded-2xl border border-zinc-800 transition-colors flex items-center justify-center space-x-2"
          >
            <span>Cancel &amp; Close</span>
          </button>
        </div>
      </div>
    </div>
  );
};
