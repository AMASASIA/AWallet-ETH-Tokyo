import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowRight, Check, Loader2 } from 'lucide-react';

interface SlideToConfirmProps {
  label?: string;
  onConfirm: () => Promise<void> | void;
  isConfirmed?: boolean;
  disabled?: boolean;
  color?: 'pink' | 'purple' | 'emerald';
  id?: string;
}

export const SlideToConfirm: React.FC<SlideToConfirmProps> = ({
  label = 'Slide to confirm',
  onConfirm,
  isConfirmed = false,
  disabled = false,
  color = 'pink',
  id = 'slide-to-confirm',
}) => {
  const [sliderPos, setSliderPos] = useState(0); // in pixels
  const [isDragging, setIsDragging] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [confirmedState, setConfirmedState] = useState(isConfirmed);

  const containerRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef<number>(0);
  const currentPosRef = useRef<number>(0);

  useEffect(() => {
    setConfirmedState(isConfirmed);
    if (!isConfirmed) {
      setSliderPos(0);
      currentPosRef.current = 0;
    }
  }, [isConfirmed]);

  const getMaxSlide = useCallback(() => {
    if (!containerRef.current || !knobRef.current) return 0;
    const containerWidth = containerRef.current.clientWidth;
    const knobWidth = knobRef.current.clientWidth;
    return Math.max(0, containerWidth - knobWidth - 8); // 4px padding on each side
  }, []);

  const handleDragStart = (clientX: number) => {
    if (disabled || confirmedState || isVerifying) return;
    setIsDragging(true);
    startXRef.current = clientX - currentPosRef.current;
  };

  const handleDragMove = useCallback((clientX: number) => {
    if (!isDragging || disabled || confirmedState || isVerifying) return;
    const maxSlide = getMaxSlide();
    const newPos = Math.min(Math.max(0, clientX - startXRef.current), maxSlide);
    currentPosRef.current = newPos;
    setSliderPos(newPos);
  }, [isDragging, disabled, confirmedState, isVerifying, getMaxSlide]);

  const handleDragEnd = useCallback(async () => {
    if (!isDragging) return;
    setIsDragging(false);
    const maxSlide = getMaxSlide();

    // If dragged at least 85% to the end, trigger completion
    if (currentPosRef.current >= maxSlide * 0.85 && maxSlide > 0) {
      // Snap to end
      setSliderPos(maxSlide);
      currentPosRef.current = maxSlide;
      setIsVerifying(true);
      try {
        await onConfirm();
        setConfirmedState(true);
      } catch (err) {
        console.error('Confirmation failed:', err);
        // Reset on error
        setSliderPos(0);
        currentPosRef.current = 0;
      } finally {
        setIsVerifying(false);
      }
    } else {
      // Snap back smoothly
      setSliderPos(0);
      currentPosRef.current = 0;
    }
  }, [isDragging, getMaxSlide, onConfirm]);

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    handleDragStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    handleDragMove(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    handleDragEnd();
  };

  // Mouse handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    handleDragStart(e.clientX);
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (isDragging) handleDragMove(e.clientX);
    };
    const onMouseUp = () => {
      if (isDragging) handleDragEnd();
    };

    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  // Progress percentage (0 to 1)
  const maxSlide = getMaxSlide();
  const progress = maxSlide > 0 ? sliderPos / maxSlide : 0;

  // Pink glow theme from reference image (IMG_9728.jpeg)
  const knobGlow = color === 'pink'
    ? 'bg-[#f4a5b8] text-zinc-900 shadow-[0_0_20px_rgba(244,165,184,0.45)]'
    : color === 'purple'
    ? 'bg-purple-300 text-zinc-950 shadow-[0_0_20px_rgba(216,180,254,0.45)]'
    : 'bg-emerald-300 text-zinc-950 shadow-[0_0_20px_rgba(110,231,183,0.45)]';

  return (
    <div
      id={id}
      ref={containerRef}
      className={`relative w-full h-[58px] rounded-full p-1 flex items-center select-none overflow-hidden transition-all duration-300 ${
        confirmedState
          ? 'bg-emerald-950/40 border border-emerald-500/50 shadow-[0_0_25px_rgba(16,185,129,0.2)]'
          : disabled
          ? 'bg-zinc-900/40 border border-zinc-800/40 opacity-50 cursor-not-allowed'
          : 'bg-[#121216]/95 border border-white/10 hover:border-white/20 shadow-inner'
      }`}
    >
      {/* Background Track & Fill */}
      <div
        className="absolute inset-y-0 left-0 rounded-full transition-colors pointer-events-none"
        style={{
          width: `${progress * 100}%`,
          background: confirmedState
            ? 'linear-gradient(90deg, rgba(16,185,129,0.15), rgba(16,185,129,0.3))'
            : 'linear-gradient(90deg, rgba(244,165,184,0.08), rgba(244,165,184,0.25))',
        }}
      />

      {/* Centered / Trailing Label */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none px-14 transition-opacity duration-200"
        style={{ opacity: confirmedState ? 1 : Math.max(0.2, 1 - progress * 1.3) }}
      >
        <span
          className={`text-[13px] tracking-tight font-medium font-sans truncate ${
            confirmedState
              ? 'text-emerald-300 font-semibold flex items-center gap-1.5'
              : 'text-zinc-300'
          }`}
        >
          {confirmedState ? (
            <>
              <span className="font-mono font-bold text-emerald-400">A✓</span>
              <span>Verified &amp; Ready</span>
            </>
          ) : isVerifying ? (
            <span className="flex items-center gap-2 text-zinc-400">
              <Loader2 size={14} className="animate-spin text-pink-300" />
              <span>Verifying RPC &amp; Contract...</span>
            </span>
          ) : (
            label
          )}
        </span>
      </div>

      {/* Tiny Status Dot (like in reference image bottom right) */}
      {!confirmedState && (
        <div className="absolute right-4 w-1.5 h-1.5 rounded-full bg-blue-500/80 shadow-[0_0_8px_#3b82f6] pointer-events-none animate-pulse" />
      )}

      {/* Round Knob (Thumb) */}
      <div
        ref={knobRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        style={{
          transform: `translateX(${sliderPos}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        className={`relative z-10 w-[50px] h-[50px] rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing transition-shadow select-none ${
          confirmedState
            ? 'bg-emerald-400 text-black shadow-[0_0_20px_rgba(52,211,153,0.6)] cursor-default'
            : knobGlow
        }`}
      >
        {confirmedState ? (
          <div className="flex items-center justify-center font-bold text-sm tracking-tighter font-mono">
            A✓
          </div>
        ) : isVerifying ? (
          <Loader2 size={20} className="animate-spin text-zinc-900" />
        ) : (
          <ArrowRight
            size={20}
            className={`transition-transform duration-200 ${
              isDragging ? 'translate-x-0.5' : ''
            }`}
            strokeWidth={2.5}
          />
        )}
      </div>
    </div>
  );
};
