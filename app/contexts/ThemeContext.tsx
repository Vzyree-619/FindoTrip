import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'auto';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children, initialTheme = 'light' }: { children: React.ReactNode; initialTheme?: Theme }) {
  // Check localStorage first, then use initialTheme as fallback
  const getInitialTheme = (): Theme => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('chat-theme');
      if (stored === 'light' || stored === 'dark' || stored === 'auto') {
        return stored;
      }
    }
    return initialTheme;
  };

  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  // Update theme when initialTheme changes (but respect localStorage if it was already set)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('chat-theme');
      if (!stored) {
        // Only set from initialTheme if nothing is in localStorage
        setTheme(initialTheme);
      }
    }
  }, [initialTheme]);

  // Register global theme update function
  useEffect(() => {
    globalThemeUpdate = setTheme;
    return () => {
      globalThemeUpdate = null;
    };
  }, []);

  // Save theme to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('chat-theme', theme);
    }
  }, [theme]);

  useEffect(() => {
    const updateResolvedTheme = () => {
      if (theme === 'auto') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        setResolvedTheme(systemTheme);
      } else {
        setResolvedTheme(theme);
      }
    };

    updateResolvedTheme();

    if (theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => updateResolvedTheme();
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  useEffect(() => {
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', resolvedTheme);
    document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');
  }, [resolvedTheme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    // Return default theme if not within ThemeProvider
    return {
      theme: 'light' as const,
      setTheme: () => {},
      resolvedTheme: 'light' as const
    };
  }
  return context;
}

// Global theme update function
let globalThemeUpdate: ((theme: Theme) => void) | null = null;

export function updateGlobalTheme(theme: Theme) {
  if (globalThemeUpdate) {
    globalThemeUpdate(theme);
  }
  if (typeof window !== 'undefined') {
    localStorage.setItem('chat-theme', theme);
  }
}

export default ThemeContext;
