import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * AiOrb3D - 3D WebGL Energy Core & Gyroscope for LyangPOS AI Consultant
 * Reacts dynamically to `active` / `thinking` states with orbital rings & crystalline core.
 */
export default function AiOrb3D({ size = 56, isThinking = false, className = '' }) {
    const mountRef = useRef(null);
    const thinkingRef = useRef(isThinking);

    useEffect(() => {
        thinkingRef.current = isThinking;
    }, [isThinking]);

    useEffect(() => {
        const container = mountRef.current;
        if (!container) return;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 20);
        camera.position.z = 4.2;

        let renderer;
        try {
            renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        } catch (err) {
            return;
        }

        renderer.setSize(size, size);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        container.innerHTML = '';
        container.appendChild(renderer.domElement);

        const group = new THREE.Group();
        scene.add(group);

        // Ambient & Point Lights
        scene.add(new THREE.AmbientLight(0xffffff, 0.9));
        const pLight1 = new THREE.PointLight(0x2dd4bf, 2.5, 10);
        pLight1.position.set(2, 2, 3);
        scene.add(pLight1);

        const pLight2 = new THREE.PointLight(0xf59e0b, 1.8, 10);
        pLight2.position.set(-2, -2, 2);
        scene.add(pLight2);

        // Inner Crystalline Core
        const coreGeo = new THREE.IcosahedronGeometry(0.88, 1);
        const coreMat = new THREE.MeshPhysicalMaterial({
            color: 0x10b981,
            emissive: 0x059669,
            emissiveIntensity: 0.45,
            metalness: 0.3,
            roughness: 0.15,
            clearcoat: 1.0,
            wireframe: false
        });
        const coreMesh = new THREE.Mesh(coreGeo, coreMat);
        group.add(coreMesh);

        // Wireframe Geodesic Shell
        const shellGeo = new THREE.IcosahedronGeometry(1.06, 1);
        const shellMat = new THREE.MeshBasicMaterial({
            color: 0x5eead4,
            wireframe: true,
            transparent: true,
            opacity: 0.55
        });
        const shellMesh = new THREE.Mesh(shellGeo, shellMat);
        group.add(shellMesh);

        // Gyroscopic Orbital Rings
        const ringGeo1 = new THREE.TorusGeometry(1.38, 0.035, 12, 48);
        const ringMat1 = new THREE.MeshBasicMaterial({
            color: 0x34d399,
            transparent: true,
            opacity: 0.75
        });
        const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
        ring1.rotation.x = Math.PI / 2.6;
        group.add(ring1);

        const ringGeo2 = new THREE.TorusGeometry(1.52, 0.028, 12, 48);
        const ringMat2 = new THREE.MeshBasicMaterial({
            color: 0xfbbf24,
            transparent: true,
            opacity: 0.55
        });
        const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
        ring2.rotation.y = Math.PI / 3;
        group.add(ring2);

        let frameId;
        const clock = new THREE.Clock();

        const animate = () => {
            frameId = requestAnimationFrame(animate);
            if (document.hidden) return;

            const t = clock.getElapsedTime();
            const speed = thinkingRef.current ? 3.2 : 1.0;

            coreMesh.rotation.y = t * 0.8 * speed;
            coreMesh.rotation.x = t * 0.5 * speed;

            shellMesh.rotation.y = -t * 0.6 * speed;
            shellMesh.rotation.z = t * 0.4 * speed;

            ring1.rotation.z = t * 1.1 * speed;
            ring1.rotation.x = Math.PI / 2.6 + Math.sin(t * 1.5) * 0.25;

            ring2.rotation.x = t * 0.9 * speed;
            ring2.rotation.y = Math.PI / 3 + Math.cos(t * 1.2) * 0.3;

            const pulse = 1 + Math.sin(t * (thinkingRef.current ? 6 : 2.2)) * (thinkingRef.current ? 0.08 : 0.04);
            coreMesh.scale.setScalar(pulse);

            renderer.render(scene, camera);
        };

        animate();

        return () => {
            cancelAnimationFrame(frameId);
            coreGeo.dispose();
            coreMat.dispose();
            shellGeo.dispose();
            shellMat.dispose();
            ringGeo1.dispose();
            ringMat1.dispose();
            ringGeo2.dispose();
            ringMat2.dispose();
            renderer.dispose();
        };
    }, [size]);

    return (
        <div
            ref={mountRef}
            style={{ width: size, height: size }}
            className={`inline-flex items-center justify-center shrink-0 select-none pointer-events-none ${className}`}
        />
    );
}

