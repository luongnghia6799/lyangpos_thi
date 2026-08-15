import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { AnimatePresence, motion as m } from 'framer-motion';
import CustomSelect from '../../components/CustomSelect';
import { 
    Users, ShieldCheck, UserPlus, Trash2, Key, Save, 
    X, AlertCircle, CheckCircle2, Shield, UserCircle,
    Fingerprint, Lock, ShieldAlert, Wheat, Tractor
} from 'lucide-react';
import { cn } from '../../lib/utils';
import Toast from '../../components/Toast';
import ConfirmModal from '../../components/ConfirmModal';

export default function RoleManager() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [savingId, setSavingId] = useState(null);
    const [toast, setToast] = useState(null);
    const [confirm, setConfirm] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newUser, setNewUser] = useState({
        username: '',
        password: '',
        display_name: '',
        role: 'user'
    });

    const roles = [
        { value: 'admin', label: 'Quản trị viên (Admin)', icon: ShieldCheck, color: 'text-rose-500', desc: 'Toàn quyền truy cập hệ thống' },
        { value: 'accountant', label: 'Kế toán (Accountant)', icon: Shield, color: 'text-amber-500', desc: 'Chỉ xem POS, Nhập hàng, Lịch sử' },
        { value: 'user', label: 'Nhân viên (User)', icon: Fingerprint, color: 'text-indigo-500', desc: 'Quyền hạn cơ bản' },
    ];

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/users');
            setUsers(res.data);
        } catch (err) {
            setToast({ message: 'Lỗi khi tải danh sách nhân viên', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateUser = async (user) => {
        setSavingId(user.id);
        try {
            await axios.patch(`/api/users/${user.id}`, {
                role: user.role,
                display_name: user.display_name
            });
            setToast({ message: `Đã cập nhật quyền cho ${user.username}`, type: 'success' });
            fetchUsers();
        } catch (err) {
            setToast({ message: 'Lỗi khi cập nhật thông tin', type: 'error' });
        } finally {
            setSavingId(null);
        }
    };

    const handleDeleteUser = (userId, username) => {
        setConfirm({
            title: "Xóa nhân viên",
            message: `Bạn có chắc chắn muốn xóa tài khoản "${username}"? Hành động này không thể hoàn tác.`,
            type: "danger",
            onConfirm: async () => {
                try {
                    await axios.delete(`/api/users/${userId}`);
                    setToast({ message: 'Đã xóa nhân viên thành công', type: 'success' });
                    fetchUsers();
                } catch (err) {
                    setToast({ message: 'Lỗi khi xóa nhân viên', type: 'error' });
                } finally {
                    setConfirm(null);
                }
            }
        });
    };

    const handleAddUser = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/register', newUser);
            setToast({ message: 'Thêm nhân viên mới thành công!', type: 'success' });
            setShowAddModal(false);
            setNewUser({ username: '', password: '', display_name: '', role: 'user' });
            fetchUsers();
        } catch (err) {
            setToast({ message: err.response?.data?.error || 'Lỗi khi thêm nhân viên', type: 'error' });
        }
    };

    return (
        <div className="p-4 pb-32 w-full transition-colors relative font-sans">
            <div className="flex-1 flex flex-col">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 p-20 opacity-[0.01] dark:opacity-[0.02] pointer-events-none -mr-20 -mt-20">
                <Shield size={400} className="text-[#4a7c59]" />
            </div>

            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 relative z-10">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-[#2d5016] dark:text-[#4a7c59] uppercase tracking-tight flex items-center gap-3 py-1">
                        <ShieldCheck className="text-[#2d5016] dark:text-[#4a7c59]" size={32} />
                        PHÂN QUYỀN NHÂN SỰ
                    </h1>
                        <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-black uppercase rounded-lg tracking-tighter">LyangPOS by Lyang</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                            <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500">Quản lý tài khoản & Quyền truy cập</p>
                        </div>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 bg-gradient-to-r from-[#2d5016] to-[#4a7c59] text-white px-5 py-2.5 rounded-xl font-black shadow-none active:scale-95 transition-all uppercase text-xs tracking-wider"
                >
                    <UserPlus size={16} />
                    THÊM NHÂN VIÊN
                </button>
            </div>

            {/* Content Area */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-40 gap-6 opacity-40">
                    <Tractor size={80} className="animate-bounce text-[#4a7c59]" />
                    <p className="font-black text-[#2d5016] uppercase tracking-[0.5em] text-xs">Đang nạp dữ liệu nhân sự...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 relative z-10">
                    {users.map((user) => (
                        <m.div
                            key={user.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-transparent border border-border p-5 rounded-2xl relative group hover:border-[#4a7c59]/40 transition-all shadow-none z-10 hover:z-20"
                        >
                            <div className="flex items-start justify-between gap-6 mb-6 relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-primary/5 border border-border flex items-center justify-center text-[#2d5016] dark:text-emerald-400 group-hover:scale-105 transition-transform duration-300 overflow-hidden">
                                        <UserCircle size={32} strokeWidth={1.5} />
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-black text-[#8b6f47] uppercase tracking-[0.3em] mb-0.5">ID: #{user.id}</div>
                                        <input
                                            type="text"
                                            value={user.display_name || ''}
                                            onChange={(e) => {
                                                const newUsers = users.map(u => u.id === user.id ? { ...u, display_name: e.target.value } : u);
                                                setUsers(newUsers);
                                            }}
                                            className="text-lg font-black text-gray-800 dark:text-emerald-50 bg-transparent border-b border-transparent focus:border-[#4a7c59] outline-none transition-all px-1 max-w-[200px]"
                                            placeholder="Tên nhân viên..."
                                        />
                                        <p className="text-xs font-bold text-gray-400 lowercase mt-0.5 italic flex items-center gap-2">
                                            @{user.username}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDeleteUser(user.id, user.username)}
                                    className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/10 rounded-xl transition-all active:scale-95"
                                    title="Xóa tài khoản"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-[#8b6f47] dark:text-[#d4a574]/60 uppercase tracking-[0.3em] ml-2">Cấp bậc (Role)</label>
                                    <div className="relative group/select">
                                        <CustomSelect
                                            className="w-full border border-border rounded-xl"
                                            value={user.role || 'user'}
                                            onChange={(e) => {
                                                const newUsers = users.map(u => u.id === user.id ? { ...u, role: e.target.value } : u);
                                                setUsers(newUsers);
                                            }}
                                            options={roles.map(r => ({ value: r.value, label: r.label }))}
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col justify-end">
                                    <button
                                        onClick={() => handleUpdateUser(user)}
                                        disabled={savingId === user.id}
                                        className="flex items-center justify-center gap-2 w-full p-3.5 bg-gradient-to-r from-[#2d5016] to-[#4a7c59] text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-none active:scale-95 transition-all duration-300 disabled:opacity-50 hover:scale-[1.02] hover:brightness-110"
                                    >
                                        {savingId === user.id ? <RefreshCcw size={14} className="animate-spin" /> : <Save size={14} />}
                                        LƯU CẤU HÌNH
                                    </button>
                                </div>
                            </div>
                            
                            {/* Role Badge Background */}
                            <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none z-0">
                                <div className="absolute -bottom-6 -right-6 opacity-[0.01] dark:opacity-[0.02] group-hover:opacity-[0.04] transition-opacity transform rotate-12">
                                    <Shield size={180} />
                                </div>
                            </div>
                        </m.div>
                    ))}
                </div>
            )}

            {/* Add User Modal */}
            {createPortal(
                <AnimatePresence>
                    {showAddModal && (
                        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 sm:p-10">
                            <m.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setShowAddModal(false)}
                                className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
                            />
                            <m.div
                                initial={{ opacity: 0, scale: 0.9, y: 40 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 40 }}
                                className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-2xl border border-border relative z-10 overflow-hidden"
                            >
                                <div className="flex items-start justify-between mb-8">
                                    <div>
                                        <h2 className="text-2xl font-black text-[#2d5016] dark:text-[#4a7c59] uppercase tracking-tight">Cấp tài khoản mới</h2>
                                        <p className="text-[10px] font-black text-[#8b6f47] uppercase tracking-[0.3em] mt-1">Bắt đầu đồng bộ hóa nhân sự</p>
                                    </div>
                                    <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-transparent dark:hover:bg-slate-800 rounded-xl transition-all">
                                        <X size={20} className="text-gray-400" />
                                    </button>
                                </div>

                                <form onSubmit={handleAddUser} className="space-y-6">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">ID Đăng nhập (Username)</label>
                                            <div className="relative">
                                                <input
                                                    required
                                                    type="text"
                                                    value={newUser.username}
                                                    onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                                                    className="w-full p-3 bg-transparent border border-border rounded-xl font-black text-xs text-gray-800 dark:text-emerald-50 focus:border-[#4a7c59] outline-none transition-all pl-10"
                                                    placeholder="VD: nv_ketoan01"
                                                />
                                                <UserPlus size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Mật khẩu khởi tạo</label>
                                            <div className="relative">
                                                <input
                                                    required
                                                    type="password"
                                                    value={newUser.password}
                                                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                                                    className="w-full p-3 bg-transparent border border-border rounded-xl font-black text-xs text-gray-800 dark:text-emerald-50 focus:border-[#4a7c59] outline-none transition-all pl-10"
                                                    placeholder="••••••••"
                                                />
                                                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Tên hiển thị</label>
                                            <input
                                                type="text"
                                                value={newUser.display_name}
                                                onChange={(e) => setNewUser({...newUser, display_name: e.target.value})}
                                                className="w-full p-3 bg-transparent border border-border rounded-xl font-black text-xs text-gray-800 dark:text-emerald-50 focus:border-[#4a7c59] outline-none transition-all"
                                                placeholder="VD: Nguyễn Văn A"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Chọn Quyền hạn</label>
                                            <div className="grid grid-cols-3 gap-3">
                                                {roles.map(r => (
                                                    <button
                                                        key={r.value}
                                                        type="button"
                                                        onClick={() => setNewUser({...newUser, role: r.value})}
                                                        className={cn(
                                                            "p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all group",
                                                            newUser.role === r.value 
                                                                ? "bg-emerald-500/10 border-emerald-500 text-emerald-600" 
                                                                : "bg-transparent border-border text-slate-400 hover:border-slate-300"
                                                        )}
                                                    >
                                                        <r.icon size={16} />
                                                        <span className="text-[9px] font-black uppercase text-center leading-tight">{r.value}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full p-3.5 bg-gradient-to-r from-[#2d5016] to-[#4a7c59] text-white rounded-xl font-black uppercase tracking-wider text-xs shadow-none active:scale-95 transition-all mt-4"
                                    >
                                        XÁC NHẬN CẤP TÀI KHOẢN
                                    </button>
                                </form>
                            </m.div>
                        </div>
                    )}
                </AnimatePresence>,
                document.body
            )}

            {/* Modals & Toasts */}
            <AnimatePresence>
                {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            </AnimatePresence>
            {confirm && (
                <ConfirmModal
                    isOpen={!!confirm}
                    title={confirm.title}
                    message={confirm.message}
                    onConfirm={confirm.onConfirm}
                    onCancel={() => setConfirm(null)}
                    type={confirm.type}
                />
            )}
            </div>
        </div>
    );
}

function ShieldLock({ size, className }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
            <rect width="10" height="6" x="7" y="11" rx="2" />
            <path d="M10 11v-2a2 2 0 1 1 4 0v2" />
        </svg>
    );
}

function RefreshCcw({ size, className }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
            <path d="M16 16h5v5" />
        </svg>
    );
}
