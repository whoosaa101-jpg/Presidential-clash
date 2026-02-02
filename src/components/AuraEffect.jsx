import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const AuraEffect = ({ color = "#2ecc71", radius = 1.5, opacity = 0.3 }) => {
    const meshRef = useRef();

    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.z += 0.01;
            meshRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 2) * 0.1);
        }
    });

    return (
        <group rotation={[-Math.PI / 2, 0, 0]}>
            <mesh ref={meshRef}>
                <ringGeometry args={[radius * 0.9, radius, 64]} />
                <meshBasicMaterial color={color} transparent opacity={opacity} />
            </mesh>
            <mesh>
                <ringGeometry args={[0, radius, 64]} />
                <meshBasicMaterial color={color} transparent opacity={opacity * 0.5} />
            </mesh>
        </group>
    );
};
