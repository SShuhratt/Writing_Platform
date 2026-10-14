import { NextResponse } from 'next/server';

export interface Scene3DPreset {
  id: string;
  name: string;
  category: 'hero' | 'chart' | 'badge';
  description: string;
  lighting: {
    ambientIntensity: number;
    directionalColor: string;
    directionalIntensity: number;
    accentColor: string;
  };
  materials: {
    primaryColor: string;
    secondaryColor: string;
    roughness: number;
    metalness: number;
    transmission?: number;
    clearcoat?: number;
  };
  animation: {
    autoRotate: boolean;
    rotationSpeed: number;
    floatIntensity: number;
  };
}

export const PRESETS_3D: Record<string, Scene3DPreset> = {
  'hero-mentor-core': {
    id: 'hero-mentor-core',
    name: 'Socratic AI Core Emblem',
    category: 'hero',
    description: 'Holographic academic nucleus with counter-rotating Band 9 orbital rings and star constellation.',
    lighting: {
      ambientIntensity: 0.8,
      directionalColor: '#818cf8',
      directionalIntensity: 1.5,
      accentColor: '#f59e0b',
    },
    materials: {
      primaryColor: '#4f46e5',
      secondaryColor: '#f59e0b',
      roughness: 0.15,
      metalness: 0.85,
      clearcoat: 0.9,
    },
    animation: {
      autoRotate: true,
      rotationSpeed: 0.8,
      floatIntensity: 1.2,
    },
  },
  'task1-3d-bars': {
    id: 'task1-3d-bars',
    name: '3D Academic Data Prism',
    category: 'chart',
    description: 'Interactive 3D bar & cylinder visualization for IELTS Task 1 Academic data analysis.',
    lighting: {
      ambientIntensity: 0.9,
      directionalColor: '#ffffff',
      directionalIntensity: 1.8,
      accentColor: '#6366f1',
    },
    materials: {
      primaryColor: '#6366f1',
      secondaryColor: '#10b981',
      roughness: 0.3,
      metalness: 0.6,
    },
    animation: {
      autoRotate: false,
      rotationSpeed: 0.5,
      floatIntensity: 0,
    },
  },
  'band-medal-gold': {
    id: 'band-medal-gold',
    name: 'Band 9.0 Master Medal',
    category: 'badge',
    description: 'Ultra-reflective 3D physical gold medal awarded upon achieving target score in evaluation.',
    lighting: {
      ambientIntensity: 0.7,
      directionalColor: '#fef08a',
      directionalIntensity: 2.2,
      accentColor: '#fbbf24',
    },
    materials: {
      primaryColor: '#f59e0b',
      secondaryColor: '#fbbf24',
      roughness: 0.1,
      metalness: 0.95,
      clearcoat: 1.0,
    },
    animation: {
      autoRotate: true,
      rotationSpeed: 1.2,
      floatIntensity: 0.8,
    },
  },
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const id = searchParams.get('id');

  if (id && PRESETS_3D[id]) {
    return NextResponse.json({ success: true, preset: PRESETS_3D[id] });
  }

  if (category) {
    const filtered = Object.values(PRESETS_3D).filter(p => p.category === category);
    return NextResponse.json({ success: true, presets: filtered });
  }

  return NextResponse.json({
    success: true,
    presets: Object.values(PRESETS_3D),
    capabilities: {
      engine: 'Three.js / React Three Fiber',
      supportsOrbitControls: true,
      supportsProceduralCharts: true,
      supportsPhysicalShaders: true,
      supportsMouseParallax: true,
    },
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { presetId, customOverrides } = body;

    const basePreset = PRESETS_3D[presetId] || PRESETS_3D['hero-mentor-core'];
    const customized = {
      ...basePreset,
      ...customOverrides,
      materials: { ...basePreset.materials, ...(customOverrides?.materials || {}) },
      lighting: { ...basePreset.lighting, ...(customOverrides?.lighting || {}) },
      animation: { ...basePreset.animation, ...(customOverrides?.animation || {}) },
    };

    return NextResponse.json({
      success: true,
      configuredPreset: customized,
      appliedAt: Date.now(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to apply 3D design parameters' },
      { status: 400 }
    );
  }
}
