import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const TetContext = createContext();

export const TetProvider = ({ children }) => {
    const [isTetMode, setIsTetMode] = useState(() => {
        return localStorage.getItem('ui_tet_mode') === 'true';
    });

    // Effect to apply/remove theme attribute to html element
    useEffect(() => {
        if (isTetMode) {
            document.documentElement.setAttribute('data-theme', 'tet');
            localStorage.setItem('ui_tet_mode', 'true');
        } else {
            // Restore previous theme from localStorage or default to 'agri'
            const savedTheme = localStorage.getItem('app_theme') || 'agri';
            document.documentElement.setAttribute('data-theme', savedTheme);
            localStorage.setItem('ui_tet_mode', 'false');
        }
    }, [isTetMode]);

    // Function to toggle and sync with backend if needed
    const toggleTetMode = async () => {
        const newMode = !isTetMode;
        setIsTetMode(newMode);

        try {
            // Sync with backend settings
            await axios.post('/api/settings', {
                ui_tet_mode: newMode ? 'true' : 'false'
            });
        } catch (error) {
            console.error('Failed to sync Tet mode to backend:', error);
        }
    };

    return (
        <TetContext.Provider value={{ isTetMode, setIsTetMode, toggleTetMode }}>
            {children}
        </TetContext.Provider>
    );
};

export const useTet = () => {
    const context = useContext(TetContext);
    if (!context) {
        throw new Error('useTet must be used within a TetProvider');
    }
    return context;
};
