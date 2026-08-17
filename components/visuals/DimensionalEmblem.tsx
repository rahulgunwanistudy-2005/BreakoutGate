"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

interface DimensionalEmblemProps {
  size?: number;
}

export function DimensionalEmblem({ size = 320 }: DimensionalEmblemProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [webGlSupported, setWebGlSupported] = useState(true);

  useEffect(() => {
    if (!mountRef.current) return;

    // Verify WebGL availability
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl) {
      setWebGlSupported(false);
      return;
    }

    const currentMount = mountRef.current;
    const width = size;
    const height = size;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 4.2;

    // 2. Renderer
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      currentMount.appendChild(renderer.domElement);
    } catch {
      setWebGlSupported(false);
      return;
    }

    // 3. Geometry & Materials: Multi-layered Crystal Core + Wireframe Spectrum
    const group = new THREE.Group();

    // Inner Core
    const innerGeo = new THREE.IcosahedronGeometry(1.2, 2);
    const innerMat = new THREE.MeshStandardMaterial({
      color: 0xdfb15b,
      metalness: 0.85,
      roughness: 0.25,
      wireframe: false,
    });
    const innerMesh = new THREE.Mesh(innerGeo, innerMat);
    group.add(innerMesh);

    // Outer Spectral Wireframe
    const outerGeo = new THREE.IcosahedronGeometry(1.6, 1);
    const outerMat = new THREE.MeshBasicMaterial({
      color: 0xecd18a,
      wireframe: true,
      transparent: true,
      opacity: 0.4,
    });
    const outerMesh = new THREE.Mesh(outerGeo, outerMat);
    group.add(outerMesh);

    // Optical Dimension Nodes (11 cosmetic signal points)
    const nodeGeo = new THREE.SphereGeometry(0.06, 8, 8);
    const nodeMat = new THREE.MeshBasicMaterial({ color: 0x5ec0c7 });
    for (let i = 0; i < 11; i++) {
      const angle = (i / 11) * Math.PI * 2;
      const radius = 1.6;
      const node = new THREE.Mesh(nodeGeo, nodeMat);
      node.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, (Math.sin(angle * 3) * 0.4));
      group.add(node);
    }

    scene.add(group);

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0xdfb15b, 3.5, 50);
    pointLight1.position.set(5, 5, 5);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x5ec0c7, 2.5, 50);
    pointLight2.position.set(-5, -5, 3);
    scene.add(pointLight2);

    // 5. Animation Loop
    let animationFrameId: number;
    let mouseX = 0;
    let mouseY = 0;

    const onMouseMove = (e: MouseEvent) => {
      const rect = currentMount.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / width - 0.5) * 2;
      mouseY = ((e.clientY - rect.top) / height - 0.5) * 2;
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      group.rotation.y += 0.008;
      group.rotation.x += 0.004;

      // Subtle mouse tilt reaction
      group.rotation.y += (mouseX * 0.5 - group.rotation.y) * 0.05;
      group.rotation.x += (mouseY * 0.5 - group.rotation.x) * 0.05;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", onMouseMove);
      if (renderer.domElement && currentMount.contains(renderer.domElement)) {
        currentMount.removeChild(renderer.domElement);
      }
      innerGeo.dispose();
      innerMat.dispose();
      outerGeo.dispose();
      outerMat.dispose();
      nodeGeo.dispose();
      nodeMat.dispose();
      renderer.dispose();
    };
  }, [size]);

  if (!webGlSupported) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: "radial-gradient(circle at 30% 30%, rgba(223, 177, 91, 0.4), rgba(20, 22, 28, 0.9))",
          border: "1px solid rgba(223, 177, 91, 0.3)",
          boxShadow: "0 0 40px rgba(223, 177, 91, 0.15)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span style={{ color: "var(--accent-gold)", fontSize: "0.85rem", letterSpacing: "0.1em" }}>
          OPTICAL SPECTRUM
        </span>
      </div>
    );
  }

  return (
    <div
      ref={mountRef}
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
      aria-label="BreakoutGate 3D Optical Skin Spectrum Visualization"
      role="img"
    />
  );
}
