import React, { createContext, useContext, useEffect, useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';

interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    // Initialize from localStorage or system preference
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  const [isLoading, setIsLoading] = useState(false);
  
  // Only use Convex hooks when user is authenticated
  const userSettings = useQuery(api.userSettings.getUserSettings);
  const updateUserSettings = useMutation(api.userSettings.updateUserSettings);

  // Initialize theme from user settings when available
  useEffect(() => {
    if (userSettings && userSettings.theme) {
      const savedTheme = userSettings.theme;
      setTheme(savedTheme as 'light' | 'dark');
    }
  }, [userSettings]);

  // Apply theme to document and save to localStorage
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    
    // Try to save to user settings if authenticated
    try {
      if (userSettings) {
        await updateUserSettings({ theme: newTheme });
      }
    } catch (error) {
      console.error('Failed to save theme preference:', error);
      // Don't revert theme since localStorage will persist it
    }
  };

  const value = {
    theme,
    toggleTheme,
    isLoading,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
