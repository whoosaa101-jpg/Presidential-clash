import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const ToyBomb = ({ position, onExplode }) => {
    const meshRef = useRef();
    const [progress, setProgress] = useState(0);
    const startY = 10;
    const endY = 0.5;

    useFrame((state, delta) => {
        setProgress(p => {
            const next = p + delta * 1.5; // Falls in ~0.6s
            if (next >= 1) {
                if (onExplode) onExplode();
                return 1;
            }
            return next;
        });

        if (meshRef.current) {
            const y = THREE.MathUtils.lerp(startY, endY, progress);
            meshRef.current.position.y = y;
            meshRef.current.rotation.x += delta * 5;
            meshRef.current.rotation.z += delta * 3;
        }
    });

    if (progress >= 1) return null;

    return (
        <group position={position}>
            <mesh ref={meshRef} castShadow>
                {/* Chunky Toy Bomb: Cylinder with spheres */}
                <cylinderGeometry args={[0.3, 0.3, 0.6, 12]} />
                <meshToonMaterial color="#e74c3c" />
                <Outlines thickness={2} color="black" />

                {/* Fuse */}
                <mesh position={[0, 0.35, 0]}>
                    <cylinderGeometry args={[0.02, 0.02, 0.2, 8]} />
                    <meshToonMaterial color="#5d4037" />
                </mesh>

                {/* Spark */}
                <mesh position={[0, 0.45, 0]}>
                    <sphereGeometry args={[0.05, 8, 8]} />
                    <meshBasicMaterial color="#f1c40f" />
                </mesh>
            </mesh>

            {/* Target Indicator on Ground */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
                <ringGeometry args={[0.4, 0.5, 32]} />
                <meshBasicMaterial color="#e74c3c" transparent opacity={0.5} />
            </mesh>
        </group>
    );
};

export const ToySmoke = ({ position, color = "#cccccc", onComplete }) => {
    const groupRef = useRef();
    const [particles] = useState(() => Array.from({ length: 8 }, () => ({
        pos: new THREE.Vector3(
            (Math.random() - 0.5) * 1,
            Math.random() * 0.5,
            (Math.random() - 0.5) * 1
        ),
        scale: Math.random() * 0.8 + 0.4,
        speed: Math.random() * 0.5 + 0.2
    })));

    useFrame((state, delta) => {
        if (groupRef.current) {
            let active = false;
            groupRef.current.children.forEach((mesh, i) => {
                const p = particles[i];
                mesh.position.y += delta * p.speed;
                mesh.scale.multiplyScalar(0.95);
                if (mesh.scale.x > 0.05) active = true;
            });
            if (!active && onComplete) onComplete();
        }
    });

    return (
        <group ref={groupRef} position={position}>
            {particles.map((p, i) => (
                <mesh key={i} position={p.pos} scale={p.scale}>
                    <sphereGeometry args={[0.5, 8, 8]} />
                    <meshToonMaterial color={color} transparent opacity={0.6} />
                </mesh>
            ))}
        </group>
    );
};
