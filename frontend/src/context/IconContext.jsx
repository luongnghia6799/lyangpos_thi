import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { getStoredCustomIcons, setStoredCustomIcon, resetStoredCustomIcons } from '../lib/iconConfig';

const IconContext = createContext({
    customIcons: {},
    editMode: false,
    setEditMode: () => {},
    toggleEditMode: () => {},
    updateIcon: () => {},
    resetIcons: () => {},
    activePickerTarget: null,
    openPicker: () => {},
    closePicker: () => {}
});

export const IconProvider = ({ children }) => {
    const [customIcons, setCustomIcons] = useState(() => getStoredCustomIcons());
    const [editMode, setEditMode] = useState(false);
    const [activePickerTarget, setActivePickerTarget] = useState(null); // { id, label, currentIconName }

    useEffect(() => {
        if (editMode) {
            document.body.classList.add('icon-edit-mode');
        } else {
            document.body.classList.remove('icon-edit-mode');
        }
        return () => {
            document.body.classList.remove('icon-edit-mode');
        };
    }, [editMode]);

    useEffect(() => {
        const handleSync = () => {
            setCustomIcons(getStoredCustomIcons());
        };
        const handleOpenExternal = (e) => {
            if (e.detail) {
                setActivePickerTarget(e.detail);
            }
        };

        window.addEventListener('app_icon_changed', handleSync);
        window.addEventListener('storage', handleSync);
        window.addEventListener('app_open_icon_picker', handleOpenExternal);

        // Shortcut Alt + I to toggle Icon Customization Mode quickly
        const handleKeyDown = (e) => {
            if (e.altKey && (e.key === 'i' || e.key === 'I')) {
                e.preventDefault();
                setEditMode(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('app_icon_changed', handleSync);
            window.removeEventListener('storage', handleSync);
            window.removeEventListener('app_open_icon_picker', handleOpenExternal);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    const updateIcon = useCallback((iconId, iconName) => {
        setStoredCustomIcon(iconId, iconName);
        setCustomIcons(getStoredCustomIcons());
    }, []);

    const resetIcons = useCallback(() => {
        resetStoredCustomIcons();
        setCustomIcons({});
    }, []);

    const toggleEditMode = useCallback(() => {
        setEditMode(prev => !prev);
    }, []);

    const openPicker = useCallback((target) => {
        // target: { id: string, label: string, currentIconName: string }
        setActivePickerTarget(target);
    }, []);

    const closePicker = useCallback(() => {
        setActivePickerTarget(null);
    }, []);

    const value = useMemo(() => ({
        customIcons,
        editMode,
        setEditMode,
        toggleEditMode,
        updateIcon,
        resetIcons,
        activePickerTarget,
        openPicker,
        closePicker
    }), [customIcons, editMode, updateIcon, resetIcons, activePickerTarget, openPicker, closePicker, toggleEditMode]);

    return (
        <IconContext.Provider value={value}>
            {children}
        </IconContext.Provider>
    );
};

export const useIconContext = () => useContext(IconContext);
