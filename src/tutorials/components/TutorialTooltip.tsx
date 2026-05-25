import React, { useState, useEffect } from 'react';
import { X, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';

interface TutorialTooltipProps {
  title?: string;
  message: string;
  onClose: () => void;
  bounds: DOMRect | null;
  // Step-by-step navigation enhancements
  stepIndex?: number;
  totalSteps?: number;
  onNext?: () => void;
  onPrev?: () => void;
  onSkip?: () => void;
  isRealActionStep?: boolean;
}

export const TutorialTooltip: React.FC<TutorialTooltipProps> = ({
  title = "Tutorial Step",
  message,
  onClose,
  bounds,
  stepIndex,
  totalSteps,
  onNext,
  onPrev,
  onSkip,
  isRealActionStep = false,
}) => {
  const [viewportDims, setViewportDims] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setViewportDims({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const tooltipWidth = 320;
  const marginOffset = 16;

  // 1. Determine Placement (Above vs Below target)
  let placement: 'top' | 'bottom' | 'center' = 'bottom';
  if (bounds) {
    const spaceBelow = viewportDims.height - bounds.bottom;
    const spaceAbove = bounds.top;
    // If there is not enough room below (e.g. less than 160px), and more room above, flip
    if (spaceBelow < 180 && spaceAbove > spaceBelow) {
      placement = 'top';
    }
  } else {
    placement = 'center';
  }

  // 2. Position tooltip relative to the screen bounds with safety clamps
  let tooltipStyle: React.CSSProperties = {};

  if (placement === 'center') {
    tooltipStyle = {
      position: 'fixed' as const,
      left: '50%',
      top: '50%',
      transform: 'translate(-50%, -50%)',
      width: `${tooltipWidth}px`,
      maxWidth: `calc(100vw - ${marginOffset * 2}px)`,
      zIndex: 130,
    };
  } else {
    // Math to center the tooltip horizontal center and clamp it so it doesn't bleed out of screen
    let leftCoord = bounds ? bounds.left + bounds.width / 2 : viewportDims.width / 2;
    const minLeft = tooltipWidth / 2 + marginOffset;
    const maxLeft = viewportDims.width - (tooltipWidth / 2 + marginOffset);

    if (viewportDims.width > (tooltipWidth + marginOffset * 2)) {
      leftCoord = Math.max(minLeft, Math.min(maxLeft, leftCoord));
    } else {
      leftCoord = viewportDims.width / 2;
    }

    if (placement === 'bottom') {
      tooltipStyle = {
        position: 'fixed' as const,
        left: `${leftCoord}px`,
        top: `${bounds!.bottom + 16}px`,
        transform: 'translateX(-50%)',
        width: `${tooltipWidth}px`,
        maxWidth: `calc(100vw - ${marginOffset * 2}px)`,
        zIndex: 130,
      };
    } else {
      tooltipStyle = {
        position: 'fixed' as const,
        left: `${leftCoord}px`,
        top: `${bounds!.top - 16}px`,
        transform: 'translate(-50%, -100%)',
        width: `${tooltipWidth}px`,
        maxWidth: `calc(100vw - ${marginOffset * 2}px)`,
        zIndex: 130,
      };
    }
  }

  const showPagination = typeof stepIndex === 'number' && typeof totalSteps === 'number' && totalSteps > 1;

  return (
    <div
      style={tooltipStyle}
      className="bg-white dark:bg-slate-900 border-[3px] border-indigo-400 rounded-2xl p-5 shadow-[0_0_20px_rgba(99,102,241,0.3)] flex flex-col gap-4 z-[130] animate-in zoom-in-95 fade-in duration-200"
    >
      {/* Tooltip Header */}
      <div className="flex items-center justify-between border-b-2 border-slate-100 dark:border-slate-800 pb-3 shrink-0">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="bg-indigo-100 dark:bg-indigo-900/50 p-1.5 rounded-lg shrink-0">
            <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" />
          </div>
          <h4 className="text-slate-900 dark:text-white font-black text-base uppercase tracking-tight truncate">
            {title}
          </h4>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0 cursor-pointer"
          aria-label="Close tutorial step"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Detail / Steps counter Row */}
      {showPagination && (
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="text-[10px] font-black uppercase text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-md">
            Step {stepIndex! + 1} of {totalSteps}
          </div>
          <div className="flex-1 flex gap-1 h-1.5">
            {Array.from({ length: totalSteps! }).map((_, i) => (
              <div 
                key={i} 
                className={`flex-1 rounded-full ${i <= stepIndex! ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-700'}`} 
              />
            ))}
          </div>
        </div>
      )}

      {/* Tooltip Body */}
      <div className="space-y-3">
        <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed font-bold">
          {message}
        </p>
        {isRealActionStep && (
          <div className="bg-emerald-50 dark:bg-emerald-950/30 border-2 border-emerald-400 p-3 rounded-xl flex items-center justify-center">
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-black uppercase tracking-widest animate-pulse flex items-center gap-1.5">
              👇 Tap to try it! 👇
            </p>
          </div>
        )}
      </div>

      {/* Tooltip Footer Actions */}
      <div className="flex items-center justify-between pt-2 shrink-0">
        {onSkip && showPagination ? (
          <button
            onClick={onSkip}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold uppercase text-[10px] tracking-wider transition-colors cursor-pointer"
          >
            Skip Guide
          </button>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-2.5">
          {onPrev && showPagination && stepIndex! > 0 && (
            <button
              onClick={onPrev}
              className="p-2.5 text-indigo-500 hover:text-white hover:bg-indigo-500 bg-slate-50 dark:bg-slate-800 rounded-xl border-2 border-indigo-100 dark:border-slate-700 transition-colors cursor-pointer"
              title="Previous Step"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          {isRealActionStep ? (
            <button
              onClick={onClose}
              className="sa-btn text-white bg-slate-300 dark:bg-slate-700 border-b-4 border-slate-400 dark:border-slate-800 font-black uppercase tracking-wider rounded-xl py-2 px-4 text-xs cursor-pointer opacity-80"
              disabled
            >
              Got it
            </button>
          ) : (
            <button
              onClick={onNext || onClose}
              className="sa-btn text-white bg-indigo-500 hover:bg-indigo-600 border-b-4 border-indigo-600 hover:border-indigo-700 active:border-b-0 active:translate-y-1 font-black uppercase tracking-wider rounded-xl py-2 px-5 text-sm transition-all cursor-pointer flex items-center gap-1.5"
            >
              {showPagination && stepIndex! + 1 < totalSteps! ? (
                <>
                  Next <ChevronRight className="w-4 h-4" />
                </>
              ) : (
                "Finish"
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
