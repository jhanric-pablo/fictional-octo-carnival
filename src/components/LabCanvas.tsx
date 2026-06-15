import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { MeshTransmissionMaterial, Environment, RoundedBox } from '@react-three/drei';
import { Physics, RigidBody, CuboidCollider, InstancedRigidBodies, BallCollider, RapierRigidBody } from '@react-three/rapier';
import * as THREE from 'three';

const cubeStartPositions = [
  [0.2, 0.3, 0.8],
  [1.8, 1.2, -0.3],
  [-2, -1, 0.6],
  [0.8, -1.6, -0.6],
  [-1.5, 1.4, 0.2],
];

// Interactive floating glass cubes
function GlassCubes() {
  const bodiesRef = useRef<RapierRigidBody[]>([]);
  const [dragged, setDragged] = useState<number | null>(null);
  
  const wanderSeeds = useMemo(() => cubeStartPositions.map(() => ({
    ox: Math.random() * 1000,
    oy: Math.random() * 1000,
    oz: Math.random() * 1000,
  })), []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const dt = state.clock.getDelta();
    
    // Convert normalized mouse device coordinates to 3D roughly at z=0 plane
    const mouseX = (state.mouse.x * state.viewport.width) / 2;
    const mouseY = (state.mouse.y * state.viewport.height) / 2;
    
    bodiesRef.current.forEach((body, i) => {
      if (!body) return;
      const pos = body.translation();
      const vel = body.linvel();
      
      if (dragged === i) {
        // Drag logic: set velocity directly towards cursor for snappy feel
        const target = new THREE.Vector3(mouseX, mouseY, 0);
        const current = new THREE.Vector3(pos.x, pos.y, pos.z);
        const diff = target.sub(current);
        
        body.setLinvel({
          x: diff.x * 12,
          y: diff.y * 12,
          z: diff.z * 12,
        }, true);
      } else {
        // Normal floating logic
        const seed = wanderSeeds[i];
        
        const attractDir = new THREE.Vector3(-pos.x, -pos.y, -pos.z)
          .normalize()
          .multiplyScalar(9 * dt);

        const s = 0.22; // wander speed
        const wanderDir = new THREE.Vector3(
          Math.sin(t * s + seed.ox) + Math.sin(t * s * 0.57 + seed.ox * 2),
          Math.sin(t * s * 0.77 + seed.oy) + Math.sin(t * s * 0.43 + seed.oy * 2),
          Math.sin(t * s * 0.63 + seed.oz) + Math.sin(t * s * 0.37 + seed.oz * 2),
        ).normalize().multiplyScalar(0.72 * dt);

        attractDir.add(wanderDir);
        
        // Water drag
        const speed = Math.sqrt(vel.x * vel.x + vel.y * vel.y + vel.z * vel.z);
        if (speed > 0.001) {
          const dragForce = 1.35 * speed * speed * dt;
          const invSpeed = 1 / speed;
          attractDir.x -= vel.x * invSpeed * dragForce;
          attractDir.y -= vel.y * invSpeed * dragForce;
          attractDir.z -= vel.z * invSpeed * dragForce;
        }

        body.applyImpulse(attractDir, true);
      }
    });
  });

  return (
    <>
      {cubeStartPositions.map((pos, i) => (
        <RigidBody
          key={`cube-${i}`}
          ref={(el) => {
            if (el) bodiesRef.current[i] = el;
          }}
          type="dynamic"
          position={pos as [number, number, number]}
          restitution={0.1}
          friction={0.25}
          linearDamping={1.6}
          angularDamping={5.5}
        >
          <RoundedBox 
            args={[1.3, 1.3, 1.3]} 
            radius={0.12} 
            smoothness={6}
            onPointerDown={(e) => {
              e.stopPropagation();
              if (e.target && 'setPointerCapture' in e.target) {
                (e.target as Element).setPointerCapture(e.pointerId);
              }
              setDragged(i);
              document.body.style.cursor = 'grabbing';
            }}
            onPointerUp={(e) => {
              e.stopPropagation();
              if (e.target && 'releasePointerCapture' in e.target) {
                (e.target as Element).releasePointerCapture(e.pointerId);
              }
              if (dragged === i) setDragged(null);
              document.body.style.cursor = 'auto';
            }}
            onPointerOver={() => {
              if (dragged !== i) document.body.style.cursor = 'grab';
            }}
            onPointerOut={() => {
              if (dragged !== i) document.body.style.cursor = 'auto';
            }}
          >
            <MeshTransmissionMaterial 
              backside
              backsideThickness={1.2}
              thickness={1.2}
              roughness={0.08}
              ior={1.45}
              chromaticAberration={1.5}
              anisotropy={0.1}
              distortion={0.5}
              distortionScale={0.5}
              temporalDistortion={0.1}
              clearcoat={0.1}
              clearcoatRoughness={0.05}
              color="#e8f0e4"
              transmission={1}
            />
          </RoundedBox>
        </RigidBody>
      ))}
    </>
  );
}



// Bounding box mapping the camera view frustum constraints roughly
function Bounds() {
  const { viewport } = useThree();
  const hw = viewport.width / 2;
  const hh = viewport.height / 2;
  return (
    <>
      <CuboidCollider position={[0, -hh - 1, 0]} args={[hw + 2, 1, 10]} />
      <CuboidCollider position={[0, hh + 1, 0]} args={[hw + 2, 1, 10]} />
      <CuboidCollider position={[-hw - 1, 0, 0]} args={[1, hh + 2, 10]} />
      <CuboidCollider position={[hw + 1, 0, 0]} args={[1, hh + 2, 10]} />
      <CuboidCollider position={[0, 0, -3]} args={[hw + 2, hh + 2, 1]} />
      <CuboidCollider position={[0, 0, 3]} args={[hw + 2, hh + 2, 1]} />
    </>
  );
}

export default function LabCanvas() {
  return (
    <div className="w-full h-screen absolute inset-0 -z-10 bg-paper">
      <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
        <color attach="background" args={['#F9F8F6']} />
        <fog attach="fog" args={['#F9F8F6', 8, 18]} />
        <ambientLight intensity={1.5} />
        <spotLight position={[8, 12, 8]} intensity={5} castShadow />
        <directionalLight position={[-5, 3, 5]} intensity={1.5} />
        
        <Environment preset="city" />

        <Physics gravity={[0, 0, 0]}>
          <GlassCubes />
          <Bounds />
        </Physics>
      </Canvas>
    </div>
  );
}
