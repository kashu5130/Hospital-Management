import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Palette, Check, Activity, Zap, Shield, Flame } from 'lucide-react';
import { useTheme, DarkStyle } from '../context/ThemeContext';

interface ThemeToggleProps {
  variant?: 'pill' | 'compact' | 'floating';
  className?: string;
  showHoverHint?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  variant = 'compact',
  className = '',
}) => {
  const { theme, darkStyle, isDark, toggleTheme, setTheme, setDarkStyle } = useTheme();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const paletteRef = useRef<HTMLDivElement>(null);

  const darkStyles: {
    id: DarkStyle;
    label: string;
    tag: string;
    dotClass: string;
    desc: string;
    icon: React.FC<{ className?: string }>;
  }[] = [
    {
      id: 'obsidian',
      label: 'Midnight Obsidian',
      tag: 'Bio-Emerald',
      dotClass: 'bg-emerald-500',
      desc: 'Deep carbon canvas with medical emerald accents',
      icon: Activity,
    },
    {
      id: 'cyber-teal',
      label: 'Cyber Bio-Teal',
      tag: 'Cyan Biolab',
      dotClass: 'bg-cyan-500',
      desc: 'High-contrast clinical cyan & deep marine',
      icon: Zap,
    },
    {
      id: 'midnight-navy',
      label: 'Midnight Sapphire',
      tag: 'Deep Blue',
      dotClass: 'bg-sky-500',
      desc: 'Royal celestial navy with crisp starlight blue',
      icon: Shield,
    },
    {
      id: 'royal-amethyst',
      label: 'Royal Amethyst',
      tag: 'Violet Luxury',
      dotClass: 'bg-purple-500',
      desc: 'Deep obsidian purple with electric violet',
      icon: Flame,
    },
  ];

  // Close palette on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (paletteRef.current && !paletteRef.current.contains(e.target as Node)) {
        setPaletteOpen(false);
      }
    };
    if (paletteOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [paletteOpen]);

  // Current active style object
  const activeDarkMeta = darkStyles.find((s) => s.id === darkStyle) || darkStyles[0];

  /* ========================================================================= */
  /* VARIANT 1: COMPACT - HEADER BUTTON TOGGLE                                 */
  /* ========================================================================= */
  if (variant === 'compact') {
    return (
      <div className={`relative inline-flex items-center gap-1.5 ${className}`} ref={paletteRef}>
        {/* Main 1-Click Theme Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer shadow-xs select-none ${
            isDark
              ? 'bg-[#141C2E] border-slate-700/80 text-slate-100 hover:bg-[#1A253E] hover:border-slate-600'
              : 'bg-[#F4F1EA] border-[#E2DDD3] text-[#2D3748] hover:bg-[#EBE7DD]'
          }`}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? (
            <div className="flex items-center gap-1.5 text-emerald-400">
              <Moon className="w-4 h-4 fill-emerald-400/20 text-emerald-400 transition-transform duration-200 -rotate-12" />
              <span className="text-xs font-bold text-slate-200">Dark</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-amber-600">
              <Sun className="w-4 h-4 text-amber-500 transition-transform duration-200 rotate-45" />
              <span className="text-xs font-bold text-[#2D3748]">Light</span>
            </div>
          )}
        </button>

        {/* Style Palette Button (Opens on click) */}
        {isDark && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setPaletteOpen(!paletteOpen)}
              className={`p-1.5 rounded-xl border text-xs transition-colors cursor-pointer flex items-center justify-center ${
                paletteOpen
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                  : 'bg-[#141C2E] border-slate-700/80 text-slate-400 hover:text-slate-100 hover:bg-[#1A253E]'
              }`}
              title="Change Dark Mode Theme Style"
              aria-label="Theme Palette Options"
            >
              <Palette className="w-3.5 h-3.5" />
            </button>

            {/* Dropdown Menu on Click */}
            {paletteOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 p-2.5 rounded-2xl bg-[#0F1624] border border-slate-700 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="flex items-center justify-between pb-2 mb-1.5 border-b border-slate-800 px-1">
                  <span className="text-xs font-bold text-slate-200">Dark Theme Palette</span>
                  <span className="text-[10px] text-slate-400">Click to choose</span>
                </div>

                <div className="space-y-1">
                  {darkStyles.map((item) => {
                    const isSelected = darkStyle === item.id;
                    const IconComp = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setDarkStyle(item.id);
                          setPaletteOpen(false);
                        }}
                        className={`w-full p-2 rounded-xl text-left transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                          isSelected
                            ? 'bg-[#141C2E] border border-emerald-500/50 text-white'
                            : 'hover:bg-slate-800/80 border border-transparent text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-white ${item.dotClass}`}
                          >
                            <IconComp className="w-3.5 h-3.5 text-white" />
                          </div>
                          <div className="truncate">
                            <p className="text-xs font-bold text-slate-100 truncate">{item.label}</p>
                            <p className="text-[10px] text-slate-400 truncate">{item.desc}</p>
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  /* ========================================================================= */
  /* VARIANT 2: FLOATING - 1-CLICK CIRCULAR BUTTON (CORNER)                   */
  /* ========================================================================= */
  if (variant === 'floating') {
    return (
      <div className={`fixed bottom-20 sm:bottom-6 right-3 sm:right-6 z-40 select-none ${className}`}>
        <button
          type="button"
          onClick={toggleTheme}
          className={`p-3 rounded-2xl shadow-xl border flex items-center justify-center transition-all active:scale-95 cursor-pointer ${
            isDark
              ? 'bg-[#0F1624] border-slate-700 text-emerald-400 hover:bg-[#141C2E]'
              : 'bg-white border-[#E2DDD3] text-amber-600 hover:bg-[#F9F7F2]'
          }`}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? (
            <Moon className="w-5 h-5 text-emerald-400 -rotate-12" />
          ) : (
            <Sun className="w-5 h-5 text-amber-500 rotate-45" />
          )}
        </button>
      </div>
    );
  }

  /* ========================================================================= */
  /* VARIANT 3: PILL - CLEAN BUTTON SWITCHER IN SIDEBAR                        */
  /* ========================================================================= */
  return (
    <div className={`flex flex-col items-start gap-2.5 select-none w-full ${className}`}>
      {/* Light / Dark Buttons */}
      <div
        className={`w-full flex items-center p-1 rounded-xl border transition-all ${
          isDark
            ? 'bg-[#090D14] border-slate-800'
            : 'bg-[#F5F2EB] border-[#E2DDD3]'
        }`}
      >
        {/* Light Button */}
        <button
          type="button"
          onClick={() => setTheme('light')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            !isDark
              ? 'bg-white text-amber-700 font-bold shadow-xs border border-[#EAE6DF]'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Activate Light Mode"
        >
          <Sun className={`w-3.5 h-3.5 ${!isDark ? 'text-amber-500' : 'text-slate-400'}`} />
          <span>Light</span>
          {!isDark && <Check className="w-3 h-3 text-amber-600 ml-0.5" />}
        </button>

        {/* Dark Button */}
        <button
          type="button"
          onClick={() => setTheme('dark')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            isDark
              ? 'bg-[#141C2E] text-emerald-400 font-bold shadow-xs border border-slate-700'
              : 'text-[#64748B] hover:text-[#2D3748]'
          }`}
          title="Activate Dark Mode"
        >
          <Moon className={`w-3.5 h-3.5 ${isDark ? 'text-emerald-400' : 'text-[#64748B]'}`} />
          <span>Dark</span>
          {isDark && <Check className="w-3 h-3 text-emerald-400 ml-0.5" />}
        </button>
      </div>

      {/* Style Swatches (Visible in Dark Mode) */}
      {isDark && (
        <div className="w-full pt-2 border-t border-slate-800">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold text-slate-400">Theme Style:</span>
            <span className="text-[9px] text-emerald-400 font-mono font-semibold">
              {activeDarkMeta.tag}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {darkStyles.map((item) => {
              const isSelected = darkStyle === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setDarkStyle(item.id)}
                  className={`flex items-center gap-2 p-1.5 rounded-lg border text-[10px] font-semibold transition-all cursor-pointer text-left truncate ${
                    isSelected
                      ? 'bg-[#141C2E] text-white border-emerald-500 font-bold shadow-xs'
                      : 'bg-[#0B101B] border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                  title={`Select ${item.label}`}
                >
                  <span className={`w-2 h-2 rounded-full ${item.dotClass} shrink-0`} />
                  <span className="truncate">{item.label.replace('Midnight ', '')}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
