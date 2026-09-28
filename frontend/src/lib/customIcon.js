import { forwardRef, useState, useEffect, createElement, useSyncExternalStore } from 'react';
import defaultAttributes from 'lucide-react/dist/esm/defaultAttributes.js';
import { mergeClasses, hasA11yProp, toPascalCase, toKebabCase } from 'lucide-react/dist/esm/shared/src/utils.js';
import dynamicIconImports from 'lucide-react/dist/esm/dynamicIconImports.js';

const STORAGE_KEY = 'app_custom_icons';
const CLIENT_ID = Math.random().toString(36).substring(2);

// O(1) in-memory synchronous storage cache
let lastRawJson = '';
let customIconsCache = {};
const listeners = new Set();
const iconNodeCache = new Map();

function getCachedIcons() {
    return customIconsCache;
}

export function preloadIconNode(iconName) {
    if (!iconName) return Promise.resolve(null);
    const pascal = toPascalCase(iconName);
    const kebab = toKebabCase(iconName);
    if (iconNodeCache.has(pascal)) return Promise.resolve(iconNodeCache.get(pascal));
    if (iconNodeCache.has(kebab)) return Promise.resolve(iconNodeCache.get(kebab));

    const loader = dynamicIconImports[kebab] || dynamicIconImports[iconName.toLowerCase()];
    if (loader) {
        return loader().then((mod) => {
            const node = mod.__iconNode || (mod.default && mod.default.__iconNode);
            if (node) {
                iconNodeCache.set(pascal, node);
                iconNodeCache.set(kebab, node);
                return node;
            }
            return null;
        }).catch(() => null);
    }
    return Promise.resolve(null);
}

function loadIconsFromStorage() {
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
                // Preload any custom icon replacements asynchronously
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

// Khởi tạo cache ngay khi load module
customIconsCache = loadIconsFromStorage();

function notifyListeners() {
    const prev = lastRawJson;
    loadIconsFromStorage();
    if (prev !== lastRawJson) {
        listeners.forEach((listener) => {
            try {
                listener();
            } catch (e) {}
        });
    }
}

if (typeof window !== 'undefined') {
    window.addEventListener('app_icon_changed', notifyListeners);
    window.addEventListener('storage', notifyListeners);
    try {
        const chan = new BroadcastChannel('pos_data_sync');
        chan.addEventListener('message', (e) => {
            if (e.data?.clientId === CLIENT_ID) return;
            if (e.data?.type === 'APP_ICON_UPDATED' || e.data?.type === 'APP_ICON_RESET') {
                notifyListeners();
            }
        });
    } catch (e) {}
}

function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

function getIconBaseName(className) {
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
 * Thay thế trực tiếp cho lucide-react/dist/esm/Icon.js
 * 1. Tiêu thụ 0% RAM dư thừa (không duyệt 1,600 module AST khi load).
 * 2. Hỗ trợ thay đổi icon tức thì & thay đổi strokeWidth (độ dày nét).
 * 3. Bắt sự kiện chuột phải (Right-Click) trên bất kỳ icon nào để mở bộ chọn icon.
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
        const customIcons = useSyncExternalStore(subscribe, getCachedIcons, () => ({}));
        const baseName = getIconBaseName(className);

        // Kiểm tra xem icon này có override hay không
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

        // Đang cần icon thay thế khác
        const isDifferentName = overrideName && overrideName !== baseName;
        const [dynamicNode, setDynamicNode] = useState(() => {
            if (!isDifferentName) return null;
            return iconNodeCache.get(overrideName) || iconNodeCache.get(toPascalCase(overrideName)) || null;
        });

        useEffect(() => {
            if (isDifferentName) {
                const cached = iconNodeCache.get(overrideName) || iconNodeCache.get(toPascalCase(overrideName));
                if (cached) {
                    setDynamicNode(cached);
                } else {
                    preloadIconNode(overrideName).then((node) => {
                        if (node) setDynamicNode(node);
                    });
                }
            } else {
                setDynamicNode(null);
            }
        }, [overrideName, isDifferentName]);

        const effectiveNode = (isDifferentName && dynamicNode) ? dynamicNode : iconNode;
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
                    overrideName ? `lucide-${toKebabCase(overrideName)}` : ''
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
