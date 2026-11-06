import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { formatCurrency } from '../../lib/utils';

/**
 * DebtTorus3D - Interactive 3D WebGL Dual-Arc Gyroscopic Torus for Customer vs Supplier Debt
 */
export default function DebtTorus3D({
    customerDebt = 0,
    supplierDebt = 0,
    hideStats = false,
    isDark = false
}) {
    const mountRef = useRef(null);
    const [hoveredPart, setHoveredPart] = useState(null);

    const absCust = Math.abs(Number(customerDebt) || 0);
    const absSupp = Math.abs(Number(supplierDebt) || 0);
    const total = Math.max(1, absCust + absSupp);
    const custRatio = (absCust + absSupp === 0) ? 0.5 : (absCust / total);
    const custPercent = (absCust + absSupp === 0) ? 0 : Math.round((absCust / total) * 100);

    useEffect(() => {
        const container = mountRef.current;
        if (!container) return;

        const width = container.clientWidth || 300;
        const height = container.clientHeight || 250;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
        camera.position.set(0, 1.8, 7.6);
        camera.lookAt(0, 0, 0);

        let renderer;
        try {
            renderer = new THREE.WebGLRenderer({
                alpha: true,
                antialias: true,
                powerPreference: 'high-performance'
            });
        } catch (e) {
            return;
        }

        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        container.innerHTML = '';
        container.appendChild(renderer.domElement);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, isDark ? 0.75 : 1.05);
        scene.add(ambientLight);

        const keyLight = new THREE.DirectionalLight(0xffffff, isDark ? 1.5 : 1.25);
        keyLight.position.set(5, 8, 6);
        scene.add(keyLight);

        const emeraldPoint = new THREE.PointLight(0x10b981, 2.2, 15);
        emeraldPoint.position.set(-4, 2, 4);
        scene.add(emeraldPoint);

        const amberPoint = new THREE.PointLight(0xf59e0b, 2.0, 15);
        amberPoint.position.set(4, -2, 4);
        scene.add(amberPoint);

        // Root interactive group
        const rootGroup = new THREE.Group();
        rootGroup.rotation.x = 0.38;
        rootGroup.rotation.y = -0.25;
        scene.add(rootGroup);

        // Base holographic pedestal ring
        const baseRingGeo = new THREE.RingGeometry(2.15, 2.25, 64);
        const baseRingMat = new THREE.MeshBasicMaterial({
            color: isDark ? 0x10b981 : 0x0f766e,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: isDark ? 0.22 : 0.16
        });
        const baseRing = new THREE.Mesh(baseRingGeo, baseRingMat);
        baseRing.rotation.x = Math.PI / 2;
        baseRing.position.y = -1.65;
        scene.add(baseRing);

        // Outer gyroscopic wireframe ring
        const gyroGeo = new THREE.TorusGeometry(2.32, 0.025, 12, 72);
        const gyroMat = new THREE.MeshBasicMaterial({
            color: isDark ? 0x38bdf8 : 0x10b981,
            transparent: true,
            opacity: isDark ? 0.35 : 0.25
        });
        const gyroRing = new THREE.Mesh(gyroGeo, gyroMat);
        rootGroup.add(gyroRing);

        // Compute arc angles with small gap
        const gap = 0.12;
        const fullCircle = Math.PI * 2;
        const custArc = Math.max(0.25, custRatio * (fullCircle - gap * 2));
        const suppArc = Math.max(0.25, (1 - custRatio) * (fullCircle - gap * 2));

        const pickableMeshes = [];

        // 1. Customer Debt 3D Torus Arc (Emerald/Teal)
        const custGeo = new THREE.TorusGeometry(1.72, 0.36, 28, 64, custArc);
        const custMat = new THREE.MeshPhysicalMaterial({
            color: 0x10b981,
            emissive: 0x059669,
            emissiveIntensity: isDark ? 0.32 : 0.18,
            metalness: 0.25,
            roughness: 0.18,
            clearcoat: 0.9,
            clearcoatRoughness: 0.1,
            transparent: true,
            opacity: 0.94
        });
        const custMesh = new THREE.Mesh(custGeo, custMat);
        custMesh.rotation.z = gap / 2;
        custMesh.userData = {
            id: 'customer',
            label: 'Khách hàng nợ (Phải thu)',
            value: absCust,
            color: '#10b981',
            baseScale: 1
        };
        rootGroup.add(custMesh);
        pickableMeshes.push(custMesh);

        // 2. Supplier Debt 3D Torus Arc (Amber/Rose)
        const suppGeo = new THREE.TorusGeometry(1.72, 0.32, 28, 64, suppArc);
        const suppMat = new THREE.MeshPhysicalMaterial({
            color: 0xf59e0b,
            emissive: 0xd97706,
            emissiveIntensity: isDark ? 0.3 : 0.16,
            metalness: 0.25,
            roughness: 0.2,
            clearcoat: 0.85,
            clearcoatRoughness: 0.12,
            transparent: true,
            opacity: 0.92
        });
        const suppMesh = new THREE.Mesh(suppGeo, suppMat);
        suppMesh.rotation.z = custArc + gap * 1.5;
        suppMesh.userData = {
            id: 'supplier',
            label: 'Nợ nhà cung cấp (Phải trả)',
            value: absSupp,
            color: '#f59e0b',
            baseScale: 1
        };
        rootGroup.add(suppMesh);
        pickableMeshes.push(suppMesh);

        // Inner floating crystal octahedron core
        const coreGeo = new THREE.OctahedronGeometry(0.68, 0);
        const coreMat = new THREE.MeshPhysicalMaterial({
            color: isDark ? 0x14b8a6 : 0x0d9488,
            emissive: isDark ? 0x0d9488 : 0x0f766e,
            emissiveIntensity: 0.35,
            wireframe: true,
            transparent: true,
            opacity: 0.45
        });
        const coreMesh = new THREE.Mesh(coreGeo, coreMat);
        rootGroup.add(coreMesh);

        // Interaction: Drag to tilt & hover raycast
        const raycaster = new THREE.Raycaster();
        const pointer = new THREE.Vector2(-999, -999);
        let isDragging = false;
        let prevX = 0;
        let prevY = 0;
        let targetRotX = 0.38;
        let targetRotY = -0.25;

        const handlePointerDown = (e) => {
            isDragging = true;
            prevX = e.clientX;
            prevY = e.clientY;
        };

        const handlePointerMove = (e) => {
            const rect = renderer.domElement.getBoundingClientRect();
            pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

            if (isDragging) {
                const dx = e.clientX - prevX;
                const dy = e.clientY - prevY;
                prevX = e.clientX;
                prevY = e.clientY;
                targetRotY += dx * 0.01;
                targetRotX = Math.max(-0.6, Math.min(0.9, targetRotX + dy * 0.01));
            }
        };

        const handlePointerUp = () => {
            isDragging = false;
        };

        const handlePointerLeave = () => {
            isDragging = false;
            pointer.set(-999, -999);
            setHoveredPart(null);
        };

        const domEl = renderer.domElement;
        domEl.addEventListener('pointerdown', handlePointerDown);
        domEl.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
        domEl.addEventListener('pointerleave', handlePointerLeave);

        const handleResize = () => {
            if (!container) return;
            const w = container.clientWidth || 300;
            const h = container.clientHeight || 250;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        };
        window.addEventListener('resize', handleResize);

        let rafId = null;
        let clock = 0;

        const animate = () => {
            rafId = requestAnimationFrame(animate);
            if (document.hidden) return;

            clock += 0.014;
            if (!isDragging) {
                targetRotY += 0.0045;
            }

            rootGroup.rotation.y += (targetRotY - rootGroup.rotation.y) * 0.08;
            rootGroup.rotation.x += (targetRotX - rootGroup.rotation.x) * 0.08;

            gyroRing.rotation.x = Math.sin(clock * 0.7) * 0.5;
            gyroRing.rotation.y = clock * 0.6;
            coreMesh.rotation.y = -clock * 1.1;
            coreMesh.rotation.z = clock * 0.5;

            // Raycasting
            if (pointer.x > -10) {
                raycaster.setFromCamera(pointer, camera);
                const hits = raycaster.intersectObjects(pickableMeshes, false);
                if (hits.length > 0) {
                    const hitObj = hits[0].object;
                    pickableMeshes.forEach((m) => {
                        const isHit = m === hitObj;
                        const s = isHit ? 1.07 : 1.0;
                        m.scale.lerp(new THREE.Vector3(s, s, s), 0.15);
                        m.material.emissiveIntensity = isHit ? 0.6 : 0.25;
                    });
                    setHoveredPart(hitObj.userData);
                    domEl.style.cursor = isDragging ? 'grabbing' : 'pointer';
                } else {
                    pickableMeshes.forEach((m) => {
                        m.scale.lerp(new THREE.Vector3(1, 1, 1), 0.15);
                        m.material.emissiveIntensity = 0.25;
                    });
                    setHoveredPart(null);
                    domEl.style.cursor = isDragging ? 'grabbing' : 'grab';
                }
            }

            renderer.render(scene, camera);
        };

        animate();

        return () => {
            if (rafId) cancelAnimationFrame(rafId);
            domEl.removeEventListener('pointerdown', handlePointerDown);
            domEl.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
            domEl.removeEventListener('pointerleave', handlePointerLeave);
            window.removeEventListener('resize', handleResize);
            scene.traverse((obj) => {
                if (obj.geometry) obj.geometry.dispose();
                if (obj.material) {
                    if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
                    else obj.material.dispose();
                }
            });
            renderer.dispose();
        };
    }, [absCust, absSupp, custRatio, isDark]);

    return (
        <div className="relative w-full h-full min-h-[240px] flex items-center justify-center select-none">
            <div ref={mountRef} className="w-full h-full min-h-[240px]" />

            {/* Center 3D Floating HUD */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div className="px-3.5 py-2 rounded-2xl bg-white/75 dark:bg-slate-950/75 backdrop-blur-md border border-emerald-500/25 shadow-lg flex flex-col items-center justify-center">
                    <span className="text-[8px] font-black uppercase text-[#8b6f47] dark:text-[#d4a574] tracking-[0.2em]">
                        Tỷ lệ phải thu
                    </span>
                    <span className="text-2xl font-black text-[#2d5016] dark:text-emerald-400 tracking-tight leading-none my-0.5 tabular-nums">
                        {hideStats ? '••%' : `${custPercent}%`}
                    </span>
                    <span className="text-[8px] font-black uppercase tracking-widest text-teal-600 dark:text-teal-300">
                        Xoay 3D 360°
                    </span>
                </div>
            </div>

            {/* Hover Inspection Pill */}
            {hoveredPart && (
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 z-20 pointer-events-none px-3 py-1.5 rounded-xl bg-slate-900/90 dark:bg-slate-950/95 text-white border border-white/15 shadow-xl flex items-center gap-2 whitespace-nowrap animate-in fade-in duration-150">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: hoveredPart.color }} />
                    <span className="text-[10px] font-bold text-slate-300">{hoveredPart.label}:</span>
                    <span className="text-xs font-black text-emerald-300 tabular-nums">
                        {hideStats ? '••••••••' : formatCurrency(hoveredPart.value)}
                    </span>
                </div>
            )}
        </div>
    );
}

