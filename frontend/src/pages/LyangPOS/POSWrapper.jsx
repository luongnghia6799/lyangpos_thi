import React, { lazy, Suspense } from 'react';
import LoadingOverlay from '../../components/LoadingOverlay';
import { m, AnimatePresence } from 'framer-motion';

const POSnew = lazy(() => import('./POSnew'));

export default function POSWrapper() {
  return (
    <div className="w-full h-full overflow-hidden">
      <Suspense fallback={<LoadingOverlay isVisible={true} message="Đang chuẩn bị giao diện..." />}>
        <AnimatePresence mode="wait">
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full h-full"
          >
            <POSnew />
          </m.div>
        </AnimatePresence>
      </Suspense>
    </div>
  );
}
