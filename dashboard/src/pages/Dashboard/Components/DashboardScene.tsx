import { Canvas, useFrame } from "@react-three/fiber";
import React, { useMemo, useRef } from "react";
import { useTheme } from "src/contexts/ThemeContext";
import * as THREE from "three";

/* ─────────────────────────────────────────────
 *  Dashboard Particle Network — ambient IoT
 *  background with floating sensor nodes and
 *  luminous data beams. Rendered behind all
 *  dashboard panels with pointer-events: none.
 *
 *  Theme-aware: soft blush in light,
 *  deep ember glow in dark.
 * ───────────────────────────────────────────── */

const PARTICLE_COUNT = 200;
const CONNECTION_DISTANCE = 5;

const THEME_COLORS = {
  light: {
    primary: "#e11d48",
    secondary: "#fda4af",
    tertiary: "#f0e5e5",
    bg: "#fdf8f8",
    particleOpacity: 0.3,
    lineOpacity: 0.08,
    orbOpacity: 0.04,
  },
  dark: {
    primary: "#f43f5e",
    secondary: "#881337",
    tertiary: "#2d2626",
    bg: "#0f0d0d",
    particleOpacity: 0.4,
    lineOpacity: 0.15,
    orbOpacity: 0.06,
  },
};

type SceneColors = (typeof THEME_COLORS)["light"];

const axisLimit = (a: "x" | "y" | "z"): number => {
  if (a === "x") return 7.5;
  if (a === "y") return 5.5;
  return 4.5;
};

/* ── Floating particles ── */
const Particles: React.FC<{ colors: SceneColors }> = ({ colors }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const particles = useMemo(() => {
    const arr = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      arr.push({
        pos: new THREE.Vector3(
          (Math.random() - 0.5) * 14,
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 8,
        ),
        vel: new THREE.Vector3(
          (Math.random() - 0.5) * 0.002,
          (Math.random() - 0.5) * 0.002,
          (Math.random() - 0.5) * 0.001,
        ),
        baseScale: 0.005 + Math.random() * 0.008,
        phase: Math.random() * Math.PI * 2,
      });
    }
    return arr;
  }, []);

  useFrame(({ clock }: { clock: THREE.Clock }) => {
    const t = clock.getElapsedTime();
    particles.forEach((p, i) => {
      p.pos.add(p.vel);
      (["x", "y", "z"] as const).forEach((a) => {
        const limit = axisLimit(a);
        if (p.pos[a] > limit) p.pos[a] = -limit;
        if (p.pos[a] < -limit) p.pos[a] = limit;
      });
      const s = p.baseScale * (1 + 0.3 * Math.sin(t * 0.8 + p.phase));
      dummy.position.copy(p.pos);
      dummy.scale.setScalar(s);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, PARTICLE_COUNT]}>
      <sphereGeometry args={[1, 10, 10]} />
      <meshBasicMaterial
        color={colors.primary}
        transparent
        opacity={colors.particleOpacity}
      />
    </instancedMesh>
  );
};

/* ── Connection lines between nearby particles ── */
const Connections: React.FC<{ colors: SceneColors }> = ({ colors }) => {
  const lineRef = useRef<THREE.LineSegments>(null!);
  const MAX_LINES = 500;
  const colorsRef = useRef(colors);
  colorsRef.current = colors;

  const particles = useMemo(() => {
    const arr = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      arr.push({
        pos: new THREE.Vector3(
          (Math.random() - 0.5) * 14,
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 8,
        ),
        vel: new THREE.Vector3(
          (Math.random() - 0.5) * 0.002,
          (Math.random() - 0.5) * 0.002,
          (Math.random() - 0.5) * 0.001,
        ),
      });
    }
    return arr;
  }, []);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(MAX_LINES * 6);
    const geoColors = new Float32Array(MAX_LINES * 6);
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(geoColors, 3));
    geo.setDrawRange(0, 0);
    return geo;
  }, []);

  useFrame(() => {
    const cc = colorsRef.current;
    const secondaryColor = new THREE.Color(cc.secondary);
    const tertiaryColor = new THREE.Color(cc.tertiary);

    particles.forEach((p) => {
      p.pos.add(p.vel);
      (["x", "y", "z"] as const).forEach((a) => {
        const limit = axisLimit(a);
        if (p.pos[a] > limit) p.pos[a] = -limit;
        if (p.pos[a] < -limit) p.pos[a] = limit;
      });
    });

    const posAttr = geometry.attributes.position as THREE.BufferAttribute;
    const colAttr = geometry.attributes.color as THREE.BufferAttribute;
    let idx = 0;

    for (let i = 0; i < PARTICLE_COUNT && idx < MAX_LINES; i++) {
      for (let j = i + 1; j < PARTICLE_COUNT && idx < MAX_LINES; j++) {
        const dist = particles[i].pos.distanceTo(particles[j].pos);
        if (dist < CONNECTION_DISTANCE) {
          const alpha = 1 - dist / CONNECTION_DISTANCE;
          const c = secondaryColor.clone().lerp(tertiaryColor, 1 - alpha);
          const off = idx * 6;

          posAttr.array[off] = particles[i].pos.x;
          posAttr.array[off + 1] = particles[i].pos.y;
          posAttr.array[off + 2] = particles[i].pos.z;
          posAttr.array[off + 3] = particles[j].pos.x;
          posAttr.array[off + 4] = particles[j].pos.y;
          posAttr.array[off + 5] = particles[j].pos.z;

          colAttr.array[off] = c.r;
          colAttr.array[off + 1] = c.g;
          colAttr.array[off + 2] = c.b;
          colAttr.array[off + 3] = c.r;
          colAttr.array[off + 4] = c.g;
          colAttr.array[off + 5] = c.b;

          idx++;
        }
      }
    }

    geometry.setDrawRange(0, idx * 2);
    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
  });

  return (
    <lineSegments ref={lineRef} geometry={geometry}>
      <lineBasicMaterial
        vertexColors
        transparent
        opacity={colors.lineOpacity}
      />
    </lineSegments>
  );
};

/* ── Gentle slow-drifting camera ── */
const CameraRig: React.FC = () => {
  useFrame(
    ({ camera, clock }: { camera: THREE.Camera; clock: THREE.Clock }) => {
      const t = clock.getElapsedTime() * 0.04;
      camera.position.x = Math.sin(t) * 10;
      camera.position.z = Math.cos(t) * 10;
      camera.position.y = Math.sin(t * 0.3) * 1.5;
      camera.lookAt(0, 0, 0);
    },
  );
  return null;
};

/* ── Subtle central glow ── */
const CoreOrb: React.FC<{ colors: SceneColors }> = ({ colors }) => {
  const ref = useRef<THREE.Mesh>(null!);

  useFrame(({ clock }: { clock: THREE.Clock }) => {
    const t = clock.getElapsedTime();
    const scale = 0.4 + 0.06 * Math.sin(t * 0.6);
    ref.current.scale.setScalar(scale);
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshBasicMaterial
        color={colors.primary}
        transparent
        opacity={colors.orbOpacity}
      />
    </mesh>
  );
};

/* ── Main exported component ── */
export const DashboardScene: React.FC = () => {
  const { resolved } = useTheme();
  const colors = THEME_COLORS[resolved];

  return (
    <div
      data-testid="dashboard-scene"
      className="fixed inset-0 z-0 pointer-events-none"
    >
      <Canvas
        camera={{ position: [0, 0, 10], fov: 55, near: 0.1, far: 50 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent", pointerEvents: "none" }}
      >
        <fog attach="fog" args={[colors.bg, 10, 24]} />
        <CameraRig />
        <CoreOrb colors={colors} />
        <Particles colors={colors} />
        <Connections colors={colors} />
      </Canvas>
    </div>
  );
};

export default DashboardScene;
