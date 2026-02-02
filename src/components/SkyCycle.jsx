import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sky, Stars, Environment } from '@react-three/drei';
import * as THREE from 'three';

export const SkyCycle = ({ cycleDuration = 300, weather = "clear", onNightModeChange }) => { // 5 minutes by default
    const skyRef = useRef();
    const sunRef = useRef(new THREE.Vector3());
    const [lighting, setLighting] = React.useState({ intensity: 0.8, color: "#ffffff" });
    const lastNightState = useRef(false);
    const lightningRef = useRef();
    const lastLightning = useRef(0);

    useFrame((state) => {
        const time = state.clock.elapsedTime % cycleDuration;
        const progress = time / cycleDuration;
        const angle = progress * Math.PI * 2;

        // Sun movement
        const x = Math.sin(angle) * 100;
        const y = Math.cos(angle) * 100; // Elevation
        sunRef.current.set(x, y, 100);

        if (skyRef.current) {
            skyRef.current.sunPosition = sunRef.current;
        }

        // Lighting logic based on Time and Weather
        const isNight = y < 0;
        const isStorm = weather === 'storm';

        if (isNight !== lastNightState.current) {
            lastNightState.current = isNight;
            if (onNightModeChange) onNightModeChange(isNight);
        }

        // "Brightish" Night intensity
        let targetIntensity = isNight ? 0.35 : (isStorm ? 0.4 : 0.8);
        let targetColor = isNight ? "#d0e0ff" : (isStorm ? "#9b59b6" : "#ffffff");

        if (lighting.intensity !== targetIntensity || lighting.color !== targetColor) {
            setLighting({ intensity: targetIntensity, color: targetColor });
        }

        // Random Lightning Flash
        if (isStorm && lightningRef.current) {
            const now = state.clock.elapsedTime;
            if (now - lastLightning.current > 3 + Math.random() * 5) { // Flash every 3-8s
                lightningRef.current.intensity = 50;
                lastLightning.current = now;
                // Quick decay
                setTimeout(() => { if (lightningRef.current) lightningRef.current.intensity = 0; }, 100);
                setTimeout(() => { if (lightningRef.current) lightningRef.current.intensity = 30; }, 150);
                setTimeout(() => { if (lightningRef.current) lightningRef.current.intensity = 0; }, 250);
            }
        }
    });

    const isNight = lighting.color === "#d0e0ff";

    return (
        <>
            <Sky ref={skyRef} distance={450000} sunPosition={[0, 1, 0]} inclination={0} azimuth={0.25} />
            <Stars radius={100} depth={50} count={7000} factor={6} saturation={0.5} fade speed={2} />
            <ambientLight intensity={lighting.intensity} color={isNight ? "#445588" : "#ffffff"} />
            <directionalLight
                position={[sunRef.current.x, sunRef.current.y, 100]}
                intensity={isNight ? 0.5 : lighting.intensity * 1.5}
                color={lighting.color}
                castShadow={sunRef.current.y > 10 && weather !== "storm"}
            />

            {/* Monument Uplighting (Active at Night) */}
            {isNight && (
                <group>
                    {/* White House Uplight */}
                    <spotLight position={[0, -5, -15]} target-position={[0, 5, -20]} intensity={10} color="#ffccaa" angle={0.6} penumbra={0.5} castShadow />
                    {/* Lincoln Memorial Uplight */}
                    <spotLight position={[-8, -5, -15]} target-position={[-8, 5, -20]} intensity={8} color="#ffffff" angle={0.5} penumbra={0.5} />
                    {/* Pentagon Uplight */}
                    <spotLight position={[8, -5, -15]} target-position={[8, 5, -20]} intensity={8} color="#ffffff" angle={0.5} penumbra={0.5} />

                    {/* Player Side Uplights */}
                    <spotLight position={[0, -5, 15]} target-position={[0, 5, 20]} intensity={10} color="#ffccaa" angle={0.6} penumbra={0.5} />
                </group>
            )}

            {weather === 'storm' && (
                <pointLight ref={lightningRef} position={[Math.random() * 20 - 10, 20, Math.random() * 20 - 10]} intensity={0} color="#ffffff" distance={100} />
            )}
        </>
    );
};
