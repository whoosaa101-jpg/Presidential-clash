import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Text, Float, Outlines } from '@react-three/drei';
import * as THREE from 'three';
import { WindStreaks, HeroGlow } from './CinematicVFX';
import { AuraEffect } from './AuraEffect';

export const ToyUnit = ({ id, team, isFlying, isAttacking, isMoving, scale = 1, level = 1, showSpeedTrails = false }) => {
    const groupRef = useRef();
    const bodyRef = useRef();
    const headRef = useRef();

    const isBlue = team === 'player' || team === 'blue';
    const teamColor = isBlue ? '#2563eb' : '#dc2626'; // Vibrant patriotic blue and red

    // Procedural Animation
    useFrame((state) => {
        const time = state.clock.getElapsedTime();
        const t = time * 4;
        const walkSpeed = 10;
        const walkT = time * walkSpeed;

        // Breathing / Bobbing / Hopping
        if (groupRef.current) {
            const baseHeight = isFlying ? 2.5 : 0;
            const bobAmt = isMoving ? 0.15 : 0.05;
            const bobFreq = isMoving ? walkT : t;

            groupRef.current.position.y = baseHeight + Math.abs(Math.sin(bobFreq)) * bobAmt;

            // Forward Lean when moving
            if (isMoving) {
                groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, 0.25, 0.1);
            } else {
                groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, 0, 0.1);
            }
        }

        // Body Waddling (Side-to-Side)
        if (bodyRef.current) {
            if (isMoving) {
                bodyRef.current.rotation.z = Math.sin(walkT * 0.5) * 0.15;
            } else {
                bodyRef.current.rotation.z = THREE.MathUtils.lerp(bodyRef.current.rotation.z, 0, 0.1);
            }
        }

        // Head sway
        if (headRef.current) {
            const swayAmt = isMoving ? 0.2 : 0.1;
            headRef.current.rotation.z = Math.sin(t * 0.5) * swayAmt;
            headRef.current.position.y = 1.4 + Math.sin(t) * 0.02;
        }

        // Attack Squash/Stretch
        if (isAttacking && bodyRef.current) {
            const s = 1 + Math.sin(t * 2) * 0.1;
            bodyRef.current.scale.set(1 / s, s, 1 / s);
        } else if (bodyRef.current) {
            // Keep the constant scale 1 if not attacking
            bodyRef.current.scale.set(1, 1, 1);
        }
    });
    // Level Scaling: +2% size per level (max ~1.2x at lvl 10)
    const levelScale = 1 + (level - 1) * 0.02;
    const finalScale = scale * levelScale;

    return (
        <group ref={groupRef} scale={finalScale}>
            {/* Outline Effect (Simple Hull) */}
            <mesh scale={1.05} position={[0, 0.6, 0]}>
                <capsuleGeometry args={[0.4, 1.6, 4, 8]} />
                <meshBasicMaterial color="#000" side={THREE.BackSide} transparent opacity={0.3} />
            </mesh>

            {/* Shadow (Only if not flying, or small) */}
            {!isFlying && (
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
                    <ringGeometry args={[0, 0.5, 32]} />
                    <meshBasicMaterial color="black" transparent opacity={0.2} />
                </mesh>
            )}

            {/* LEGS - Full Presidential Figure */}
            <group position={[0, 0.25, 0]}>
                {/* Left Leg */}
                <mesh position={[0.15, 0, 0]}>
                    <capsuleGeometry args={[0.12, 0.5, 4, 8]} />
                    <meshToonMaterial color="#1e293b" />
                    <Outlines thickness={1.5} color="black" />
                </mesh>
                {/* Left Shoe */}
                <mesh position={[0.15, -0.3, 0.05]}>
                    <boxGeometry args={[0.18, 0.1, 0.25]} />
                    <meshToonMaterial color="#0f172a" />
                    <Outlines thickness={1} color="black" />
                </mesh>

                {/* Right Leg */}
                <mesh position={[-0.15, 0, 0]}>
                    <capsuleGeometry args={[0.12, 0.5, 4, 8]} />
                    <meshToonMaterial color="#1e293b" />
                    <Outlines thickness={1.5} color="black" />
                </mesh>
                {/* Right Shoe */}
                <mesh position={[-0.15, -0.3, 0.05]}>
                    <boxGeometry args={[0.18, 0.1, 0.25]} />
                    <meshToonMaterial color="#0f172a" />
                    <Outlines thickness={1} color="black" />
                </mesh>
            </group>

            {/* Main Body - Suit Jacket */}
            <mesh ref={bodyRef} position={[0, 0.8, 0]}>
                <capsuleGeometry args={[0.4, 0.8, 4, 12]} />
                <meshToonMaterial color={teamColor} />
                <Outlines thickness={3} color="black" />
            </mesh>

            {/* Presidential Necktie */}
            <mesh position={[0, 0.55, 0.38]}>
                <boxGeometry args={[0.12, 0.45, 0.03]} />
                <meshToonMaterial color="#ef4444" />
                <Outlines thickness={1} color="black" />
            </mesh>

            {/* Oversized Head - Presidential */}
            <mesh ref={headRef} position={[0, 1.4, 0]}>
                <sphereGeometry args={[0.45, 16, 16]} />
                <meshToonMaterial color="#fbbf24" />
                <Outlines thickness={3} color="black" />

                {/* Eyes (Simple dots) */}
                <mesh position={[0.15, 0.1, 0.35]}>
                    <sphereGeometry args={[0.06, 8, 8]} />
                    <meshBasicMaterial color="black" />
                </mesh>
                <mesh position={[-0.15, 0.1, 0.35]}>
                    <sphereGeometry args={[0.06, 8, 8]} />
                    <meshBasicMaterial color="black" />
                </mesh>

                {/* President Specific Accessories */}
                {(id === 'lincoln' || id === 'abraham_lincoln') && (
                    <group position={[0, 0.4, 0]}>
                        <mesh position={[0, 0, 0]}><cylinderGeometry args={[0.5, 0.5, 0.05, 16]} /><meshToonMaterial color="#222" /><Outlines thickness={1} color="black" /></mesh>
                        <mesh position={[0, 0.3, 0]}><cylinderGeometry args={[0.35, 0.35, 0.6, 16]} /><meshToonMaterial color="#222" /><Outlines thickness={2} color="black" /></mesh>
                    </group>
                )}

                {(id === 'trump' || id === 'donald_trump') && (
                    <mesh position={[0, 0.3, -0.05]} rotation={[0.4, 0, 0]}>
                        <boxGeometry args={[0.7, 0.3, 0.5]} />
                        <meshToonMaterial color="#f1c40f" />
                        <Outlines thickness={1} color="black" />
                    </mesh>
                )}

                {(id === 'washington' || id === 'george_washington') && (
                    <group>
                        <mesh position={[0.4, 0, 0]}><sphereGeometry args={[0.2, 8, 8]} /><meshToonMaterial color="#fff" /><Outlines thickness={1} color="black" /></mesh>
                        <mesh position={[-0.4, 0, 0]}><sphereGeometry args={[0.2, 8, 8]} /><meshToonMaterial color="#fff" /><Outlines thickness={1} color="black" /></mesh>
                    </group>
                )}

                {(id === 'teddy' || id === 'teddy_roosevelt') && (
                    <group>
                        <mesh position={[0, -0.1, 0.4]}><cylinderGeometry args={[0.05, 0.05, 0.5, 8]} rotation={[0, 0, Math.PI / 2]} /><meshToonMaterial color="#5d4037" /><Outlines thickness={1} color="black" /></mesh>
                        <mesh position={[0.15, 0.1, 0.44]}><torusGeometry args={[0.08, 0.01, 8, 16]} /><meshToonMaterial color="#333" /><Outlines thickness={1} color="black" /></mesh>
                        <mesh position={[-0.15, 0.1, 0.44]}><torusGeometry args={[0.08, 0.01, 8, 16]} /><meshToonMaterial color="#333" /><Outlines thickness={1} color="black" /></mesh>
                    </group>
                )}

                {(id === 'jfk' || id === 'jfk_space') && (
                    <group position={[0, 0.1, 0.2]}>
                        <mesh><torusGeometry args={[0.46, 0.05, 8, 24]} rotation={[Math.PI / 2, 0, 0]} /><meshToonMaterial color="#3498db" /><Outlines thickness={1} color="black" /></mesh>
                        <mesh position={[0, 0, 0.25]}><boxGeometry args={[0.6, 0.2, 0.1]} /><meshBasicMaterial color="rgba(255,255,255,0.3)" transparent /></mesh>
                    </group>
                )}

                {id === 'obama' && (
                    <mesh position={[0, 0.3, 0]}><sphereGeometry args={[0.1, 8, 8]} /><meshBasicMaterial color="#00ffff" /></mesh>
                )}

                {id === 'secret_service' && (
                    <mesh position={[0, 0.1, 0.4]}><boxGeometry args={[0.6, 0.1, 0.1]} /><meshBasicMaterial color="black" /></mesh>
                )}

                {id === 'fdr' && (
                    <group position={[0, -0.4, 0]}>
                        <mesh position={[0.4, -0.2, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.3, 0.3, 0.1, 16]} /><meshToonMaterial color="#5d4037" /><Outlines thickness={1} color="black" /></mesh>
                        <mesh position={[-0.4, -0.2, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.3, 0.3, 0.1, 16]} /><meshToonMaterial color="#5d4037" /><Outlines thickness={1} color="black" /></mesh>
                    </group>
                )}

                {id === 'truman' && (
                    <mesh position={[0, 0.4, 0]} rotation={[0, 0, 0.5]}>
                        <cylinderGeometry args={[0.05, 0.05, 0.5, 8]} />
                        <meshToonMaterial color="#e74c3c" />
                        <Outlines thickness={1} color="black" />
                        <mesh position={[0, 0.25, 0]}><coneGeometry args={[0.07, 0.15, 8]} /><meshToonMaterial color="#3498db" /><Outlines thickness={1} color="black" /></mesh>
                    </mesh>
                )}

                {id === 'grant' && (
                    <group position={[0, 0.4, 0]}>
                        <mesh position={[0, 0, 0]}><cylinderGeometry args={[0.45, 0.45, 0.1, 16]} /><meshToonMaterial color="#2c3e50" /><Outlines thickness={1} color="black" /></mesh>
                        <mesh position={[0, 0.05, 0.2]} rotation={[-0.2, 0, 0]}><boxGeometry args={[0.6, 0.02, 0.3]} /><meshToonMaterial color="#2c3e50" /><Outlines thickness={1} color="black" /></mesh>
                    </group>
                )}
            </mesh>

            {/* Chunky Hands/Arms */}
            <mesh position={[0.55, 0.6, 0.1]}>
                <sphereGeometry args={[0.18, 8, 8]} />
                <meshToonMaterial color={teamColor} />
                <Outlines thickness={2} color="black" />
                {id === 'grant' && (
                    <mesh position={[0.1, 0, 0.3]} rotation={[1.5, 0, 0]}>
                        <boxGeometry args={[0.05, 0.8, 0.02]} />
                        <meshToonMaterial color="silver" />
                        <Outlines thickness={1} color="black" />
                    </mesh>
                )}
            </mesh>
            <mesh position={[-0.55, 0.6, 0.1]}>
                <sphereGeometry args={[0.18, 8, 8]} />
                <meshToonMaterial color={teamColor} />
                <Outlines thickness={2} color="black" />
            </mesh>

            {/* Team Ring Base */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
                <ringGeometry args={[0.5, 0.6, 32]} />
                <meshBasicMaterial color={teamColor} transparent opacity={0.8} />
            </mesh>

            {/* Air Glow for Flying or Speed Boost */}
            {(isFlying || showSpeedTrails) && (
                <>
                    {(isFlying || showSpeedTrails) && <pointLight position={[0, -1, 0]} distance={2} intensity={2} color={teamColor} />}
                    <WindStreaks position={[0, -0.5, 0]} />
                </>
            )}

            {/* Hero Level Rewards */}
            {level >= 5 && <HeroGlow position={[0, 0.6, 0]} color={level >= 10 ? "#f1c40f" : teamColor} />}

            {level >= 10 && (
                <mesh position={[0, -0.05, 0]}>
                    <cylinderGeometry args={[0.55, 0.6, 0.1, 32]} />
                    <meshToonMaterial color="#f1c40f" />
                    <Outlines thickness={1} color="black" />
                </mesh>
            )}

            {id === 'fdr' && <AuraEffect color="#2ecc71" radius={1.5} />}
        </group>
    );
};
