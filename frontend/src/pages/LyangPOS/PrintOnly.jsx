import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import PrintTemplate from "../../components/PrintTemplate";
import { DEFAULT_SETTINGS } from "../../lib/settings";

const PrintOnly = () => {
    const { orderId } = useParams();
    const [orderData, setOrderData] = useState(null);
    const [settings, setSettings] = useState(DEFAULT_SETTINGS);
    const [error, setError] = useState(null);
    const printRef = useRef(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Ensure correct baseURL when running in Android WebView
                axios.defaults.baseURL = window.location.origin;

                // Fetch settings and templates
                const [templatesRes, settingsRes] = await Promise.all([
                    axios.get("/api/print-templates?module=Sale"),
                    axios.get("/api/settings"),
                ]);

                let combinedSettings = { ...DEFAULT_SETTINGS };
                if (settingsRes.data) {
                    combinedSettings = { ...combinedSettings, ...settingsRes.data };
                }
                if (templatesRes.data && templatesRes.data.length > 0) {
                    const defaultTemplate = templatesRes.data.find((t) => t.is_default) || templatesRes.data[0];
                    if (defaultTemplate) {
                        try {
                            const config = JSON.parse(defaultTemplate.config);
                            combinedSettings = { ...combinedSettings, ...config };
                        } catch (e) {
                            console.error("Lỗi parse config:", e);
                        }
                    }
                }
                setSettings(combinedSettings);

                // Fetch order data
                const orderRes = await axios.get(`/api/orders/${orderId}`);
                if (orderRes.data) {
                    setOrderData(orderRes.data);
                } else {
                    setError("Không tìm thấy đơn hàng.");
                    // Notify android to close or ignore
                    if (window.PrintInterface && window.PrintInterface.onPrintReady) {
                        window.PrintInterface.onPrintReady();
                    }
                }
            } catch (err) {
                console.error("Failed to load print data", err);
                setError("Lỗi tải dữ liệu: " + err.message);
                if (window.PrintInterface && window.PrintInterface.onPrintReady) {
                    window.PrintInterface.onPrintReady();
                }
            }
        };

        if (orderId) {
            fetchData();
        }
    }, [orderId]);

    // Notify Android when ready
    useEffect(() => {
        if (orderData && settings) {
            // Give DOM a little time to render fonts and tables
            const timer = setTimeout(() => {
                if (window.PrintInterface && window.PrintInterface.onPrintReady) {
                    // Send to Android interface
                    window.PrintInterface.onPrintReady();
                } else {
                    // Fallback to browser print if opened directly
                    window.print();
                }
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [orderData, settings]);

    if (error) {
        return <div style={{ padding: "20px", color: "red" }}>{error}</div>;
    }

    if (!orderData) {
        return <div style={{ padding: "20px" }}>Đang tải dữ liệu in...</div>;
    }

    return (
        <div style={{ background: "#fff", minHeight: "100vh", padding: 0, margin: 0 }}>
            <PrintTemplate
                ref={printRef}
                data={orderData}
                settings={settings}
                type="Sale"
                isPreview={false}
            />
        </div>
    );
};

export default PrintOnly;
