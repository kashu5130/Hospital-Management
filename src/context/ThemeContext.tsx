import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'light' | 'dark';
export type DarkStyle = 'obsidian' | 'cyber-teal' | 'midnight-navy' | 'royal-amethyst';

interface ThemeContextType {
  theme: ThemeMode;
  darkStyle: DarkStyle;
  isDark: boolean;
  setTheme: (theme: ThemeMode) => void;
  setDarkStyle: (style: DarkStyle) => void;
  toggleTheme: () => void;
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

  // Sync classes to DOM immediately on state change
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark-obsidian', 'dark-cyber-teal', 'dark-midnight-navy', 'dark-royal-amethyst');

    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.add(`dark-${darkStyle}`);
    } else {
      root.classList.remove('dark');
    }

    try {
      localStorage.setItem('vitaspectra_theme', theme);
      localStorage.setItem('vitaspectra_dark_style', darkStyle);
    } catch {}
  }, [theme, darkStyle]);

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
  };

  const setDarkStyle = (newStyle: DarkStyle) => {
    setDarkStyleState(newStyle);
    if (theme !== 'dark') {
      setThemeState('dark');
    }
  };

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const commitThemeChange = (targetTheme: ThemeMode, style?: DarkStyle) => {
    if (style) {
      setDarkStyleState(style);
    }
    setThemeState(targetTheme);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        darkStyle,
        isDark: theme === 'dark',
        setTheme,
        setDarkStyle,
        toggleTheme,
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
