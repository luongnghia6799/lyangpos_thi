import { forwardRef, createElement } from 'react';
import * as LucideModule from 'lucide-react';
import { getStoredCustomIcons, getLucideIconComponent } from '../lib/iconConfig';

// Lấy component Icon gốc của lucide-react
const OriginalIcon = LucideModule.icons ? LucideModule.Icon : null;

/**
 * Global Interceptor cho createLucideIcon
 * Mọi icon trong lucide-react (như Plus, Search, Trash2, Home,...) đều được tạo từ createLucideIcon.
 * Bằng việc wrap createElement, bất kỳ icon nào cũng tự động:
 * 1. Kiểm tra xem iconName gốc có bị ghi đè toàn cục không (Global Mapping)
 * 2. Khi bật Edit Mode (document.body.classList.contains('icon-edit-mode')), cho phép bấm trực tiếp vào SVG để đổi!
 */
export const patchCreateLucideIcon = (origCreateLucideIcon) => {
    return function interceptedCreateLucideIcon(iconName, iconNode) {
        const OrigComponent = origCreateLucideIcon(iconName, iconNode);

        const WrappedComponent = forwardRef((props, ref) => {
            const { className = '', onClick, ...restProps } = props;

            // Kiểm tra xem icon này có override không
            const customIcons = getStoredCustomIcons();
            const overriddenName = customIcons[`icon.${iconName}`] || customIcons[iconName];

            let FinalComponent = OrigComponent;
            if (overriddenName) {
                const Replacement = getLucideIconComponent(overriddenName);
                if (Replacement && Replacement !== WrappedComponent) {
                    FinalComponent = Replacement;
                }
            }

            const handleClick = (e) => {
                if (document.body.classList.contains('icon-edit-mode')) {
                    e.preventDefault();
                    e.stopPropagation();
                    window.dispatchEvent(new CustomEvent('app_open_icon_picker', {
                        detail: {
                            id: `icon.${iconName}`,
                            label: `Icon: ${iconName}`,
                            currentIconName: overriddenName || iconName
                        }
                    }));
                    return;
                }
                if (onClick) onClick(e);
            };

            return createElement(FinalComponent, {
                ref,
                className: `${className} ${document.body.classList.contains('icon-edit-mode') ? 'global-editable-icon' : ''}`.trim(),
                onClick: handleClick,
                'data-lucide-name': iconName,
                ...restProps
            });
        });

        WrappedComponent.displayName = OrigComponent.displayName || iconName;
        return WrappedComponent;
    };
};
