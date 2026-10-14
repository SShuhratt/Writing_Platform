'use client';

import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

// 3D Graduation Cap & Socratic AI Core
function SocraticCore() {
  const coreRef = useRef<THREE.Group>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const capDiamondRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (coreRef.current) {
      // Gentle floating rotation
      coreRef.current.rotation.y += delta * 0.4;
    }
    if (ring1Ref.current) {
      ring1Ref.current.rotation.x += delta * 0.7;
      ring1Ref.current.rotation.y += delta * 0.5;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.y -= delta * 0.6;
      ring2Ref.current.rotation.z += delta * 0.4;
    }
    if (capDiamondRef.current) {
      capDiamondRef.current.rotation.y += delta * 0.3;
    }
  });

  return (
    <group ref={coreRef}>
      {/* Central Glowing Socratic Nucleus */}
      <mesh>
        <octahedronGeometry args={[0.9, 2]} />
        <meshPhysicalMaterial
          color="#4f46e5"
          emissive="#6366f1"
          emissiveIntensity={0.6}
          roughness={0.1}
          metalness={0.9}
          clearcoat={1}
          clearcoatRoughness={0.1}
          wireframe={false}
        />
      </mesh>

      {/* Graduation Cap Top (Diamond Rhombus) */}
      <mesh ref={capDiamondRef} position={[0, 1.25, 0]} rotation={[0.4, 0.4, 0]}>
        <boxGeometry args={[1.5, 0.08, 1.5]} />
        <meshStandardMaterial
          color="#1e1b4b"
          roughness={0.3}
          metalness={0.8}
        />
      </mesh>

      {/* Golden Band 9.0 Tassel & Button */}
      <mesh position={[0, 1.35, 0]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial
          color="#f59e0b"
          metalness={0.95}
          roughness={0.1}
          emissive="#d97706"
          emissiveIntensity={0.4}
        />
      </mesh>

      {/* Outer Orbital Ring 1 (Brand Indigo) */}
      <mesh ref={ring1Ref}>
        <torusGeometry args={[1.7, 0.04, 16, 64]} />
        <meshStandardMaterial
          color="#818cf8"
          emissive="#4f46e5"
          emissiveIntensity={0.8}
          roughness={0.2}
          metalness={0.9}
        />
      </mesh>

      {/* Outer Orbital Ring 2 (Golden Band 9.0) */}
      <mesh ref={ring2Ref} rotation={[Math.PI / 3, 0, 0]}>
        <torusGeometry args={[2.0, 0.03, 16, 64]} />
        <meshStandardMaterial
          color="#fbbf24"
          emissive="#f59e0b"
          emissiveIntensity={0.7}
          roughness={0.1}
          metalness={0.95}
        />
      </mesh>
    </group>
  );
}

// Scene Root with Lighting and Camera Interaction
export default function HeroScene() {
  return (
    <div className="w-full h-[400px] sm:h-[460px] relative">
      <Canvas
        camera={{ position: [0, 0, 5.5], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={0.9} />
        <directionalLight position={[5, 6, 4]} intensity={2.0} color="#c7d2fe" />
        <pointLight position={[-4, -3, -2]} intensity={1.5} color="#fbbf24" />
        <spotLight position={[0, 5, 2]} intensity={2.5} angle={0.6} penumbra={0.8} color="#818cf8" />

        <Float speed={2.5} rotationIntensity={0.6} floatIntensity={1.2}>
          <SocraticCore />
        </Float>

        {/* Ambient Floating Gold & Indigo Dust */}
        <Sparkles
          count={45}
          scale={5.5}
          size={2.5}
          speed={0.4}
          color="#fbbf24"
        />
        <Sparkles
          count={35}
          scale={6.0}
          size={2.0}
          speed={0.3}
          color="#818cf8"
        />
      </Canvas>
    </div>
  );
}
