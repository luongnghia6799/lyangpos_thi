import axios from 'axios';
import React from 'react';
import { ShieldAlert, RefreshCw, Copy, Trash2, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { 
            hasError: false, 
            error: null, 
            errorInfo: null,
            eventError: null
        };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ errorInfo });
        console.error("ErrorBoundary caught an error", error, errorInfo);
        
        try {
            const savedIp = localStorage.getItem('server_ip');
            const baseUrl = axios.defaults.baseURL;
            fetch(`${baseUrl}/api/log_error`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: error.message,
                    stack: error.stack,
                    componentStack: errorInfo.componentStack
                })
            }).catch(() => {});
        } catch (e) {}
    }

    componentDidMount() {
        // Global error listener for non-react errors (e.g. chunk loading failures)
        this.globalErrorListener = (event) => {
            console.error("Global window.onerror caught:", event);
            const error = event.error || { message: event.message };
            this.setState({
                hasError: true,
                error: error,
                eventError: {
                    message: event.message,
                    filename: event.filename,
                    lineno: event.lineno,
                    colno: event.colno
                }
            });
        };

        this.globalPromiseListener = (event) => {
            console.error("Unhandled promise rejection caught:", event);
            this.setState({
                hasError: true,
                error: new Error(event.reason || 'Unhandled Promise Rejection')
            });
        };

        window.addEventListener('error', this.globalErrorListener);
        window.addEventListener('unhandledrejection', this.globalPromiseListener);
    }

    componentWillUnmount() {
        window.removeEventListener('error', this.globalErrorListener);
        window.removeEventListener('unhandledrejection', this.globalPromiseListener);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null, eventError: null });
        window.location.hash = '/welcome';
        window.location.reload();
    };

    handleClearData = () => {
        if (window.confirm("Bạn có chắc chắn muốn XÓA DỮ LIỆU ĐỆM (Cache/Session)? Thao tác này sẽ yêu cầu bạn đăng nhập lại nhưng có thể sửa được hầu hết các lỗi hiển thị.")) {
            sessionStorage.clear();
            localStorage.clear();
            this.handleReset();
        }
    };

    handleCopyError = () => {
        const errorText = `
Error Message: ${this.state.error?.message || 'N/A'}
Stack Trace: ${this.state.error?.stack || 'N/A'}
Component Stack: ${this.state.errorInfo?.componentStack || 'N/A'}
Event Info: ${JSON.stringify(this.state.eventError || {})}
        `;
        navigator.clipboard.writeText(errorText.trim());
        alert("Đã sao chép mã lỗi vào bộ nhớ tạm!");
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen w-full flex items-center justify-center bg-[#faf8f3] dark:bg-[#06150a] p-6 font-sans">
                    <div className="w-full max-w-2xl bg-transparent backdrop-blur-2xl rounded-[3rem] border-2 border-[#d4a574]/20 p-8 md:p-12 shadow-2xl relative overflow-hidden flex flex-col items-center text-center">
                        {/* Glow decorative */}
                        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-[#2d5016]/5 rounded-full blur-[100px] pointer-events-none" />
                        <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-[#d4a574]/10 rounded-full blur-[100px] pointer-events-none" />

                        {/* Pulsing warning icon */}
                        <div className="w-24 h-24 rounded-[2rem] bg-rose-500/10 dark:bg-rose-500/20 border-2 border-rose-500/30 flex items-center justify-center text-rose-500 mb-6 relative animate-pulse">
                            <ShieldAlert size={48} strokeWidth={2} />
                        </div>

                        <h1 className="text-3xl font-black text-[#2d5016] dark:text-emerald-400 tracking-tight uppercase mb-2">
                            Hệ Thống Tự Chẩn Đoán Lỗi
                        </h1>
                        <p className="text-[#8b6f47] dark:text-emerald-400/60 font-bold uppercase tracking-[0.15em] text-[10px] mb-6">
                            LyangPOS Diagnostics & Recovery • Version 0.1.0
                        </p>

                        <div className="w-full bg-[#faf8f3] dark:bg-slate-950/60 rounded-2xl border border-[#d4a574]/10 p-5 mb-8 text-left overflow-x-auto font-mono text-[11px] leading-relaxed text-rose-600 dark:text-rose-400 shadow-inner max-h-64">
                            <div className="font-bold text-xs mb-2 border-b border-rose-500/20 pb-1 flex justify-between items-center text-[#8b6f47] dark:text-emerald-400">
                                <span>CHI TIẾT LỖI GIAO DIỆN (CRASH LOG):</span>
                                <button 
                                    onClick={this.handleCopyError}
                                    className="flex items-center gap-1 px-2.5 py-1 bg-transparent border border-[#d4a574]/30 rounded-lg hover:bg-emerald-50 text-[10px] font-black"
                                >
                                    <Copy size={10} /> Sao chép
                                </button>
                            </div>
                            <p className="font-bold mb-1">{this.state.error?.toString() || 'Unknown Error'}</p>
                            {this.state.eventError && (
                                <p className="mb-2 text-[#8b6f47]">
                                    File: {this.state.eventError.filename?.split('/').pop()}<br />
                                    Line: {this.state.eventError.lineno} : Col: {this.state.eventError.colno}
                                </p>
                            )}
                            {this.state.error?.stack && (
                                <pre className="whitespace-pre-wrap font-mono mt-2 opacity-80">{this.state.error.stack}</pre>
                            )}
                            {this.state.errorInfo?.componentStack && (
                                <pre className="whitespace-pre-wrap font-mono mt-2 opacity-80 text-gray-500">{this.state.errorInfo.componentStack}</pre>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
                            <button
                                onClick={this.handleReset}
                                className="bg-gradient-to-r from-[#2d5016] to-[#4a7c59] text-white font-black uppercase tracking-wider py-4 px-6 rounded-2xl shadow-xl shadow-[#2d5016]/20 hover:shadow-[#2d5016]/40 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group text-xs"
                            >
                                <RefreshCw size={16} className="group-hover:rotate-180 transition-transform duration-700" />
                                <span>Thử Tải Lại</span>
                            </button>

                            <button
                                onClick={this.handleClearData}
                                className="bg-transparent border-2 border-[#d4a574]/30 hover:border-red-500 text-red-600 dark:text-red-400 font-black uppercase tracking-wider py-4 px-6 rounded-2xl transition-all flex items-center justify-center gap-2 text-xs hover:bg-red-50 dark:hover:bg-red-950/20"
                            >
                                <Trash2 size={16} />
                                <span>Xóa Đệm & Sửa</span>
                            </button>

                            <button
                                onClick={() => {
                                    this.setState({ hasError: false, error: null, errorInfo: null, eventError: null });
                                    window.location.hash = '/welcome';
                                }}
                                className="bg-[#faf8f3] dark:bg-slate-950/40 border-2 border-transparent hover:border-[#d4a574]/20 text-[#8b6f47] dark:text-[#d4a574] font-black uppercase tracking-wider py-4 px-6 rounded-2xl transition-all flex items-center justify-center gap-2 text-xs"
                            >
                                <Home size={16} />
                                <span>Về Trang Đăng Nhập</span>
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
