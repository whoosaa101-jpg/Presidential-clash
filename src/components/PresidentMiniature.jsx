import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Text } from '@react-three/drei';
import * as THREE from 'three';
import { PRESIDENTS } from '../constants';

export const PresidentMiniature = ({ id, team = 'player' }) => {
    const group = useRef();
    const portraitRef = useRef();
    const [texture, setTexture] = useState(null);

    // Load president portrait image
    useEffect(() => {
        const president = Object.values(PRESIDENTS).find(p => p.id === id);
        if (president?.image) {
            new THREE.TextureLoader().load(
                `/${president.image}`,
                (loadedTex) => {
                    loadedTex.colorSpace = THREE.SRGBColorSpace;
                    setTexture(loadedTex);
                },
                undefined,
                (err) => console.warn("Failed to load portrait:", president.image)
            );
        }
    }, [id]);

    useFrame((state) => {
        if (group.current) {
            // Smooth idle bobbing
            group.current.position.y = -0.5 + Math.sin(state.clock.elapsedTime * 2) * 0.05;
        }
        if (portraitRef.current) {
            // Slow rotation for the portrait
            portraitRef.current.rotation.y = state.clock.elapsedTime * 0.5;

            // Animated smile effect (subtle scale pulse)
            const smile = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.03;
            portraitRef.current.scale.set(1, smile, 1);
        }
    });

    const teamColor = team === 'player' ? '#2563eb' : '#dc2626';
    const goldColor = '#f1c40f';

    return (
        <group ref={group}>
            {/* 1. HERO LIGHTING - Local to the card tiny world */}
            <pointLight position={[2, 2, 2]} intensity={2} color="white" />
            <pointLight position={[-1, 1, 1]} intensity={1} color={teamColor} />

            {/* 2. PRESTIGIOUS PEDESTAL */}
            <mesh position={[0, -0.6, 0]} receiveShadow castShadow>
                <cylinderGeometry args={[0.35, 0.4, 0.2, 32]} />
                <meshToonMaterial color="#ecf0f1" />
                <Outlines thickness={1} color="black" />
            </mesh>
            <mesh position={[0, -0.7, 0]}>
                <cylinderGeometry args={[0.4, 0.42, 0.1, 32]} />
                <meshToonMaterial color={goldColor} />
                <Outlines thickness={1} color="black" />
            </mesh>

            {/* 3. THE PRESIDENTIAL PORTRAIT - Rotating Billboard */}
            <group ref={portraitRef} position={[0, 0, 0]}>
                <Billboard follow={false} lockX={false} lockY={false} lockZ={false}>
                    <mesh>
                        <planeGeometry args={[1.2, 1.2]} />
                        <meshToonMaterial
                            map={texture}
                            color={texture ? 'white' : teamColor}
                            transparent
                            alphaTest={0.1}
                        />
                    </mesh>

                    {/* Glowing frame around portrait */}
                    <mesh position={[0, 0, -0.01]}>
                        <ringGeometry args={[0.6, 0.65, 32]} />
                        <meshBasicMaterial color={goldColor} />
                    </mesh>
                </Billboard>
            </group>

            {/* Presidential Name Plate */}
            <mesh position={[0, -0.45, 0]}>
                <boxGeometry args={[0.8, 0.1, 0.15]} />
                <meshToonMaterial color="#1e293b" />
                <Outlines thickness={1} color="black" />
            </mesh>
        </group>
    );
};
