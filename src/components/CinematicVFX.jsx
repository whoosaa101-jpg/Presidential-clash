import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// 1. Wind Streaks for flying units
export const WindStreaks = ({ position, speed = 1 }) => {
    const points = useMemo(() => {
        const p = [];
        for (let i = 0; i < 8; i++) {
            p.push({
                offset: [Math.random() * 0.4 - 0.2, Math.random() * 0.4 - 0.2, Math.random() * 2],
                length: Math.random() * 0.5 + 0.5,
                phase: Math.random() * Math.PI * 2
            });
        }
        return p;
    }, []);

    const group = useRef();
    useFrame((state) => {
        if (!group.current) return;
        group.current.children.forEach((child, i) => {
            const p = points[i];
            const t = (state.clock.elapsedTime + p.phase) * 5;
            child.position.z = ((t % 5) - 2.5);
            child.scale.z = Math.sin((t % 5) / 5 * Math.PI);
        });
    });

    return (
        <group ref={group} position={position}>
            {points.map((p, i) => (
                <mesh key={i} position={[p.offset[0], p.offset[1], 0]}>
                    <cylinderGeometry args={[0.01, 0.01, p.length, 8]} />
                    <meshBasicMaterial color="white" transparent opacity={0.3} />
                </mesh>
            ))}
        </group>
    );
};

// 2. Impact Shockwave for heavy hits
export const Shockwave = ({ position, color = "#ffffff", onComplete }) => {
    const meshRef = useRef();
    const [progress, setProgress] = React.useState(0);

    useFrame((state, delta) => {
        const next = progress + delta * 3;
        if (next >= 1) {
            if (onComplete) onComplete();
            return;
        }
        setProgress(next);
        if (meshRef.current) {
            meshRef.current.scale.set(next * 4, next * 4, 1);
        }
    });

    return (
        <mesh ref={meshRef} position={position} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.9, 1, 64]} />
            <meshBasicMaterial color={color} transparent opacity={1 - progress} />
        </mesh>
    );
};

// 3. Hero Glow for leveled-up units
export const HeroGlow = ({ position, color = "#f1c40f" }) => {
    const meshRef = useRef();
    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.y += 0.02;
            meshRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 4) * 0.05);
        }
    });

    return (
        <mesh ref={meshRef} position={position}>
            <torusKnotGeometry args={[0.4, 0.02, 64, 8]} />
            <meshBasicMaterial color={color} transparent opacity={0.6} />
        </mesh>
    );
};
