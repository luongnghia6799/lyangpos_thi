import React, { useState, useEffect, useCallback, useMemo } from 'react';
import StandbyScreensaver from './StandbyScreensaver';

/**
 * GlobalScreensaver
 * - Mounts at root level (in App.jsx) to work across ALL pages.
 * - Listens for F7 hotkey globally (with event.stopPropagation/preventDefault in capture phase).
 * - Listens for 'pos_open_screensaver', 'pos_close_screensaver', 'pos_toggle_screensaver' custom events.
 * - Handles optional auto idle timeout from localStorage.
 */
export default function GlobalScreensaver() {
    const [isOpen, setIsOpen] = useState(false);
    const [theme, setTheme] = useState(() => localStorage.getItem('pos_theme') || 'agri');
    const [isDark, setIsDark] = useState(() => {
        return document.documentElement.classList.contains('dark') || localStorage.getItem('theme') === 'dark';
    });
    const [shopName, setShopName] = useState(() => {
        try {
            const saved = localStorage.getItem('shop_info');
            if (saved) return JSON.parse(saved)?.shop_name || 'Lyang POS';
        } catch (e) {}
        return 'Lyang POS';
    });
    const [serverIp, setServerIp] = useState(() => localStorage.getItem('server_ip') || '');

    // Timeout duration in seconds (0 = disabled)
    const [timeoutSec, setTimeoutSec] = useState(() => {
        const saved = localStorage.getItem('pos_welcome_screensaver_timeout');
        return saved !== null ? parseInt(saved, 10) : 300; // default 5 minutes
    });

    // Listen for timeout change events from screensaver menu
    useEffect(() => {
        const handleTimeoutChange = (e) => {
            const sec = e.detail !== undefined ? e.detail : parseInt(localStorage.getItem('pos_welcome_screensaver_timeout') || '300', 10);
            setTimeoutSec(sec);
        };
        window.addEventListener('pos_screensaver_timeout_changed', handleTimeoutChange);
        return () => window.removeEventListener('pos_screensaver_timeout_changed', handleTimeoutChange);
    }, []);

    // Sync theme / shop info whenever screensaver is about to open
    const refreshState = useCallback(() => {
        const curTheme = localStorage.getItem('pos_theme') || 'agri';
        const curDark = document.documentElement.classList.contains('dark') || localStorage.getItem('theme') === 'dark';
        setTheme(curTheme);
        setIsDark(curDark);
        try {
            const saved = localStorage.getItem('shop_info');
            if (saved) setShopName(JSON.parse(saved)?.shop_name || 'Lyang POS');
        } catch (e) {}
        setServerIp(localStorage.getItem('server_ip') || '');
    }, []);

    const handleOpen = useCallback(() => {
        refreshState();
        setIsOpen(true);
    }, [refreshState]);

    const handleClose = useCallback(() => {
        setIsOpen(false);
    }, []);

    const handleToggle = useCallback(() => {
        refreshState();
        setIsOpen(prev => !prev);
    }, [refreshState]);

    // Global Shortcut F7 Handler (Capture phase to precede local handlers)
    useEffect(() => {
        const handleGlobalKeyDown = (e) => {
            if (e.key === 'F7' || e.keyCode === 118) {
                e.preventDefault();
                e.stopPropagation();
                handleToggle();
            }
        };

        window.addEventListener('keydown', handleGlobalKeyDown, true);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown, true);
    }, [handleToggle]);

    // Global CustomEvent Bus Listeners
    useEffect(() => {
        window.addEventListener('pos_open_screensaver', handleOpen);
        window.addEventListener('pos_close_screensaver', handleClose);
        window.addEventListener('pos_toggle_screensaver', handleToggle);

        return () => {
            window.removeEventListener('pos_open_screensaver', handleOpen);
            window.removeEventListener('pos_close_screensaver', handleClose);
            window.removeEventListener('pos_toggle_screensaver', handleToggle);
        };
    }, [handleOpen, handleClose, handleToggle]);

    // Auto idle timeout handler
    useEffect(() => {
        if (timeoutSec <= 0 || isOpen) return;

        let timer = null;
        const resetTimer = () => {
            if (timer) clearTimeout(timer);
            timer = setTimeout(() => {
                handleOpen();
            }, timeoutSec * 1000);
        };

        resetTimer();
        const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
        events.forEach(evt => window.addEventListener(evt, resetTimer, { passive: true }));

        return () => {
            if (timer) clearTimeout(timer);
            events.forEach(evt => window.removeEventListener(evt, resetTimer));
        };
    }, [timeoutSec, isOpen, handleOpen]);

    return (
        <StandbyScreensaver
            isOpen={isOpen}
            onClose={handleClose}
            theme={theme}
            isDark={isDark}
            shopName={shopName}
            serverIp={serverIp}
        />
    );
}
