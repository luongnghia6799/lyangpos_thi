# Changelog - LyangPOS

## [2026-04-17]
### Added
- **Accounting Inventory Dashboard**: Completely redesigned the "Import Mode" into a high-performance reconciliation dashboard.
    - Added real-time Search, Multi-tab Filtering (Unmatched, Discrepancy), and Column Sorting.
    - Implemented Pagination (20/50/100) to handle large Excel datasets (10,000+ rows).
- **Manual Matching Modal**: Redesigned as a professional centered modal with blurred backdrop and scroll lock.
- **Improved Responsiveness**: Increased main container max-width to 1800px for wider desktop optimization.

### Fixed
- **Modal Positioning**: Resolved "fixed element" anchor issues caused by Framer Motion transforms by implementing **React Portals** (`createPortal`) for all top-level overlays.
- **Reference Errors**: Fixed `ArrowUpDown` and `ChevronDown` missing icon references in the sort-icon helper.


## [2026-04-09]
### Added
- **Unified Migration Manager**: Created `migrations_manager.py` to centralize all database schema updates.
    - Implemented `ensure_schema` to automatically detect missing columns and apply `ALTER TABLE` on startup.
    - Consolidated redundant migration blocks from `app.py` into a robust, inspect-based engine.
- **Improved Packaging Script**: Optimized `DONG_GOI_APP.bat`.
    - Added versioning (`APP_VERSION`).
    - Implemented deep cleaning for `__pycache__` and stale log files before building.
    - Explicitly excluded temp data to ensure clean production builds.

### Changed
- **Backend Refactor**: Cleaned up `app.py` by removing manual SQL migration blocks and integrating the new `MigrationManager`.

## [2026-03-29]
### Fixed
- **Inventory Audit UX**: Resolved critical input bugs in both `InventoryAudit.jsx` (Web) and `MobileInventory.jsx` (Mobile).
    - Implemented `onFocus={e => e.target.select()}` for all quantity inputs to enable quick overwriting.
    - Improved value handling (`value || ''`) to allow users to clear inputs completely instead of defaulting to `0`.
    - Repaired corrupted JSX syntax in both components caused by previous session interruptions.
- **Negative Stock Logic**: Fixed incorrect display of negative inventory for products with multipliers (e.g., -47 items showing as -1 box).
    - Switched from `Math.floor` to `Math.trunc` in all division-based splits (Thùng/Lẻ) across Web and Mobile UI.
    - Ensured consistent display in Audit History, Modals, and Search results.


## [2026-03-04]
### Fixed
- **Partner History Printing**: Resolved `ReferenceError: handlePrint is not defined` in `PartnerHistoryModal.jsx`. Integrated `useReactToPrint` for high-quality PDF/Paper output.
- **CSS Animation Issues**: Fixed "Invalid keyframe value" browser warnings for `filter: blur()`. 
    - Resolved cases where Framer Motion spring overshoot caused negative blur values (e.g., `-0.03px`).
    - Standardized `blur(0.01px)` target and non-spring transitions for filter properties in `POS.jsx`, `Layout.jsx`, `Dashboard.jsx`, and `Welcome.jsx`.


## [2026-02-25]
### Fixed
- **Backend Checkout Crash**: Resolved `sqlite3.IntegrityError` when saving "Custom Items" (F6). 
    - Implemented auto-migration logic in `app.py` to recreate `order_detail` table with a nullable `product_id`.
    - Added data preservation logic during migration to avoid loss of existing records.
- **Custom Item Modal UX**: 
    - Added phím `ESC` to close the modal instantly.
    - Disabled TAB focus for the F6 trigger button to prevent "Enter lộn" when navigating fields.
- **Profit Logic**: Fixed profit bubble visibility. It now correctly appears whenever catalog items are present, even if total profit is 0 or negative.

### Changed
- **Payment Toggle**: Redesigned the Cash/Debt toggle with glassmorphism + Framer Motion animations for a more "premium" feel.
- **Backend Startup**: Added a robust migration block in `app.py` that handles sequential database updates automatically.

---
## [Previously]
- Implemented Mobile-First UI with horizontal product cards.
- Navigation converged into Hamburger Drawer.
- Added LocalStorage persistence for Cart and Search state.
