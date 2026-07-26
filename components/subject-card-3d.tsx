"use client";

import { RoundedBox, Text } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

type CardSceneProps = {
  name: string;
  color: string;
  pointer: React.MutableRefObject<{ x: number; y: number }>;
};

function CardScene({ name, color, pointer }: CardSceneProps) {
  const groupRef = useRef<THREE.Group>(null);
  const targetRotation = useRef({ x: 0, y: 0 });
  const floatOffset = useRef(Math.random() * Math.PI * 2);

  useFrame((state, delta) => {
    const group = groupRef.current;
    if (!group) return;

    targetRotation.current.x = pointer.current.y * 0.35;
    targetRotation.current.y = pointer.current.x * 0.35;

    group.rotation.x = THREE.MathUtils.lerp(
      group.rotation.x,
      targetRotation.current.x,
      delta * 6
    );
    group.rotation.y = THREE.MathUtils.lerp(
      group.rotation.y,
      targetRotation.current.y,
      delta * 6
    );

    const t = state.clock.elapsedTime + floatOffset.current;
    group.position.y = Math.sin(t * 1.2) * 0.12;
  });

  return (
    <>
      <ambientLight intensity={0.35} />
      <pointLight position={[2, 2, 3]} intensity={0.6} />
      <pointLight position={[-2, -1, 2]} color={color} intensity={1.4} />
      <pointLight position={[0, 0, 1.5]} color={color} intensity={0.8} />

      <group ref={groupRef}>
        <RoundedBox args={[3.2, 1.9, 0.18]} radius={0.14} smoothness={6}>
          <meshStandardMaterial
            color="#141414"
            metalness={0.55}
            roughness={0.35}
            emissive={color}
            emissiveIntensity={0.08}
          />
        </RoundedBox>

        <mesh position={[0, 0, 0.1]}>
          <planeGeometry args={[2.9, 1.55]} />
          <meshBasicMaterial color={color} transparent opacity={0.12} />
        </mesh>

        <Text
          position={[0, 0, 0.12]}
          fontSize={0.38}
          color={color}
          anchorX="center"
          anchorY="middle"
          maxWidth={2.6}
          textAlign="center"
          outlineWidth={0.015}
          outlineColor={color}
          outlineOpacity={0.85}
        >
          {name}
        </Text>
      </group>
    </>
  );
}

type SubjectCard3DProps = {
  name: string;
  color: string;
};

export function SubjectCard3D({ name, color }: SubjectCard3DProps) {
  const pointer = useRef({ x: 0, y: 0 });

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    pointer.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.current.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
  }

  function handlePointerLeave() {
    pointer.current.x = 0;
    pointer.current.y = 0;
  }

  return (
    <div
      className="h-[220px] w-full overflow-hidden rounded-lg border border-border/80 bg-gradient-to-b from-muted/30 to-muted/10 shadow-sm"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <Canvas
        camera={{ position: [0, 0, 4.2], fov: 42 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        <CardScene name={name} color={color} pointer={pointer} />
      </Canvas>
    </div>
  );
}
