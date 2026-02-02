import React, { useRef, useState, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Text, Ring, Outlines } from '@react-three/drei';
import { ToyBomb, ToySmoke } from './ToyBomb';
import * as THREE from 'three';

export const SuperEffectsManager = ({ effects, onComplete, playerTeam }) => {
    return (
        <group>
            {effects.map(eff => (
                <SuperEffect
                    key={eff.id}
                    {...eff}
                    playerTeam={playerTeam}
                    onComplete={() => onComplete(eff.id)}
                />
            ))}
        </group>
    );
};

const SuperEffect = ({ type, x, y, radius, team, playerTeam, onComplete, isSpell }) => {
    const [progress, setProgress] = useState(0);
    const [exploded, setExploded] = useState(!isSpell); // Only wait if it's a spell bomb
    const DURATION = isSpell ? 0.6 : 1.2;
    const isBlue = team === 'player' || team === 'blue';
    const color = isBlue ? '#3498db' : '#e74c3c';

    // Scale coords with FLIP logic matching App.jsx
    const flip = playerTeam === 'enemy' ? 1 : -1;
    const pos = [
        ((x - 200) / 20) * flip, // Corrected from 180 to 200 (BOARD_WIDTH/2)
        0.1,
        ((y - 350) / 20) * flip  // Corrected from 320 to 350 (BOARD_HEIGHT/2)
    ];

    useFrame((state, delta) => {
        if (!exploded) return;

        setProgress(p => {
            const next = p + delta / DURATION;
            if (next >= 1) {
                onComplete();
                return 1;
            }
            return next;
        });
    });

    return (
        <group position={pos}>
            {isSpell && !exploded && (
                <ToyBomb
                    position={[0, 0, 0]}
                    onExplode={() => setExploded(true)}
                />
            )}

            {exploded && (
                <>
                    {isSpell && <ToySmoke position={[0, 0.5, 0]} color={color} />}
                    {(type === 'damage' || type === 'knockback' || type === 'stun') && (
                        <group>
                            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                                <ringGeometry args={[0, (radius / 20) * progress, 64]} />
                                <meshToonMaterial color={color} transparent opacity={0.3 * (1 - progress)} />
                                <Outlines thickness={2} color="black" />
                            </mesh>
                            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                                <ringGeometry args={[(radius / 20) * progress * 0.85, (radius / 20) * progress, 64]} />
                                <meshToonMaterial color={color} transparent opacity={0.6 * (1 - progress)} />
                                <Outlines thickness={3} color="black" />
                            </mesh>
                            {/* Inner highlight ring */}
                            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                                <ringGeometry args={[(radius / 20) * progress * 0.95, (radius / 20) * progress, 64]} />
                                <meshToonMaterial color="white" transparent opacity={0.9 * (1 - progress)} />
                            </mesh>
                        </group>
                    )}

                    {type === 'heal' && (
                        <group>
                            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                                <ringGeometry args={[0, (radius / 20) * (1 - progress), 32]} />
                                <meshToonMaterial color="#2ecc71" transparent opacity={0.5 * progress} />
                                <Outlines thickness={2} color="black" />
                            </mesh>
                            <Billboard position={[0, 2 * progress, 0]}>
                                <Text fontSize={0.5} color="#2ecc71" opacity={1 - progress}>+</Text>
                            </Billboard>
                        </group>
                    )}

                    {(type === 'rush' || type === 'jump') && (
                        <group>
                            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                                <ringGeometry args={[0.5 * progress, 0.6 * progress, 32]} />
                                <meshToonMaterial color="#f1c40f" transparent opacity={0.8 * (1 - progress)} />
                                <Outlines thickness={2} color="black" />
                            </mesh>
                            <Billboard position={[0, 1, 0]}>
                                <Text fontSize={0.4} color="#f1c40f" opacity={1 - progress}>FAST</Text>
                            </Billboard>
                        </group>
                    )}
                </>
            )}
        </group>
    );
};
