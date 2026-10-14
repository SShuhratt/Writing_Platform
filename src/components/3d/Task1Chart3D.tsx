'use client';

import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text, Float } from '@react-three/drei';

export interface DataPoint3D {
  label: string;
  value: number;
  color?: string;
  group?: string;
}

interface Task1Chart3DProps {
  title?: string;
  data?: DataPoint3D[];
  unit?: string;
}

const DEFAULT_DATA: DataPoint3D[] = [
  { label: 'Energy', value: 75, color: '#6366f1' },
  { label: 'Transport', value: 92, color: '#f59e0b' },
  { label: 'Industry', value: 64, color: '#10b981' },
  { label: 'Agriculture', value: 48, color: '#ec4899' },
  { label: 'Residential', value: 83, color: '#3b82f6' },
];

function Bar3D({
  x,
  height,
  color,
  label,
  value,
  unit,
}: {
  x: number;
  height: number;
  color: string;
  label: string;
  value: number;
  unit: string;
}) {
  const [hovered, setHovered] = useState(false);
  const normalizedHeight = Math.max(0.4, (height / 100) * 3);

  return (
    <group position={[x, 0, 0]}>
      {/* 3D Bar Cylinder / Box */}
      <mesh
        position={[0, normalizedHeight / 2, 0]}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[0.55, normalizedHeight, 0.55]} />
        <meshStandardMaterial
          color={hovered ? '#ffffff' : color}
          roughness={0.2}
          metalness={0.7}
          emissive={hovered ? color : '#000000'}
          emissiveIntensity={hovered ? 0.6 : 0}
        />
      </mesh>

      {/* Value Floating Label in 3D */}
      <Text
        position={[0, normalizedHeight + 0.35, 0]}
        fontSize={0.25}
        color={hovered ? '#f59e0b' : '#ffffff'}
        anchorX="center"
        anchorY="middle"
      >
        {`${value}${unit}`}
      </Text>

      {/* Category X-Axis Label */}
      <Text
        position={[0, -0.3, 0.4]}
        rotation={[-Math.PI / 4, 0, 0]}
        fontSize={0.2}
        color="#cbd5e1"
        anchorX="center"
        anchorY="middle"
      >
        {label}
      </Text>
    </group>
  );
}

function GridFloor() {
  return (
    <group position={[0, -0.05, 0]}>
      <gridHelper args={[8, 8, '#4f46e5', '#334155']} />
    </group>
  );
}

export default function Task1Chart3D({
  title = 'Interactive 3D Data Representation',
  data = DEFAULT_DATA,
  unit = '%',
}: Task1Chart3DProps) {
  const [autoRotate, setAutoRotate] = useState(false);
  const spacing = 1.1;
  const startX = -((data.length - 1) * spacing) / 2;

  return (
    <div className="w-full flex flex-col rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl relative">
      {/* Header Bar */}
      <div className="px-4 py-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-bold text-white tracking-wide">{title}</span>
          <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px]">
            WebGL 3D
          </span>
        </div>

        <button
          onClick={() => setAutoRotate(!autoRotate)}
          className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-colors ${
            autoRotate
              ? 'bg-brand-600 border-brand-500 text-white'
              : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
          }`}
        >
          {autoRotate ? 'Pause 3D Orbit' : 'Auto-Orbit 3D'}
        </button>
      </div>

      {/* 3D Canvas */}
      <div className="w-full h-[320px] sm:h-[380px] relative">
        <Canvas camera={{ position: [0, 3.2, 5.5], fov: 42 }}>
          <ambientLight intensity={0.9} />
          <directionalLight position={[6, 8, 4]} intensity={2.0} color="#ffffff" />
          <pointLight position={[-4, 2, -2]} intensity={1.2} color="#818cf8" />

          <group position={[0, -0.6, 0]}>
            <GridFloor />
            {data.map((item, idx) => (
              <Bar3D
                key={item.label}
                x={startX + idx * spacing}
                height={item.value}
                color={item.color || '#6366f1'}
                label={item.label}
                value={item.value}
                unit={unit}
              />
            ))}
          </group>

          <OrbitControls
            autoRotate={autoRotate}
            autoRotateSpeed={2.0}
            enableZoom={true}
            maxPolarAngle={Math.PI / 2.1}
            minDistance={3}
            maxDistance={10}
          />
        </Canvas>

        {/* 3D Interaction Hint */}
        <div className="absolute bottom-3 left-4 text-[11px] text-slate-400 bg-slate-900/80 px-2.5 py-1 rounded-md border border-slate-800 backdrop-blur-sm pointer-events-none">
          Click & drag to rotate in 3D • Scroll to zoom
        </div>
      </div>
    </div>
  );
}
