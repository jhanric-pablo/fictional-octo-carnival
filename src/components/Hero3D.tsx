import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float } from '@react-three/drei';
import * as THREE from 'three';

function BoneParticles() {
  const count = 1500;
  const mesh = useRef<THREE.InstancedMesh>(null);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
        let x=0, y=0, z=0;
        const r = Math.random();
        // Dog bone distribution
        if(r < 0.4) {
            // center tube
            x = (Math.random() - 0.5) * 4;
            const radius = Math.random() * 0.4;
            const theta = Math.random() * Math.PI * 2;
            y = Math.cos(theta) * radius;
            z = Math.sin(theta) * radius;
        } else if (r < 0.55) {
            // Left top bump
            const r2 = Math.random() * 0.6;
            const t = Math.random() * Math.PI * 2, p = Math.acos(2 * Math.random() - 1);
            x = -2.0 + r2 * Math.sin(p) * Math.cos(t);
            y = 0.5 + r2 * Math.sin(p) * Math.sin(t);
            z = r2 * Math.cos(p);
        } else if (r < 0.70) {
            // Left bottom bump
            const r2 = Math.random() * 0.6;
            const t = Math.random() * Math.PI * 2, p = Math.acos(2 * Math.random() - 1);
            x = -2.0 + r2 * Math.sin(p) * Math.cos(t);
            y = -0.5 + r2 * Math.sin(p) * Math.sin(t);
            z = r2 * Math.cos(p);
        } else if (r < 0.85) {
            // Right top bump
            const r2 = Math.random() * 0.6;
            const t = Math.random() * Math.PI * 2, p = Math.acos(2 * Math.random() - 1);
            x = 2.0 + r2 * Math.sin(p) * Math.cos(t);
            y = 0.5 + r2 * Math.sin(p) * Math.sin(t);
            z = r2 * Math.cos(p);
        } else {
            // Right bottom bump
            const r2 = Math.random() * 0.6;
            const t = Math.random() * Math.PI * 2, p = Math.acos(2 * Math.random() - 1);
            x = 2.0 + r2 * Math.sin(p) * Math.cos(t);
            y = -0.5 + r2 * Math.sin(p) * Math.sin(t);
            z = r2 * Math.cos(p);
        }

        temp.push({ 
            t: Math.random() * 100, 
            speed: 0.01 + Math.random() * 0.02,
            x, y, z
        });
    }
    return temp;
  }, [count]);

  useFrame((state) => {
    if (!mesh.current) return;
    particles.forEach((particle, i) => {
      let { t, speed, x, y, z } = particle;
      t = particle.t += speed;
      // Gentle particle drifting
      const dx = Math.cos(t) * 0.1;
      const dy = Math.sin(t) * 0.1;
      const dz = Math.cos(t * 0.8) * 0.1;
      
      dummy.position.set(x + dx, y + dy, z + dz);
      // Small particles
      dummy.scale.set(0.06, 0.06, 0.06);
      dummy.updateMatrix();
      mesh.current!.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
    
    // Slowly rotate the entire structure
    mesh.current.rotation.y = state.clock.elapsedTime * 0.15;
    mesh.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 16, 16]} />
      {/* Cool glowing aesthetic mapping to our 'Natural Tones' theme */}
      <meshStandardMaterial color="#7D9D85" roughness={0.2} metalness={0.6} />
    </instancedMesh>
  );
}

export default function Hero3D() {
  return (
    <div className="w-full h-full absolute inset-0 z-0">
      <Canvas camera={{ position: [0, 0, 7], fov: 55 }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} color="#FDFBF7" />
        <pointLight position={[-10, -10, -5]} intensity={1} color="#E7E1D7" />
        <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
          <BoneParticles />
        </Float>
        <OrbitControls enableZoom={false} autoRotate={false} enablePan={false} />
      </Canvas>
      {/* Decorative overlay to blend 3D and UI */}
      <div className="absolute inset-0 bg-gradient-to-t from-paper to-transparent pointer-events-none" />
    </div>
  );
}
