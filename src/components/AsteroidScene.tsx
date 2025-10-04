import { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

function Asteroids({ speedMultiplier = 1 }: { speedMultiplier?: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const count = 18;

  const { positions, rotations } = useMemo(() => {
    const positions: number[] = [];
    const rotations: number[] = [];

    for (let i = 0; i < count; i++) {
      // Spread asteroids in a wide field
      positions.push(
        (Math.random() - 0.5) * 25,
        (Math.random() - 0.5) * 15,
        (Math.random() - 0.5) * 20 - 10
      );
      rotations.push(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
    }
    return { positions, rotations };
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;

    const time = state.clock.getElapsedTime() * 0.15 * speedMultiplier;
    const matrix = new THREE.Matrix4();

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const x = positions[i3] + Math.sin(time + i) * 0.5;
      const y = positions[i3 + 1] + Math.cos(time * 0.7 + i) * 0.3;
      const z = positions[i3 + 2];

      const rotation = new THREE.Euler(
        rotations[i3] + time * 0.2,
        rotations[i3 + 1] + time * 0.15,
        rotations[i3 + 2] + time * 0.1
      );

      const scale = 0.3 + Math.sin(time + i) * 0.1;

      matrix.makeRotationFromEuler(rotation);
      matrix.setPosition(x, y, z);
      matrix.scale(new THREE.Vector3(scale, scale, scale));

      meshRef.current.setMatrixAt(i, matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color="#4A5568" roughness={0.8} metalness={0.2} />
    </instancedMesh>
  );
}

function Starfield() {
  const starsRef = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const positions = new Float32Array(400 * 3);
    for (let i = 0; i < 400; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 50;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 50;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 50;
    }
    return positions;
  }, []);

  return (
    <points ref={starsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.05} color="#ffffff" transparent opacity={0.6} />
    </points>
  );
}

function CameraController({ mouseX, mouseY }: { mouseX: number; mouseY: number }) {
  const { camera } = useThree();

  useFrame(() => {
    camera.position.x += (mouseX * 2 - camera.position.x) * 0.05;
    camera.position.y += (-mouseY * 2 - camera.position.y) * 0.05;
  });

  return null;
}

interface AsteroidSceneProps {
  speedMultiplier?: number;
}

export function AsteroidScene({ speedMultiplier = 1 }: AsteroidSceneProps) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = () => setPrefersReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    let rafId: number;
    let lastTime = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const currentTime = Date.now();
      if (currentTime - lastTime < 45) return; // Throttle to ~22fps
      lastTime = currentTime;

      rafId = requestAnimationFrame(() => {
        setMousePos({
          x: (e.clientX / window.innerWidth - 0.5) * 0.5,
          y: (e.clientY / window.innerHeight - 0.5) * 0.5,
        });
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(rafId);
    };
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      // Canvas will pause when document is hidden (handled by R3F)
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const finalSpeedMultiplier = prefersReducedMotion ? 0.3 : speedMultiplier;

  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 10], fov: 60 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
      >
        <color attach="background" args={['#000000']} />
        <ambientLight intensity={0.3} />
        <directionalLight position={[5, 5, 5]} intensity={0.5} />
        <Starfield />
        <Asteroids speedMultiplier={finalSpeedMultiplier} />
        {!prefersReducedMotion && <CameraController mouseX={mousePos.x} mouseY={mousePos.y} />}
      </Canvas>
    </div>
  );
}
