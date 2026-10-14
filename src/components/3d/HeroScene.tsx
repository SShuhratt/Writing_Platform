'use client';

import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sparkles, MeshDistortMaterial, ContactShadows, PresentationControls } from '@react-three/drei';
import * as THREE from 'three';

// 4 IELTS Criteria Criteria Satellites
const SATELLITES = [
  { name: 'TR', label: 'Task Response', color: '#f59e0b', emissive: '#fbbf24', radius: 1.95, speed: 1.1, phase: 0 },
  { name: 'CC', label: 'Coherence & Cohesion', color: '#38bdf8', emissive: '#0ea5e9', radius: 2.15, speed: -0.9, phase: Math.PI * 0.5 },
  { name: 'LR', label: 'Lexical Resource', color: '#10b981', emissive: '#34d399', radius: 2.35, speed: 1.3, phase: Math.PI },
  { name: 'GRA', label: 'Grammar Accuracy', color: '#ec4899', emissive: '#f472b6', radius: 2.55, speed: -1.0, phase: Math.PI * 1.5 },
];

function OrbitingSatellite({ config }: { config: typeof SATELLITES[0] }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime() * config.speed + config.phase;
    const x = Math.cos(t) * config.radius;
    const z = Math.sin(t) * config.radius;
    const y = Math.sin(t * 2) * 0.35;

    if (meshRef.current) {
      meshRef.current.position.set(x, y, z);
      // Gentle self-spin
      meshRef.current.rotation.y += 0.03;
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.09, 32, 32]} />
      <meshStandardMaterial
        color={config.color}
        emissive={config.emissive}
        emissiveIntensity={2.5}
        roughness={0.1}
        metalness={0.9}
      />
      <pointLight ref={glowRef} distance={1.2} intensity={1.5} color={config.emissive} />
    </mesh>
  );
}

// Fluid Socratic AI Core with Multi-Axis Gyroscopes & Parallax Rig
function SocraticFluidCore({ isHovered, isBoosted }: { isHovered: boolean; isBoosted: boolean }) {
  const rigRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const glassShellRef = useRef<THREE.Mesh>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const ring3Ref = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();

    // 1. Smooth Spring Parallax (Follows Cursor)
    if (rigRef.current) {
      const targetRotX = -state.pointer.y * 0.35;
      const targetRotY = state.pointer.x * 0.45;
      rigRef.current.rotation.x = THREE.MathUtils.lerp(rigRef.current.rotation.x, targetRotX, 0.06);
      rigRef.current.rotation.y = THREE.MathUtils.lerp(rigRef.current.rotation.y, targetRotY, 0.06);
    }

    // 2. Liquid Core Breathing & Pulsing
    if (coreRef.current) {
      const pulseSpeed = isBoosted ? 4.5 : 1.8;
      const pulseAmp = isBoosted ? 0.12 : 0.05;
      const scale = 1 + Math.sin(t * pulseSpeed) * pulseAmp;
      coreRef.current.scale.set(scale, scale, scale);
      coreRef.current.rotation.y += delta * 0.4;
      coreRef.current.rotation.z += delta * 0.2;
    }

    // 3. Outer Glass Shell counter-rotation
    if (glassShellRef.current) {
      glassShellRef.current.rotation.y -= delta * 0.25;
      glassShellRef.current.rotation.x += delta * 0.15;
    }

    // 4. Harmonic Triple Gyroscopic Rings
    const ringSpeedMultiplier = isBoosted ? 2.2 : isHovered ? 1.4 : 1.0;
    
    // Ring 1 (Gold Band 9 Ring): pitch and yaw undulating
    if (ring1Ref.current) {
      ring1Ref.current.rotation.x += delta * 0.8 * ringSpeedMultiplier;
      ring1Ref.current.rotation.y += delta * 0.5 * ringSpeedMultiplier;
      ring1Ref.current.rotation.z = Math.sin(t * 0.7) * 0.2;
    }

    // Ring 2 (Electric Indigo Ring): counter-precession
    if (ring2Ref.current) {
      ring2Ref.current.rotation.y -= delta * 0.7 * ringSpeedMultiplier;
      ring2Ref.current.rotation.z += delta * 0.6 * ringSpeedMultiplier;
      ring2Ref.current.rotation.x = Math.cos(t * 0.6) * 0.25;
    }

    // Ring 3 (Outer Platinum Ring): steady celestial rotation
    if (ring3Ref.current) {
      ring3Ref.current.rotation.z += delta * 0.45 * ringSpeedMultiplier;
      ring3Ref.current.rotation.x -= delta * 0.35 * ringSpeedMultiplier;
    }
  });

  return (
    <group ref={rigRef}>
      {/* 1. Fluid Liquid Metallic Core (Morphing) */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[0.95, 64, 64]} />
        <MeshDistortMaterial
          color="#4f46e5"
          emissive="#3730a3"
          emissiveIntensity={0.8}
          roughness={0.12}
          metalness={0.85}
          clearcoat={1}
          clearcoatRoughness={0.1}
          distort={isBoosted ? 0.55 : 0.35}
          speed={isBoosted ? 4.2 : 2.5}
        />
      </mesh>

      {/* 2. Outer Translucent Glass Cage (Facetted Icosahedron with Smooth Normals) */}
      <mesh ref={glassShellRef}>
        <icosahedronGeometry args={[1.25, 2]} />
        <meshPhysicalMaterial
          color="#818cf8"
          emissive="#6366f1"
          emissiveIntensity={0.3}
          roughness={0.05}
          metalness={0.2}
          transmission={0.65}
          thickness={0.8}
          transparent
          opacity={0.45}
          wireframe={true}
        />
      </mesh>

      {/* 3. Gyroscopic Ring 1 (Polished Gold Band 9) */}
      <mesh ref={ring1Ref}>
        <torusGeometry args={[1.75, 0.035, 32, 100]} />
        <meshPhysicalMaterial
          color="#f59e0b"
          emissive="#d97706"
          emissiveIntensity={0.6}
          roughness={0.08}
          metalness={0.96}
          clearcoat={1}
        />
      </mesh>

      {/* 4. Gyroscopic Ring 2 (Electric Violet/Indigo) */}
      <mesh ref={ring2Ref} rotation={[Math.PI / 3, 0, 0]}>
        <torusGeometry args={[2.1, 0.03, 32, 100]} />
        <meshPhysicalMaterial
          color="#6366f1"
          emissive="#4f46e5"
          emissiveIntensity={0.8}
          roughness={0.1}
          metalness={0.92}
          clearcoat={1}
        />
      </mesh>

      {/* 5. Gyroscopic Ring 3 (Outer Cyan Band) */}
      <mesh ref={ring3Ref} rotation={[-Math.PI / 4, 0, Math.PI / 6]}>
        <torusGeometry args={[2.45, 0.02, 32, 100]} />
        <meshStandardMaterial
          color="#38bdf8"
          emissive="#0284c7"
          emissiveIntensity={0.9}
          roughness={0.15}
          metalness={0.9}
        />
      </mesh>

      {/* 6. Orbiting IELTS Criteria Satellites */}
      {SATELLITES.map((sat) => (
        <OrbitingSatellite key={sat.name} config={sat} />
      ))}
    </group>
  );
}

// Scene Root with Interactive Camera, Sparkle Nebula & Ground Shadows
export default function HeroScene() {
  const [isHovered, setIsHovered] = useState(false);
  const [isBoosted, setIsBoosted] = useState(false);

  return (
    <div 
      className="w-full h-[400px] sm:h-[460px] relative select-none cursor-grab active:cursor-grabbing overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900/40 via-indigo-950/20 to-slate-950/60 backdrop-blur-sm border border-indigo-500/10"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsBoosted(false);
      }}
      onClick={() => setIsBoosted(prev => !prev)}
      title="Click to boost energy • Move cursor to tilt • Drag to inspect 360°"
    >
      {/* Ambient Radial Color Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-gradient-to-tr from-brand-600/30 via-indigo-600/25 to-amber-500/20 rounded-full blur-3xl pointer-events-none" />

      {/* Interactive HUD Overlay */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="text-[10px] font-mono tracking-wider uppercase text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
          Socratic Neural Core {isBoosted ? '• Hyper-Speed' : '• Active'}
        </span>
      </div>

      <div className="absolute top-3 right-3 z-10">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsBoosted(prev => !prev);
          }}
          className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 border ${
            isBoosted
              ? 'bg-amber-500 text-gray-950 border-amber-400 shadow-lg shadow-amber-500/30 font-black'
              : 'bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-md'
          }`}
        >
          <span>{isBoosted ? '⚡ Boosted' : '⚡ Boost Energy'}</span>
        </button>
      </div>

      <Canvas
        camera={{ position: [0, 0, 5.8], fov: 45 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={0.9} />
        <directionalLight position={[6, 7, 5]} intensity={2.4} color="#e0e7ff" />
        <directionalLight position={[-6, -4, -3]} intensity={1.2} color="#fbbf24" />
        <pointLight position={[0, 0, 3.5]} intensity={1.8} color="#818cf8" distance={8} />

        <PresentationControls
          global={false}
          snap={true}
          speed={1.5}
          zoom={0.85}
          polar={[-Math.PI / 4, Math.PI / 4]}
          azimuth={[-Math.PI / 3, Math.PI / 3]}
        >
          <Float speed={2.4} rotationIntensity={0.5} floatIntensity={0.9}>
            <SocraticFluidCore isHovered={isHovered} isBoosted={isBoosted} />
          </Float>
        </PresentationControls>

        {/* Dynamic Dual-Layer Sparkle Nebula */}
        <Sparkles
          count={50}
          scale={6.5}
          size={2.8}
          speed={isBoosted ? 1.2 : 0.45}
          color="#fbbf24"
        />
        <Sparkles
          count={40}
          scale={7.5}
          size={2.2}
          speed={isBoosted ? 1.0 : 0.35}
          color="#818cf8"
        />
        <Sparkles
          count={30}
          scale={8.0}
          size={1.8}
          speed={0.25}
          color="#38bdf8"
        />

        {/* Soft Volumetric Ground Shadow */}
        <ContactShadows
          position={[0, -2.4, 0]}
          opacity={0.65}
          scale={6.5}
          blur={2.5}
          far={4.5}
          color="#312e81"
        />
      </Canvas>

      {/* Bottom Hint */}
      <div className="absolute bottom-2.5 inset-x-0 flex items-center justify-center gap-3 text-[11px] text-slate-400 font-medium pointer-events-none">
        <span>Drag to rotate</span>
        <span>•</span>
        <span>Cursor tilts view</span>
        <span>•</span>
        <span className="text-amber-400 font-semibold">Click to boost</span>
      </div>
    </div>
  );
}
