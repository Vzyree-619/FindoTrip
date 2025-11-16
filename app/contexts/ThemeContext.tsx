import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'auto';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children, initialTheme = 'light' }: { children: React.ReactNode; initialTheme?: Theme }) {
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const [isClient, setIsClient] = useState(false);
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  // Only check localStorage on the client side to avoid hydration mismatch
  useEffect(() => {
    setIsClient(true);
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('chat-theme');
      if (stored === 'light' || stored === 'dark' || stored === 'auto') {
        setTheme(stored);
      }
    }
  }, []);

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
    // Use suppressHydrationWarning for the html element to avoid hydration mismatch
    // This is safe because theme changes happen in a separate effect after hydration
    const htmlElement = document.documentElement;
    htmlElement.setAttribute('data-theme', resolvedTheme);
    
    // Use a small delay to ensure hydration is complete before toggling the class
    const timeoutId = requestAnimationFrame(() => {
      htmlElement.classList.toggle('dark', resolvedTheme === 'dark');
    });
    
    return () => cancelAnimationFrame(timeoutId);
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
