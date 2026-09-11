// Real-time WebSocket connection manager for LyangPOS
import { queryClient } from './queryClient';

class WebSocketService {
  constructor() {
    this.ws = null;
    this.reconnectTimer = null;
    this.reconnectAttempts = 0;
    this.listeners = new Set();
    this.isConnected = false;
  }

  getWsUrl() {
    const savedIp = localStorage.getItem('server_ip');
    const port = import.meta.env.VITE_BACKEND_PORT || '3579';

    if (savedIp) {
      const clean = savedIp.trim().replace(/^https?:\/\//i, '');
      const host = clean.includes(':') ? clean : `${clean}:${port}`;
      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${proto}//${host}/ws`;
    }

    if (typeof window !== 'undefined' && window.location && window.location.hostname &&
        window.location.hostname !== 'localhost' && 
        window.location.hostname !== '127.0.0.1' && 
        window.location.hostname !== 'tauri.localhost') {
      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${proto}//${window.location.hostname}:${port}/ws`;
    }

    return `ws://localhost:${port}/ws`;
  }

  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const url = this.getWsUrl();
    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        console.log('⚡ [LyangPOS WS] WebSocket Connected to:', url);
        this.notifyListeners({ type: 'STATUS', status: 'connected' });
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleEvent(data);
        } catch (e) {
          console.warn('[LyangPOS WS] Failed to parse ws message:', event.data);
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.notifyListeners({ type: 'STATUS', status: 'disconnected' });
        this.scheduleReconnect();
      };

      this.ws.onerror = (err) => {
        this.isConnected = false;
        // WS error will trigger onclose
      };
    } catch (err) {
      console.warn('[LyangPOS WS] Connect error:', err);
      this.scheduleReconnect();
    }
  }

  scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), 10000);
    this.reconnectAttempts++;
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  handleEvent(data) {
    if (!data || !data.type) return;

    // 1. Auto-invalidate relevant TanStack queries for instant UI update
    if (data.type === 'ORDER_CREATED' || data.type === 'ORDER_UPDATED' || data.type === 'ORDER_DELETED') {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['report-kpis'] });
      queryClient.invalidateQueries({ queryKey: ['daily-invoices'] });
    }

    if (data.type === 'STOCK_CHANGED') {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product_summary'] });
    }

    // 2. Notify all registered custom listeners (e.g., POS terminal cart mirror, notifications)
    this.notifyListeners(data);
  }

  send(type, payload = {}) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }));
    }
  }

  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyListeners(data) {
    this.listeners.forEach((callback) => {
      try {
        callback(data);
      } catch (e) {
        console.error('[LyangPOS WS] Error in subscriber callback:', e);
      }
    });
  }
}

export const wsService = new WebSocketService();
