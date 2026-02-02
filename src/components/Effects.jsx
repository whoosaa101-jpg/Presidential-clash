import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Billboard, Image as ThreeImage } from '@react-three/drei';
// Old effects removed to fix duplicates

// --- CRISP CARTOON EFFECTS ---

export const Projectile = ({ start, end, team, type, onComplete }) => {
    const meshRef = useRef();
    const [active, setActive] = useState(true);
    const targetVec = useRef(new THREE.Vector3(...end));
    const startVec = useRef(new THREE.Vector3(...start));

    const isFriendly = team === 'player' || team === 'blue';
    const color = type === 'laser' ? '#00f2ff' : (isFriendly ? '#3498db' : '#e74c3c');

    useEffect(() => {
        if (meshRef.current) {
            meshRef.current.position.copy(startVec.current);
            meshRef.current.lookAt(targetVec.current);
        }
    }, []);

    useFrame((state, delta) => {
        if (!active || !meshRef.current) return;
        const dist = meshRef.current.position.distanceTo(targetVec.current);
        const speed = 25 * delta;
        meshRef.current.translateZ(speed);
        if (dist < 0.4) {
            setActive(false);
            onComplete();
        }
    });

    if (!active) return null;

    // Solid Geometry - No Blur
    return (
        <group ref={meshRef}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.08, 0.08, 0.6, 6]} /> {/* Hex projectile */}
                <meshToonMaterial color={color} />
                <Outlines thickness={1} color="black" />
            </mesh>
            <mesh position={[0, 0, -0.4]} rotation={[Math.PI / 2, 0, 0]}>
                <coneGeometry args={[0.08, 0.2, 6]} />
                <meshToonMaterial color="white" />
                <Outlines thickness={0.5} color="black" />
            </mesh>
        </group>
    );
};

export const ParticleExplosion = ({ position, color = "#e74c3c", onComplete }) => {
    const groupRef = useRef();
    // Star Burst Logic
    const [particles] = useState(() => Array.from({ length: 16 }, (_, i) => ({
        velocity: new THREE.Vector3(
            (Math.random() - 0.5) * 4,
            Math.random() * 4,
            (Math.random() - 0.5) * 4
        ),
        rotationSpeed: (Math.random() - 0.5) * 10,
        scale: Math.random() * 0.4 + 0.3,
        type: i % 3 === 0 ? 'star' : (i % 3 === 1 ? 'stripe' : 'dot'),
        color: i % 2 === 0 ? '#ffffff' : color
    })));

    useFrame((state, delta) => {
        if (groupRef.current) {
            let activeCount = 0;
            groupRef.current.children.forEach((mesh, i) => {
                const p = particles[i];
                mesh.position.addScaledVector(p.velocity, delta);
                mesh.rotation.z += p.rotationSpeed * delta;
                p.velocity.y -= delta * 8; // Heavy gravity

                // Scale Down
                mesh.scale.multiplyScalar(0.9);
                if (mesh.scale.x > 0.05) activeCount++;
            });
            if (activeCount === 0) onComplete();
        }
    });

    return (
        <group ref={groupRef} position={position}>
            {particles.map((p, i) => (
                <mesh key={i} scale={p.scale}>
                    {p.type === 'star' ? (
                        <dodecahedronGeometry args={[0.2, 0]} /> // Psuedo-star/rock
                    ) : p.type === 'stripe' ? (
                        <boxGeometry args={[0.4, 0.1, 0.1]} />
                    ) : (
                        <boxGeometry args={[0.15, 0.15, 0.15]} /> // Pixel box
                    )}
                    <meshToonMaterial color={p.color} />
                </mesh>
            ))}
        </group>
    );
};

export const SpawnSmoke = ({ position, onComplete }) => {
    // Star & Stripe Spawn Burst
    const groupRef = useRef();
    const [particles] = useState(() => Array.from({ length: 12 }, (_, i) => ({
        velocity: new THREE.Vector3(
            (Math.random() - 0.5) * 1.5,
            Math.random() * 2,
            (Math.random() - 0.5) * 1.5
        ),
        scale: Math.random() * 0.5 + 0.2,
        color: i % 2 === 0 ? '#3498db' : '#e74c3c' // Red/Blue spawn
    })));

    useFrame((state, delta) => {
        if (groupRef.current) {
            let active = false;
            groupRef.current.children.forEach((mesh, i) => {
                const p = particles[i];
                mesh.position.addScaledVector(p.velocity, delta);
                mesh.scale.multiplyScalar(0.94);
                if (mesh.scale.x > 0.05) active = true;
            });
            if (!active) onComplete();
        }
    });

    return (
        <group position={position} ref={groupRef}>
            {particles.map((p, i) => (
                <mesh key={i} scale={p.scale}>
                    <coneGeometry args={[0.2, 0.4, 4]} /> {/* Star points */}
                    <meshToonMaterial color={p.color} />
                </mesh>
            ))}
        </group>
    );
};

export const DamageFlash = ({ children, isHit }) => {
    const [flash, setFlash] = useState(false);
    useEffect(() => {
        if (isHit) {
            setFlash(true);
            setTimeout(() => setFlash(false), 80); // Quick strobe
        }
    }, [isHit]);

    return (
        <group>
            {children}
            {flash && (
                <mesh position={[0, 0.5, 0]}>
                    <boxGeometry args={[0.8, 1.2, 0.8]} />
                    <meshBasicMaterial color="white" wireframe />
                </mesh>
            )}
        </group>
    );
};
