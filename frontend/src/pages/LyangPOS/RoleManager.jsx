import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { AnimatePresence, motion as m } from 'framer-motion';
import CustomSelect from '../../components/forms/CustomSelect';
import { 
    Users, ShieldCheck, UserPlus, Trash2, Key, Save, 
    X, AlertCircle, CheckCircle2, Shield, UserCircle,
    Fingerprint, Lock, ShieldAlert, Wheat, Tractor,
    Camera, Upload, Sparkles, Image as ImageIcon, Check
} from 'lucide-react';
import { cn } from '../../lib/utils';
import Toast from '../../components/widgets/Toast';
import ConfirmModal from '../../components/modals/ConfirmModal';
import logo from '../../assets/logo.png';

export const USER_AVATAR_PRESETS = [
    { id: 'mascot', name: 'Nông Dân Lyang', url: '/assets/images/user_mascot.png' },
    { id: 'farmer_boy', name: 'Cậu Bé Nông Dân', url: '/assets/images/cute_farmer_boy.png' },
    { id: 'plant_doctor', name: 'Bác Sĩ Cây Trồng', url: '/assets/images/plant_doctor.png' },
    { id: 'logo', name: 'Logo LyangPOS', url: logo },
    { id: 'doraemon', name: 'Doraemon', url: '/doraemon.png' },
];

export const getUserAvatar = (user, index = 0) => {
    if (!user) return USER_AVATAR_PRESETS[0].url;
    if (user.avatar) return user.avatar;
    const custom = localStorage.getItem(`user_avatar_${user.username}`) || localStorage.getItem(`user_avatar_${user.id}`);
    if (custom) return custom;
    
    // Hash username for consistent avatar assignment
    const key = user.username || String(user.id || index);
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
        hash = (hash << 5) - hash + key.charCodeAt(i);
        hash |= 0;
    }
    const idx = Math.abs(hash) % USER_AVATAR_PRESETS.length;
    return USER_AVATAR_PRESETS[idx].url;
};

export default function RoleManager() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [savingId, setSavingId] = useState(null);
    const [toast, setToast] = useState(null);
    const [confirm, setConfirm] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingAvatarUser, setEditingAvatarUser] = useState(null);
    const [selectedAvatarUrl, setSelectedAvatarUrl] = useState('');
    const fileInputRef = useRef(null);
    const [newUser, setNewUser] = useState({
        username: '',
        password: '',
        display_name: '',
        role: 'user',
        avatar: USER_AVATAR_PRESETS[0].url
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
                                    {/* User Avatar with Edit Overlay */}
                                    <div 
                                        onClick={() => {
                                            setEditingAvatarUser(user);
                                            setSelectedAvatarUrl(getUserAvatar(user));
                                        }}
                                        className="relative group/avatar cursor-pointer shrink-0"
                                        title="Bấm để đổi Avatar cho nhân viên này"
                                    >
                                        <div className="w-14 h-14 rounded-2xl p-0.5 bg-gradient-to-tr from-emerald-500 via-teal-400 to-[#d4a574] shadow-md group-hover/avatar:scale-105 transition-all duration-300">
                                            <div className="w-full h-full rounded-[14px] bg-slate-900/10 dark:bg-slate-900 overflow-hidden flex items-center justify-center relative shadow-inner">
                                                <img 
                                                    src={getUserAvatar(user)} 
                                                    alt={user.display_name || user.username}
                                                    className="w-full h-full object-cover select-none filter drop-shadow-xs"
                                                    onError={(e) => { e.currentTarget.src = logo; }}
                                                />
                                                {/* Hover Camera Icon */}
                                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[8px] font-black gap-0.5">
                                                    <Camera size={15} />
                                                    <span>Đổi</span>
                                                </div>
                                            </div>
                                        </div>
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

                                <form onSubmit={handleAddUser} className="space-y-5">
                                    {/* Avatar Selection in Add Modal */}
                                    <div className="flex items-center gap-4 p-3 bg-black/5 dark:bg-white/5 rounded-2xl border border-border">
                                        <div 
                                            onClick={() => {
                                                setEditingAvatarUser(newUser);
                                                setSelectedAvatarUrl(newUser.avatar || USER_AVATAR_PRESETS[0].url);
                                            }}
                                            className="w-14 h-14 rounded-2xl p-0.5 bg-gradient-to-tr from-emerald-500 via-teal-400 to-[#d4a574] shadow-md cursor-pointer group/add-avatar shrink-0 relative"
                                            title="Bấm chọn Avatar"
                                        >
                                            <div className="w-full h-full rounded-[14px] bg-slate-900/10 dark:bg-slate-900 overflow-hidden flex items-center justify-center relative">
                                                <img 
                                                    src={newUser.avatar || USER_AVATAR_PRESETS[0].url} 
                                                    alt="New User Avatar"
                                                    className="w-full h-full object-cover select-none"
                                                    onError={(e) => { e.currentTarget.src = logo; }}
                                                />
                                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/add-avatar:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[8px] font-black gap-0.5">
                                                    <Camera size={14} />
                                                    <span>Đổi</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <span className="text-xs font-black text-slate-800 dark:text-slate-200 block">Avatar nhân viên</span>
                                            <span className="text-[10px] text-slate-400 block">Bấm vào ảnh để chọn nhân vật 3D hoặc tải ảnh riêng</span>
                                        </div>
                                    </div>

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

            {/* Avatar Customization Modal */}
            {editingAvatarUser && createPortal(
                <AnimatePresence>
                    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6 font-sans">
                        <m.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setEditingAvatarUser(null)}
                            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
                        />
                        <m.div
                            initial={{ opacity: 0, scale: 0.92, y: 25 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.92, y: 25 }}
                            className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 sm:p-8 shadow-2xl border border-border relative z-10 overflow-hidden space-y-6"
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md">
                                        <Sparkles size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg sm:text-xl font-black text-[#2d5016] dark:text-emerald-400 uppercase tracking-tight">
                                            Tùy Chỉnh Avatar Nhân Viên
                                        </h3>
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                            Tài khoản: @{editingAvatarUser.username || 'nhân_viên_mới'}
                                        </p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setEditingAvatarUser(null)} 
                                    className="p-2 hover:bg-black/5 dark:hover:bg-slate-800 rounded-xl transition-all text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Live Preview of Selected Avatar */}
                            <div className="flex flex-col items-center justify-center py-2">
                                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full p-1.5 bg-gradient-to-tr from-emerald-500 via-teal-400 to-[#d4a574] shadow-xl relative group">
                                    <div className="w-full h-full rounded-full bg-slate-900/10 dark:bg-slate-900 overflow-hidden flex items-center justify-center shadow-inner">
                                        <img 
                                            src={selectedAvatarUrl || getUserAvatar(editingAvatarUser)} 
                                            alt="Selected Avatar"
                                            className="w-full h-full object-cover select-none"
                                            onError={(e) => { e.currentTarget.src = logo; }}
                                        />
                                    </div>
                                </div>
                                <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 mt-2 uppercase tracking-wider">
                                    Xem trước hiển thị
                                </span>
                            </div>

                            {/* Preset Avatars Grid */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                    <span>Nhân vật 3D / Linh vật có sẵn</span>
                                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 lowercase font-medium">bấm để chọn</span>
                                </div>

                                <div className="grid grid-cols-5 gap-3">
                                    {USER_AVATAR_PRESETS.map((preset) => {
                                        const isChosen = selectedAvatarUrl === preset.url;
                                        return (
                                            <button
                                                key={preset.id}
                                                type="button"
                                                onClick={() => setSelectedAvatarUrl(preset.url)}
                                                className={cn(
                                                    "p-2 rounded-2xl border transition-all flex flex-col items-center gap-1.5 group cursor-pointer relative",
                                                    isChosen 
                                                        ? "bg-emerald-500/15 border-emerald-500 shadow-md shadow-emerald-500/20 scale-105" 
                                                        : "bg-black/5 dark:bg-white/5 border-border hover:border-emerald-500/50 hover:bg-black/10 dark:hover:bg-white/10"
                                                )}
                                            >
                                                <div className="w-12 h-12 rounded-xl overflow-hidden bg-white dark:bg-slate-800 flex items-center justify-center p-1 shadow-xs">
                                                    <img src={preset.url} alt={preset.name} className="w-full h-full object-contain select-none" />
                                                </div>
                                                <span className="text-[9px] font-black text-slate-700 dark:text-slate-300 truncate w-full text-center">
                                                    {preset.name}
                                                </span>
                                                {isChosen && (
                                                    <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                                                        <Check size={11} strokeWidth={3.5} />
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Upload Custom Avatar Button */}
                            <div className="pt-2 border-t border-border">
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    accept="image/*" 
                                    className="hidden" 
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        if (file.size > 3 * 1024 * 1024) {
                                            setToast({ message: 'Ảnh vượt quá 3MB, vui lòng chọn ảnh nhỏ hơn!', type: 'error' });
                                            return;
                                        }
                                        const reader = new FileReader();
                                        reader.onloadend = () => {
                                            setSelectedAvatarUrl(reader.result);
                                        };
                                        reader.readAsDataURL(file);
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full py-3 px-4 rounded-2xl border border-dashed border-emerald-600/40 hover:border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
                                >
                                    <Upload size={16} />
                                    <span>Tải lên ảnh từ máy tính (JPG, PNG, WebP)</span>
                                </button>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setEditingAvatarUser(null)}
                                    className="flex-1 py-3.5 rounded-2xl border border-border text-slate-600 dark:text-slate-300 font-black text-xs uppercase tracking-wider hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (!selectedAvatarUrl) return;
                                        if (editingAvatarUser.id) {
                                            localStorage.setItem(`user_avatar_${editingAvatarUser.username}`, selectedAvatarUrl);
                                            localStorage.setItem(`user_avatar_${editingAvatarUser.id}`, selectedAvatarUrl);
                                            setToast({ message: `Đã lưu avatar cho ${editingAvatarUser.display_name || editingAvatarUser.username}`, type: 'success' });
                                            setUsers(prev => [...prev]);
                                        } else {
                                            setNewUser(prev => ({ ...prev, avatar: selectedAvatarUrl }));
                                            setToast({ message: 'Đã chọn avatar cho nhân viên mới', type: 'success' });
                                        }
                                        window.dispatchEvent(new Event('user_avatar_updated'));
                                        window.dispatchEvent(new Event('storage'));
                                        setEditingAvatarUser(null);
                                    }}
                                    className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-[#2d5016] to-[#4a7c59] text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-[#2d5016]/20 hover:scale-[1.02] active:scale-98 transition-all cursor-pointer"
                                >
                                    Áp Dụng Avatar
                                </button>
                            </div>
                        </m.div>
                    </div>
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
