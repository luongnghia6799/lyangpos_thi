import { forwardRef, createElement, useSyncExternalStore } from 'react';
import Icon from 'lucide-react/dist/esm/Icon.js';
import { mergeClasses, toKebabCase, toPascalCase } from 'lucide-react/dist/esm/shared/src/utils.js';

const STORAGE_KEY = 'app_custom_icons';
const CLIENT_ID = Math.random().toString(36).substring(2);

// In-memory cache truy xuất tức thì O(1) đồng bộ 0ms ngay frame đầu tiên
let lastRawJson = '';
let customIconsCache = {};
const listeners = new Set();
const renderingStack = new Set();

function getCachedIcons() {
    return customIconsCache;
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
                return customIconsCache;
            }
        }
    } catch (e) {}
    lastRawJson = '';
    customIconsCache = {};
    return customIconsCache;
}

// Khởi tạo cache ngay khi JS module được load
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
            if (e.data?.clientId === CLIENT_ID) return; // Bỏ qua message từ chính tab này
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

function resolveReplacementComponent(iconName) {
    if (!iconName) return null;
    if (typeof window !== 'undefined' && window.__LUCIDE_ICONS__) {
        return window.__LUCIDE_ICONS__[iconName] || window.__LUCIDE_ICONS__[toPascalCase(iconName)] || null;
    }
    return null;
}

/**
 * Custom createLucideIcon Factory
 * Chặn mọi icon trong lucide-react để:
 * 1. Render NGAY LẬP TỨC icon tùy biến từ frame đầu tiên (không delay, không flash icon cũ).
 * 2. Tiết kiệm RAM tối đa (Zero Memory Leak, Fast Memo Cache).
 * 3. Chuột phải (Right-click) vào bất kỳ icon nào để mở bộ chọn icon mà không cần phím tắt!
 */
const createLucideIcon = (iconName, iconNode) => {
    const defaultPascal = toPascalCase(iconName);
    const defaultKebab = toKebabCase(defaultPascal);

    const Component = forwardRef(({ className = '', onContextMenu, ...props }, ref) => {
        const customIcons = useSyncExternalStore(subscribe, getCachedIcons, () => ({}));

        // Kiểm tra xem icon có bị override không (cả tên và strokeWidth)
        const config =
            customIcons[`icon.${defaultPascal}`] ||
            customIcons[defaultPascal] ||
            customIcons[`icon.${iconName}`] ||
            customIcons[iconName];

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

        const handleContextMenu = (e) => {
            if (e.target && e.target.closest && e.target.closest('#icon-popout-picker')) {
                return;
            }
            e.preventDefault();
            e.stopPropagation();

            const rect = e.currentTarget ? e.currentTarget.getBoundingClientRect() : null;
            window.dispatchEvent(new CustomEvent('app_open_icon_picker', {
                detail: {
                    id: `icon.${defaultPascal}`,
                    label: `Icon: ${defaultPascal}`,
                    currentIconName: overrideName || defaultPascal,
                    currentStrokeWidth: overrideStroke || props.strokeWidth || 2,
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

        // Nếu có override icon hợp lệ và khác với chính tên mặc định
        if (overrideName && overrideName !== defaultPascal) {
            if (!renderingStack.has(defaultPascal)) {
                renderingStack.add(defaultPascal);
                try {
                    const ReplacementComp = resolveReplacementComponent(overrideName);
                    if (ReplacementComp) {
                        return createElement(ReplacementComp, {
                            ref,
                            className: mergeClasses(
                                `lucide-${defaultKebab}`,
                                `lucide-${iconName}`,
                                `lucide-${toKebabCase(overrideName)}`,
                                className
                            ),
                            'data-lucide-name': defaultPascal,
                            'data-custom-icon': overrideName,
                            onContextMenu: handleContextMenu,
                            ...props,
                            ...(overrideStroke ? { strokeWidth: overrideStroke } : {})
                        });
                    }
                } finally {
                    renderingStack.delete(defaultPascal);
                }
            }
        }

        // Render icon mặc định gốc
        return createElement(Icon, {
            ref,
            iconNode,
            className: mergeClasses(
                `lucide-${defaultKebab}`,
                `lucide-${iconName}`,
                className
            ),
            'data-lucide-name': defaultPascal,
            onContextMenu: handleContextMenu,
            ...props,
            ...(overrideStroke ? { strokeWidth: overrideStroke } : {})
        });
    });

    Component.displayName = defaultPascal;
    return Component;
};

export { createLucideIcon as default };
