import React from 'react';
import { useIconContext } from '../../context/IconContext';
import { getLucideIconComponent } from '../../lib/iconConfig';
import { cn } from '../../lib/utils';
import { Edit3 } from 'lucide-react';

/**
 * DynamicIcon Component
 * @param {string} id - Định danh duy nhất của icon trong hệ thống (VD: 'nav.dashboard', 'pos.create_order_btn')
 * @param {React.ComponentType} defaultIcon - Component icon mặc định (như Home, ShoppingCart, Plus, ...)
 * @param {string} label - Tên nhãn tiếng Việt hiển thị khi mở bộ chọn icon
 * @param {number} size - Kích thước icon
 * @param {string} className - Class CSS tùy biến
 * @param {boolean} allowEdit - Cho phép click đổi icon khi bật edit mode (mặc định true)
 */
export default function DynamicIcon({
    id,
    defaultIcon: DefaultIcon,
    label,
    size = 18,
    className = '',
    allowEdit = true,
    ...props
}) {
    const { customIcons, editMode, openPicker } = useIconContext();

    const customName = id ? customIcons[id] : null;
    const CustomIconComp = customName ? getLucideIconComponent(customName) : null;
    const ActiveIcon = CustomIconComp || DefaultIcon;

    if (!ActiveIcon) return null;

    if (editMode && allowEdit && id) {
        return (
            <span
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    openPicker({
                        id,
                        label: label || id,
                        currentIconName: customName || (DefaultIcon?.displayName || DefaultIcon?.name || '')
                    });
                }}
                className="relative inline-flex items-center justify-center group/dynicon cursor-pointer"
                title={`Bấm để đổi icon: ${label || id}`}
            >
                <ActiveIcon size={size} className={cn(className, "ring-2 ring-amber-400 ring-offset-1 rounded-sm animate-pulse")} {...props} />
                <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-amber-500 text-white rounded-full flex items-center justify-center shadow-xs z-30 pointer-events-none">
                    <Edit3 size={8} strokeWidth={3} />
                </span>
            </span>
        );
    }

    return <ActiveIcon size={size} className={className} {...props} />;
}
