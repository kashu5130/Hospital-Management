import React, { createContext, useContext, useEffect, useState, useRef } from 'react';

export type ThemeMode = 'light' | 'dark';
export type DarkStyle = 'obsidian' | 'cyber-teal' | 'midnight-navy' | 'royal-amethyst';
export type HoverBehavior = 'magnetic-charge' | 'instant-glide';

interface ThemeContextType {
  theme: ThemeMode;
  darkStyle: DarkStyle;
  isDark: boolean;
  hoverBehavior: HoverBehavior;
  activePreviewTheme: ThemeMode | null;
  setTheme: (theme: ThemeMode) => void;
  setDarkStyle: (style: DarkStyle) => void;
  setHoverBehavior: (behavior: HoverBehavior) => void;
  toggleTheme: () => void;
  previewTheme: (targetTheme: ThemeMode, style?: DarkStyle) => void;
  cancelPreview: () => void;
  commitThemeChange: (targetTheme: ThemeMode, style?: DarkStyle) => void;
  hoverChangeTheme: (targetTheme: ThemeMode, style?: DarkStyle) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    try {
      const stored = localStorage.getItem('vitaspectra_theme');
      if (stored === 'dark' || stored === 'light') return stored;
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    } catch {}
    return 'light';
  });

  const [darkStyle, setDarkStyleState] = useState<DarkStyle>(() => {
    try {
      const stored = localStorage.getItem('vitaspectra_dark_style');
      if (stored === 'obsidian' || stored === 'cyber-teal' || stored === 'midnight-navy' || stored === 'royal-amethyst') {
        return stored;
      }
    } catch {}
    return 'obsidian';
  });

  const [hoverBehavior, setHoverBehaviorState] = useState<HoverBehavior>(() => {
    try {
      const stored = localStorage.getItem('vitaspectra_hover_behavior');
      if (stored === 'magnetic-charge' || stored === 'instant-glide') {
        return stored;
      }
    } catch {}
    return 'magnetic-charge';
  });

  const [previewState, setPreviewState] = useState<{
    theme: ThemeMode;
    style: DarkStyle;
  } | null>(null);

  // Sync classes to DOM
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark-obsidian', 'dark-cyber-teal', 'dark-midnight-navy', 'dark-royal-amethyst');

    const effectiveTheme = previewState ? previewState.theme : theme;
    const effectiveStyle = previewState ? previewState.style : darkStyle;

    if (effectiveTheme === 'dark') {
      root.classList.add('dark');
      root.classList.add(`dark-${effectiveStyle}`);
    } else {
      root.classList.remove('dark');
    }

    if (!previewState) {
      try {
        localStorage.setItem('vitaspectra_theme', theme);
        localStorage.setItem('vitaspectra_dark_style', darkStyle);
        localStorage.setItem('vitaspectra_hover_behavior', hoverBehavior);
      } catch {}
    }
  }, [theme, darkStyle, previewState, hoverBehavior]);

  const setTheme = (newTheme: ThemeMode) => {
    setPreviewState(null);
    setThemeState(newTheme);
  };

  const setDarkStyle = (newStyle: DarkStyle) => {
    setPreviewState(null);
    setDarkStyleState(newStyle);
    if (theme !== 'dark') {
      setThemeState('dark');
    }
  };

  const setHoverBehavior = (behavior: HoverBehavior) => {
    setHoverBehaviorState(behavior);
    try {
      localStorage.setItem('vitaspectra_hover_behavior', behavior);
    } catch {}
  };

  const toggleTheme = () => {
    setPreviewState(null);
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Temporarily preview theme on hover
  const previewTheme = (targetTheme: ThemeMode, style?: DarkStyle) => {
    setPreviewState({
      theme: targetTheme,
      style: style || darkStyle,
    });
  };

  // Revert preview on mouse leave if not locked
  const cancelPreview = () => {
    setPreviewState(null);
  };

  // Permanently commit changes (from click or hover charge lock-in)
  const commitThemeChange = (targetTheme: ThemeMode, style?: DarkStyle) => {
    setPreviewState(null);
    if (style && style !== darkStyle) {
      setDarkStyleState(style);
    }
    setThemeState(targetTheme);
  };

  const effectiveIsDark = previewState ? previewState.theme === 'dark' : theme === 'dark';

  return (
    <ThemeContext.Provider
      value={{
        theme,
        darkStyle,
        isDark: effectiveIsDark,
        hoverBehavior,
        activePreviewTheme: previewState ? previewState.theme : null,
        setTheme,
        setDarkStyle,
        setHoverBehavior,
        toggleTheme,
        previewTheme,
        cancelPreview,
        commitThemeChange,
        hoverChangeTheme: commitThemeChange,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

