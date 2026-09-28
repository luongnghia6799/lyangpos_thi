import React from 'react';
import { useIconContext } from '../../context/IconContext';
import { getStoredCustomIcons } from '../../lib/iconConfig';
import IconPickerModal from '../modals/IconPickerModal';

export default function GlobalIconPickerContainer() {
    const {
        activePickerTarget,
        closePicker,
        updateIcon,
        resetIcons
    } = useIconContext();

    // Bắt sự kiện chuột phải trên BẤT KỲ icon SVG nào trên toàn bộ ứng dụng
    React.useEffect(() => {
        const handleGlobalContextMenu = (e) => {
            const svg = e.target && e.target.closest && (e.target.closest('svg.lucide') || e.target.closest('svg'));
            if (!svg) return;

            // Bỏ qua nếu đang click bên trong popup chọn icon
            if (svg.closest('#icon-popout-picker')) return;

            e.preventDefault();
            e.stopPropagation();

            let iconName = '';
            const nameAttr = svg.getAttribute('data-lucide-name') || (svg.closest('[data-lucide-name]') && svg.closest('[data-lucide-name]').getAttribute('data-lucide-name'));
            if (nameAttr) {
                iconName = nameAttr;
            } else {
                for (const cls of svg.classList) {
                    if (cls.startsWith('lucide-') && cls !== 'lucide-icon') {
                        const kebab = cls.replace('lucide-', '');
                        iconName = kebab.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
                        break;
                    }
                }
            }

            const savedCustoms = getStoredCustomIcons();
            const existingConfig = iconName ? (savedCustoms[`icon.${iconName}`] || savedCustoms[iconName]) : null;

            let currentActiveName = iconName;
            let currentStroke = 2;

            if (typeof existingConfig === 'string') {
                currentActiveName = existingConfig;
            } else if (existingConfig && typeof existingConfig === 'object') {
                currentActiveName = existingConfig.name || iconName;
                if (existingConfig.strokeWidth) {
                    currentStroke = parseFloat(existingConfig.strokeWidth) || 2;
                }
            }

            const parentButton = svg.closest('button') || svg.closest('a') || svg.closest('[role="button"]');
            const parentLabel = parentButton ? (parentButton.innerText || parentButton.getAttribute('title') || '').trim() : '';
            const displayLabel = parentLabel ? `${iconName || 'Icon'} (${parentLabel.slice(0, 25)})` : (iconName || 'Icon');

            const targetId = iconName ? `icon.${iconName}` : `dom.icon_${Date.now()}`;
            const rect = svg.getBoundingClientRect();

            window.dispatchEvent(new CustomEvent('app_open_icon_picker', {
                detail: {
                    id: targetId,
                    label: displayLabel,
                    currentIconName: currentActiveName,
                    currentStrokeWidth: currentStroke,
                    anchorRect: {
                        top: rect.top,
                        bottom: rect.bottom,
                        left: rect.left,
                        right: rect.right,
                        width: rect.width,
                        height: rect.height
                    }
                }
            }));
        };

        window.addEventListener('contextmenu', handleGlobalContextMenu, true);
        return () => {
            window.removeEventListener('contextmenu', handleGlobalContextMenu, true);
        };
    }, []);

    return (
        <IconPickerModal
            isOpen={!!activePickerTarget}
            onClose={closePicker}
            target={activePickerTarget}
            onSelectIcon={(id, data) => updateIcon(id, data)}
            onResetIcon={(id) => updateIcon(id, null)}
        />
    );
}
