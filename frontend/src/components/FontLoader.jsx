import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function FontLoader() {
    const [fonts, setFonts] = useState([]);

    const getResolvedUrl = (url) => {
        if (!url || url === 'undefined' || url === 'null') return '';
        const normalized = url.replace(/\\/g, '/').trim();
        if (normalized.startsWith('http') || normalized.startsWith('data:')) {
            return normalized;
        }
        const savedIp = localStorage.getItem('server_ip');
        const defaultPort = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV) ? '3580' : '3579';
        let base = `http://localhost:${defaultPort}`;
        if (savedIp && savedIp !== 'undefined' && savedIp !== 'null' && savedIp.trim() !== '') {
            base = `http://${savedIp.trim()}:${defaultPort}`;
        } else if (!window.__TAURI_INTERNALS__) {
            base = window.location.origin;
        }
        return `${base.replace(/\/+$/, '')}/${normalized.replace(/^\/+/, '')}`;
    };

    useEffect(() => {
        const fetchFonts = async () => {
            try {
                const res = await axios.get('/api/fonts');
                setFonts(res.data);
            } catch (err) {
                console.error("Error fetching fonts for loader", err);
            }
        };
        fetchFonts();
    }, []);

    useEffect(() => {
        if (fonts.length > 0) {
            const styleId = 'custom-fonts-style';
            let style = document.getElementById(styleId);
            if (!style) {
                style = document.createElement('style');
                style.id = styleId;
                document.head.appendChild(style);
            }

            style.innerHTML = fonts.map(font => {
                const fontName = font.split('.')[0];
                const format = font.toLowerCase().endsWith('.ttf') ? 'truetype' : 'opentype';
                const fontUrl = getResolvedUrl(`/uploads/fonts/${font}`);
                return `
                    @font-face {
                        font-family: '${fontName}';
                        src: url('${fontUrl}') format('${format}');
                        font-display: block;
                    }
                `;
            }).join('\n');

            // Force browser to load and cache all custom fonts into memory immediately
            if (typeof document !== 'undefined' && document.fonts && typeof FontFace !== 'undefined') {
                fonts.forEach(font => {
                    try {
                        const fontName = font.split('.')[0];
                        const fontUrl = getResolvedUrl(`/uploads/fonts/${font}`);
                        const f = new FontFace(fontName, `url('${fontUrl}')`, { display: 'block' });
                        f.load().then(loadedFace => {
                            document.fonts.add(loadedFace);
                        }).catch(e => {
                            console.warn(`Could not preload font ${fontName}:`, e);
                        });
                    } catch (e) {
                        // ignore font load errors
                    }
                });
            }
        }
    }, [fonts]);

    return null; // This component doesn't render anything
}
