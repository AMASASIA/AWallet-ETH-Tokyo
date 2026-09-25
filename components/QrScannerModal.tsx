import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { ArrowLeft, Camera, Image, X, AlertCircle, RefreshCw, CheckCircle2, Sparkles } from 'lucide-react';

interface QrScannerModalProps {
  onScan: (scannedText: string) => void;
  onClose: () => void;
}

export const QrScannerModal: React.FC<QrScannerModalProps> = ({ onScan, onClose }) => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [liveCameraActive, setLiveCameraActive] = useState(false);
  const [liveCameraStatus, setLiveCameraStatus] = useState<'idle' | 'starting' | 'running' | 'failed'>('idle');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const photoLibraryInputRef = useRef<HTMLInputElement | null>(null);
  const hasScannedRef = useRef(false);

  // Stop video stream cleanly
  const stopLiveCamera = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setLiveCameraActive(false);
    setLiveCameraStatus('idle');
  };

  const handleSuccess = (decodedText: string) => {
    if (hasScannedRef.current) return;
    hasScannedRef.current = true;
    stopLiveCamera();
    onScan(decodedText);
  };

  // Decode QR code from any image file or camera capture
  const processImageFile = async (file: File) => {
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const result = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const img = new window.Image();
          img.onload = () => {
            try {
              const canvas = document.createElement('canvas');
              // Scale down if image is huge to optimize memory and scanning speed
              const maxDim = 1600;
              let { width, height } = img;
              if (width > maxDim || height > maxDim) {
                const ratio = Math.min(maxDim / width, maxDim / height);
                width = Math.round(width * ratio);
                height = Math.round(height * ratio);
              }

              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d', { willReadFrequently: true });
              if (!ctx) {
                reject(new Error('Canvas rendering is not supported on this device.'));
                return;
              }

              ctx.drawImage(img, 0, 0, width, height);
              const imageData = ctx.getImageData(0, 0, width, height);

              // High-precision QR code scan with inversion attempts
              const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: 'attemptBoth',
              });

              if (code && code.data && code.data.trim().length > 0) {
                resolve(code.data.trim());
              } else {
                reject(
                  new Error(
                    'No QR code detected in the photo. Please make sure the QR code is centered, well-lit, and in focus.'
                  )
                );
              }
            } catch (err) {
              reject(err);
            }
          };
          img.onerror = () => reject(new Error('Failed to load the selected image.'));
          img.src = reader.result as string;
        };
        reader.onerror = () => reject(new Error('Failed to read file from storage.'));
        reader.readAsDataURL(file);
      });

      handleSuccess(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
    } finally {
      setIsProcessing(false);
      if (cameraInputRef.current) cameraInputRef.current.value = '';
      if (photoLibraryInputRef.current) photoLibraryInputRef.current.value = '';
    }
  };

  // Live video scanning loop via requestAnimationFrame
  const startScanningLoop = () => {
    const scanFrame = () => {
      if (!videoRef.current || hasScannedRef.current) return;

      const video = videoRef.current;
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (ctx && canvas.width > 0 && canvas.height > 0) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'attemptBoth',
          });

          if (code && code.data && code.data.trim().length > 0) {
            handleSuccess(code.data.trim());
            return;
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(scanFrame);
    };

    animFrameRef.current = requestAnimationFrame(scanFrame);
  };

  // Start live streaming camera directly
  const startLiveCamera = async () => {
    setErrorMessage(null);
    setLiveCameraStatus('starting');

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Live camera video stream is not supported in this browser context.');
      }

      // Constraints with rear camera preference and video resolution
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true'); // Required for iOS Safari
        await videoRef.current.play();
        setLiveCameraActive(true);
        setLiveCameraStatus('running');
        startScanningLoop();
      }
    } catch (err: unknown) {
      setLiveCameraStatus('failed');
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('Permission') || msg.includes('denied') || msg.includes('NotAllowedError')) {
        setErrorMessage(
          'Live camera stream was blocked by browser permissions. Use the "Take Photo with Camera" button below to take a picture of the QR code.'
        );
      } else {
        setErrorMessage(
          `Could not start live stream: ${msg}. Please use the "Take Photo with Camera" button below.`
        );
      }
    }
  };

  // Automatically attempt live camera once on mount, but do not block UI if it fails
  useEffect(() => {
    startLiveCamera();
    return () => {
      stopLiveCamera();
    };
  }, []);

  const handleClose = () => {
    stopLiveCamera();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col text-white animate-fade-in select-none">
      {/* 1. Native OS Camera Trigger: 100% works on iOS Safari & Android, bypassing any iframe/WebRTC restrictions */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) processImageFile(file);
        }}
      />

      {/* 2. Photo Library / Screenshot file picker */}
      <input
        ref={photoLibraryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) processImageFile(file);
        }}
      />

      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-zinc-900 bg-black shrink-0">
        <button
          type="button"
          onClick={handleClose}
          className="p-2 -ml-2 text-zinc-400 hover:text-white transition-colors"
          aria-label="Back"
        >
          <ArrowLeft size={22} />
        </button>
        <div className="flex items-center space-x-2">
          <Camera size={16} className="text-zinc-300" />
          <span className="font-semibold text-sm tracking-tight text-white">Scan QR Code</span>
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
        {/* Top Scanner Window / Viewfinder */}
        <div className="w-full flex flex-col items-center pt-2 space-y-4">
          <div className="relative w-full aspect-square max-w-[280px] rounded-3xl overflow-hidden bg-zinc-950 border border-zinc-800 shadow-2xl flex items-center justify-center">
            {/* Live Video Feed (when stream is active) */}
            <video
              ref={videoRef}
              playsInline
              autoPlay
              muted
              className={`w-full h-full object-cover ${liveCameraActive ? 'block' : 'hidden'}`}
            />

            {/* When live camera is loading or inactive */}
            {!liveCameraActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-zinc-950 space-y-3">
                {liveCameraStatus === 'starting' ? (
                  <>
                    <RefreshCw size={24} className="text-zinc-400 animate-spin" />
                    <span className="text-xs font-mono text-zinc-400">Accessing Camera...</span>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
                      <Camera size={22} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-white">Live Stream Inactive</p>
                      <p className="text-[11px] text-zinc-400 leading-relaxed">
                        Tap "Take Photo with Camera" below to launch your camera directly.
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Processing Spinner Overlay */}
            {isProcessing && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-xs flex flex-col items-center justify-center space-y-2.5 z-20">
                <RefreshCw size={26} className="text-white animate-spin" />
                <span className="text-xs font-semibold text-white">Analyzing QR Code...</span>
              </div>
            )}

            {/* Scanner Frame Reticle */}
            {liveCameraActive && !isProcessing && (
              <div className="absolute inset-6 pointer-events-none flex flex-col justify-between z-10">
                <div className="flex justify-between">
                  <div className="w-6 h-6 border-t-2 border-l-2 border-white rounded-tl-sm" />
                  <div className="w-6 h-6 border-t-2 border-r-2 border-white rounded-tr-sm" />
                </div>
                <div className="flex justify-between">
                  <div className="w-6 h-6 border-b-2 border-l-2 border-white rounded-bl-sm" />
                  <div className="w-6 h-6 border-b-2 border-r-2 border-white rounded-br-sm" />
                </div>
              </div>
            )}
          </div>

          {/* Subtitle instructions */}
          <div className="text-center space-y-0.5">
            <p className="text-xs text-zinc-300 font-medium">
              {liveCameraActive
                ? 'Point your camera at any wallet QR code'
                : 'Choose a capture method below'}
            </p>
            <p className="text-[11px] text-zinc-500 font-mono">
              Supports 0x Addresses, ENS (.eth), and DIDs
            </p>
          </div>
        </div>

        {/* Error / Feedback Message Box */}
        {errorMessage && (
          <div className="w-full my-3 p-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 flex items-start space-x-2.5">
            <AlertCircle size={16} className="text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5 text-left">
              <span className="font-semibold text-amber-300 block">Notice</span>
              <p className="text-[11px] text-zinc-400 leading-relaxed">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Primary Action Buttons: Designed for 100% Mobile Reliability */}
        <div className="w-full space-y-2.5 pt-4 pb-2">
          {/* Main Button: Native OS Camera Snap (100% reliable on iOS & Android) */}
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            disabled={isProcessing}
            className="w-full py-3 px-4 bg-white hover:bg-zinc-200 text-black text-xs font-semibold rounded-2xl transition-transform active:scale-[0.98] flex items-center justify-center space-x-2 shadow-lg"
          >
            <Camera size={16} />
            <span>Take Photo with Camera</span>
          </button>

          {/* Secondary Button: Choose from Photo Library / Screenshots */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => photoLibraryInputRef.current?.click()}
              disabled={isProcessing}
              className="py-2.5 px-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs font-medium rounded-xl border border-zinc-800 transition-colors flex items-center justify-center space-x-1.5"
            >
              <Image size={14} />
              <span>Choose Photo</span>
            </button>

            {liveCameraActive ? (
              <button
                type="button"
                onClick={stopLiveCamera}
                className="py-2.5 px-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-medium rounded-xl border border-zinc-800 transition-colors flex items-center justify-center space-x-1.5"
              >
                <span>Pause Stream</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={startLiveCamera}
                className="py-2.5 px-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-medium rounded-xl border border-zinc-800 transition-colors flex items-center justify-center space-x-1.5"
              >
                <RefreshCw size={12} />
                <span>Retry Stream</span>
              </button>
            )}
          </div>

          {/* Cancel button */}
          <button
            type="button"
            onClick={handleClose}
            className="w-full py-2 text-center text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Cancel &amp; Enter Manually
          </button>
        </div>
      </div>
    </div>
  );
};
