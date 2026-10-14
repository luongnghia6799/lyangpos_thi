import { m } from 'framer-motion';
import PageDecorationsOverlay from '../widgets/PageDecorationsOverlay';

const PageWrapper = ({ children }) => {
    return (
        <m.div
            initial={{ opacity: 0, y: 10, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.985 }}
            transition={{
                duration: 0.35,
                ease: [0.16, 1, 0.3, 1] // Custom easeOutExpo
            }}
            className="w-full h-full flex flex-col relative"
            style={{ willChange: 'opacity, transform' }}
        >
            {/* Liquid highlight effect on transition */}
            <m.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 0.8 }}
                className="absolute inset-0 bg-primary/5 pointer-events-none z-[99]"
            />
            {/* Content Layer (z-10 ensures tables, bubbles, text sit ABOVE background decorations at z-1) */}
            <div className="relative z-10 w-full h-full flex-1 flex flex-col min-h-0 pointer-events-auto [body.decorations-editing-active_&]:pointer-events-none">
                {children}
            </div>
            <div className="no-print print:hidden">
                <PageDecorationsOverlay />
            </div>
        </m.div>
    );
};

export default PageWrapper;
