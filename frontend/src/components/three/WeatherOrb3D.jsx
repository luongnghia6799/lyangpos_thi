import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * WeatherOrb3D - 3D WebGL Atmospheric & Solar/Lunar Biosphere Widget for Dashboard
 */
export default function WeatherOrb3D({
    temp = 28,
    desc = '',
    size = 78,
    isDark = false,
    className = ''
}) {
    const mountRef = useRef(null);

    const isRain = /mưa|dông|bão/i.test(desc);
    const isNight = /đêm|tối/i.test(desc) || new Date().getHours() >= 18 || new Date().getHours() < 5;

    useEffect(() => {
        const container = mountRef.current;
        if (!container) return;

        if (document.documentElement.classList.contains('gpu-disabled')) {
            container.innerHTML = '';
            return;
        }

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 50);
        camera.position.set(0, 0.4, 4.4);
        camera.lookAt(0, 0, 0);

        let renderer;
        try {
            renderer = new THREE.WebGLRenderer({
                alpha: true,
                antialias: true,
                powerPreference: 'low-power'
            });
        } catch (e) {
            return;
        }

        renderer.setSize(size, size);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        container.innerHTML = '';
        container.appendChild(renderer.domElement);

        const ambient = new THREE.AmbientLight(0xffffff, 0.9);
        scene.add(ambient);

        const mainColor = isRain
            ? 0x38bdf8
            : isNight
                ? 0x818cf8
                : temp >= 31
                    ? 0xf59e0b
                    : 0x10b981;

        const subColor = isRain
            ? 0x0284c7
            : isNight
                ? 0x38bdf8
                : 0xfbbf24;

        const pointLight = new THREE.PointLight(mainColor, 2.5, 12);
        pointLight.position.set(2, 2, 3);
        scene.add(pointLight);

        const group = new THREE.Group();
        scene.add(group);

        // 1. Central 3D Celestial Sphere (Sun / Moon / Rain Core)
        const coreGeo = new THREE.IcosahedronGeometry(0.88, 2);
        const coreMat = new THREE.MeshPhysicalMaterial({
            color: mainColor,
            emissive: mainColor,
            emissiveIntensity: 0.42,
            roughness: 0.2,
            metalness: 0.25,
            clearcoat: 0.9,
            flatShading: true
        });
        const coreMesh = new THREE.Mesh(coreGeo, coreMat);
        group.add(coreMesh);

        // 2. Equatorial & Meridian 3D Rings
        const ring1Geo = new THREE.TorusGeometry(1.32, 0.032, 12, 56);
        const ring1Mat = new THREE.MeshBasicMaterial({
            color: subColor,
            transparent: true,
            opacity: 0.72
        });
        const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
        ring1.rotation.x = Math.PI / 2.6;
        group.add(ring1);

        const ring2Geo = new THREE.TorusGeometry(1.56, 0.022, 12, 56);
        const ring2Mat = new THREE.MeshBasicMaterial({
            color: mainColor,
            transparent: true,
            opacity: 0.45
        });
        const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
        ring2.rotation.y = Math.PI / 3;
        ring2.rotation.x = -Math.PI / 4;
        group.add(ring2);

        // 3. Orbiting satellite / weather droplets
        const satGroup = new THREE.Group();
        const satCount = isRain ? 8 : 5;
        const satGeo = new THREE.OctahedronGeometry(0.11, 0);
        const satMat = new THREE.MeshBasicMaterial({ color: subColor });
        for (let i = 0; i < satCount; i++) {
            const m = new THREE.Mesh(satGeo, satMat);
            const angle = (i / satCount) * Math.PI * 2;
            const r = 1.42;
            m.position.set(Math.cos(angle) * r, Math.sin(angle * 2) * 0.35, Math.sin(angle) * r);
            satGroup.add(m);
        }
        group.add(satGroup);

        let rafId = null;
        let t = 0;

        const animate = () => {
            rafId = requestAnimationFrame(animate);
            if (document.hidden) return;

            t += 0.02;
            coreMesh.rotation.y = t * 0.7;
            coreMesh.rotation.x = Math.sin(t * 0.5) * 0.25;
            const pulse = 1 + Math.sin(t * 2.2) * 0.04;
            coreMesh.scale.set(pulse, pulse, pulse);

            ring1.rotation.z = t * 0.9;
            ring2.rotation.x = -Math.PI / 4 + Math.cos(t * 0.6) * 0.3;
            ring2.rotation.y = t * 0.5;

            satGroup.rotation.y = -t * 1.1;

            renderer.render(scene, camera);
        };

        animate();

        return () => {
            if (rafId) cancelAnimationFrame(rafId);
            scene.traverse((obj) => {
                if (obj.geometry) obj.geometry.dispose();
                if (obj.material) obj.material.dispose();
            });
            renderer.dispose();
        };
    }, [temp, desc, isRain, isNight, size, isDark]);

    return (
        <div
            ref={mountRef}
            style={{ width: size, height: size }}
            className={`relative inline-flex items-center justify-center shrink-0 pointer-events-none select-none ${className}`}
        />
    );
}

