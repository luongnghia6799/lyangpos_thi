import React, { useState, useEffect } from 'react';
import {
    Settings as SettingsIcon,
    FileSpreadsheet,
    Upload,
    Save,
    Plus,
    Trash2,
    Info,
    CheckCircle2,
    AlertCircle,
    ArrowRightLeft,
    Type,
    Binary,
    XCircle
} from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { cn } from '../../lib/utils';

export default function ExcelMapping() {
    const [template, setTemplate] = useState(null);
    const [mappings, setMappings] = useState({});
    const [startRow, setStartRow] = useState(1);
    const [sourceFields, setSourceFields] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const [fieldsRes, configRes] = await Promise.all([
                axios.get('/api/accounting/source-fields'),
                axios.get('/api/accounting/config').catch(e => ({ data: null }))
            ]);

            setSourceFields(fieldsRes.data);
            if (configRes.data) {
                setTemplate(configRes.data);
                setStartRow(configRes.data.start_row || 1);

                const mappingObj = {};
                (configRes.data.mappings || []).forEach(m => {
                    mappingObj[m.column_letter] = {
                        header_name: m.header_name,
                        source_type: m.source_type,
                        source_value: m.source_value
                    };
                });
                setMappings(mappingObj);
            }
        } catch (error) {
            console.error("Error fetching mapping data:", error);
        } finally {
            setLoading(false);
        }
    };

    // Helper to sort Excel columns (A, B... Z, AA, AB)
    const excelColumnToNumber = (col) => {
        if (!col) return 0;
        let num = 0;
        for (let i = 0; i < col.length; i++) {
            num = num * 26 + (col.charCodeAt(i) - 64);
        }
        return num;
    };

    const sortedMappingEntries = Object.entries(mappings).sort((a, b) =>
        excelColumnToNumber(a[0]) - excelColumnToNumber(b[0])
    );

    useEffect(() => {
        if (template) {
            setStartRow(template.start_row || 1);
            const mappingObj = {};
            (template.mappings || []).forEach(m => {
                mappingObj[m.column_letter] = {
                    header_name: m.header_name,
                    source_type: m.source_type,
                    source_value: m.source_value
                };
            });
            setMappings(mappingObj);
        }
    }, [template]);

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setUploading(true);
        try {
            const res = await axios.post('/api/accounting/templates/upload', formData);
            setTemplate(res.data);
            toast.success("Đã phân tích file Excel thành công!");
        } catch (error) {
            toast.error("Lỗi khi tải lên phôi");
        } finally {
            setUploading(false);
        }
    };

    const handleSaveConfig = async () => {
        setSaving(true);
        try {
            await axios.post('/api/accounting/config', {
                start_row: startRow,
                mappings: mappings
            });
            toast.success("Đã lưu cấu hình mapping!");
        } catch (error) {
            toast.error("Lỗi khi lưu cấu hình");
        } finally {
            setSaving(false);
        }
    };

    const addMappingRow = () => {
        const letters = Object.keys(mappings);
        let nextLetter = 'A';
        if (letters.length > 0) {
            const last = sortedMappingEntries[sortedMappingEntries.length - 1][0];
            nextLetter = String.fromCharCode(last.charCodeAt(0) + 1);
        }

        setMappings({
            ...mappings,
            [nextLetter]: { header_name: 'Cột mới', source_type: 'field', source_value: 'name' }
        });
    };

    const updateMapping = (col, key, value) => {
        setMappings({
            ...mappings,
            [col]: { ...mappings[col], [key]: value }
        });
    };

    const removeMapping = (col) => {
        const newMappings = { ...mappings };
        delete newMappings[col];
        setMappings(newMappings);
    };

    if (loading) return <div className="p-8 text-center text-slate-400">Đang tải cấu hình...</div>;

    return (
        <div className="min-h-screen bg-transparent/50 p-4 md:p-8">
            <div className="max-w-[98%] mx-auto space-y-6">
                {/* Header Section */}
                <div className="bg-transparent p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                            <FileSpreadsheet size={28} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Cấu hình Mẫu Excel</h1>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Light Mode</span>
                                <span className="text-[10px] text-slate-400 font-medium">Sắp xếp theo thứ tự cột Excel (A {'\u2192'} Z)</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleSaveConfig}
                            disabled={saving}
                            className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-all disabled:opacity-50"
                        >
                            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={18} />}
                            LƯU CẤU HÌNH
                        </motion.button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Column - Setup */}
                    <div className="lg:col-span-3 space-y-6">
                        <div className="bg-transparent p-6 rounded-3xl border border-slate-200 shadow-sm">
                            <h2 className="text-sm font-black text-slate-800 mb-6 flex items-center gap-2 uppercase tracking-widest">
                                <Upload size={18} className="text-emerald-500" />
                                Tải phôi Excel
                            </h2>

                            <div className="relative group mb-6">
                                <input
                                    type="file"
                                    accept=".xlsx"
                                    onChange={handleUpload}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                />
                                <div className="border-2 border-dashed border-slate-200 group-hover:border-emerald-500/50 rounded-2xl p-6 text-center transition-all bg-transparent group-hover:bg-emerald-50">
                                    <FileSpreadsheet className="text-slate-300 group-hover:text-emerald-500 mx-auto mb-3 transition-colors" size={32} />
                                    <p className="text-xs font-bold text-slate-600">Chọn file mẫu (.xlsx)</p>
                                </div>
                            </div>

                            {template && (
                                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                                    <div className="flex items-center gap-2 mb-2">
                                        <CheckCircle2 className="text-emerald-600" size={16} />
                                        <p className="text-xs font-bold text-emerald-800 truncate">{template.name}</p>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black text-emerald-600/60 uppercase">Dòng bắt đầu:</span>
                                        <input
                                            type="number"
                                            value={startRow}
                                            onChange={(e) => setStartRow(parseInt(e.target.value))}
                                            className="w-12 bg-white border border-emerald-200 rounded text-center text-xs font-black p-0.5 focus:ring-emerald-500"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 shadow-xl text-white">
                            <h3 className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                <Info size={14} />
                                NHẮC NHỞ
                            </h3>
                            <div className="space-y-4">
                                <div className="flex gap-3">
                                    <div className="w-5 h-5 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
                                        <span className="text-[10px] font-bold text-emerald-400">1</span>
                                    </div>
                                    <p className="text-xs font-medium text-slate-300 leading-relaxed italic">Hệ thống tự nhận diện tiêu đề và dữ liệu mẫu từ dòng kế tiếp.</p>
                                </div>
                                <div className="flex gap-3">
                                    <div className="w-5 h-5 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
                                        <span className="text-[10px] font-bold text-emerald-400">2</span>
                                    </div>
                                    <p className="text-xs font-medium text-slate-300 leading-relaxed italic">Chọn <b>"Bỏ qua"</b> cho các cột không muốn điền dữ liệu.</p>
                                </div>
                                <div className="flex gap-3">
                                    <div className="w-5 h-5 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
                                        <span className="text-[10px] font-bold text-emerald-400">3</span>
                                    </div>
                                    <p className="text-xs font-medium text-slate-300 leading-relaxed italic">Cột sẽ được xuất ra file y hệt thứ tự hiển thị bên phải.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Mapping Table */}
                    <div className="lg:col-span-9">
                        <div className="bg-transparent rounded-3xl border border-slate-200 shadow-sm overflow-hidden min-h-[600px]">
                            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-transparent/50">
                                <div className="flex items-center gap-3">
                                    <ArrowRightLeft className="text-emerald-600" size={20} />
                                    <h2 className="text-base font-black text-slate-800 tracking-tight">DANH SÁCH CỘT MAPPING</h2>
                                </div>
                                <button
                                    onClick={addMappingRow}
                                    className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-all border border-emerald-200"
                                >
                                    <Plus size={16} /> THÊM CỘT MỚI
                                </button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-transparent border-b border-slate-100">
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-20">Vị trí</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-64">Tiêu đề (trong file)</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-48">Kiểu dữ liệu</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Dữ liệu thực tế</th>
                                            <th className="px-6 py-4 w-12 text-center">Xóa</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        <AnimatePresence mode="popLayout">
                                            {sortedMappingEntries.map(([col, config]) => (
                                                <motion.tr
                                                    layout
                                                    key={col}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    className="group hover:bg-transparent/50 transition-colors"
                                                >
                                                    <td className="px-6 py-5">
                                                        <span className="text-xl font-black text-slate-300 group-hover:text-emerald-600 transition-colors uppercase">{col}</span>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <div className="flex flex-col">
                                                            <input
                                                                type="text"
                                                                value={config.header_name || ''}
                                                                onChange={(e) => updateMapping(col, 'header_name', e.target.value)}
                                                                className="bg-transparent border-none text-slate-800 font-bold p-0 focus:ring-0 w-full text-sm placeholder:text-slate-300"
                                                                placeholder="Nhập tên tiêu đề..."
                                                            />
                                                            <div className="h-0.5 w-8 bg-transparent group-hover:w-full transition-all duration-300 mt-1" />
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <select
                                                            value={config.source_type}
                                                            onChange={(e) => updateMapping(col, 'source_type', e.target.value)}
                                                            className={cn(
                                                                "bg-white border-slate-200 rounded-xl text-slate-700 font-bold text-[11px] focus:ring-emerald-500 focus:border-emerald-500 w-full cursor-pointer py-2 px-3 shadow-sm transition-all",
                                                                config.source_type === 'skip' && "bg-rose-50 text-rose-600 border-rose-100"
                                                            )}
                                                        >
                                                            <option value="field">Dữ liệu từ POS</option>
                                                            <option value="static">Giá trị cố định / Mẫu</option>
                                                            <option value="static_first">Cố định (Dòng đầu)</option>
                                                            <option value="index">Số thứ tự (STT)</option>
                                                            <option value="skip" className="text-rose-500 font-bold">Bỏ qua cột này</option>
                                                        </select>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        {config.source_type === 'field' ? (
                                                            <select
                                                                value={config.source_value}
                                                                onChange={(e) => updateMapping(col, 'source_value', e.target.value)}
                                                                className="bg-emerald-50 border-emerald-100 rounded-xl text-emerald-700 font-black text-[11px] focus:ring-emerald-500 focus:border-emerald-500 w-full cursor-pointer py-2 px-3"
                                                            >
                                                                {sourceFields.filter(f => f.type === 'field').map(f => (
                                                                    <option key={f.id} value={f.id}>{f.name}</option>
                                                                ))}
                                                            </select>
                                                        ) : (config.source_type === 'static' || config.source_type === 'static_first') ? (
                                                            <div className="flex items-center gap-2 bg-transparent/50 px-3 py-2 rounded-xl border border-slate-200 group-hover:bg-white transition-colors">
                                                                <Type size={14} className="text-slate-300" />
                                                                <input
                                                                    type="text"
                                                                    value={config.source_value}
                                                                    onChange={(e) => updateMapping(col, 'source_value', e.target.value)}
                                                                    placeholder="Giá trị..."
                                                                    className="bg-transparent border-none text-slate-700 text-[11px] font-bold focus:ring-0 p-0 w-full"
                                                                />
                                                            </div>
                                                        ) : config.source_type === 'skip' ? (
                                                            <div className="flex items-center gap-2 text-rose-400 italic">
                                                                <XCircle size={14} />
                                                                <span className="text-[10px] font-bold uppercase tracking-widest pl-1">Sẽ để rỗng cột này</span>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-2 text-emerald-500 italic">
                                                                <Binary size={14} />
                                                                <span className="text-[10px] font-bold uppercase tracking-widest pl-1">Số thứ tự tự tăng</span>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-5 text-center">
                                                        <motion.button
                                                            whileHover={{ scale: 1.2, color: '#ef4444' }}
                                                            whileTap={{ scale: 0.9 }}
                                                            onClick={() => removeMapping(col)}
                                                            className="text-slate-300 hover:text-rose-500 transition-colors"
                                                        >
                                                            <Trash2 size={18} />
                                                        </motion.button>
                                                    </td>
                                                </motion.tr>
                                            ))}
                                        </AnimatePresence>
                                    </tbody>
                                </table>

                                {Object.keys(mappings).length === 0 && (
                                    <div className="p-20 text-center">
                                        <div className="w-16 h-16 bg-transparent rounded-3xl flex items-center justify-center mx-auto mb-4">
                                            <Upload className="text-slate-300" size={24} />
                                        </div>
                                        <p className="text-sm font-bold text-slate-400">Chưa có dữ liệu mapping</p>
                                        <p className="text-xs text-slate-300 mt-1 uppercase tracking-widest">Hãy tải phôi lên để nhận diện cấu trúc</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
