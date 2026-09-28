import { getStoredCustomIcons, getLucideIconComponent } from './iconConfig';

/**
 * Global SVG Icon Replacer Engine:
 * Cho phép thay thế biểu tượng của BẤT KỲ icon SVG Lucide nào trong toàn bộ DOM,
 * ngay cả khi component đó không được bọc DynamicIcon!
 */
export const applyGlobalDomIconOverrides = () => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    const customIcons = getStoredCustomIcons();
    if (!customIcons || Object.keys(customIcons).length === 0) return;

    // Quét toàn bộ svg.lucide trong document
    const svgs = document.querySelectorAll('svg.lucide, svg[class*="lucide-"]');

    svgs.forEach((svg) => {
        // Tìm tên icon từ class lucide-xxx
        let originalName = '';
        for (const cls of svg.classList) {
            if (cls.startsWith('lucide-') && cls !== 'lucide-icon') {
                const kebab = cls.replace('lucide-', '');
                originalName = kebab.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
                break;
            }
        }

        if (!originalName) return;

        // Kiểm tra xem icon này có override không
        const replacementName = customIcons[`icon.${originalName}`] || customIcons[originalName];
        if (!replacementName || replacementName === originalName) return;

        const ReplacementComp = getLucideIconComponent(replacementName);
        if (!ReplacementComp) return;

        // Nếu icon đã được thay thế bằng replacementName này rồi thì bỏ qua
        if (svg.getAttribute('data-overridden-icon') === replacementName) return;

        // Lấy các thuộc tính của svg hiện tại
        const size = svg.getAttribute('width') || svg.getAttribute('height') || '20';
        const strokeWidth = svg.getAttribute('stroke-width') || '2';
        const color = svg.getAttribute('stroke') || 'currentColor';
        const className = svg.getAttribute('class') || '';

        try {
            // Render icon thay thế tạm thời bằng React hoặc tạo phần tử SVG tương ứng
            // Tạo SVG container ảo để lấy innerHTML từ component Lucide
            const dummy = document.createElement('div');
            import('react').then(({ createElement }) => {
                import('react-dom/client').then(({ createRoot }) => {
                    const root = createRoot(dummy);
                    root.render(
                        createElement(ReplacementComp, {
                            size: parseInt(size, 10) || 20,
                            strokeWidth: parseFloat(strokeWidth) || 2,
                            color,
                            className
                        })
                    );

                    setTimeout(() => {
                        const newSvg = dummy.querySelector('svg');
                        if (newSvg && svg.parentNode) {
                            newSvg.setAttribute('data-overridden-icon', replacementName);
                            newSvg.setAttribute('data-original-icon', originalName);
                            // Giữ lại các style hoặc dataset
                            svg.parentNode.replaceChild(newSvg, svg);
                        }
                    }, 10);
                });
            });
        } catch (e) {
            console.error('Error overriding DOM icon:', e);
        }
    });
};

/**
 * MutationObserver tự động áp dụng override cho mọi icon mới xuất hiện (Modal, Popover, Route mới...)
 */
export const initGlobalIconObserver = () => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    let debounceTimer = null;
    const observer = new MutationObserver(() => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            applyGlobalDomIconOverrides();
        }, 100);
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    window.addEventListener('app_icon_changed', () => {
        applyGlobalDomIconOverrides();
    });

    // Chạy lần đầu
    applyGlobalDomIconOverrides();
};
