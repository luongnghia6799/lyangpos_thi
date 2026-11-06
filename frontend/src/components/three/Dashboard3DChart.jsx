import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RotateCcw, Orbit, Eye, Layers, Sparkles } from 'lucide-react';
import { formatNumber, cn } from '../../lib/utils';

/**
 * Dashboard3DChart - Interactive 3D WebGL Financial Prism & Bar Stage
 * Supports mouse drag orbit, hover raycasting, and camera view presets.
 */
export default function Dashboard3DChart({
    data = [],
    labels = [],
    revenueData = [],
    profitData = [],
    showProfit = false,
    isDark = false,
    title = 'Không Gian 3D Biến Động Doanh Thu & Lợi Nhuận'
}) {
    const mountRef = useRef(null);
    const [hoveredItem, setHoveredItem] = useState(null);
    const [autoRotate, setAutoRotate] = useState(true);
    const [cameraPreset, setCameraPreset] = useState('iso'); // 'iso' | 'front' | 'bird'
    const stateRef = useRef({
        autoRotate: true,
        targetRotY: -0.42,
        targetRotX: 0.32,
        zoom: 15.5
    });

    useEffect(() => {
        stateRef.current.autoRotate = autoRotate;
    }, [autoRotate]);

    useEffect(() => {
        if (cameraPreset === 'iso') {
            stateRef.current.targetRotY = -0.45;
            stateRef.current.targetRotX = 0.34;
            stateRef.current.zoom = 15.5;
        } else if (cameraPreset === 'front') {
            stateRef.current.targetRotY = 0;
            stateRef.current.targetRotX = 0.14;
            stateRef.current.zoom = 14.5;
        } else if (cameraPreset === 'bird') {
            stateRef.current.targetRotY = -0.25;
            stateRef.current.targetRotX = 0.72;
            stateRef.current.zoom = 17.0;
        }
    }, [cameraPreset]);

    const normalizedData = React.useMemo(() => {
        if (Array.isArray(labels) && labels.length > 0) {
            return labels.slice(-14).map((lbl, idx) => ({
                label: String(lbl || `#${idx + 1}`),
                revenue: Number(revenueData[idx] ?? 0),
                profit: Number(profitData[idx] ?? (Number(revenueData[idx] || 0) * 0.22)),
                orders: 0
            }));
        }
        if (!Array.isArray(data) || data.length === 0) {
            return Array.from({ length: 7 }, (_, i) => ({
                label: `T${i + 2}`,
                revenue: 0,
                profit: 0,
                orders: 0
            }));
        }
        return data.slice(-14).map((d, idx) => ({
            label: d.date || d.label || d.name || `#${idx + 1}`,
            revenue: Number(d.revenue ?? d.total_revenue ?? d.total ?? d.amount ?? 0),
            profit: Number(d.profit ?? d.net_profit ?? (Number(d.revenue || 0) * 0.22)),
            orders: Number(d.order_count ?? d.orders ?? d.count ?? 0)
        }));
    }, [data, labels, revenueData, profitData]);

    useEffect(() => {
        const container = mountRef.current;
        if (!container) return;

        const scene = new THREE.Scene();
        const width = container.clientWidth || 700;
        const height = container.clientHeight || 340;

        const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
        camera.position.set(0, 5.5, 15.5);

        let renderer;
        try {
            renderer = new THREE.WebGLRenderer({
                alpha: true,
                antialias: true,
                powerPreference: 'high-performance'
            });
        } catch (err) {
            return;
        }

        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.shadowMap.enabled = true;
        container.innerHTML = '';
        container.appendChild(renderer.domElement);

        // Lights
        const ambient = new THREE.AmbientLight(0xffffff, isDark ? 0.7 : 0.95);
        scene.add(ambient);

        const keyLight = new THREE.DirectionalLight(0x34d399, isDark ? 2.2 : 1.5);
        keyLight.position.set(10, 16, 12);
        scene.add(keyLight);

        const rimLight = new THREE.PointLight(0xf59e0b, isDark ? 1.8 : 1.2, 35);
        rimLight.position.set(-10, 8, -8);
        scene.add(rimLight);

        // Stage Group (rotated by user drag / auto-orbit)
        const stageGroup = new THREE.Group();
        scene.add(stageGroup);

        // 3D Base Platform Pedestal
        const count = Math.max(normalizedData.length, 1);
        const spacing = Math.min(1.35, 13.5 / count);
        const totalSpan = (count - 1) * spacing;
        const platformWidth = Math.max(totalSpan + 4.2, 11);

        const baseGeo = new THREE.BoxGeometry(platformWidth, 0.32, 4.6);
        const baseMat = new THREE.MeshPhysicalMaterial({
            color: isDark ? 0x0f172a : 0xe2e8f0,
            metalness: 0.35,
            roughness: 0.25,
            clearcoat: 0.6,
            transparent: true,
            opacity: isDark ? 0.88 : 0.92
        });
        const baseMesh = new THREE.Mesh(baseGeo, baseMat);
        baseMesh.position.y = -2.35;
        stageGroup.add(baseMesh);

        // Glowing Platform Edge Frame
        const baseEdges = new THREE.EdgesGeometry(baseGeo);
        const baseEdgeMat = new THREE.LineBasicMaterial({
            color: isDark ? 0x2dd4bf : 0x0f766e,
            transparent: true,
            opacity: isDark ? 0.55 : 0.35
        });
        const baseWire = new THREE.LineSegments(baseEdges, baseEdgeMat);
        baseMesh.add(baseWire);

        // Subtle Grid on top of platform
        const grid = new THREE.GridHelper(platformWidth - 0.4, 16, 0x10b981, 0x10b981);
        grid.position.y = -2.18;
        grid.scale.z = 4.2 / (platformWidth - 0.4);
        if (grid.material) {
            grid.material.transparent = true;
            grid.material.opacity = isDark ? 0.22 : 0.14;
        }
        stageGroup.add(grid);

        // Build 3D Extruded Prisms for Revenue & Profit
        const maxVal = Math.max(...normalizedData.map(d => Math.max(d.revenue, d.profit, 1)), 1);
        const maxBarHeight = 5.2;
        const barWidth = Math.min(0.56, spacing * 0.44);

        const interactiveMeshes = [];
        const barAnimations = [];

        const revMatBase = new THREE.MeshPhysicalMaterial({
            color: isDark ? 0x10b981 : 0x1f4d2e,
            emissive: isDark ? 0x064e3b : 0x0f2918,
            emissiveIntensity: 0.35,
            metalness: 0.2,
            roughness: 0.18,
            clearcoat: 0.9,
            transparent: true,
            opacity: 0.94
        });

        const profitMatBase = new THREE.MeshPhysicalMaterial({
            color: 0xf59e0b,
            emissive: 0x78350f,
            emissiveIntensity: 0.35,
            metalness: 0.25,
            roughness: 0.2,
            clearcoat: 0.9,
            transparent: true,
            opacity: 0.94
        });

        normalizedData.forEach((item, idx) => {
            const x = -totalSpan / 2 + idx * spacing;
            const revRatio = Math.max(0.06, item.revenue / maxVal);
            const targetRevH = revRatio * maxBarHeight;

            const revGeo = new THREE.BoxGeometry(barWidth, 1, barWidth);
            // Shift geometry origin to bottom of box
            revGeo.translate(0, 0.5, 0);

            const revMat = revMatBase.clone();
            const revMesh = new THREE.Mesh(revGeo, revMat);
            revMesh.position.set(x, -2.18, showProfit ? -0.36 : 0);
            revMesh.scale.y = 0.01;
            revMesh.userData = { index: idx, item, type: 'revenue', baseColor: revMat.color.getHex() };

            // Specular edge lines on each 3D prism
            const edgeGeo = new THREE.EdgesGeometry(revGeo);
            const edgeMat = new THREE.LineBasicMaterial({
                color: isDark ? 0x6ee7b7 : 0xa7f3d0,
                transparent: true,
                opacity: 0.55
            });
            revMesh.add(new THREE.LineSegments(edgeGeo, edgeMat));

            stageGroup.add(revMesh);
            interactiveMeshes.push(revMesh);
            barAnimations.push({ mesh: revMesh, targetH: targetRevH, delay: idx * 0.04 });

            if (showProfit) {
                const profRatio = Math.max(0.04, Math.max(0, item.profit) / maxVal);
                const targetProfH = profRatio * maxBarHeight;

                const profGeo = new THREE.BoxGeometry(barWidth * 0.82, 1, barWidth * 0.82);
                profGeo.translate(0, 0.5, 0);

                const profMat = profitMatBase.clone();
                const profMesh = new THREE.Mesh(profGeo, profMat);
                profMesh.position.set(x + barWidth * 0.28, -2.18, 0.42);
                profMesh.scale.y = 0.01;
                profMesh.userData = { index: idx, item, type: 'profit', baseColor: profMat.color.getHex() };

                const pEdgeGeo = new THREE.EdgesGeometry(profGeo);
                const pEdgeMat = new THREE.LineBasicMaterial({
                    color: 0xfde68a,
                    transparent: true,
                    opacity: 0.6
                });
                profMesh.add(new THREE.LineSegments(pEdgeGeo, pEdgeMat));

                stageGroup.add(profMesh);
                interactiveMeshes.push(profMesh);
                barAnimations.push({ mesh: profMesh, targetH: targetProfH, delay: idx * 0.04 + 0.08 });
            }
        });

        // Pointer Drag & Raycaster Hover
        const raycaster = new THREE.Raycaster();
        const pointer = new THREE.Vector2(-99, -99);
        let isDragging = false;
        let prevX = 0;
        let prevY = 0;

        const onPointerDown = (e) => {
            isDragging = true;
            stateRef.current.autoRotate = false;
            setAutoRotate(false);
            prevX = e.clientX;
            prevY = e.clientY;
        };

        const onPointerMove = (e) => {
            const rect = renderer.domElement.getBoundingClientRect();
            pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

            if (isDragging) {
                const dx = e.clientX - prevX;
                const dy = e.clientY - prevY;
                stateRef.current.targetRotY += dx * 0.008;
                stateRef.current.targetRotX = Math.max(-0.05, Math.min(0.85, stateRef.current.targetRotX + dy * 0.006));
                prevX = e.clientX;
                prevY = e.clientY;
            }
        };

        const onPointerUp = () => {
            isDragging = false;
        };

        const domEl = renderer.domElement;
        domEl.addEventListener('pointerdown', onPointerDown);
        window.addEventListener('pointermove', onPointerMove, { passive: true });
        window.addEventListener('pointerup', onPointerUp);

        const handleResize = () => {
            if (!container) return;
            const w = container.clientWidth || 700;
            const h = container.clientHeight || 340;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        };
        window.addEventListener('resize', handleResize);

        let frameId;
        const clock = new THREE.Clock();
        let activeHoverMesh = null;

        const animate = () => {
            frameId = requestAnimationFrame(animate);
            if (document.hidden) return;

            const elapsed = clock.getElapsedTime();

            if (stateRef.current.autoRotate && !isDragging) {
                stateRef.current.targetRotY = -0.35 + Math.sin(elapsed * 0.45) * 0.28;
            }

            stageGroup.rotation.y += (stateRef.current.targetRotY - stageGroup.rotation.y) * 0.08;
            stageGroup.rotation.x += (stateRef.current.targetRotX - stageGroup.rotation.x) * 0.08;
            camera.position.z += (stateRef.current.zoom - camera.position.z) * 0.08;
            camera.lookAt(0, 0.2, 0);

            // Spring grow bars
            barAnimations.forEach((b) => {
                if (elapsed > b.delay) {
                    b.mesh.scale.y += (b.targetH - b.mesh.scale.y) * 0.12;
                }
            });

            // Raycasting
            raycaster.setFromCamera(pointer, camera);
            const intersects = raycaster.intersectObjects(interactiveMeshes, false);
            if (intersects.length > 0) {
                const hit = intersects[0].object;
                if (activeHoverMesh !== hit) {
                    if (activeHoverMesh) {
                        activeHoverMesh.material.emissiveIntensity = 0.35;
                    }
                    activeHoverMesh = hit;
                    activeHoverMesh.material.emissiveIntensity = 0.95;
                    setHoveredItem(hit.userData.item);
                }
            } else if (activeHoverMesh) {
                activeHoverMesh.material.emissiveIntensity = 0.35;
                activeHoverMesh = null;
                setHoveredItem(null);
            }

            renderer.render(scene, camera);
        };

        animate();

        return () => {
            cancelAnimationFrame(frameId);
            domEl.removeEventListener('pointerdown', onPointerDown);
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
            window.removeEventListener('resize', handleResize);
            baseGeo.dispose();
            baseMat.dispose();
            revMatBase.dispose();
            profitMatBase.dispose();
            renderer.dispose();
        };
    }, [normalizedData, showProfit, isDark]);

    return (
        <div className="relative w-full rounded-3xl argon-card overflow-hidden p-4 sm:p-5 select-none">
            {/* Top Header & 3D Camera Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-2 relative z-20">
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-emerald-600 text-white flex items-center justify-center shadow-md">
                        <Layers size={18} strokeWidth={2.4} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-foreground">
                                {title}
                            </h3>
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30">
                                3D WebGL Interactive
                            </span>
                        </div>
                        <p className="text-[10px] font-semibold text-muted-foreground">
                            Kéo chuột để xoay góc nhìn 3D • Rê chuột vào cột tinh thể để xem chi tiết
                        </p>
                    </div>
                </div>

                {/* Camera Angle Presets */}
                <div className="flex items-center gap-1.5 bg-black/[0.04] dark:bg-white/[0.05] p-1 rounded-xl border border-[var(--border-color)]">
                    {[
                        { id: 'iso', label: 'Góc 3D Iso' },
                        { id: 'front', label: 'Trực diện' },
                        { id: 'bird', label: 'Trên cao' }
                    ].map(preset => (
                        <button
                            key={preset.id}
                            type="button"
                            onClick={() => setCameraPreset(preset.id)}
                            className={cn(
                                'px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer',
                                cameraPreset === preset.id
                                    ? 'bg-primary text-white shadow-xs'
                                    : 'text-muted-foreground hover:text-foreground'
                            )}
                        >
                            {preset.label}
                        </button>
                    ))}
                    <button
                        type="button"
                        onClick={() => setAutoRotate(prev => !prev)}
                        className={cn(
                            'p-1.5 rounded-lg transition-all cursor-pointer',
                            autoRotate
                                ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300'
                                : 'text-muted-foreground hover:text-foreground'
                        )}
                        title="Tự động xoay 3D"
                    >
                        <Orbit size={14} />
                    </button>
                </div>
            </div>

            {/* Hovered 3D Pillar HUD Readout */}
            <div className="min-h-[36px] flex items-center justify-between px-3 py-1.5 rounded-2xl bg-black/[0.025] dark:bg-white/[0.03] border border-[var(--border-color)] mb-2 relative z-20">
                {hoveredItem ? (
                    <div className="flex flex-wrap items-center gap-4 text-xs">
                        <span className="font-black uppercase tracking-wider text-primary dark:text-emerald-300">
                            📅 {hoveredItem.label}
                        </span>
                        <span className="font-bold text-muted-foreground">
                            Doanh thu: <strong className="font-black text-emerald-600 dark:text-emerald-400 tabular-nums">{formatNumber(hoveredItem.revenue)}đ</strong>
                        </span>
                        {showProfit && (
                            <span className="font-bold text-muted-foreground">
                                Lợi nhuận: <strong className="font-black text-amber-600 dark:text-amber-400 tabular-nums">{formatNumber(hoveredItem.profit)}đ</strong>
                            </span>
                        )}
                        {hoveredItem.orders > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary dark:text-emerald-300 text-[10px] font-black">
                                {hoveredItem.orders} đơn
                            </span>
                        )}
                    </div>
                ) : (
                    <span className="text-[11px] font-bold text-muted-foreground flex items-center gap-1.5">
                        <Sparkles size={13} className="text-emerald-500" />
                        Chạm hoặc rê chuột vào các cột khối 3D bên dưới để xem số liệu từng mốc thời gian
                    </span>
                )}

                <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-wider">
                    <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                        <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 inline-block" /> Doanh thu
                    </span>
                    {showProfit && (
                        <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                            <span className="w-2.5 h-2.5 rounded-xs bg-amber-500 inline-block" /> Lợi nhuận
                        </span>
                    )}
                </div>
            </div>

            {/* 3D WebGL Canvas Stage */}
            <div
                ref={mountRef}
                className="w-full h-[290px] sm:h-[330px] cursor-grab active:cursor-grabbing relative z-10"
            />

            {/* Bottom X-axis labels */}
            <div className="grid grid-flow-col auto-cols-fr gap-1 px-4 pt-1 border-t border-[var(--border-color)] text-center relative z-20">
                {normalizedData.map((item, idx) => (
                    <div
                        key={idx}
                        className={cn(
                            'text-[9.5px] font-black truncate transition-colors',
                            hoveredItem?.label === item.label
                                ? 'text-primary dark:text-emerald-300 scale-105'
                                : 'text-muted-foreground'
                        )}
                    >
                        {item.label}
                    </div>
                ))}
            </div>
        </div>
    );
}
