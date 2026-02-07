import { Canvas, useFrame } from "@react-three/fiber";
import React, { useMemo, useRef } from "react";
import { useTheme } from "src/contexts/ThemeContext";
import * as THREE from "three";

/* ─────────────────────────────────────────────
 *  Particle Network — a glowing IoT-inspired
 *  3D scene of floating sensor nodes connected
 *  by luminous data beams, slowly breathing
 *  and morphing in space.
 *
 *  Theme-aware: warm blush in light,
 *  deep ember glow in dark.
 * ───────────────────────────────────────────── */

const PARTICLE_COUNT = 180;
const CONNECTION_DISTANCE = 2.8;

const THEME_COLORS = {
  light: {
    primary: "#e11d48",
    secondary: "#fda4af",
    tertiary: "#f0e5e5",
    bg: "#fdf8f8",
    particleOpacity: 0.45,
    lineOpacity: 0.15,
    orbOpacity: 0.06,
  },
  dark: {
    primary: "#f43f5e",
    secondary: "#881337",
    tertiary: "#2d2626",
    bg: "#0f0d0d",
    particleOpacity: 0.6,
    lineOpacity: 0.25,
    orbOpacity: 0.1,
  },
};

type SceneColors = (typeof THEME_COLORS)["light"];

/* ── Floating particles ── */
const Particles: React.FC<{ colors: SceneColors }> = ({ colors }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const particles = useMemo(() => {
    const arr = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      arr.push({
        pos: new THREE.Vector3(
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 10,
        ),
        vel: new THREE.Vector3(
          (Math.random() - 0.5) * 0.003,
          (Math.random() - 0.5) * 0.003,
          (Math.random() - 0.5) * 0.003,
        ),
        baseScale: 0.005 + Math.random() * 0.01,
        phase: Math.random() * Math.PI * 2,
      });
    }
    return arr;
  }, []);

  useFrame(({ clock }: { clock: THREE.Clock }) => {
    const t = clock.getElapsedTime();
    particles.forEach((p, i) => {
      p.pos.add(p.vel);
      ["x", "y", "z"].forEach((axis) => {
        const a = axis as "x" | "y" | "z";
        if (p.pos[a] > 5.5) p.pos[a] = -5.5;
        if (p.pos[a] < -5.5) p.pos[a] = 5.5;
      });
      const s = p.baseScale * (1 + 0.4 * Math.sin(t * 1.2 + p.phase));
      dummy.position.copy(p.pos);
      dummy.scale.setScalar(s);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, PARTICLE_COUNT]}>
      <sphereGeometry args={[1, 12, 12]} />
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
  const MAX_LINES = 600;
  const colorsRef = useRef(colors);
  colorsRef.current = colors;

  const particles = useMemo(() => {
    const arr = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      arr.push({
        pos: new THREE.Vector3(
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 10,
        ),
        vel: new THREE.Vector3(
          (Math.random() - 0.5) * 0.003,
          (Math.random() - 0.5) * 0.003,
          (Math.random() - 0.5) * 0.003,
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
        if (p.pos[a] > 5.5) p.pos[a] = -5.5;
        if (p.pos[a] < -5.5) p.pos[a] = 5.5;
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

/* ── Slow-orbiting camera rig ── */
const CameraRig: React.FC = () => {
  useFrame(
    ({ camera, clock }: { camera: THREE.Camera; clock: THREE.Clock }) => {
      const t = clock.getElapsedTime() * 0.08;
      camera.position.x = Math.sin(t) * 8;
      camera.position.z = Math.cos(t) * 8;
      camera.position.y = Math.sin(t * 0.5) * 2;
      camera.lookAt(0, 0, 0);
    },
  );
  return null;
};

/* ── Central glowing orb (brand focal) ── */
const CoreOrb: React.FC<{ colors: SceneColors }> = ({ colors }) => {
  const ref = useRef<THREE.Mesh>(null!);

  useFrame(({ clock }: { clock: THREE.Clock }) => {
    const t = clock.getElapsedTime();
    const scale = 0.35 + 0.08 * Math.sin(t * 0.8);
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
export const LoginScene: React.FC<{ className?: string }> = ({
  className = "",
}) => {
  const { resolved } = useTheme();
  const colors = THEME_COLORS[resolved];

  return (
    <div data-testid="login-scene" className={`absolute inset-0 ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 8], fov: 60, near: 0.1, far: 50 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <fog attach="fog" args={[colors.bg, 8, 20]} />
        <CameraRig />
        <CoreOrb colors={colors} />
        <Particles colors={colors} />
        <Connections colors={colors} />
      </Canvas>
    </div>
  );
};

export default LoginScene;
