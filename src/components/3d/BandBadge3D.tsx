'use client';

import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Text, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

function MedalMesh({ bandScore }: { bandScore: number | string }) {
  const meshRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.7;
    }
  });

  const isHighBand = Number(bandScore) >= 7.5;
  const primaryColor = isHighBand ? '#f59e0b' : '#6366f1';
  const rimColor = isHighBand ? '#fbbf24' : '#818cf8';

  return (
    <group ref={meshRef}>
      {/* Outer Medal Coin */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.3, 1.3, 0.15, 48]} />
        <meshPhysicalMaterial
          color={primaryColor}
          emissive={primaryColor}
          emissiveIntensity={0.2}
          roughness={0.12}
          metalness={0.92}
          clearcoat={1}
          clearcoatRoughness={0.1}
        />
      </mesh>

      {/* Raised Outer Ring Rim */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.22, 0.08, 16, 48]} />
        <meshStandardMaterial
          color={rimColor}
          metalness={0.95}
          roughness={0.1}
          emissive={rimColor}
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* Front Face Text "BAND" */}
      <Text
        position={[0, 0.35, 0.1]}
        fontSize={0.25}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        fontWeight="bold"
      >
        BAND
      </Text>

      {/* Front Face Score Number (e.g. "8.0") */}
      <Text
        position={[0, -0.15, 0.1]}
        fontSize={0.65}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        fontWeight="black"
      >
        {String(bandScore)}
      </Text>

      {/* Back Face Text "IELTS AI" */}
      <Text
        position={[0, 0, -0.1]}
        rotation={[0, Math.PI, 0]}
        fontSize={0.28}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        fontWeight="bold"
      >
        IELTS MENTOR
      </Text>
    </group>
  );
}

export default function BandBadge3D({ bandScore = 8.0 }: { bandScore?: number | string }) {
  return (
    <div className="w-[180px] h-[180px] sm:w-[220px] sm:h-[220px] relative mx-auto">
      <Canvas camera={{ position: [0, 0, 3.8], fov: 42 }}>
        <ambientLight intensity={0.9} />
        <directionalLight position={[4, 5, 3]} intensity={2.2} color="#fef08a" />
        <pointLight position={[-3, -2, -1]} intensity={1.5} color="#6366f1" />

        <Float speed={2.5} rotationIntensity={0.4} floatIntensity={0.8}>
          <MedalMesh bandScore={bandScore} />
        </Float>

        <Sparkles count={25} scale={3.2} size={2.0} speed={0.4} color="#fbbf24" />
      </Canvas>
    </div>
  );
}
