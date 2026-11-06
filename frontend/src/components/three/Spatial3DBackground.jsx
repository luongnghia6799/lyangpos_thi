import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const THEME_PALETTES = {
    argon: {
        light: { primary: 0x0f766e, secondary: 0x14b8a6, accent: 0x0284c7, grid: 0x0f766e },
        dark: { primary: 0x2dd4bf, secondary: 0x0d9488, accent: 0x38bdf8, grid: 0x14b8a6 }
    },
    agri: {
        light: { primary: 0x2d5016, secondary: 0x4a7c59, accent: 0xd4a574, grid: 0x2d5016 },
        dark: { primary: 0x34d399, secondary: 0x10b981, accent: 0xfbbf24, grid: 0x10b981 }
    },
    luxury: {
        light: { primary: 0x7c4d23, secondary: 0xa1887f, accent: 0xd4a574, grid: 0x8b5a2b },
        dark: { primary: 0xd4a574, secondary: 0x9c7248, accent: 0xf59e0b, grid: 0xd4a574 }
    }
};

/**
 * Spatial3DBackground - Ambient 3D WebGL Spatial Workspace Stage
 * Renders floating 3D crystalline polyhedra, orbital rings, and depth particles
 * that respond to mouse parallax and theme changes.
 */
export default function Spatial3DBackground({ enabled = true, appTheme = 'agri', isDark = false }) {
    const mountRef = useRef(null);

    useEffect(() => {
        if (!enabled || !mountRef.current) return;
        const container = mountRef.current;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(
            50,
            (container.clientWidth || window.innerWidth) / (container.clientHeight || window.innerHeight),
            0.1,
            120
        );
        camera.position.set(0, 1.5, 16);

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

        const width = container.clientWidth || window.innerWidth;
        const height = container.clientHeight || window.innerHeight;
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
        container.innerHTML = '';
        container.appendChild(renderer.domElement);

        const paletteGroup = THEME_PALETTES[appTheme] || THEME_PALETTES.agri;
        const pal = isDark ? paletteGroup.dark : paletteGroup.light;

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, isDark ? 0.55 : 0.85);
        scene.add(ambientLight);

        const dirLight1 = new THREE.DirectionalLight(pal.primary, isDark ? 1.8 : 1.2);
        dirLight1.position.set(8, 12, 10);
        scene.add(dirLight1);

        const dirLight2 = new THREE.PointLight(pal.accent, isDark ? 1.6 : 1.0, 35);
        dirLight2.position.set(-10, -6, 8);
        scene.add(dirLight2);

        // 1. Subtle 3D Spatial Floor Grid
        const gridHelper = new THREE.GridHelper(48, 32, pal.grid, pal.grid);
        gridHelper.position.y = -5.5;
        if (gridHelper.material) {
            gridHelper.material.transparent = true;
            gridHelper.material.opacity = isDark ? 0.14 : 0.08;
        }
        scene.add(gridHelper);

        // 2. Floating 3D Crystalline Polyhedra Group
        const crystalGroup = new THREE.Group();
        scene.add(crystalGroup);

        const geometries = [
            new THREE.IcosahedronGeometry(1.1, 0),
            new THREE.OctahedronGeometry(0.95, 0),
            new THREE.TorusGeometry(0.9, 0.22, 12, 32),
            new THREE.DodecahedronGeometry(0.85, 0)
        ];

        const solidMat = new THREE.MeshPhysicalMaterial({
            color: pal.primary,
            metalness: 0.25,
            roughness: 0.2,
            transparent: true,
            opacity: isDark ? 0.24 : 0.14,
            clearcoat: 0.8
        });

        const wireMat = new THREE.MeshBasicMaterial({
            color: pal.secondary,
            wireframe: true,
            transparent: true,
            opacity: isDark ? 0.35 : 0.22
        });

        const accentWireMat = new THREE.MeshBasicMaterial({
            color: pal.accent,
            wireframe: true,
            transparent: true,
            opacity: isDark ? 0.32 : 0.2
        });

        const nodeConfigs = [
            { pos: [-9.5, 3.8, -4], scale: 1.35, geoIdx: 0, speed: 0.35, accent: false },
            { pos: [10.2, 3.2, -5], scale: 1.45, geoIdx: 1, speed: 0.28, accent: true },
            { pos: [-7.8, -3.2, -3], scale: 1.1, geoIdx: 2, speed: 0.42, accent: true },
            { pos: [8.8, -2.8, -4], scale: 1.25, geoIdx: 3, speed: 0.31, accent: false },
            { pos: [0, 4.8, -8], scale: 1.6, geoIdx: 2, speed: 0.22, accent: false },
            { pos: [-3.5, -4.0, -6], scale: 0.9, geoIdx: 0, speed: 0.48, accent: true },
            { pos: [4.2, 1.5, -7], scale: 0.95, geoIdx: 1, speed: 0.38, accent: false }
        ];

        const floatingMeshes = nodeConfigs.map((cfg, i) => {
            const holder = new THREE.Group();
            holder.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
            holder.scale.setScalar(cfg.scale);

            const core = new THREE.Mesh(geometries[cfg.geoIdx], solidMat);
            const cage = new THREE.Mesh(geometries[cfg.geoIdx], cfg.accent ? accentWireMat : wireMat);
            cage.scale.setScalar(1.06);

            holder.add(core);
            holder.add(cage);
            crystalGroup.add(holder);

            return {
                holder,
                baseY: cfg.pos[1],
                speed: cfg.speed,
                phase: i * 1.15
            };
        });

        // 3. Spatial Depth Particles
        const particleCount = 70;
        const positions = new Float32Array(particleCount * 3);
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 32;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 18;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 16 - 2;
        }
        const particleGeo = new THREE.BufferGeometry();
        particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const particleMat = new THREE.PointsMaterial({
            color: pal.secondary,
            size: isDark ? 0.14 : 0.12,
            transparent: true,
            opacity: isDark ? 0.55 : 0.35
        });
        const particles = new THREE.Points(particleGeo, particleMat);
        scene.add(particles);

        // Mouse Parallax Tracking
        let targetX = 0;
        let targetY = 0;
        const handleMouseMove = (e) => {
            targetX = ((e.clientX / window.innerWidth) - 0.5) * 2.2;
            targetY = -((e.clientY / window.innerHeight) - 0.5) * 1.4;
        };
        window.addEventListener('mousemove', handleMouseMove, { passive: true });

        const handleResize = () => {
            if (!container) return;
            const w = container.clientWidth || window.innerWidth;
            const h = container.clientHeight || window.innerHeight;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        };
        window.addEventListener('resize', handleResize);

        let frameId;
        const clock = new THREE.Clock();

        const animate = () => {
            frameId = requestAnimationFrame(animate);
            if (document.hidden || document.documentElement.classList.contains('gpu-disabled')) return;

            const t = clock.getElapsedTime();

            // Smooth camera parallax
            camera.position.x += (targetX - camera.position.x) * 0.04;
            camera.position.y += (1.5 + targetY - camera.position.y) * 0.04;
            camera.lookAt(0, 0, -2);

            floatingMeshes.forEach((item) => {
                item.holder.rotation.x = t * item.speed * 0.7 + item.phase;
                item.holder.rotation.y = t * item.speed + item.phase;
                item.holder.position.y = item.baseY + Math.sin(t * item.speed * 2 + item.phase) * 0.45;
            });

            particles.rotation.y = t * 0.03;
            gridHelper.position.z = (t * 0.6) % 1.5;

            renderer.render(scene, camera);
        };

        animate();

        return () => {
            cancelAnimationFrame(frameId);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('resize', handleResize);
            geometries.forEach(g => g.dispose());
            particleGeo.dispose();
            solidMat.dispose();
            wireMat.dispose();
            accentWireMat.dispose();
            particleMat.dispose();
            renderer.dispose();
        };
    }, [enabled, appTheme, isDark]);

    if (!enabled) return null;

    return (
        <div
            ref={mountRef}
            className="fixed inset-0 pointer-events-none z-0 print:hidden overflow-hidden"
            aria-hidden="true"
        />
    );
}

