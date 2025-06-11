import React, { createContext, useContext, useState, useEffect } from 'react';
import { colors } from '../constants/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_STORAGE_KEY = '@theme_preference';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light');
  const [isLoading, setIsLoading] = useState(true);

  // Load saved theme preference on mount
  useEffect(() => {
    let mounted = true;

    const loadTheme = async () => {
      try {
        // Check if AsyncStorage is available
        if (!AsyncStorage) {
          console.warn('AsyncStorage is not available');
          if (mounted) {
            setIsLoading(false);
          }
          return;
        }

        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (mounted && savedTheme) {
          setTheme(savedTheme);
        }
      } catch (error) {
        console.error('Error loading theme:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadTheme();

    return () => {
      mounted = false;
    };
  }, []);

  const getCurrentTheme = () => {
    return colors[theme] || colors.light;
  };

  const changeTheme = async (newTheme) => {
    try {
      if (AsyncStorage) {
        await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
      }
      setTheme(newTheme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      changeTheme, 
      getCurrentTheme,
      isLoading
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 