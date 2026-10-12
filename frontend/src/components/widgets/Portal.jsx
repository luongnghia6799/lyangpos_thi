import { useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';

const Portal = ({ children, zIndex = 999999 }) => {
    const [mountNode] = useState(() => {
        if (typeof document === 'undefined') return null;
        const div = document.createElement('div');
        div.className = 'no-print';
        div.style.position = 'relative';
        div.style.zIndex = String(zIndex);
        return div;
    });

    useLayoutEffect(() => {
        if (!mountNode) return;
        mountNode.style.zIndex = String(zIndex);
        document.body.appendChild(mountNode);
        return () => {
            if (document.body.contains(mountNode)) {
                document.body.removeChild(mountNode);
            }
        };
    }, [mountNode, zIndex]);

    if (!mountNode) return null;
    return createPortal(children, mountNode);
};

export default Portal;
