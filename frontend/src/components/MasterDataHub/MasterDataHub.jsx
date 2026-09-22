import React, { useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { Layers, Boxes, FlaskConical, Sprout, Building2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import UnitCatalogTab from './UnitCatalogTab';
import ConversionCatalogTab from './ConversionCatalogTab';
import IngredientCatalogTab from './IngredientCatalogTab';
import CategoryCatalogTab from './CategoryCatalogTab';
import BrandCatalogTab from './BrandCatalogTab';

const CATALOG_TABS = [
    { id: 'units', label: 'Đơn Vị Tính', icon: Layers, description: 'Quản lý ĐVT, phân nhóm & thống kê sử dụng' },
    { id: 'conversions', label: 'Quy Đổi', icon: Boxes, description: 'Thiết lập quy cách đóng gói & tỷ lệ quy đổi' },
    { id: 'ingredients', label: 'Hoạt Chất', icon: FlaskConical, description: 'Thư viện hoạt chất nông nghiệp & công dụng' },
    { id: 'categories', label: 'Phân Loại', icon: Sprout, description: 'Danh mục nhóm hàng, ngành hàng & biểu tượng' },
    { id: 'brands', label: 'Hãng Sản Xuất', icon: Building2, description: 'Thương hiệu & đổi tên hãng đồng bộ' },
];

export default function MasterDataHub({ products = [], onUpdate, onToast, onOpenEditProduct }) {
    const [activeTab, setActiveTab] = useState('units');

    const currentTabMeta = CATALOG_TABS.find(t => t.id === activeTab);

    return (
        <div className="space-y-6">
            {/* SUB-TAB NAVIGATOR */}
            <div className="bg-stone-200/50 dark:bg-[#142018]/60 backdrop-blur-xl p-1.5 rounded-2xl flex flex-wrap items-center justify-between gap-2 shadow-xs">
                <div className="flex items-center gap-1 flex-wrap">
                    {CATALOG_TABS.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer relative",
                                    isActive
                                        ? "bg-gradient-to-r from-emerald-700 via-emerald-600 to-[#224213] text-white shadow-sm shadow-emerald-950/20"
                                        : "text-stone-600 dark:text-stone-300 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-stone-300/40 dark:hover:bg-white/5 font-bold"
                                )}
                            >
                                <Icon size={15} strokeWidth={isActive ? 2.5 : 2} />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>

                <div className="hidden lg:flex items-center text-xs text-stone-500 dark:text-stone-400 font-medium pr-3">
                    <span>{currentTabMeta?.description}</span>
                </div>
            </div>

            {/* TAB CONTENT WITH ANIMATION */}
            <div className="min-h-[400px] pt-1">
                <AnimatePresence mode="wait">
                    <m.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.18, ease: 'easeOut' }}
                    >
                        {activeTab === 'units' && (
                            <UnitCatalogTab
                                products={products}
                                onToast={onToast}
                                onOpenEditProduct={onOpenEditProduct}
                            />
                        )}
                        {activeTab === 'conversions' && (
                            <ConversionCatalogTab
                                products={products}
                                onUpdate={onUpdate}
                                onToast={onToast}
                                onOpenEditProduct={onOpenEditProduct}
                            />
                        )}
                        {activeTab === 'ingredients' && (
                            <IngredientCatalogTab
                                products={products}
                                onUpdate={onUpdate}
                                onToast={onToast}
                                onOpenEditProduct={onOpenEditProduct}
                            />
                        )}
                        {activeTab === 'categories' && (
                            <CategoryCatalogTab
                                products={products}
                                onToast={onToast}
                                onOpenEditProduct={onOpenEditProduct}
                            />
                        )}
                        {activeTab === 'brands' && (
                            <BrandCatalogTab
                                products={products}
                                onUpdate={onUpdate}
                                onToast={onToast}
                                onOpenEditProduct={onOpenEditProduct}
                            />
                        )}
                    </m.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
