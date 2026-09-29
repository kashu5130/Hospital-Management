import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Sparkles, Check, Palette, Zap, Shield, Flame, Activity } from 'lucide-react';
import { useTheme, DarkStyle, ThemeMode, HoverBehavior } from '../context/ThemeContext';

interface ThemeToggleProps {
  variant?: 'pill' | 'compact' | 'floating';
  className?: string;
  showHoverHint?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  variant = 'compact',
  className = '',
  showHoverHint = true,
}) => {
  const {
    theme,
    darkStyle,
    isDark,
    hoverBehavior,
    setHoverBehavior,
    commitThemeChange,
    previewTheme,
    cancelPreview,
    toggleTheme,
  } = useTheme();

  const [hoveringTarget, setHoveringTarget] = useState<'light' | 'dark' | null>(null);
  const [chargeProgress, setChargeProgress] = useState<number>(0);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [styleMenuOpen, setStyleMenuOpen] = useState(false);

  const chargeTimerRef = useRef<number | null>(null);
  const progressIntervalRef = useRef<number | null>(null);
  const feedbackTimeoutRef = useRef<number | null>(null);

  const darkStyles: {
    id: DarkStyle;
    label: string;
    tag: string;
    dotClass: string;
    glowClass: string;
    borderAccent: string;
    desc: string;
    icon: React.FC<{ className?: string }>;
  }[] = [
    {
      id: 'obsidian',
      label: 'Midnight Obsidian',
      tag: 'Bio-Emerald',
      dotClass: 'bg-emerald-400',
      glowClass: 'shadow-[0_0_12px_rgba(16,185,129,0.5)]',
      borderAccent: 'border-emerald-500/40 text-emerald-400',
      desc: 'Deep carbon velvet with neon medical emerald accents',
      icon: Activity,
    },
    {
      id: 'cyber-teal',
      label: 'Cyber Bio-Teal',
      tag: 'Cyan Biolab',
      dotClass: 'bg-cyan-400',
      glowClass: 'shadow-[0_0_12px_rgba(6,182,212,0.5)]',
      borderAccent: 'border-cyan-500/40 text-cyan-400',
      desc: 'Futuristic oceanic dark with high-contrast cyber cyan',
      icon: Zap,
    },
    {
      id: 'midnight-navy',
      label: 'Midnight Sapphire',
      tag: 'Deep Blue',
      dotClass: 'bg-sky-400',
      glowClass: 'shadow-[0_0_12px_rgba(56,189,248,0.5)]',
      borderAccent: 'border-sky-500/40 text-sky-400',
      desc: 'Royal celestial navy with crisp starlight telemetry',
      icon: Shield,
    },
    {
      id: 'royal-amethyst',
      label: 'Royal Amethyst',
      tag: 'Violet Luxury',
      dotClass: 'bg-purple-400',
      glowClass: 'shadow-[0_0_12px_rgba(168,85,247,0.5)]',
      borderAccent: 'border-purple-500/40 text-purple-400',
      desc: 'Deep mystical amethyst obsidian with electric violet glow',
      icon: Flame,
    },
  ];

  // Clean timers on unmount
  useEffect(() => {
    return () => {
      if (chargeTimerRef.current) window.clearTimeout(chargeTimerRef.current);
      if (progressIntervalRef.current) window.clearInterval(progressIntervalRef.current);
      if (feedbackTimeoutRef.current) window.clearTimeout(feedbackTimeoutRef.current);
    };
  }, []);

  const showNotification = (msg: string) => {
    if (feedbackTimeoutRef.current) window.clearTimeout(feedbackTimeoutRef.current);
    setFeedbackMessage(msg);
    feedbackTimeoutRef.current = window.setTimeout(() => {
      setFeedbackMessage(null);
    }, 2400);
  };

  // Triggered when entering a hover zone
  const handleMouseEnterZone = (target: ThemeMode, specificStyle?: DarkStyle) => {
    setHoveringTarget(target);

    // If instant-glide mode is selected, switch immediately
    if (hoverBehavior === 'instant-glide') {
      commitThemeChange(target, specificStyle);
      showNotification(
        target === 'dark'
          ? `🌙 Dark Mode: ${getStyleLabel(specificStyle || darkStyle)}`
          : '☀️ Light Mode Activated'
      );
      return;
    }

    // Default: Magnetic Charge mode
    // 1. Give real-time ambient preview
    previewTheme(target, specificStyle);

    // 2. Start charging progress bar (240ms duration)
    const DURATION = 220;
    const INTERVAL = 20;
    let elapsed = 0;
    setChargeProgress(10);

    if (progressIntervalRef.current) window.clearInterval(progressIntervalRef.current);
    progressIntervalRef.current = window.setInterval(() => {
      elapsed += INTERVAL;
      const pct = Math.min(100, Math.round((elapsed / DURATION) * 100));
      setChargeProgress(pct);
      if (pct >= 100 && progressIntervalRef.current) {
        window.clearInterval(progressIntervalRef.current);
      }
    }, INTERVAL);

    // 3. Lock-in trigger after charge completes
    if (chargeTimerRef.current) window.clearTimeout(chargeTimerRef.current);
    chargeTimerRef.current = window.setTimeout(() => {
      commitThemeChange(target, specificStyle);
      setChargeProgress(0);
      setHoveringTarget(null);
      showNotification(
        target === 'dark'
          ? `✨ Locked: ${getStyleLabel(specificStyle || darkStyle)}`
          : '☀️ Locked: Light Mode'
      );
    }, DURATION);
  };

  // Triggered when leaving a hover zone
  const handleMouseLeaveZone = () => {
    if (chargeTimerRef.current) {
      window.clearTimeout(chargeTimerRef.current);
      chargeTimerRef.current = null;
    }
    if (progressIntervalRef.current) {
      window.clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    setChargeProgress(0);
    setHoveringTarget(null);
    cancelPreview();
  };

  // Immediate Click / Tap (0ms)
  const handleInstantClick = (target: ThemeMode, specificStyle?: DarkStyle) => {
    if (chargeTimerRef.current) window.clearTimeout(chargeTimerRef.current);
    if (progressIntervalRef.current) window.clearInterval(progressIntervalRef.current);
    setChargeProgress(0);
    setHoveringTarget(null);
    commitThemeChange(target, specificStyle);
    showNotification(
      target === 'dark'
        ? `🌙 ${getStyleLabel(specificStyle || darkStyle)} (Active)`
        : '☀️ Light Mode (Active)'
    );
  };

  const getStyleLabel = (styleKey: DarkStyle) => {
    const s = darkStyles.find((item) => item.id === styleKey);
    return s ? s.label : 'Dark';
  };

  // Current active style object
  const activeDarkMeta = darkStyles.find((s) => s.id === darkStyle) || darkStyles[0];

  /* ========================================================================= */
  /* VARIANT 1: COMPACT - HEADER DUAL-PILL WITH HOVER CHARGE & GLOW THUMB     */
  /* ========================================================================= */
  if (variant === 'compact') {
    return (
      <div className={`relative inline-flex items-center ${className}`}>
        {/* Main Capsule Container */}
        <div
          className={`relative flex items-center p-1 rounded-2xl border transition-all duration-300 shadow-xs select-none backdrop-blur-md ${
            isDark
              ? 'bg-[#111827]/90 border-slate-700/80 shadow-[0_4px_20px_rgba(0,0,0,0.5)] ring-1 ring-white/10'
              : 'bg-[#F4F1EA] border-[#E2DDD3] shadow-inner'
          }`}
          onMouseLeave={handleMouseLeaveZone}
        >
          {/* Active Sliding Floating Thumb */}
          <div
            className={`absolute top-1 bottom-1 w-[calc(50%-18px)] rounded-xl transition-all duration-300 pointer-events-none ${
              !isDark
                ? 'left-1 bg-white text-amber-700 shadow-md border border-[#EAE6DF] shadow-amber-500/10'
                : 'left-[calc(50%-15px)] bg-gradient-to-r from-slate-800 to-slate-800/90 text-white shadow-lg border border-slate-600/70 shadow-emerald-500/20'
            }`}
          >
            {/* Soft inner ambient glow inside the thumb */}
            <div
              className={`w-full h-full rounded-xl transition-opacity duration-300 ${
                isDark
                  ? 'bg-gradient-to-r from-emerald-500/15 via-transparent to-transparent'
                  : 'bg-gradient-to-r from-amber-400/15 via-transparent to-transparent'
              }`}
            />
          </div>

          {/* Left Zone: LIGHT */}
          <button
            type="button"
            onMouseEnter={() => handleMouseEnterZone('light')}
            onClick={() => handleInstantClick('light')}
            className={`relative z-10 flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer group ${
              !isDark
                ? 'text-amber-700'
                : 'text-slate-400 hover:text-amber-300'
            }`}
            title="Hover or tap to activate Light Mode"
            aria-label="Light Mode"
          >
            <div className="relative">
              <Sun
                className={`w-3.5 h-3.5 transition-transform duration-300 ${
                  !isDark ? 'text-amber-500 rotate-45 scale-110 drop-shadow-[0_0_6px_rgba(245,158,11,0.5)]' : 'group-hover:rotate-45 group-hover:scale-110'
                }`}
              />
              {hoveringTarget === 'light' && chargeProgress > 0 && !(!isDark) && (
                <span
                  className="absolute -inset-1 rounded-full border-2 border-amber-400 animate-ping opacity-75"
                />
              )}
            </div>
            <span className="hidden sm:inline text-[11px] tracking-tight">Light</span>
          </button>

          {/* Right Zone: DARK */}
          <button
            type="button"
            onMouseEnter={() => handleMouseEnterZone('dark')}
            onClick={() => handleInstantClick('dark')}
            className={`relative z-10 flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer group ${
              isDark
                ? 'text-emerald-400 dark-cyber-teal:text-cyan-400 dark-midnight-navy:text-sky-400 dark-royal-amethyst:text-purple-400'
                : 'text-[#64748B] hover:text-slate-900'
            }`}
            title="Hover or tap to activate Dark Mode"
            aria-label="Dark Mode"
          >
            <div className="relative">
              <Moon
                className={`w-3.5 h-3.5 transition-transform duration-300 ${
                  isDark
                    ? '-rotate-12 scale-110 drop-shadow-[0_0_6px_var(--glow-highlight)]'
                    : 'group-hover:-rotate-12 group-hover:scale-110'
                }`}
              />
              {hoveringTarget === 'dark' && chargeProgress > 0 && isDark === false && (
                <span
                  className="absolute -inset-1 rounded-full border-2 border-emerald-400 animate-ping opacity-75"
                />
              )}
            </div>
            <span className="hidden sm:inline text-[11px] tracking-tight">Dark</span>
          </button>

          {/* Quick Palette Button: reveals 4 curated Dark themes */}
          <div
            className="relative ml-1 pl-1 border-l border-[#E2DDD3] dark:border-slate-700/80"
            onMouseEnter={() => setStyleMenuOpen(true)}
            onMouseLeave={() => setStyleMenuOpen(false)}
          >
            <button
              type="button"
              onClick={() => setStyleMenuOpen(!styleMenuOpen)}
              className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer flex items-center justify-center ${
                isDark
                  ? 'text-slate-300 hover:text-white hover:bg-slate-800'
                  : 'text-[#64748B] hover:text-[#2D3748] hover:bg-white/80'
              }`}
              title="Dark Mode Styles Palette (Hover to browse)"
              aria-label="Choose dark mode style"
            >
              <Palette className="w-3.5 h-3.5" />
            </button>

            {/* Dropdown Menu of Dark Styles */}
            {styleMenuOpen && (
              <div
                className="absolute right-0 top-full mt-2 w-72 p-3 rounded-2xl bg-white dark:bg-[#111827] border border-[#EAE6DF] dark:border-slate-700 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-xl"
                onMouseEnter={() => setStyleMenuOpen(true)}
              >
                <div className="flex items-center justify-between pb-2 border-b border-[#F0ECE4] dark:border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-xs font-bold text-[#2D3748] dark:text-slate-100">
                      Dark Mode Palette
                    </span>
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    Hover to preview
                  </span>
                </div>

                <div className="mt-2 space-y-1.5">
                  {darkStyles.map((item) => {
                    const isSelected = isDark && darkStyle === item.id;
                    const IconComp = item.icon;
                    return (
                      <div
                        key={item.id}
                        onMouseEnter={() => handleMouseEnterZone('dark', item.id)}
                        onClick={() => handleInstantClick('dark', item.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2.5 group ${
                          isSelected
                            ? 'bg-slate-800/90 dark:bg-slate-800 border-emerald-500/60 shadow-xs'
                            : 'hover:bg-[#F9F7F2] dark:hover:bg-slate-800/50 border-transparent hover:border-slate-700/50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border border-white/10 ${
                              item.dotClass
                            } ${item.glowClass} text-slate-950 font-bold`}
                          >
                            <IconComp className="w-3.5 h-3.5 text-slate-950" />
                          </div>
                          <div className="truncate">
                            <div className="flex items-center gap-1.5">
                              <p className="text-xs font-bold text-[#2D3748] dark:text-slate-100 truncate">
                                {item.label}
                              </p>
                              <span className="text-[9px] px-1 py-0.2 rounded font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80">
                                {item.tag}
                              </span>
                            </div>
                            <p className="text-[10px] text-[#64748B] dark:text-slate-400 truncate mt-0.5">
                              {item.desc}
                            </p>
                          </div>
                        </div>
                        {isSelected && (
                          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Hover Behavior toggle inside dropdown */}
                <div className="mt-2.5 pt-2.5 border-t border-[#F0ECE4] dark:border-slate-800 flex items-center justify-between text-[10px]">
                  <span className="text-[#64748B] dark:text-slate-400 font-medium">
                    Hover trigger speed:
                  </span>
                  <div className="flex items-center gap-1 bg-[#F5F2EB] dark:bg-slate-800/80 p-0.5 rounded-lg border border-[#EAE6DF] dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => setHoverBehavior('magnetic-charge')}
                      className={`px-2 py-0.5 rounded-md font-semibold transition-colors ${
                        hoverBehavior === 'magnetic-charge'
                          ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                          : 'text-[#64748B] dark:text-slate-400'
                      }`}
                      title="Gliding with smooth dwell charge to prevent accidents"
                    >
                      Dwell (220ms)
                    </button>
                    <button
                      type="button"
                      onClick={() => setHoverBehavior('instant-glide')}
                      className={`px-2 py-0.5 rounded-md font-semibold transition-colors ${
                        hoverBehavior === 'instant-glide'
                          ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                          : 'text-[#64748B] dark:text-slate-400'
                      }`}
                      title="Instant theme switch on cursor contact"
                    >
                      Instant
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Live Hover Charging Progress Line */}
        {chargeProgress > 0 && (
          <div className="absolute -bottom-1 left-2 right-2 h-0.5 bg-slate-300 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all duration-75"
              style={{ width: `${chargeProgress}%` }}
            />
          </div>
        )}

        {/* Floating Notification Toast */}
        {feedbackMessage && (
          <div className="absolute -bottom-9 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-1 rounded-full bg-slate-950 text-white dark:bg-white dark:text-slate-950 text-[10px] font-bold shadow-2xl border border-white/20 pointer-events-none animate-in fade-in slide-in-from-top-1 duration-150 z-50 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-amber-400 dark:text-emerald-600" />
            <span>{feedbackMessage}</span>
          </div>
        )}
      </div>
    );
  }

  /* ========================================================================= */
  /* VARIANT 2: FLOATING - ORBITAL CYBER DOCK (LOWER CORNER)                   */
  /* ========================================================================= */
  if (variant === 'floating') {
    return (
      <div className={`fixed bottom-20 sm:bottom-6 right-3 sm:right-6 z-40 select-none ${className}`}>
        <div
          className="relative group"
          onMouseLeave={handleMouseLeaveZone}
        >
          {/* Luminous Glow Capsule */}
          <div
            className={`p-1.5 rounded-2xl shadow-2xl border flex items-center gap-1.5 transition-all duration-300 backdrop-blur-xl ${
              isDark
                ? 'bg-[#111827]/95 border-slate-750 text-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.6)] ring-1 ring-emerald-500/30'
                : 'bg-white/95 border-[#E2DDD3] text-[#2D3748] shadow-emerald-950/10 ring-1 ring-[#5A7865]/20'
            }`}
          >
            {/* Left Button: Hover for Light */}
            <button
              type="button"
              onMouseEnter={() => handleMouseEnterZone('light')}
              onClick={() => handleInstantClick('light')}
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                !isDark
                  ? 'bg-amber-100/90 text-amber-800 shadow-xs ring-1 ring-amber-400/40'
                  : 'text-slate-400 hover:text-amber-300 hover:bg-slate-800/80'
              }`}
              title="Hover to switch to Light Mode"
            >
              <Sun className={`w-4 h-4 transition-transform ${!isDark ? 'rotate-45 scale-110 text-amber-600' : ''}`} />
            </button>

            {/* Right Button: Hover for Dark */}
            <button
              type="button"
              onMouseEnter={() => handleMouseEnterZone('dark')}
              onClick={() => handleInstantClick('dark')}
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                isDark
                  ? 'bg-slate-800 text-emerald-400 shadow-xs border border-emerald-500/40 ring-1 ring-emerald-400/30'
                  : 'text-[#64748B] hover:text-slate-900 hover:bg-[#F5F2EB]'
              }`}
              title="Hover to switch to Dark Mode"
            >
              <Moon className={`w-4 h-4 transition-transform ${isDark ? '-rotate-12 scale-110 text-emerald-400' : ''}`} />
            </button>

            {/* Style Badge / Active Pill */}
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 uppercase tracking-wider hidden sm:inline cursor-default"
              title="Gliding cursor switches theme"
            >
              {isDark ? activeDarkMeta.tag : 'Light'}
            </span>
          </div>

          {/* Charge Progress bar on bottom */}
          {chargeProgress > 0 && (
            <div className="absolute -bottom-1.5 left-2 right-2 h-1 bg-slate-800/80 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-400 transition-all duration-75"
                style={{ width: `${chargeProgress}%` }}
              />
            </div>
          )}

          {/* Feedback Toast */}
          {feedbackMessage && (
            <div className="absolute -top-9 right-0 whitespace-nowrap px-3 py-1 rounded-full bg-slate-950 text-white dark:bg-white dark:text-slate-950 text-[10px] font-bold shadow-xl border border-white/20 pointer-events-none animate-in fade-in duration-150">
              {feedbackMessage}
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ========================================================================= */
  /* VARIANT 3: PILL - FULL SEGMENTED CONTROL IN SIDEBAR                       */
  /* ========================================================================= */
  return (
    <div
      className={`flex flex-col items-start gap-2.5 select-none w-full ${className}`}
      onMouseLeave={handleMouseLeaveZone}
    >
      {/* Dual Segmented Hover Switch */}
      <div
        className={`w-full relative flex items-center p-1 rounded-xl border transition-all duration-200 ${
          isDark
            ? 'bg-[#090D16] border-slate-750 shadow-inner'
            : 'bg-[#F5F2EB] border-[#E2DDD3] shadow-inner'
        }`}
      >
        {/* Animated Background Slider */}
        <div
          className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg transition-all duration-300 pointer-events-none shadow-xs ${
            !isDark
              ? 'left-1 bg-white text-[#2D3748] border border-[#EAE6DF] shadow-xs'
              : 'left-[calc(50%+2px)] bg-slate-800 text-emerald-400 border border-slate-700 shadow-emerald-500/10'
          }`}
        />

        {/* Light Option */}
        <button
          type="button"
          onMouseEnter={() => handleMouseEnterZone('light')}
          onClick={() => handleInstantClick('light')}
          className={`relative z-10 flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            !isDark ? 'text-amber-700 font-bold' : 'text-slate-400 hover:text-amber-300'
          }`}
          title="Hover to charge or click to activate Light Mode"
        >
          <Sun className={`w-3.5 h-3.5 ${!isDark ? 'text-amber-500' : 'text-slate-400'}`} />
          <span>Light</span>
          {!isDark && <Check className="w-3 h-3 text-amber-600 ml-0.5" />}
        </button>

        {/* Dark Option */}
        <button
          type="button"
          onMouseEnter={() => handleMouseEnterZone('dark')}
          onClick={() => handleInstantClick('dark')}
          className={`relative z-10 flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            isDark ? 'text-emerald-400 font-bold' : 'text-[#64748B] hover:text-slate-200'
          }`}
          title="Hover to charge or click to activate Dark Mode"
        >
          <Moon className={`w-3.5 h-3.5 ${isDark ? 'text-emerald-400' : 'text-[#64748B]'}`} />
          <span>Dark</span>
          {isDark && <Check className="w-3 h-3 text-emerald-400 ml-0.5" />}
        </button>
      </div>

      {/* Charging indicator bar */}
      {chargeProgress > 0 && (
        <div className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-75"
            style={{ width: `${chargeProgress}%` }}
          />
        </div>
      )}

      {/* 4 Curated Dark Style Swatches */}
      <div className="w-full pt-1.5 border-t border-[#F0ECE4] dark:border-slate-800">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-bold text-[#64748B] dark:text-slate-400">
            Dark Atmosphere (Hover to test):
          </span>
          <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-mono">
            {activeDarkMeta.tag}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          {darkStyles.map((item) => {
            const isSelected = isDark && darkStyle === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onMouseEnter={() => handleMouseEnterZone('dark', item.id)}
                onClick={() => handleInstantClick('dark', item.id)}
                className={`flex items-center gap-2 p-1.5 rounded-lg border text-[10px] font-semibold transition-all cursor-pointer text-left truncate ${
                  isSelected
                    ? 'bg-slate-800 dark:bg-slate-800 text-white border-emerald-500/80 shadow-xs ring-1 ring-emerald-500/20'
                    : 'bg-white dark:bg-slate-900 border-[#EAE6DF] dark:border-slate-800 text-[#64748B] dark:text-slate-400 hover:text-slate-100 hover:border-slate-700'
                }`}
                title={`Hover to preview and lock ${item.label}`}
              >
                <span className={`w-2 h-2 rounded-full ${item.dotClass} ${item.glowClass} shrink-0`} />
                <span className="truncate">{item.label.replace('Midnight ', '')}</span>
              </button>
            );
          })}
        </div>
      </div>

      {showHoverHint && (
        <span className="text-[10px] text-[#64748B] dark:text-slate-400 flex items-center gap-1 pl-0.5">
          <Sparkles className="w-3 h-3 text-emerald-500" />
          <span>Gliding over controls charges and previews theme</span>
        </span>
      )}
    </div>
  );
};
