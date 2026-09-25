import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import QRCode from 'react-qr-code';
import { 
  ArrowLeft, 
  Camera, 
  Image, 
  X, 
  AlertCircle, 
  RefreshCw, 
  CheckCircle2, 
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  UploadCloud,
  Check,
  Zap,
  Coffee,
  Palette,
  FileCode,
  Building2,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import { InvisibleAction } from '../types';
import { 
  parseInvisibleProposalFromQR, 
  DEMO_PROPOSAL_PRESETS,
  ParsedProposalResult 
} from '../services/proposalParser';

interface ProposalQrScannerModalProps {
  onImportProposal: (action: InvisibleAction) => void;
  onClose: () => void;
  initialLocale?: 'ja' | 'en';
}

export const ProposalQrScannerModal: React.FC<ProposalQrScannerModalProps> = ({
  onImportProposal,
  onClose,
  initialLocale = 'ja'
}) => {
  const [lang, setLang] = useState<'ja' | 'en'>(initialLocale);
  const isJa = lang === 'ja';

  // Scanner states
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [liveCameraActive, setLiveCameraActive] = useState(false);
  const [liveCameraStatus, setLiveCameraStatus] = useState<'idle' | 'starting' | 'running' | 'failed'>('idle');
  const [activeSubTab, setActiveSubTab] = useState<'scanner' | 'presets'>('scanner');
  const [selectedPresetId, setSelectedPresetId] = useState<string>(DEMO_PROPOSAL_PRESETS[0].id);

  // Proposal confirmation state
  const [detectedProposal, setDetectedProposal] = useState<ParsedProposalResult | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Video and DOM refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const photoLibraryInputRef = useRef<HTMLInputElement | null>(null);
  const hasScannedRef = useRef(false);

  // Clean stop video stream
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

  // Decode QR code from any image file or camera snapshot
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
                reject(new Error(isJa ? 'Canvasの初期化に失敗しました。' : 'Canvas context not supported.'));
                return;
              }

              ctx.drawImage(img, 0, 0, width, height);
              const imageData = ctx.getImageData(0, 0, width, height);
              const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: 'attemptBoth',
              });

              if (code && code.data && code.data.trim().length > 0) {
                resolve(code.data.trim());
              } else {
                reject(
                  new Error(
                    isJa
                      ? '画像からQRコードが検出されませんでした。ピントを合わせて再度撮影してください。'
                      : 'No QR code detected in the photo. Please align and re-focus.'
                  )
                );
              }
            } catch (err) {
              reject(err);
            }
          };
          img.onerror = () => reject(new Error(isJa ? '画像の読み込みに失敗しました。' : 'Failed to load photo.'));
          img.src = reader.result as string;
        };
        reader.onerror = () => reject(new Error(isJa ? 'ファイルの読み込みエラーです。' : 'Failed to read file.'));
        reader.readAsDataURL(file);
      });

      handleProposalDetected(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
    } finally {
      setIsProcessing(false);
      if (cameraInputRef.current) cameraInputRef.current.value = '';
      if (photoLibraryInputRef.current) photoLibraryInputRef.current.value = '';
    }
  };

  // Continuous video frame scanning loop
  const startScanningLoop = () => {
    const scanFrame = () => {
      if (!videoRef.current || hasScannedRef.current || detectedProposal) return;

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
            handleProposalDetected(code.data.trim());
            return;
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(scanFrame);
    };

    animFrameRef.current = requestAnimationFrame(scanFrame);
  };

  // Start live streaming camera
  const startLiveCamera = async () => {
    setErrorMessage(null);
    setLiveCameraStatus('starting');
    hasScannedRef.current = false;

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error(
          isJa
            ? 'お使いのブラウザ環境ではWebRTCカメラストリームがサポートされていません。'
            : 'Live camera video stream is not supported in this browser context.'
        );
      }

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
        videoRef.current.setAttribute('playsinline', 'true');
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
          isJa
            ? 'カメラへのアクセスが拒否されました。「カメラで撮影」ボタンから直接撮影するか、下のプリセットをご利用ください。'
            : 'Camera access denied. Tap "Take Photo with Camera" or pick a preset below.'
        );
      } else {
        setErrorMessage(
          isJa
            ? `ライブカメラ起動エラー: ${msg}。「カメラで撮影」ボタンをご利用ください。`
            : `Could not start live stream: ${msg}. Please tap "Take Photo with Camera".`
        );
      }
    }
  };

  const handleProposalDetected = (scannedPayload: string) => {
    if (hasScannedRef.current) return;
    hasScannedRef.current = true;

    // Haptic feedback
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([30, 20, 30]);
    }

    // Parse according to deterministic rules
    const parsed = parseInvisibleProposalFromQR(scannedPayload, lang);
    setDetectedProposal(parsed);

    // Stop video stream cleanly while reviewing proposal
    stopLiveCamera();
  };

  const handleConfirmImport = () => {
    if (!detectedProposal?.action) return;
    setIsImporting(true);

    setTimeout(() => {
      onImportProposal(detectedProposal.action!);
      setIsImporting(false);
      onClose();
    }, 400);
  };

  const handleResetAndScanAgain = () => {
    hasScannedRef.current = false;
    setDetectedProposal(null);
    setErrorMessage(null);
    startLiveCamera();
  };

  const handleSelectPreset = (presetPayload: string) => {
    hasScannedRef.current = true;
    stopLiveCamera();
    const parsed = parseInvisibleProposalFromQR(presetPayload, lang);
    setDetectedProposal(parsed);
  };

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

  const activePreset = DEMO_PROPOSAL_PRESETS.find((p) => p.id === selectedPresetId) || DEMO_PROPOSAL_PRESETS[0];

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col text-white animate-fade-in select-none">
      {/* 1. Native OS Camera capture trigger: 100% reliable fallback */}
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

      {/* 2. Photo library picker trigger */}
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
          <ArrowLeft size={20} />
        </button>

        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 rounded-full bg-white text-black flex items-center justify-center text-xs font-bold shadow leading-none">
            ◉
          </div>
          <span className="font-semibold text-sm tracking-tight text-white">
            {isJa ? 'Tive ◉AI QR提案スキャナー' : 'Tive ◉AI Proposal Scanner'}
          </span>
        </div>

        {/* Language switch & close */}
        <div className="flex items-center space-x-1.5">
          <button
            type="button"
            onClick={() => setLang(lang === 'ja' ? 'en' : 'ja')}
            className="px-2 py-0.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-300 hover:text-white"
          >
            {isJa ? 'EN' : 'JA'}
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 -mr-2 text-zinc-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Sub Tabs: Live Scanner vs Test QR Generator / Presets */}
      <div className="px-4 py-2 bg-zinc-950/80 border-b border-zinc-900 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-2 w-full max-w-sm mx-auto">
          <button
            type="button"
            onClick={() => {
              setActiveSubTab('scanner');
              if (!liveCameraActive && !detectedProposal) startLiveCamera();
            }}
            className={`flex-1 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
              activeSubTab === 'scanner'
                ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Camera size={13} />
            <span>{isJa ? 'カメラでスキャン' : 'Camera Scanner'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('presets')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
              activeSubTab === 'presets'
                ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sparkles size={13} className="text-amber-400" />
            <span>{isJa ? 'テスト用QR・プリセット' : 'Test Presets & QR'}</span>
          </button>
        </div>
      </div>

      {/* Main View Area */}
      <div className="flex-1 overflow-y-auto max-w-sm w-full mx-auto p-4 flex flex-col justify-between">
        {/* SUBTAB 1: CAMERA SCANNER */}
        {activeSubTab === 'scanner' && (
          <div className="w-full flex-1 flex flex-col justify-between space-y-4">
            {/* Viewfinder when NO proposal detected yet */}
            {!detectedProposal && (
              <div className="w-full flex flex-col items-center pt-1 space-y-4">
                {/* Title instructions */}
                <div className="text-center space-y-0.5">
                  <p className="text-xs font-medium text-white">
                    {liveCameraActive
                      ? (isJa ? '提案QRコードを枠内に収めてください' : 'Point camera at proposal QR code')
                      : (isJa ? '撮影方法を選択してください' : 'Select capture method')}
                  </p>
                  <p className="text-[11px] text-zinc-500 font-mono">
                    {isJa
                      ? 'Tive ◉AI JSON / Web3 送金URI / 受取先アドレスに対応'
                      : 'Supports Tive ◉AI Proposals, Web3 URIs, & DIDs'}
                  </p>
                </div>

                {/* Viewfinder Window */}
                <div className="relative w-full aspect-square max-w-[270px] rounded-3xl overflow-hidden bg-zinc-950 border border-zinc-800 shadow-2xl flex items-center justify-center">
                  <video
                    ref={videoRef}
                    playsInline
                    autoPlay
                    muted
                    className={`w-full h-full object-cover ${liveCameraActive ? 'block' : 'hidden'}`}
                  />

                  {/* Inactive or Loading placeholder */}
                  {!liveCameraActive && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-zinc-950 space-y-3">
                      {liveCameraStatus === 'starting' ? (
                        <>
                          <RefreshCw size={24} className="text-white animate-spin" />
                          <span className="text-xs font-mono text-zinc-400">
                            {isJa ? 'カメラを起動中...' : 'Accessing Camera...'}
                          </span>
                        </>
                      ) : (
                        <>
                          <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
                            <Camera size={22} />
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs font-semibold text-white">
                              {isJa ? 'カメラ映像が一時停止中' : 'Camera Feed Inactive'}
                            </p>
                            <p className="text-[11px] text-zinc-400 leading-relaxed">
                              {isJa
                                ? '「カメラで撮影」ボタンから直接撮影してQRを即座に読み取れます。'
                                : 'Tap "Take Photo with Camera" below to take a picture of the QR.'}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Processing Overlay */}
                  {isProcessing && (
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-xs flex flex-col items-center justify-center space-y-2.5 z-20">
                      <RefreshCw size={26} className="text-white animate-spin" />
                      <span className="text-xs font-semibold text-white">
                        {isJa ? 'QRコードを解析中...' : 'Analyzing QR Code...'}
                      </span>
                    </div>
                  )}

                  {/* Reticle Guides & Laser */}
                  {liveCameraActive && !isProcessing && (
                    <div className="absolute inset-6 pointer-events-none flex flex-col justify-between z-10">
                      <div className="flex justify-between">
                        <div className="w-6 h-6 border-t-2 border-l-2 border-white rounded-tl-sm" />
                        <div className="w-6 h-6 border-t-2 border-r-2 border-white rounded-tr-sm" />
                      </div>

                      {/* Scanning Laser Line */}
                      <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent shadow-[0_0_8px_#60a5fa] animate-qr-scan" />

                      <div className="flex justify-between">
                        <div className="w-6 h-6 border-b-2 border-l-2 border-white rounded-bl-sm" />
                        <div className="w-6 h-6 border-b-2 border-r-2 border-white rounded-br-sm" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Error Box if any */}
                {errorMessage && (
                  <div className="w-full p-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 flex items-start space-x-2.5">
                    <AlertCircle size={16} className="text-amber-400 shrink-0 mt-0.5" />
                    <div className="space-y-0.5 text-left">
                      <span className="font-semibold text-amber-300 block">
                        {isJa ? 'お知らせ' : 'Notice'}
                      </span>
                      <p className="text-[11px] text-zinc-400 leading-relaxed">{errorMessage}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* CONFIRMATION CARD: When proposal has been successfully detected */}
            {detectedProposal && detectedProposal.action && (
              <div className="w-full space-y-3 pt-1 animate-fade-in">
                {/* Status Bar */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-xs font-bold text-emerald-400">
                      {isJa ? '提案QRコードを検出・検証完了' : 'Proposal Verified from QR'}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold ${
                      detectedProposal.action.tier === 1
                        ? 'border-emerald-700 bg-emerald-950/80 text-emerald-300'
                        : detectedProposal.action.tier === 2
                        ? 'border-blue-700 bg-blue-950/80 text-blue-300'
                        : detectedProposal.action.tier === 3
                        ? 'border-amber-700 bg-amber-950/80 text-amber-300'
                        : detectedProposal.action.tier === 4
                        ? 'border-rose-700 bg-rose-950/80 text-rose-300'
                        : 'border-purple-700 bg-purple-950/80 text-purple-300'
                    }`}
                  >
                    Tier {detectedProposal.action.tier}
                  </span>
                </div>

                {/* Verified Proposal Card (Strict Tive ◉AI Structure) */}
                <div className="p-4 rounded-3xl bg-zinc-950 border border-zinc-800 space-y-3.5 shadow-xl">
                  <div className="flex items-center justify-between border-b border-zinc-900 pb-2.5">
                    <div>
                      <h3 className="text-sm font-bold text-white leading-snug">
                        {(!isJa && detectedProposal.action.descEn)
                          ? detectedProposal.action.descEn
                          : detectedProposal.action.desc}
                      </h3>
                      <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                        {detectedProposal.action.initiatedBy}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-extrabold text-white font-mono">
                        {detectedProposal.action.amount}
                      </div>
                      <div className="text-[10px] text-zinc-400 font-mono">
                        {detectedProposal.action.amountLabel}
                      </div>
                    </div>
                  </div>

                  {/* 4 Mandatory Items (Strict format from System Rules) */}
                  <div className="space-y-2.5 text-xs">
                    {/* 1. Destination */}
                    <div className="p-2.5 rounded-2xl bg-zinc-900/60 border border-zinc-900 space-y-1">
                      <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-400">
                        {isJa ? '送り先 (Destination)' : 'Destination'}
                      </span>
                      <p className="font-mono text-zinc-200 text-[11px] break-all">
                        {detectedProposal.action.destination}
                      </p>
                    </div>

                    {/* 2. AmountLabel */}
                    <div className="p-2.5 rounded-2xl bg-zinc-900/60 border border-zinc-900 space-y-1">
                      <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-400">
                        {isJa ? '金額換算 (Amount)' : 'Amount Label'}
                      </span>
                      <p className="font-medium text-white text-[11px]">
                        {detectedProposal.action.amountLabel || detectedProposal.action.amount}
                      </p>
                    </div>

                    {/* 3. Reason */}
                    <div className="p-2.5 rounded-2xl bg-zinc-900/60 border border-zinc-900 space-y-1">
                      <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-400">
                        {isJa ? '根拠 (Reason)' : 'Reason'}
                      </span>
                      <p className="text-zinc-300 text-[11px] leading-relaxed">
                        {(!isJa && detectedProposal.action.reasonEn)
                          ? detectedProposal.action.reasonEn
                          : detectedProposal.action.reason}
                      </p>
                    </div>

                    {/* 4. Why Approval Needed */}
                    <div className="p-2.5 rounded-2xl bg-zinc-900/60 border border-zinc-900 space-y-1">
                      <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-400">
                        {isJa ? '承認の必要理由 (Why Approval Needed)' : 'Why Approval Needed'}
                      </span>
                      <p className="text-amber-200/90 text-[11px] leading-relaxed">
                        {(!isJa && detectedProposal.action.whyApprovalNeededEn)
                          ? detectedProposal.action.whyApprovalNeededEn
                          : detectedProposal.action.whyApprovalNeeded}
                      </p>
                    </div>
                  </div>

                  {/* Safety & Policy Warning if Tier 5 Rejected */}
                  {detectedProposal.action.status === 'rejected_tier5' && (
                    <div className="p-3 rounded-2xl bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs flex items-start space-x-2">
                      <ShieldAlert size={16} className="text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block">
                          {isJa ? '【出資法違反・即時遮断】' : 'Execution Prohibited by Law'}
                        </span>
                        <p className="text-[11px] text-rose-200/80 leading-relaxed mt-0.5">
                          {isJa
                            ? '元本保証や確定利回りに関する語句が検出されたため、Policy Engineが実行を自動遮断した状態でインポートされます。'
                            : 'Prohibited investment keywords detected. Blocked deterministically by Policy Engine.'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Import Confirmation Buttons */}
                <div className="space-y-2 pt-2 pb-1">
                  <button
                    type="button"
                    onClick={handleConfirmImport}
                    disabled={isImporting}
                    className="w-full py-3.5 px-4 bg-white hover:bg-zinc-200 text-black text-xs font-bold rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center space-x-2 shadow-lg"
                  >
                    {isImporting ? (
                      <>
                        <RefreshCw size={15} className="animate-spin" />
                        <span>{isJa ? 'インポート中...' : 'Importing...'}</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={16} />
                        <span>{isJa ? 'ダッシュボードへインポート' : 'Import Proposal to Dashboard'}</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleResetAndScanAgain}
                    className="w-full py-2.5 text-center text-xs text-zinc-400 hover:text-white transition-colors flex items-center justify-center space-x-1.5"
                  >
                    <RefreshCw size={13} />
                    <span>{isJa ? 'もう一度スキャンする' : 'Scan Another QR Code'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Camera Control Action Buttons (when not reviewing detected proposal) */}
            {!detectedProposal && (
              <div className="w-full space-y-2.5 pt-2 pb-1">
                {/* 1. Native Camera Snap (100% reliable) */}
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={isProcessing}
                  className="w-full py-3 px-4 bg-white hover:bg-zinc-200 text-black text-xs font-bold rounded-2xl transition-transform active:scale-[0.98] flex items-center justify-center space-x-2 shadow-lg"
                >
                  <Camera size={16} />
                  <span>{isJa ? 'カメラで撮影して読み取り' : 'Take Photo with Camera'}</span>
                </button>

                {/* 2. Secondary Row: Choose File + Stream Control */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => photoLibraryInputRef.current?.click()}
                    disabled={isProcessing}
                    className="py-2.5 px-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs font-medium rounded-xl border border-zinc-800 transition-colors flex items-center justify-center space-x-1.5"
                  >
                    <Image size={14} />
                    <span>{isJa ? '画像ファイル選択' : 'Choose Photo'}</span>
                  </button>

                  {liveCameraActive ? (
                    <button
                      type="button"
                      onClick={stopLiveCamera}
                      className="py-2.5 px-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-medium rounded-xl border border-zinc-800 transition-colors flex items-center justify-center space-x-1.5"
                    >
                      <span>{isJa ? 'ライブ停止' : 'Pause Stream'}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={startLiveCamera}
                      className="py-2.5 px-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-medium rounded-xl border border-zinc-800 transition-colors flex items-center justify-center space-x-1.5"
                    >
                      <RefreshCw size={12} />
                      <span>{isJa ? 'ライブ再開' : 'Resume Stream'}</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* SUBTAB 2: DEMO PRESETS & LIVE QR CODES */}
        {activeSubTab === 'presets' && (
          <div className="w-full space-y-4 pt-1 animate-fade-in">
            <div className="text-center space-y-1">
              <p className="text-xs font-semibold text-white">
                {isJa ? 'テスト用提案プリセット & リアルタイムQR' : 'Interactive QR Presets & Live Display'}
              </p>
              <p className="text-[11px] text-zinc-400">
                {isJa
                  ? 'スマホカメラを向けるか、ワンタップで即座にインポート検証できます。'
                  : 'Point camera at this QR code, or click to inspect and import directly.'}
              </p>
            </div>

            {/* Preset Selector Chips */}
            <div className="flex flex-col space-y-2">
              {DEMO_PROPOSAL_PRESETS.map((p) => {
                const isSelected = p.id === selectedPresetId;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPresetId(p.id)}
                    className={`p-2.5 rounded-2xl border text-left transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-zinc-900 border-zinc-600 shadow-sm'
                        : 'bg-zinc-950 border-zinc-900 text-zinc-400 hover:border-zinc-800'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <span className="text-xs font-semibold text-white block">
                        {isJa ? p.labelJa : p.labelEn}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-400">
                        Tier {p.tier} Policy
                      </span>
                    </div>
                    <span
                      className={`text-[9px] font-mono px-2 py-0.5 rounded-full border font-bold ${
                        p.tier === 2
                          ? 'text-blue-400 border-blue-800 bg-blue-950/40'
                          : p.tier === 3
                          ? 'text-amber-400 border-amber-800 bg-amber-950/40'
                          : 'text-purple-400 border-purple-800 bg-purple-950/40'
                      }`}
                    >
                      Tier {p.tier}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Rendered Live QR Code for the active preset */}
            <div className="p-4 rounded-3xl bg-zinc-950 border border-zinc-800 flex flex-col items-center space-y-3">
              <div className="bg-white p-4 rounded-2xl shadow-xl">
                <QRCode value={activePreset.payload} size={180} />
              </div>
              <p className="text-[10px] text-zinc-400 font-mono text-center max-w-xs">
                {isJa ? 'このQRコードをカメラで読み取ってテスト可能' : 'Scan this QR code with another camera to test'}
              </p>
            </div>

            {/* Quick 1-Tap Import from selected Preset */}
            <div className="space-y-2 pt-1 pb-2">
              <button
                type="button"
                onClick={() => {
                  setActiveSubTab('scanner');
                  handleSelectPreset(activePreset.payload);
                }}
                className="w-full py-3 px-4 bg-white hover:bg-zinc-200 text-black text-xs font-bold rounded-2xl transition-transform active:scale-[0.98] flex items-center justify-center space-x-2 shadow-lg"
              >
                <Sparkles size={15} />
                <span>
                  {isJa
                    ? `このプリセットをインポート確認へ (${activePreset.id.replace('preset-', '')})`
                    : 'Inspect & Import This Preset'}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
