import { forwardRef, useState, useEffect, createElement, useSyncExternalStore } from 'react';
import defaultAttributes from 'lucide-react/dist/esm/defaultAttributes.js';
import { mergeClasses, hasA11yProp, toPascalCase, toKebabCase } from 'lucide-react/dist/esm/shared/src/utils.js';
import dynamicIconImports from 'lucide-react/dist/esm/dynamicIconImports.js';

const STORAGE_KEY = 'app_custom_icons';
const CLIENT_ID = Math.random().toString(36).substring(2);

// Build bidirectional name map for all 1,912 Lucide icons (O(1) resolution)
const nameToKebabMap = new Map();
if (dynamicIconImports) {
    Object.keys(dynamicIconImports).forEach((kebab) => {
        const pascal = kebab.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
        nameToKebabMap.set(pascal, kebab);
        nameToKebabMap.set(pascal.toLowerCase(), kebab);
        nameToKebabMap.set(kebab, kebab);
    });
}

export function getIconKebabKey(iconName) {
    if (!iconName) return '';
    let name = iconName;
    if (typeof name === 'object' && name !== null) {
        name = name.name || '';
    }
    if (typeof name !== 'string') return '';
    return nameToKebabMap.get(name) || nameToKebabMap.get(name.toLowerCase()) || toKebabCase(name);
}

// Global node cache and subscribers
export const iconNodeCache = new Map();
const nodeLoadedListeners = new Set();

function notifyNodeLoaded(iconName) {
    nodeLoadedListeners.forEach((listener) => {
        try {
            listener(iconName);
        } catch (e) {}
    });
}

export function preloadIconNode(iconName) {
    if (!iconName) return Promise.resolve(null);
    let name = iconName;
    if (typeof name === 'object' && name !== null) {
        name = name.name;
    }
    if (!name || typeof name !== 'string') return Promise.resolve(null);
    const kebab = getIconKebabKey(name);
    const pascal = toPascalCase(kebab);

    if (iconNodeCache.has(pascal)) return Promise.resolve(iconNodeCache.get(pascal));
    if (iconNodeCache.has(kebab)) return Promise.resolve(iconNodeCache.get(kebab));

    const loader = dynamicIconImports[kebab];
    if (loader) {
        return loader().then((mod) => {
            const node = mod.__iconNode || (mod.default && mod.default.__iconNode);
            if (node) {
                iconNodeCache.set(pascal, node);
                iconNodeCache.set(kebab, node);
                notifyNodeLoaded(pascal);
                notifyNodeLoaded(kebab);
                return node;
            }
            return null;
        }).catch((err) => {
            console.error('[customIcon] Error preloading icon:', iconName, err);
            return null;
        });
    }
    return Promise.resolve(null);
}

// O(1) in-memory storage cache
let lastRawJson = '';
let customIconsCache = {};
const storageListeners = new Set();

export function getCachedIcons() {
    return customIconsCache;
}

export function loadIconsFromStorage() {
    if (typeof window === 'undefined') return {};
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw === lastRawJson && customIconsCache) {
            return customIconsCache;
        }
        if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object') {
                lastRawJson = raw;
                customIconsCache = parsed;
                // Preload any custom icons immediately
                Object.values(parsed).forEach((val) => {
                    const name = typeof val === 'string' ? val : val?.name;
                    if (name) preloadIconNode(name);
                });
                return customIconsCache;
            }
        }
    } catch (e) {}
    lastRawJson = '';
    customIconsCache = {};
    return customIconsCache;
}

// Khởi tạo cache ngay khi JS module được nạp
customIconsCache = loadIconsFromStorage();

function notifyStorageListeners() {
    const prev = lastRawJson;
    loadIconsFromStorage();
    if (prev !== lastRawJson) {
        storageListeners.forEach((listener) => {
            try {
                listener();
            } catch (e) {}
        });
    }
}

if (typeof window !== 'undefined') {
    window.addEventListener('app_icon_changed', notifyStorageListeners);
    window.addEventListener('storage', notifyStorageListeners);
    try {
        const chan = new BroadcastChannel('pos_data_sync');
        chan.addEventListener('message', (e) => {
            if (e.data?.clientId === CLIENT_ID) return;
            if (e.data?.type === 'APP_ICON_UPDATED' || e.data?.type === 'APP_ICON_RESET') {
                notifyStorageListeners();
            }
        });
    } catch (e) {}
}

function subscribeStorage(listener) {
    storageListeners.add(listener);
    return () => storageListeners.delete(listener);
}

export function getIconBaseName(className) {
    if (!className || typeof className !== 'string') return '';
    const tokens = className.split(/\s+/);
    for (const t of tokens) {
        if (t.startsWith('lucide-') && t !== 'lucide-icon') {
            const raw = t.slice(7);
            if (/^[A-Z]/.test(raw)) return raw;
        }
    }
    for (const t of tokens) {
        if (t.startsWith('lucide-') && t !== 'lucide-icon') {
            const raw = t.slice(7);
            if (raw) return toPascalCase(raw);
        }
    }
    return '';
}

/**
 * Custom Icon Component
 * Drop-in replacement for lucide-react/dist/esm/Icon.js
 */
const Icon = forwardRef(
    ({
        color = "currentColor",
        size = 24,
        strokeWidth = 2,
        absoluteStrokeWidth,
        className = "",
        children,
        iconNode,
        onContextMenu,
        ...rest
    }, ref) => {
        const customIcons = useSyncExternalStore(subscribeStorage, getCachedIcons, () => ({}));
        const baseName = getIconBaseName(className);

        // Kiểm tra cấu hình override cho icon này
        const config = baseName
            ? (customIcons[`icon.${baseName}`] ||
               customIcons[baseName] ||
               customIcons[`icon.${toKebabCase(baseName)}`] ||
               customIcons[toKebabCase(baseName)])
            : null;

        let overrideName = null;
        let overrideStroke = null;

        if (typeof config === 'string') {
            overrideName = config;
        } else if (config && typeof config === 'object') {
            overrideName = config.name || null;
            if (typeof config.strokeWidth === 'number' || typeof config.strokeWidth === 'string') {
                const parsed = parseFloat(config.strokeWidth);
                if (!isNaN(parsed) && parsed > 0) {
                    overrideStroke = parsed;
                }
            }
        }

        const isDifferentName = Boolean(overrideName && overrideName !== baseName);

        // State quản lý dynamic node khi icon được đổi sang icon khác
        const [loadedNode, setLoadedNode] = useState(() => {
            if (!isDifferentName) return null;
            const kebab = getIconKebabKey(overrideName);
            const pascal = toPascalCase(kebab);
            return iconNodeCache.get(pascal) || iconNodeCache.get(kebab) || null;
        });

        useEffect(() => {
            if (!isDifferentName) {
                setLoadedNode(null);
                return;
            }

            const kebab = getIconKebabKey(overrideName);
            const pascal = toPascalCase(kebab);
            const cached = iconNodeCache.get(pascal) || iconNodeCache.get(kebab);
            if (cached) {
                setLoadedNode(cached);
                return;
            }

            let isMounted = true;
            preloadIconNode(overrideName).then((node) => {
                if (isMounted && node) {
                    setLoadedNode(node);
                }
            });

            const handleNodeLoaded = (loadedName) => {
                if (loadedName === pascal || loadedName === kebab) {
                    const node = iconNodeCache.get(pascal) || iconNodeCache.get(kebab);
                    if (isMounted && node) setLoadedNode(node);
                }
            };

            nodeLoadedListeners.add(handleNodeLoaded);
            return () => {
                isMounted = false;
                nodeLoadedListeners.delete(handleNodeLoaded);
            };
        }, [overrideName, isDifferentName]);

        const effectiveNode = (isDifferentName && loadedNode) ? loadedNode : iconNode;
        const effectiveStroke = overrideStroke !== null ? overrideStroke : strokeWidth;

        const handleContextMenu = (e) => {
            if (e.target && e.target.closest && e.target.closest('#icon-popout-picker')) {
                return;
            }
            e.preventDefault();
            e.stopPropagation();

            const rect = e.currentTarget ? e.currentTarget.getBoundingClientRect() : null;
            window.dispatchEvent(new CustomEvent('app_open_icon_picker', {
                detail: {
                    id: `icon.${baseName || 'Custom'}`,
                    label: `Icon: ${baseName || 'Tùy chỉnh'}`,
                    currentIconName: overrideName || baseName,
                    currentStrokeWidth: effectiveStroke || 2,
                    anchorRect: rect ? {
                        top: rect.top,
                        bottom: rect.bottom,
                        left: rect.left,
                        right: rect.right,
                        width: rect.width,
                        height: rect.height
                    } : {
                        top: e.clientY,
                        bottom: e.clientY,
                        left: e.clientX,
                        right: e.clientX,
                        width: 0,
                        height: 0
                    }
                }
            }));

            if (onContextMenu) onContextMenu(e);
        };

        return createElement(
            "svg",
            {
                ref,
                ...defaultAttributes,
                width: size,
                height: size,
                stroke: color,
                strokeWidth: absoluteStrokeWidth ? Number(effectiveStroke) * 24 / Number(size) : effectiveStroke,
                className: mergeClasses(
                    "lucide",
                    className,
                    overrideName ? `lucide-${getIconKebabKey(overrideName)}` : ''
                ),
                'data-lucide-name': baseName,
                onContextMenu: handleContextMenu,
                ...!children && !hasA11yProp(rest) && { "aria-hidden": "true" },
                ...rest
            },
            [
                ...(effectiveNode || []).map(([tag, attrs], idx) => createElement(tag, { ...attrs, key: attrs.key || idx })),
                ...(Array.isArray(children) ? children : [children])
            ]
        );
    }
);

Icon.displayName = 'LucideIcon';

export { Icon as default };
