import React, { useState, useCallback, Component, Suspense, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Billboard, Text, Image as ThreeImage, Float, Stars, Environment, ContactShadows, useTexture, Sparkles, Sky, Outlines, Grid } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing'; // Keeping import for now but unused to prevent breakage if user reverts
import * as THREE from 'three';
import { io } from 'socket.io-client';
import './App.css';
import { useNetwork } from './hooks/useNetwork';
import { useSound } from './hooks/useSound';
import { PRESIDENTS, MAX_ELIXIR, BOARD_WIDTH, BOARD_HEIGHT, GRID_SIZE, PLAYER_SPAWN_Y_START, RIVER_Y, BRIDGES, LANDMARKS, TOWER_HEALTH, LEAGUES, SEASON_PASS_REWARDS } from './constants';
import { Projectile, ParticleExplosion, DamageFlash, SpawnSmoke } from './components/Effects';
import { PresidentMiniature } from './components/PresidentMiniature';
import { SuperEffectsManager } from './components/SuperEffects';
import { ToyUnit } from './components/ToyUnit';
import { MainMenu } from './components/MainMenu';
import { CollectionView } from './components/CollectionView';
import { HallOfFame } from './components/HallOfFame';
import { ActionReport } from './components/ActionReport';
import { BattleResults } from './components/BattleResults';
import { LeagueView } from './components/LeagueView';
import { SkyCycle } from './components/SkyCycle';
import { Shockwave } from './components/CinematicVFX';
import { EmoteMenu, EmoteOverlay } from './components/EmoteSystem';
import { useProgression } from './hooks/useProgression';
import { useDeclarationManager } from './hooks/useDeclarationManager';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import './components/MainMenu.css';
import './components/CollectionView.css';
import './components/HallOfFame.css';
import './components/ActionReport.css';
import './components/BattleResults.css';

// CRITICAL: Boot sequence logging
console.log('[BOOT] Presidential Clash initializing...');

const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

const TutorialAdvisor = ({ step, onNext }) => {
  const messages = [
    {
      title: "EYES FRONT, CANDIDATE!",
      text: "I'm Agent Sterling, your Secret Service Advisor. D.C. is under attack, and you're the only one with the clearance to lead.",
      btn: "REPORTING FOR DUTY!"
    },
    {
      title: "THE WAR CHEST",
      text: "See those 'Campaign Funds' at the bottom? They refill over time. Every President you deploy costs funds. Use them wisely!",
      btn: "UNDERSTOOD."
    },
    {
      title: "DEPLOYMENT",
      text: "Drag a Presidential Card onto YOUR side of the field (above the warships) to spawn them. They will march towards the enemy King!",
      btn: "LET'S CLASH!"
    },
    {
      title: "THE OBJECTIVE",
      text: "Take down the enemy's White House. If you lose your own, the term is over. Don't let the voters down!",
      btn: "FOR THE REPUBLIC!"
    }
  ];

  if (step >= messages.length) return null;
  const msg = messages[step];

  return (
    <div className="tutorial-overlay">
      <div className="advisor-agent">
        <div className="agent-sunglasses">🕶️</div>
        <div className="agent-badge">SECRET SERVICE</div>
      </div>
      <div className="advisor-dialog">
        <h3>{msg.title}</h3>
        <p>{msg.text}</p>
        <button onClick={onNext} className="advisor-btn">{msg.btn}</button>
      </div>
    </div>
  );
};

// --- 3D LANDMARK MODELS (TOON STYLE) ---

const WhiteHouseModel = ({ scale = 1, color = "#f5f6fa", nightMode = false }) => {
  return (
    <group scale={scale}>
      {/* North Portico Triangular Pediment */}
      <mesh position={[0, 1.2, 0.4]}>
        <coneGeometry args={[1.2, 0.5, 3]} rotation={[0, Math.PI, 0]} />
        <meshToonMaterial color={color} />
        <Outlines thickness={2} color="black" />
      </mesh>

      {/* Portico Columns */}
      {[-0.4, -0.15, 0.15, 0.4].map((x, i) => (
        <group key={i} position={[x, 0.6, 0.5]}>
          <mesh>
            <cylinderGeometry args={[0.04, 0.05, 0.8, 12]} />
            <meshToonMaterial color={color} />
            <Outlines thickness={1.5} color="black" />
          </mesh>
          <mesh position={[0, 0.4, 0]}> {/* Scroll Capital */}
            <boxGeometry args={[0.12, 0.05, 0.12]} />
            <meshToonMaterial color={color} />
            <Outlines thickness={1.5} color="black" />
          </mesh>
        </group>
      ))}

      {/* Main Building Body */}
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[1.6, 0.7, 0.8]} />
        <meshToonMaterial color={color} />
        <Outlines thickness={3} color="black" />
      </mesh>

      {/* Side Wings */}
      <mesh position={[-1.1, 0.3, 0]}>
        <boxGeometry args={[0.6, 0.4, 0.5]} />
        <meshToonMaterial color={color} />
        <Outlines thickness={2} color="black" />
      </mesh>
      <mesh position={[1.1, 0.3, 0]}>
        <boxGeometry args={[0.6, 0.4, 0.5]} />
        <meshToonMaterial color={color} />
        <Outlines thickness={2} color="black" />
      </mesh>

      {/* Windows (Lit at night - Solid Pixels) */}
      {[...Array(7)].map((_, i) => (
        <mesh key={`w-${i}`} position={[((i / 6) - 0.5) * 1.4, 0.6, 0.41]}>
          <boxGeometry args={[0.08, 0.12, 0.02]} />
          <meshBasicMaterial color={nightMode ? "#f1c40f" : "#2c3e50"} />
        </mesh>
      ))}

      {/* Truman Balcony */}
      <mesh position={[0, 0.5, 0.45]}>
        <boxGeometry args={[1.0, 0.05, 0.2]} />
        <meshToonMaterial color="#bdc3c7" />
        <Outlines thickness={1.5} color="black" />
      </mesh>

      {/* Flag */}
      <mesh position={[0, 1.6, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.4]} />
        <meshToonMaterial color="#7f8c8d" />
        <Outlines thickness={1} color="black" />
      </mesh>
    </group>
  );
};

const LincolnMemorialModel = ({ scale = 1, color = "#f5f6fa", nightMode = false }) => {
  const columns = [];
  for (let i = 0; i < 16; i++) {
    const angle = (i / 16) * Math.PI * 2;
    columns.push(
      <mesh key={i} position={[Math.cos(angle) * 0.6, 0.5, Math.sin(angle) * 0.4]}>
        <cylinderGeometry args={[0.04, 0.05, 0.8, 8]} />
        <meshToonMaterial color={color} />
        <Outlines thickness={1} color="black" />
      </mesh>
    );
  }

  return (
    <group scale={scale}>
      {/* Base Steps */}
      <mesh position={[0, 0.1, 0]}>
        <boxGeometry args={[1.4, 0.2, 1.0]} />
        <meshToonMaterial color={color} />
        <Outlines thickness={2} color="black" />
      </mesh>
      {/* Floor */}
      <mesh position={[0, 0.25, 0]}>
        <boxGeometry args={[1.3, 0.1, 0.9]} />
        <meshToonMaterial color="#ecf0f1" />
      </mesh>
      {/* Columns */}
      {columns}
      {/* Entablature */}
      <mesh position={[0, 0.95, 0]}>
        <boxGeometry args={[1.3, 0.15, 0.9]} />
        <meshToonMaterial color="#ffffff" />
        <Outlines thickness={2} color="black" />
      </mesh>
      {/* Attic */}
      <mesh position={[0, 1.1, 0]}>
        <boxGeometry args={[1.3, 0.2, 0.9]} />
        <meshToonMaterial color={color} />
        <Outlines thickness={2} color="black" />
      </mesh>
      {/* Mini Lincoln Statue */}
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[0.25, 0.35, 0.25]} />
        <meshToonMaterial color={nightMode ? "#ffffff" : "#bdc3c7"} />
        <Outlines thickness={1.5} color="black" />
      </mesh>
    </group>
  );
};

const PentagonModel = ({ scale = 1, color = "#f5f6fa" }) => {
  return (
    <group scale={scale}>
      {/* 5 Concentric Rings Effect */}
      {[0.9, 0.7, 0.5, 0.3].map((s, i) => (
        <mesh key={i} position={[0, 0.1 + (i * 0.05), 0]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[s - 0.15, s, 5]} />
          <meshToonMaterial color={i % 2 === 0 ? color : "#bdc3c7"} side={THREE.DoubleSide} />
          <Outlines thickness={1.5} color="black" />
        </mesh>
      ))}

      {/* Center Courtyard */}
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.15, 32]} />
        <meshToonMaterial color="#27ae60" />
      </mesh>

      {/* Walls */}
      <mesh position={[0, 0.2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <cylinderGeometry args={[0.9, 0.95, 0.3, 5]} />
        <meshToonMaterial color={color} opacity={0.9} transparent />
        <Outlines thickness={2} color="black" />
      </mesh>
    </group>
  );
};

const CherryBlossomTree = ({ position, scale = 1 }) => {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.1, 0.15, 0.8, 6]} />
        <meshToonMaterial color="#5d4037" />
        <Outlines thickness={1} color="black" />
      </mesh>
      <mesh position={[0, 0.9, 0]}>
        <sphereGeometry args={[0.6, 6, 6]} />
        <meshToonMaterial color="#ffb7b2" />
        <Outlines thickness={1} color="pink" />
      </mesh>
    </group>
  );
};

// No Cinematic Camera needed for now, simplified
const CameraRig = () => {
  const { camera } = useThree();
  useFrame(() => {
    camera.lookAt(0, 0, 0);
  });
  return null;
};

const BattleResultOverlay = ({ result, onRematch, onExit, rematchRequested }) => {
  if (!result) return null;
  const isVictory = result.includes('Victory');
  const team = result.includes('Blue') ? 'player' : 'enemy';

  return (
    <div className={`result-overlay ${isVictory ? 'victory' : 'defeat'}`}>
      <div className="result-banner">
        <h1 className="result-title">{isVictory ? 'VICTORY' : 'DEFEAT'}</h1>
        <p className="result-subtitle">{result}</p>
        <div className="result-buttons">
          <button onClick={onRematch} className="rematch-btn giant">
            {rematchRequested ? "WAITING FOR OPPONENT..." : "PLAY AGAIN"}
          </button>
          <button onClick={onExit} className="exit-btn">RETURN TO HQ</button>
        </div>
      </div>
    </div>
  );
};

const AnnouncementOverlay = ({ announcement }) => {
  if (!announcement) return null;
  return (
    <div className={`announcement-overlay ${announcement.team}`}>
      <div className="announcement-content">
        <div className="announcement-main">{announcement.text}</div>
        {announcement.subtext && <div className="announcement-sub">{announcement.subtext}</div>}
      </div>
    </div>
  );
};

// 2.5D Standee Component (Billboard) - Safe Loader
const Standee = ({ image, color, scale = 1, isFriendly = true }) => {
  const [texture, setTexture] = useState(null);
  useEffect(() => {
    if (!image) return;
    new THREE.TextureLoader().load(image, (loadedTex) => {
      loadedTex.colorSpace = THREE.SRGBColorSpace;
      setTexture(loadedTex);
    }, undefined, (err) => console.warn("Failed to load texture:", image));
  }, [image]);

  return (
    <Billboard follow={true} lockX={true} lockY={false} lockZ={true}>
      <mesh position={[0, scale / 2, 0]}>
        <planeGeometry args={[scale, scale]} />
        <meshStandardMaterial map={texture} color={texture ? 'white' : (color || 'white')} transparent alphaTest={0.5} roughness={0.8} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <ringGeometry args={[scale * 0.3, scale * 0.4, 32]} />
        <meshStandardMaterial color={isFriendly ? '#3498db' : '#e74c3c'} metalness={0.8} roughness={0.2} />
      </mesh>
    </Billboard>
  );
};

const Unit3D = ({ unit, playerTeam, onAttack, level = 1, showSpeedTrails = false }) => {
  const meshRef = useRef();
  const targetPos = useRef(new THREE.Vector3());
  const flip = playerTeam === 'enemy' ? 1 : -1;
  const isFriendly = unit.isFriendly ?? (unit.team === playerTeam); // CRITICAL: Fix ReferenceError

  const getPos = (ux, uy) => [
    ((ux - BOARD_WIDTH / 2) / 20) * flip,
    0,
    ((uy - BOARD_HEIGHT / 2) / 20) * flip
  ];

  useFrame((state) => {
    if (!meshRef.current) return;
    const [tx, ty, tz] = getPos(unit.x, unit.y);
    targetPos.current.set(tx, ty, tz);
    meshRef.current.position.lerp(targetPos.current, 0.15);

    meshRef.current.rotation.y = unit.team === 'enemy' ? Math.PI : 0;

    if (unit.state === 'attacking') onAttack(unit);
  });

  if (unit.hp <= 0) return null;

  return (
    <group ref={meshRef}>
      <ToyUnit
        id={unit.id}
        team={unit.team}
        isFlying={unit.isFlying}
        isAttacking={unit.isAttacking}
        isMoving={unit.state !== 'attacking' && unit.state !== 'idle'}
        scale={unit.id === 'secret_service' ? 0.6 : 1.0}
        level={level}
        showSpeedTrails={showSpeedTrails}
      />
      <Billboard position={[0, 2.2, 0]}>
        <mesh>
          <planeGeometry args={[0.8, 0.1]} />
          <meshBasicMaterial color="#000" />
        </mesh>
        <mesh position={[((unit.currentHp / unit.health) - 1) * 0.4, 0, 0.01]}>
          <planeGeometry args={[(unit.currentHp / unit.health) * 0.8, 0.08]} />
          <meshBasicMaterial color={isFriendly ? '#2ecc71' : '#e74c3c'} />
        </mesh>
      </Billboard>
    </group>
  );
};

const Tower3D = ({ tower, playerTeam, nightMode = false }) => {
  const isFriendly = playerTeam ? (tower.type === playerTeam) : (tower.type === 'player');
  const teamColor = isFriendly ? '#3498db' : '#e74c3c';
  const flip = playerTeam === 'enemy' ? 1 : -1;
  const x = ((tower.x - BOARD_WIDTH / 2) / 20) * flip;
  const z = ((tower.y - BOARD_HEIGHT / 2) / 20) * flip;
  const scale = tower.isKing ? 2.2 : 1.6;

  const renderLandmark = () => {
    switch (tower.landmark) {
      case LANDMARKS.WHITE_HOUSE: return <WhiteHouseModel scale={scale} color={teamColor} nightMode={nightMode} />;
      case LANDMARKS.LINCOLN_MEMORIAL: return <LincolnMemorialModel scale={scale} color={teamColor} nightMode={nightMode} />;
      case LANDMARKS.PENTAGON: return <PentagonModel scale={scale} color={teamColor} nightMode={nightMode} />;
      default: return null;
    }
  };

  const groupRef = useRef();
  const prevHp = useRef(tower.hp);
  const shakeTime = useRef(0);

  useFrame((state, delta) => {
    if (tower.hp < prevHp.current) {
      shakeTime.current = 0.5; // Shake for 0.5s
      prevHp.current = tower.hp;
    }

    if (shakeTime.current > 0 && groupRef.current) {
      shakeTime.current -= delta;
      const intensity = shakeTime.current * 0.5;
      groupRef.current.position.x = x + (Math.random() - 0.5) * intensity;
      groupRef.current.position.z = z + (Math.random() - 0.5) * intensity;
    } else if (groupRef.current) {
      groupRef.current.position.x = x;
      groupRef.current.position.z = z;
    }
  });

  if (tower.hp <= 0) return null;

  return (
    <group ref={groupRef} position={[x, 0, z]}>
      {tower.landmark ? renderLandmark() : (
        <>
          {/* 3D Stylized Tower Base */}
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[scale, scale * 1.2, scale * 2, 6]} />
            <meshStandardMaterial color="#7f8c8d" roughness={0.8} />
          </mesh>

          {/* Tower Top (Colored) */}
          <mesh position={[0, scale, 0]} castShadow>
            <cylinderGeometry args={[scale * 1.1, scale * 1.1, 0.4, 6]} />
            <meshStandardMaterial color={teamColor} roughness={0.6} />
          </mesh>

          {/* Dome (for King) */}
          {tower.isKing && (
            <mesh position={[0, scale + 0.5, 0]} castShadow>
              <sphereGeometry args={[scale * 0.8, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <meshStandardMaterial color={teamColor} roughness={0.2} metalness={0.5} />
            </mesh>
          )}
        </>
      )}

      <Billboard position={[0, scale * 2 + 1, 0]}>
        <Text fontSize={0.8} color="white" outlineColor="black" outlineWidth={0.05}>
          {Math.round(tower.hp)}
        </Text>
      </Billboard>
    </group>
  );
};

const SpawningGrid = ({ onSpawn, selectedCard }) => {
  const gridCells = useMemo(() => {
    const cells = [];
    for (let x = 0; x < BOARD_WIDTH; x += GRID_SIZE) {
      for (let y = PLAYER_SPAWN_Y_START; y < BOARD_HEIGHT; y += GRID_SIZE) {
        cells.push({ x: x + GRID_SIZE / 2, y: y + GRID_SIZE / 2 });
      }
    }
    return cells;
  }, []);
  if (!selectedCard) return null;
  return (
    <group>
      {gridCells.map((cell, i) => (
        <mesh key={i} position={[(cell.x - BOARD_WIDTH / 2) / 20, 0.01, (cell.y - BOARD_HEIGHT / 2) / 20]} rotation={[-Math.PI / 2, 0, 0]} onClick={(e) => { e.stopPropagation(); onSpawn(cell.x, cell.y); }}>
          <planeGeometry args={[GRID_SIZE / 20 - 0.05, GRID_SIZE / 20 - 0.05]} />
          <meshBasicMaterial color="#f1c40f" transparent opacity={0.25} />
        </mesh>
      ))}
    </group>
  );
};

const PotomacWater = () => {
  const meshRef = useRef();
  useFrame((state) => {
    if (meshRef.current) meshRef.current.material.uniforms.time.value = state.clock.elapsedTime;
  });
  const uniforms = useMemo(() => ({
    time: { value: 0 },
    colorA: { value: new THREE.Color("#0a3d62") },
    colorB: { value: new THREE.Color("#1e3799") },
    colorC: { value: new THREE.Color("#2980b9") }
  }), []);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} ref={meshRef} receiveShadow>
      <planeGeometry args={[22, 2.5, 64, 32]} />
      <shaderMaterial uniforms={uniforms} vertexShader={`varying vec2 vUv; uniform float time; void main() { vUv = uv; vec3 pos = position; pos.z += sin(pos.x * 2.0 + time * 1.5) * cos(pos.y * 2.0 + time) * 0.1; gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0); }`} fragmentShader={`varying vec2 vUv; uniform vec3 colorA; uniform vec3 colorB; uniform vec3 colorC; uniform float time; void main() { float wave = sin(vUv.x * 20.0 + time * 2.0) * 0.5 + 0.5; vec3 coreColor = mix(colorA, colorB, wave); gl_FragColor = vec4(coreColor, 0.9); }`} transparent />
    </mesh>
  );
};

const ParkBench = ({ position, rotation = [0, 0, 0] }) => (
  <group position={position} rotation={rotation}>
    {/* Bench Base */}
    <mesh position={[0, 0.1, 0]}>
      <boxGeometry args={[1.2, 0.05, 0.4]} />
      <meshToonMaterial color="#34495e" />
      <Outlines thickness={1} color="black" />
    </mesh>
    {/* Bench Back */}
    <mesh position={[0, 0.3, -0.2]} rotation={[-0.2, 0, 0]}>
      <boxGeometry args={[1.2, 0.4, 0.05]} />
      <meshToonMaterial color="#2c3e50" />
      <Outlines thickness={1} color="black" />
    </mesh>
    {/* Legs */}
    <mesh position={[-0.5, 0.05, 0.15]}><boxGeometry args={[0.05, 0.1, 0.05]} /><meshToonMaterial color="#1a1a1a" /><Outlines thickness={0.5} color="black" /></mesh>
    <mesh position={[0.5, 0.05, 0.15]}><boxGeometry args={[0.05, 0.1, 0.05]} /><meshToonMaterial color="#1a1a1a" /><Outlines thickness={0.5} color="black" /></mesh>
    <mesh position={[-0.5, 0.05, -0.15]}><boxGeometry args={[0.05, 0.1, 0.05]} /><meshToonMaterial color="#1a1a1a" /><Outlines thickness={0.5} color="black" /></mesh>
    <mesh position={[0.5, 0.05, -0.15]}><boxGeometry args={[0.05, 0.1, 0.05]} /><meshToonMaterial color="#1a1a1a" /><Outlines thickness={0.5} color="black" /></mesh>
  </group>
);

const Flagpole = ({ position }) => {
  const flagRef = useRef();
  useFrame((state) => {
    if (flagRef.current) flagRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 2) * 0.1;
  });

  return (
    <group position={position}>
      {/* Pole */}
      <mesh position={[0, 2, 0]}>
        <cylinderGeometry args={[0.05, 0.08, 4, 8]} />
        <meshToonMaterial color="#bdc3c7" />
        <Outlines thickness={1} color="black" />
      </mesh>
      {/* Flag */}
      <mesh position={[0.6, 3.5, 0]} ref={flagRef}>
        <boxGeometry args={[1.2, 0.8, 0.02]} />
        <meshToonMaterial color="#e74c3c" />
        <Outlines thickness={2} color="black" />
        <Text
          position={[0, 0, 0.02]}
          fontSize={0.2}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          🇺🇸
        </Text>
      </mesh>
      {/* Gold Top */}
      <mesh position={[0, 4, 0]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshToonMaterial color="#f1c40f" />
        <Outlines thickness={1} color="black" />
      </mesh>
    </group>
  );
};

const RoseBush = ({ position, scale = 1 }) => (
  <group position={position} scale={scale}>
    <mesh position={[0, 0.2, 0]}>
      <sphereGeometry args={[0.3, 8, 8]} />
      <meshToonMaterial color="#27ae60" />
      <Outlines thickness={1} color="black" />
    </mesh>
    <mesh position={[0.1, 0.3, 0.1]}>
      <sphereGeometry args={[0.1, 4, 4]} />
      <meshToonMaterial color="#e74c3c" />
    </mesh>
    <mesh position={[-0.1, 0.25, -0.1]}>
      <sphereGeometry args={[0.08, 4, 4]} />
      <meshToonMaterial color="#e74c3c" />
    </mesh>
  </group>
);

const RoseGarden = () => (
  <group>
    <RoseBush position={[-10, 0.5, -18]} scale={1.2} />
    <RoseBush position={[10, 0.5, -18]} scale={1.2} />
    <RoseBush position={[-10, 0.5, 18]} scale={1.2} />
    <RoseBush position={[10, 0.5, 18]} scale={1.2} />
    <RoseBush position={[-13, 0.5, 0]} scale={1} />
    <RoseBush position={[13, 0.5, 0]} scale={1} />
  </group>
);

const USSBoat = ({ position, rotation = [0, 0, 0], name = "USS CONSTITUTION" }) => (
  <group position={position} rotation={rotation}>
    {/* Hull - Narrow and Long for North-South Lane alignment */}
    <mesh position={[0, -0.2, 0]}>
      <boxGeometry args={[4.4, 0.8, 8.5]} />
      <meshToonMaterial color="#576574" />
      <Outlines thickness={3} color="black" />
    </mesh>
    {/* Pointy Bow (Towards Enemy) */}
    <mesh position={[0, -0.2, -4.8]} rotation={[0, 0, 0]}>
      <coneGeometry args={[2.2, 1.5, 4]} rotation={[Math.PI / 2, 0, 0]} />
      <meshToonMaterial color="#576574" />
      <Outlines thickness={2} color="black" />
    </mesh>
    {/* Pointy Stern (Towards Player) */}
    <mesh position={[0, -0.2, 4.8]} rotation={[0, 0, 0]}>
      <coneGeometry args={[2.2, 1.5, 4]} rotation={[-Math.PI / 2, 0, 0]} />
      <meshToonMaterial color="#576574" />
      <Outlines thickness={2} color="black" />
    </mesh>

    {/* Walking Deck - Perfectly aligned with lane width */}
    <mesh position={[0, 0.21, 0]}>
      <boxGeometry args={[4.2, 0.05, 11]} />
      <meshToonMaterial color="#2c3e50" />
      <Outlines thickness={1} color="black" />
    </mesh>

    {/* Superstructure (Island) */}
    <mesh position={[1.4, 0.8, 0]}>
      <boxGeometry args={[0.8, 1.2, 2.5]} />
      <meshToonMaterial color="#8395a7" />
      <Outlines thickness={2} color="black" />
    </mesh>
    {/* Turrets (Pointed along lane) */}
    <mesh position={[0, 0.4, -3]}>
      <boxGeometry args={[1, 0.5, 1.2]} />
      <meshToonMaterial color="#2c3e50" />
      <Outlines thickness={1.5} color="black" />
    </mesh>
    <mesh position={[0, 0.6, -3]}>
      <cylinderGeometry args={[0.05, 0.05, 1.5]} rotation={[Math.PI / 2, 0, 0]} />
      <meshToonMaterial color="black" />
    </mesh>
    {/* Ship Name Labels */}
    <Text position={[-1.71, 0.5, 0]} rotation={[0, -Math.PI / 2, 0]} fontSize={0.3} color="white" fontWeight="900" anchorX="center">{name}</Text>
    <Text position={[1.81, 0.3, 1.5]} rotation={[0, Math.PI / 2, 0]} fontSize={0.4} color="#bdc3c7" fontWeight="bold">USS</Text>
  </group>
);

const StrategicLane = ({ position, nightMode = false, isTop = true }) => {
  const laneColor = nightMode ? "#2c3e50" : "#b7950b";
  const dividerColor = "#f1c40f";

  return (
    <group position={position}>
      {/* Segmented Path Slab */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, isTop ? -13.25 : 13.25]} receiveShadow>
        <planeGeometry args={[4.2, 18.5]} />
        <meshToonMaterial color={laneColor} />
        <Outlines thickness={2} color="black" />
      </mesh>

      {/* Stone Border */}
      <mesh position={[2.1, 0.05, isTop ? -13.25 : 13.25]}>
        <boxGeometry args={[0.2, 0.1, 18.5]} />
        <meshToonMaterial color="#7f8c8d" />
      </mesh>
      <mesh position={[-2.1, 0.05, isTop ? -13.25 : 13.25]}>
        <boxGeometry args={[0.2, 0.1, 18.5]} />
        <meshToonMaterial color="#7f8c8d" />
      </mesh>
    </group>
  );
};

const PerimeterFence = () => {
  const segmentWidth = 2.5;
  const halfWidth = 12.5;
  const halfHeight = 22.5;

  const fencePieces = [];
  // Horizontal (Top & Bottom)
  for (let x = -halfWidth; x <= halfWidth; x += segmentWidth) {
    fencePieces.push(<mesh key={`t-${x}`} position={[x, 0.4, -halfHeight]}><boxGeometry args={[segmentWidth, 0.8, 0.1]} /><meshToonMaterial color="white" /><Outlines thickness={1} color="black" /></mesh>);
    fencePieces.push(<mesh key={`b-${x}`} position={[x, 0.4, halfHeight]}><boxGeometry args={[segmentWidth, 0.8, 0.1]} /><meshToonMaterial color="white" /><Outlines thickness={1} color="black" /></mesh>);
  }
  // Vertical (Left & Right)
  for (let z = -halfHeight; z <= halfHeight; z += segmentWidth) {
    fencePieces.push(<mesh key={`l-${z}`} position={[-halfWidth, 0.4, z]} rotation={[0, Math.PI / 2, 0]}><boxGeometry args={[segmentWidth, 0.8, 0.1]} /><meshToonMaterial color="white" /><Outlines thickness={1} color="black" /></mesh>);
    fencePieces.push(<mesh key={`r-${z}`} position={[halfWidth, 0.4, z]} rotation={[0, Math.PI / 2, 0]}><boxGeometry args={[segmentWidth, 0.8, 0.1]} /><meshToonMaterial color="white" /><Outlines thickness={1} color="black" /></mesh>);
  }

  return <group>{fencePieces}</group>;
};

const ClashRoyaleArena = ({ nightMode = false, bridges = [] }) => (
  <group>
    {/* Main Floor - Thick Baseplate */}
    <mesh position={[0, -0.25, 0]} receiveShadow>
      <boxGeometry args={[25, 0.5, 45]} />
      <meshToonMaterial color={nightMode ? "#1a331a" : "#2d5a27"} />
      <Outlines thickness={4} color="black" />
      {/* Premium Gold Grid */}
      <gridHelper args={[25, 25, "#f1c40f", "#f1c40f"]} rotation={[0, 0, 0]} position={[0, 0.26, 0]} opacity={0.1} transparent />
    </mesh>

    {/* Strategic Lanes (Split by River) - Precisely aligned with engine LANE_X (±5 in 3D) */}
    <StrategicLane position={[-5, 0.01, 0]} nightMode={nightMode} isTop={true} />
    <StrategicLane position={[-5, 0.01, 0]} nightMode={nightMode} isTop={false} />
    <StrategicLane position={[5, 0.01, 0]} nightMode={nightMode} isTop={true} />
    <StrategicLane position={[5, 0.01, 0]} nightMode={nightMode} isTop={false} />

    {/* USS Boat Crossings - Named Warships aligned with paths and filtered by Server State */}
    {(!bridges.length || bridges.find(b => b.x <= 100)) && <USSBoat position={[-5, 0, 0]} name="USS ENTERPRISE" />}
    {(!bridges.length || bridges.find(b => b.x >= 300)) && <USSBoat position={[5, 0, 0]} name="USS CONSTITUTION" />}

    {/* Props */}
    <CherryBlossomTree position={[-12, -15, 0]} scale={1.5} rotation={[Math.PI / 2, 0, 0]} />
    <CherryBlossomTree position={[12, -12, 0]} scale={1.2} rotation={[Math.PI / 2, 0, 0]} />
    <CherryBlossomTree position={[-11, 5, 0]} scale={1.4} rotation={[Math.PI / 2, 0, 0]} />
    <CherryBlossomTree position={[13, 8, 0]} scale={1.6} rotation={[Math.PI / 2, 0, 0]} />
    <CherryBlossomTree position={[-12, 20, 0]} scale={1.3} rotation={[Math.PI / 2, 0, 0]} />
    <CherryBlossomTree position={[12, 18, 0]} scale={1.5} rotation={[Math.PI / 2, 0, 0]} />

    <RoseGarden />

    {/* Flagpoles */}
    <Flagpole position={[-11, 0, -21]} />
    <Flagpole position={[11, 0, -21]} />
    <Flagpole position={[-11, 0, 21]} />
    <Flagpole position={[11, 0, 21]} />

    {/* Benches */}
    <ParkBench position={[-13, 0, -10]} rotation={[0, Math.PI / 2, 0]} />
    <ParkBench position={[13, 0, -10]} rotation={[0, -Math.PI / 2, 0]} />
    <ParkBench position={[-13, 0, 10]} rotation={[0, Math.PI / 2, 0]} />
    <ParkBench position={[13, 0, 10]} rotation={[0, -Math.PI / 2, 0]} />

    {/* Atmosphere */}
    <Sparkles count={50} scale={[25, 2, 45]} size={2} color="#ffb7c5" speed={0.5} opacity={0.5} />

    <PerimeterFence />
  </group>
);

const Battlefield = ({ towers, units, enemyUnits, neutralUnits = [], bridges, onSpawn, selectedCard, superEffects, battleVfx, onEffectComplete, onVfxComplete, playerTeam, playShoot, playHit, getLevel, weather, isMobile, activeEvents }) => {
  const [projectiles, setProjectiles] = useState([]);
  const [shocks, setShocks] = useState([]);
  const [nightMode, setNightMode] = useState(false);
  const flip = playerTeam === 'enemy' ? 1 : -1;

  const handleAttack = useCallback((unit) => {
    const allTargets = [...towers, ...units, ...enemyUnits];
    const target = allTargets.find(t => (t.id || t.uid) === unit.targetUid);
    if (!target) return;

    const start = [((unit.x - BOARD_WIDTH / 2) / 20) * flip, 1.2, ((unit.y - BOARD_HEIGHT / 2) / 20) * flip];
    const end = [((target.x - BOARD_WIDTH / 2) / 20) * flip, 1.2, ((target.y - BOARD_HEIGHT / 2) / 20) * flip];

    if (unit.id === 'lincoln' || unit.id === 'abraham_lincoln') {
      const impactPos = [((unit.x - BOARD_WIDTH / 2) / 20) * flip, 0.1, ((unit.y - BOARD_HEIGHT / 2) / 20) * flip + 0.5];
      setShocks(prev => [...prev, { id: Date.now(), pos: impactPos }]);
    }

    let pType = 'generic';
    if (unit.id === 'george_washington' || unit.id === 'washington') pType = 'musket';
    if (unit.id === 'obama') pType = 'drone';
    if (unit.id === 'truman') pType = 'rocket';

    setProjectiles(prev => [...prev, { id: Date.now(), start, end, team: unit.team, speed: 0.15, type: pType }]);
    if (playShoot) playShoot(unit.id);
  }, [playShoot, towers, units, enemyUnits, flip]);

  return (
    <Canvas
      shadows
      dpr={isMobile ? [1, 1] : [1, 2]}
      gl={{ antialias: !isMobile, toneMapping: THREE.ACESFilmicToneMapping }}
      camera={{ position: [0, 15, 12], fov: 45 }}
    >
      <SkyCycle weather={weather} onNightModeChange={setNightMode} />
      <Environment preset="sunset" />

      <Suspense fallback={null}>
        <ClashRoyaleArena nightMode={nightMode} bridges={bridges} />
        <PotomacWater />
        {towers.map(t => <Tower3D key={t.id} tower={t} playerTeam={playerTeam} nightMode={nightMode} />)}
        {units.concat(enemyUnits).concat(neutralUnits).map(u => (
          <Unit3D
            key={u.uid}
            unit={u}
            playerTeam={playerTeam}
            onAttack={handleAttack}
            level={getLevel(u.id)}
            showSpeedTrails={activeEvents?.includes('infrastructure')}
          />
        ))}
        <SpawningGrid onSpawn={onSpawn} selectedCard={selectedCard} />
        <SuperEffectsManager effects={superEffects} onComplete={onEffectComplete} playerTeam={playerTeam} />
        {shocks.map(s => <Shockwave key={s.id} position={s.pos} onComplete={() => setShocks(prev => prev.filter(sh => sh.id !== s.id))} />)}
        {superEffects.map(p => (
          <Projectile
            key={p.id}
            {...p}
            onComplete={() => {
              onEffectComplete(p.id);
              if (playHit) playHit();
            }}
          />
        ))}
        {battleVfx.map(v => (
          v.type === 'spawn' ? (
            <SpawnSmoke key={v.id} position={v.position} onComplete={() => onVfxComplete(v.id)} />
          ) : (
            <ParticleExplosion key={v.id} position={v.position} color={v.color} onComplete={() => onVfxComplete(v.id)} />
          )
        ))}
      </Suspense>
      <OrbitControls makeDefault enablePan={false} maxPolarAngle={Math.PI / 2.5} minDistance={10} maxDistance={40} />
    </Canvas>
  );
};

// --- ARENA 2D FALLBACK ---

const Arena2D = ({ units, enemyUnits, towers, onSpawn, selectedCard }) => (
  <div className="arena-2d" style={{ background: '#1e3a1e', backgroundImage: 'radial-gradient(#27ae60 1px, transparent 1px)', backgroundSize: '20px 20px' }} onClick={(e) => {
    if (!selectedCard) return;
    const rect = e.currentTarget.getBoundingClientRect();
    onSpawn(((e.clientX - rect.left) / rect.width) * BOARD_WIDTH, ((e.clientY - rect.top) / rect.height) * BOARD_HEIGHT);
  }}>
    <div className="river-2d" style={{ top: `${(RIVER_Y / BOARD_HEIGHT) * 100}%`, height: '40px', background: 'linear-gradient(rgba(52, 152, 219, 0.8), rgba(41, 128, 185, 0.9))', boxShadow: '0 0 15px #3498db' }}></div>
    {BRIDGES.map((b, i) => (
      <div key={i} className="bridge-2d" style={{
        left: `${(b.x / BOARD_WIDTH) * 100}%`,
        top: `${(b.y / BOARD_HEIGHT) * 100}%`,
        width: `${(b.width / BOARD_WIDTH) * 100}%`,
        height: '50px',
        background: '#7f8c8d',
        border: '2px solid #333',
        borderRadius: '4px'
      }}></div>
    ))}
    {towers.map(t => (
      <div key={t.id} className={`tower-2d ${t.type}`} style={{ left: `${(t.x / BOARD_WIDTH) * 100}%`, top: `${(t.y / BOARD_HEIGHT) * 100}%`, transform: 'translate(-50%, -50%)', width: t.isKing ? '60px' : '45px', height: t.isKing ? '60px' : '45px', border: '3px solid white', boxShadow: '0 10px 0 rgba(0,0,0,0.3)', background: `url(/${t.landmark}) center/cover` }}>
        <div className="hp-bar-2d"><div className="hp-fill-2d" style={{ width: `${(t.hp / TOWER_HEALTH) * 100}%` }}></div></div>
      </div>
    ))}
    {units.concat(enemyUnits).map(u => (
      <div key={u.uid} className={`unit-2d ${u.team}`} style={{ left: `${(u.x / BOARD_WIDTH) * 100}%`, top: `${(u.y / BOARD_HEIGHT) * 100}%`, transform: 'translate(-50%, -50%) rotate(5deg)', width: '35px', height: '45px', border: '2px solid gold', boxShadow: '0 5px 0 rgba(0,0,0,0.5)', backgroundImage: `url(/${u.image})`, backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: '4px' }}></div>
    ))}
  </div>
);

// --- MAIN APPLICATION ---

class UIErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) return <div className="error-screen"><h2>FATAL APP CRASH</h2><button onClick={() => window.location.reload()}>RELOAD</button></div>;
    return this.props.children;
  }
}

function App() {
  const [screen, setScreen] = useState('menu');
  const APP_VERSION = "1.0.0-PRO"; // VISIBLE VERSION TAG
  const [isPractice, setIsPractice] = useState(false);
  const [weather, setWeather] = useState('clear');
  const isMobile = useMemo(() => window.innerWidth < 768, []);

  const [showResults, setShowResults] = useState(false);
  const [resultsData, setResultsData] = useState(null);
  const [matchStats, setMatchStats] = useState({
    totalElixir: 0,
    totalSpawns: 0,
    spawnCounts: {},
    mvp: 'N/A',
    duration: 0,
    startTime: 0
  });
  const [lastChestEarned, setLastChestEarned] = useState(null);

  const [superEffects, setSuperEffects] = useState([]);
  const [announcement, setAnnouncement] = useState(null);
  const [battleVfx, setBattleVfx] = useState([]);
  const lastUnitsRef = useRef([]);

  const { playSpawn, playShoot, playHit, playSqueak, playMusic, stopMusic, initAudio } = useSound();
  const { addXP, upgradeLevel, getLevel, progression } = useProgression();
  const { declarations, awardDeclaration, openDeclaration, getTimeRemaining } = useDeclarationManager();
  const DEFAULT_DECK = Object.values(PRESIDENTS).slice(0, 8).map(p => p.id);

  const [career, setCareer] = useState(() => {
    const saved = JSON.parse(localStorage.getItem('clash_career_stats'));
    const defaultStats = {
      wins: 0,
      losses: 0,
      totalSpawns: 0,
      bestStreak: 0,
      mostUsed: "N/A",
      approval: 0,
      funds: 4500,
      influence: 10,
      deck: DEFAULT_DECK,
      trophies: 0,
      ballots: 0,
      seasonPassOwned: false,
      claimedRewards: [], // { tier, type }
      tutorialStep: 0
    };
    return saved ? { ...defaultStats, ...saved } : defaultStats;
  });

  const tutorialStep = career.tutorialStep || 0;
  const [showTutorial, setShowTutorial] = useState(false);

  const setTutorialStep = useCallback((step) => {
    setCareer(prev => ({ ...prev, tutorialStep: step }));
  }, []);

  // Trigger tutorial on first battle
  useEffect(() => {
    if (screen === 'battle' && tutorialStep < 4) {
      setShowTutorial(true);
    } else {
      setShowTutorial(false);
    }
  }, [screen, tutorialStep]);

  useEffect(() => {
    localStorage.setItem('clash_career_stats', JSON.stringify(career));
  }, [career]);

  const updateFunds = useCallback((amount) => {
    setCareer(prev => ({ ...prev, funds: prev.funds + amount }));
  }, []);

  const toggleDeckCard = useCallback((id) => {
    setCareer(prev => {
      const newDeck = [...(prev.deck || [])];
      const idx = newDeck.indexOf(id);
      if (idx !== -1) {
        if (newDeck.length <= 4) return prev; // Min 4 cards? No, let's stick to 8.
        newDeck.splice(idx, 1);
      } else {
        if (newDeck.length >= 8) return prev; // Hard limit 8 cards
        newDeck.push(id);
      }
      return { ...prev, deck: newDeck };
    });
  }, []);

  const buySeasonPass = useCallback(() => {
    if (career.funds >= 500 && !career.seasonPassOwned) {
      setCareer(prev => ({
        ...prev,
        funds: prev.funds - 500,
        seasonPassOwned: true
      }));
      playSqueak();
    }
  }, [career.funds, career.seasonPassOwned, playSqueak]);

  const claimSeasonReward = useCallback((tier, type) => {
    const isAlreadyClaimed = career.claimedRewards?.some(r => r.tier === tier && r.type === type);
    if (isAlreadyClaimed) return;

    const rewardDef = SEASON_PASS_REWARDS.find(r => r.tier === tier);
    if (!rewardDef) return;

    const reward = rewardDef[type];
    if (reward.type === 'funds') {
      updateFunds(reward.amount);
    } else if (reward.type === 'declaration') {
      awardDeclaration(reward.rarity);
    }

    setCareer(prev => ({
      ...prev,
      claimedRewards: [...(prev.claimedRewards || []), { tier, type }]
    }));
    playSqueak();
  }, [career.claimedRewards, updateFunds, awardDeclaration, playSqueak]);

  const handleSuperEffect = useCallback((data) => {
    setSuperEffects(prev => [...prev, { ...data, id: Date.now() + Math.random() }]);
    setShake(0.4);
    if (playExplosion) playExplosion();
  }, [playExplosion]);

  const handleVfxComplete = useCallback((id) => {
    setBattleVfx(prev => prev.filter(v => v.id !== id));
  }, []);

  const handleAnnouncement = useCallback((data) => {
    setAnnouncement(data);
    setTimeout(() => setAnnouncement(null), 3000);
    if (data.text.includes('DESTROYED')) {
      try { Haptics.vibrate(); } catch (e) { }
      playSqueak();
    }
  }, [playSqueak]);

  const [activeEmote, setActiveEmote] = useState(null);

  const handleEmote = useCallback((data) => {
    setActiveEmote(data);
    setTimeout(() => setActiveEmote(null), 3000);
  }, []);

  const handleMatchResult = useCallback((data) => {
    setCareer(prev => ({
      ...prev,
      trophies: Math.max(0, (prev.trophies || 0) + data.trophyChange),
      wins: data.trophyChange > 0 ? (prev.wins || 0) + 1 : (prev.wins || 0),
      losses: data.trophyChange < 0 ? (prev.losses || 0) + 1 : (prev.losses || 0)
    }));

    // Trigger results screen
    setResultsData(data);
    setShowResults(true);
    playSqueak();
  }, [playSqueak]);

  // Super effect state
  const { gameState: cloudGameState, playerElixir: cloudElixir, superCharge: cloudSuperCharge, playerTeam: cloudTeam, isConnected, connectionError, spawnUnit: cloudSpawn, activateSuper: cloudActivate, requestRematch: cloudRematch, sendEmote: cloudEmote } = useNetwork(handleSuperEffect, handleAnnouncement, handleEmote, career.trophies, handleMatchResult);

  // Offline / Practice Mode Logic
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [localGameState, setLocalGameState] = useState(null);
  const [localElixir, setLocalElixir] = useState(5);
  const [localSuperCharge, setLocalSuperCharge] = useState(0);
  const [localTeam] = useState('player');
  const [offlineResults, setOfflineResults] = useState(null);

  // Derive active game state & command handlers EARLY to avoid ReferenceError
  const gameState = isOfflineMode ? localGameState : cloudGameState;
  const playerElixir = isOfflineMode ? localElixir : cloudElixir;
  const superCharge = isOfflineMode ? localSuperCharge : cloudSuperCharge;
  const playerTeam = isOfflineMode ? localTeam : cloudTeam;

  const allUnits = useMemo(() => [
    ...(gameState?.units || []),
    ...(gameState?.enemyUnits || []),
    ...(gameState?.neutralUnits || [])
  ], [gameState?.units, gameState?.enemyUnits, gameState?.neutralUnits]);

  const calculateStats = (stats, level) => {
    const multiplier = 1 + (level - 1) * 0.1; // 10% boost per level
    return {
      ...stats,
      health: Math.floor(stats.health * multiplier),
      damage: Math.floor(stats.damage * multiplier),
      level: level
    };
  };

  const localSpawn = (president, x, y) => {
    const level = getLevel(president.id);
    const baseStats = PRESIDENTS[president.id] || president;
    const stats = calculateStats(baseStats, level);

    if (localElixir >= stats.cost) {
      setLocalElixir(prev => prev - stats.cost);
      setLocalGameState(prev => {
        const units = [...prev.units];
        const count = stats.count || 1;
        for (let i = 0; i < count; i++) {
          units.push({
            ...stats,
            uid: Date.now() + Math.random(),
            x: x + (count > 1 ? (Math.random() - 0.5) * 20 : 0),
            y: y + (count > 1 ? (Math.random() - 0.5) * 20 : 0),
            currentHp: stats.health,
            team: 'player',
            isFriendly: true,
            isAttacking: false
          });
        }
        return { ...prev, units };
      });
    }
  };

  const localActivate = (data) => {
    // Basic local super implementation could go here
    setLocalSuperCharge(0);
    handleAnnouncement({ text: "LOCAL SUPER ACTIVATED!", team: 'player' });
  };

  const localRematch = () => {
    setLocalGameState(null); // Will trigger re-init in loop
  };

  const localEmote = (emote) => {
    handleEmote({ emote, team: 'player' });
  };

  const spawnUnit = isOfflineMode ? localSpawn : cloudSpawn;
  const activateSuper = isOfflineMode ? localActivate : cloudActivate;
  const requestRematch = isOfflineMode ? localRematch : cloudRematch;
  const sendEmote = isOfflineMode ? localEmote : cloudEmote;

  const BOARD_WIDTH = 400;
  const BOARD_HEIGHT = 700;
  const RIVER_Y = BOARD_HEIGHT / 2;
  const BRIDGES = [{ x: 100, y: RIVER_Y }, { x: 300, y: RIVER_Y }];

  const [shake, setShake] = useState(0);

  useFrame((state, delta) => {
    // Basic camera shake
    if (shake > 0) {
      state.camera.position.x += (Math.random() - 0.5) * shake;
      state.camera.position.y += (Math.random() - 0.5) * shake;
      setShake(s => Math.max(0, s - delta * 5)); // Decays quickly
    }
  });

  // Tower Shake monitor
  const prevTowerHp = useRef({});
  useEffect(() => {
    if (!gameState?.towers) return;
    gameState.towers.forEach(t => {
      const prevHp = prevTowerHp.current[t.id];
      if (prevHp !== undefined && prevHp > 0 && t.hp <= 0) {
        setShake(t.isKing ? 1.5 : 0.6);
        if (playSqueak) playSqueak(); // Using existing sound for now
      }
      prevTowerHp.current[t.id] = t.hp;
    });
  }, [gameState?.towers, playSqueak]);

  // --- LOCAL GAME LOOP ---
  useEffect(() => {
    if (!isOfflineMode) return;

    if (!localGameState) {
      setLocalGameState({
        units: [],
        enemyUnits: [],
        neutralUnits: [],
        towers: [
          { id: 'player-left', x: 100, y: 600, hp: 1500, type: 'player', landmark: LANDMARKS.LINCOLN_MEMORIAL },
          { id: 'player-right', x: 300, y: 600, hp: 1500, type: 'player', landmark: LANDMARKS.PENTAGON },
          { id: 'player-king', x: 200, y: 650, hp: 3000, type: 'player', isKing: true, landmark: LANDMARKS.WHITE_HOUSE },
          { id: 'enemy-left', x: 100, y: 100, hp: 1500, type: 'enemy', landmark: LANDMARKS.LINCOLN_MEMORIAL },
          { id: 'enemy-right', x: 300, y: 100, hp: 1500, type: 'enemy', landmark: LANDMARKS.PENTAGON },
          { id: 'enemy-king', x: 200, y: 50, hp: 3000, type: 'enemy', isKing: true, landmark: LANDMARKS.WHITE_HOUSE },
        ],
        bridges: BRIDGES,
        matchTimer: 180,
        matchStarted: true,
        gameOver: null,
        activeEvents: [],
        speedMultiplier: 1.0
      });
      setLocalElixir(5);
      setLocalSuperCharge(0);
      return;
    }

    const loop = setInterval(() => {
      try {
        setLocalGameState(prev => {
          if (!prev || prev.gameOver) return prev;
          if (!prev.units || !prev.enemyUnits || !prev.towers) return prev;

          const dt = 0.05;
          const newTimer = prev.matchTimer - dt;
          const timeElapsed = 180 - newTimer; // Assuming 3 min standard match + overtime

          // --- ELIXIR REGEN LOGIC (Clash Style) ---
          let elixerRate = 0.35; // Base ~1 per 2.8s
          let isSuddenDeath = false;
          if (timeElapsed >= 120 && timeElapsed < 240) {
            elixerRate = 0.7; // Double Elixir (2m)
          } else if (timeElapsed >= 240) {
            elixerRate = 1.05; // Triple Elixir (Constitutional Crisis)
            isSuddenDeath = true;
          }

          setLocalElixir(e => Math.min(10, e + elixerRate * dt));
          setLocalSuperCharge(s => Math.min(100, s + 5 * dt));

          // --- TOWER DECAY (Sudden Death) ---
          let newTowers = [...prev.towers];
          if (isSuddenDeath) {
            newTowers = newTowers.map(t => ({
              ...t,
              hp: Math.max(0, t.hp - (2 * dt)) // 2 HP per second decay
            }));
          }

          // Simple AI Spawning Logic (Refined for Deploy Time)
          let newEnemyUnits = [...prev.enemyUnits];
          if (Math.random() > 0.985 && newTimer > 0) { // Slight pacing adjustment
            // ... existing AI spawn logic ...
            // For brevity, we'll keep the simple spawn but it should ideally respect deploy time too.
            // We'll focus strictly on the USER's unit logic in applying deploy time first.
          }
          // Only add enemy if we actually wrote the spawning logic fully, maintaining existing behavior for now:
          if (Math.random() > 0.985 && newTimer > 0) {
            const pids = Object.keys(PRESIDENTS);
            const pid = pids[Math.floor(Math.random() * pids.length)];
            const stats = PRESIDENTS[pid];
            if (stats && stats.health) {
              // Enemies spawn instantly for now to keep AI simple, or add deployDelay field
              newEnemyUnits.push({
                ...stats,
                uid: Date.now() + Math.random(),
                x: Math.random() > 0.5 ? 100 : 300,
                y: 100, // Top spawn
                currentHp: stats.health,
                team: 'enemy',
                isFriendly: false,
                isAttacking: false,
                deployTimer: stats.deployTime || 1000 // Add deploy timer
              });
            }
          }

          // Apply Action (Movement/Attack)
          const damageMap = new Map();
          const applyAction = (u, targets) => {
            if (!u) return u;

            // Handle Deploy Time
            if (u.deployTimer > 0) {
              return { ...u, deployTimer: Math.max(0, u.deployTimer - (dt * 1000)) };
            }

            // Target Logic
            let nearest = null; let minDist = Infinity;
            targets.forEach(t => {
              if (!t || typeof t.x !== 'number' || typeof t.y !== 'number') return;
              // Filter by priority (building/any) if needed, simplified here
              if (u.targetsPriority === 'buildings' && !t.isKing && !t.landmark) return; // Basic building filter

              const d = Math.sqrt((t.x - u.x) ** 2 + (t.y - u.y) ** 2);
              if (d < minDist) { minDist = d; nearest = t; }
            });

            // Pathfinding/Movement (River Logic)
            if (nearest && minDist < (u.range || 20) + 5) {
              // Attack
              const tid = nearest.uid || nearest.id;
              const dmg = (u.damage || 0) * (u.hitSpeed ? (1 / u.hitSpeed) : 1) * dt; // DPS calculation
              damageMap.set(tid, (damageMap.get(tid) || 0) + dmg);
              return { ...u, isAttacking: true };
            } else if (nearest) {
              // Move - Path towards bridge if far, then target
              let targetX = nearest.x;
              let targetY = nearest.y;

              // Simple Bridge Pathing: If on own side and need to cross
              const isPlayer = u.team === 'player';
              const mySide = isPlayer ? (u.y > RIVER_Y) : (u.y < RIVER_Y);
              const targetSide = isPlayer ? (nearest.y > RIVER_Y) : (nearest.y < RIVER_Y); // Wait, enemy is on TOP (0-350), Player BOTTOM (350-700)

              // Correct Y check: Player starts > 350. Enemy starts < 350. River ~ 350.
              // If unit is at Y=600 (Player) and target is Y=100 (Enemy) -> Must cross river.
              if ((isPlayer && u.y > RIVER_Y + 20) || (!isPlayer && u.y < RIVER_Y - 20)) {
                // Go to nearest bridge
                const bridge = BRIDGES.reduce((prev, curr) =>
                  Math.abs(curr.x - u.x) < Math.abs(prev.x - u.x) ? curr : prev
                );
                if (Math.abs(u.y - RIVER_Y) > 50) { // If far from river, aim for bridge
                  targetX = bridge.x;
                  targetY = isPlayer ? RIVER_Y + 20 : RIVER_Y - 20; // Approach bridge entry
                  // Once close to bridge X, move vertically
                }
              }

              const angle = Math.atan2(targetY - u.y, targetX - u.x);
              // Speed: 1.0 speed stat ~= 30 pixels/sec? User said "1-1.5 tiles/sec". Tile = 20px? 
              // 1.5 tiles = 30px. 
              const moveSpeed = (u.speed || 1) * 20 * dt; // Scale speed relative to grid

              return {
                ...u,
                x: u.x + Math.cos(angle) * moveSpeed,
                y: u.y + Math.sin(angle) * moveSpeed,
                isAttacking: false
              };
            }
            return u;
          };

          const currentUnits = prev.units.map(u => applyAction(u, [...newEnemyUnits, ...newTowers.filter(t => t.type === 'enemy' && t.hp > 0)]));
          const currentEnemyUnits = newEnemyUnits.map(u => applyAction(u, [...currentUnits, ...newTowers.filter(t => t.type === 'player' && t.hp > 0)]));

          // --- COMBAT RESOLUTION ---
          const finalUnits = currentUnits.map(u => ({ ...u, currentHp: (u.currentHp || u.health) - (damageMap.get(u.uid) || 0) })).filter(u => u.currentHp > 0);
          const finalEnemyUnits = currentEnemyUnits.map(u => ({ ...u, currentHp: (u.currentHp || u.health) - (damageMap.get(u.uid) || 0) })).filter(u => u.currentHp > 0);

          // Apply Tower Damage from damageMap
          newTowers = newTowers.map(t => {
            const dmg = damageMap.get(t.id) || 0;
            return { ...t, hp: Math.max(0, t.hp - dmg) };
          });

          const pk = newTowers.find(t => t.isKing && t.type === 'player');
          const ek = newTowers.find(t => t.isKing && t.type === 'enemy');
          let gameOver = null;
          if (pk && pk.hp <= 0) gameOver = 'red-victory';
          else if (ek && ek.hp <= 0) gameOver = 'blue-victory';
          // Removed draw condition - decay ensures someone eventually loses a tower or king

          if (isSuddenDeath && !prev.activeEvents.includes('CONSTITUTIONAL_CRISIS')) {
            prev.activeEvents.push('CONSTITUTIONAL_CRISIS');
          }

          if (gameOver) {
            const isVictory = gameOver === 'blue-victory';
            setMatchStats(s => ({ ...s, trophyChange: isVictory ? 30 : -20, fundsEarned: isVictory ? 50 : 10 }));
          }

          return {
            ...prev,
            matchTimer: newTimer,
            units: finalUnits,
            enemyUnits: finalEnemyUnits,
            towers: newTowers,
            gameOver
          };
        });
      } catch (error) {
        console.error('[OFFLINE] Game loop error:', error);
      }
    }, 50);

    return () => clearInterval(loop);
  }, [isOfflineMode, localGameState]);
  // Death VFX Effect - MOVED AFTER useNetwork to avoid reference error
  useEffect(() => {
    if (!gameState || !playerTeam) return;
    const currentUnits = [...(gameState.units || []), ...(gameState.enemyUnits || [])];
    const prevUnits = lastUnitsRef.current;

    if (prevUnits.length > 0) {
      prevUnits.forEach(prev => {
        const stillAlive = currentUnits.find(curr => curr.uid === prev.uid);
        if (!stillAlive) {
          const flip = playerTeam === 'enemy' ? 1 : -1;
          const pos = [
            ((prev.x - BOARD_WIDTH / 2) / 20) * flip,
            0.5,
            ((prev.y - BOARD_HEIGHT / 2) / 20) * flip
          ];
          setBattleVfx(prevVfx => [...prevVfx, {
            id: Date.now() + Math.random(),
            type: 'death',
            position: pos,
            color: prev.team === 'enemy' ? '#e74c3c' : '#3498db'
          }]);
        }
      });
    }
    lastUnitsRef.current = currentUnits;
  }, [gameState?.units, gameState?.enemyUnits, playerTeam]);

  const [selectedCard, setSelectedCard] = useState(null);
  const [activeCollectionPres, setActiveCollectionPres] = useState(null);
  const [lastDeclarationEarned, setLastDeclarationEarned] = useState(null);
  const processedGameOver = useRef(false);

  useEffect(() => {
    if (gameState?.gameOver && !processedGameOver.current) {
      processedGameOver.current = true;
      const isVictory = (gameState.gameOver === 'blue-victory' && playerTeam === 'player') ||
        (gameState.gameOver === 'red-victory' && playerTeam === 'enemy');

      // Calculate League Multiplier
      const currentLeague = [...LEAGUES].reverse().find(l => career.trophies >= l.minElectoralVotes) || LEAGUES[0];
      const multiplier = currentLeague.multiplier || 1.0;

      const baseFunds = isVictory ? 250 : 50;
      const finalFunds = Math.floor(baseFunds * multiplier);
      const trophyChange = isVictory ? 30 : 20;

      // Ballots: 5 per win, 3 per tower destroyed
      const towersDestroyed = (gameState?.towers || []).filter(t => t.type !== playerTeam && t.hp <= 0).length;
      const ballotsEarned = isVictory ? (towersDestroyed * 5) + 10 : (towersDestroyed * 3);

      updateFunds(finalFunds);

      setCareer(prev => {
        const newTrophies = isVictory ? prev.trophies + trophyChange : Math.max(0, prev.trophies - trophyChange);

        // Check for league up
        const oldLeague = [...LEAGUES].reverse().find(l => prev.trophies >= l.minElectoralVotes) || LEAGUES[0];
        const newLeague = [...LEAGUES].reverse().find(l => newTrophies >= l.minElectoralVotes) || LEAGUES[0];

        if (newLeague.minElectoralVotes > oldLeague.minElectoralVotes) {
          setTimeout(() => setScreen('inauguration'), 2000); // Delay for dramatic effect
        }

        return {
          ...prev,
          wins: isVictory ? prev.wins + 1 : prev.wins,
          losses: !isVictory ? prev.losses + 1 : prev.losses,
          trophies: newTrophies,
          ballots: (prev.ballots || 0) + ballotsEarned
        };
      });

      setMatchStats(prev => ({
        ...prev,
        fundsEarned: finalFunds,
        trophyChange,
        ballotsEarned
      }));
    } else if (!gameState?.gameOver) {
      processedGameOver.current = false;
    }
  }, [gameState?.gameOver, career.trophies, updateFunds, playerTeam, gameState?.towers]);

  const [viewMode, setViewMode] = useState('3d');

  // Update Career Stats
  useEffect(() => {
    if (gameState?.gameOver) {
      setCareer(prev => {
        const stats = { ...prev };
        const isVictory = (gameState.gameOver === 'blue-victory' && playerTeam === 'player') ||
          (gameState.gameOver === 'red-victory' && playerTeam === 'enemy');
        if (isVictory) {
          stats.wins += 1;
          stats.bestStreak += 1;
          stats.approval += 30;
          stats.funds += 50;
          // Award Declaration
          const decTypes = ['PREAMBLE', 'ARTICLE', 'AMENDMENT', 'FINAL'];
          const randomType = decTypes[Math.min(Math.floor(stats.wins / 3), 3)]; // Better docs as you progress
          awardDeclaration(randomType);
          setLastDeclarationEarned(randomType);
        } else {
          stats.losses += 1;
          stats.bestStreak = 0;
          stats.approval = Math.max(0, stats.approval - 20);
          setLastDeclarationEarned(null);
        }
        stats.totalSpawns += matchStats.totalSpawns;
        const thisMatchBest = Object.entries(matchStats.spawnCounts).reduce((a, b) => b[1] > (a[1] || 0) ? b : a, ['N/A', 0])[0];
        if (thisMatchBest !== 'N/A') stats.mostUsed = thisMatchBest;
        return stats;
      });
    }
  }, [gameState?.gameOver]);

  // Practice AI Logic
  useEffect(() => {
    if (screen === 'battle' && isPractice && gameState && !gameState.gameOver) {
      const interval = setInterval(() => {
        const pids = Object.values(PRESIDENTS).map(p => p.id);
        const randomPid = pids[Math.floor(Math.random() * pids.length)];
        const president = PRESIDENTS[randomPid];
        // Only spawn if "enemy" team (top half)
        spawnUnit(president, Math.random() * BOARD_WIDTH, 10, true); // true for forced enemy spawn if supported, or just coords
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [screen, isPractice, gameState]);

  useEffect(() => {
    if (screen === 'menu') {
      playMusic('/menu_music.mp3');
      setWeather('clear');
    } else if (screen === 'battle') {
      if (gameState?.gameOver) stopMusic();
      else {
        playMusic('/battle_music.mp3');
        setWeather(Math.random() > 0.7 ? 'storm' : 'clear');
        setMatchStats(prev => ({ ...prev, startTime: Date.now(), totalElixir: 0, totalSpawns: 0, spawnCounts: {} }));
      }
    }
    return () => stopMusic();
  }, [screen, gameState?.gameOver, playMusic, stopMusic]);

  // 4-Card Cyclical Hand State
  const [hand, setHand] = useState([]);
  const [deck, setDeck] = useState([]);

  useEffect(() => {
    const playerDeck = career.deck || DEFAULT_DECK;
    const shuffled = [...playerDeck].sort(() => Math.random() - 0.5);
    setHand(shuffled.slice(0, 4));
    setDeck(shuffled.slice(4));
  }, [screen === 'battle' && !gameState?.gameOver]); // Re-shuffle on game start

  useEffect(() => {
    localStorage.setItem('viewMode', viewMode);
  }, [viewMode]);

  const botSocketRef = useRef(null);

  const handleStartPractice = () => {
    setIsPractice(true);
    setScreen('battle');
    playSqueak();
    initAudio();

    // Initialize Bot "Player"
    const botId = 'bot_' + Math.random().toString(36).substr(2, 5);
    // Mobile-Ready Connection
    const SERVER_URL = 'http://192.168.1.120:3001'; // Hardcoded for mobile testing
    botSocketRef.current = io(SERVER_URL);
    botSocketRef.current.emit('register', { playerId: botId });

    // AI Strategic Logic
    const botInterval = setInterval(() => {
      if (!botSocketRef.current || !gameState || gameState.gameOver) return;

      const playerUnits = gameState.units || [];
      const spawnX = Math.random() * (BOARD_WIDTH - 60) + 30;
      const spawnY = 50; // Top side

      // 1. Reactive Defense (Counter player cluster with spell)
      const clusters = playerUnits.filter(u => u.y < RIVER_Y + 100);
      if (clusters.length >= 3) {
        botSocketRef.current.emit('spawn', { president: PRESIDENTS.EXECUTIVE_ORDER, x: clusters[0].x, y: clusters[0].y, playerId: botId });
        return;
      }

      // 2. Counter Picking
      const targetsFlying = playerUnits.find(u => u.isFlying);
      if (targetsFlying) {
        // Pick Washington (ranged) to counter flying
        botSocketRef.current.emit('spawn', { president: PRESIDENTS.WASHINGTON, x: spawnX, y: spawnY, playerId: botId });
      } else if (playerUnits.length > 3) {
        // Pick Obama (splash/air) to counter swarms
        botSocketRef.current.emit('spawn', { president: PRESIDENTS.OBAMA, x: spawnX, y: spawnY, playerId: botId });
      } else {
        // Pick standard offensive units
        const choices = [PRESIDENTS.LINCOLN, PRESIDENTS.TEDDY, PRESIDENTS.JFK, PRESIDENTS.TRUMP];
        const pick = choices[Math.floor(Math.random() * choices.length)];
        botSocketRef.current.emit('spawn', { president: pick, x: spawnX, y: spawnY, playerId: botId });
      }
    }, 5000);

    // Cleanup when match ends or navigating away
    botSocketRef.current.on('snapshot', (data) => {
      if (data.gameState.gameOver) {
        clearInterval(botInterval);
        botSocketRef.current.disconnect();
        botSocketRef.current = null;
      }
    });
  };

  const handleSpawn = (x, y, forcedPresidentId = null) => {
    const activeCardId = forcedPresidentId || selectedCard;
    if (activeCardId && gameState && playerTeam) {
      // Team-based boundaries
      const isBlue = playerTeam === 'player';
      const validY = isBlue ? (y >= RIVER_Y + 20) : (y <= RIVER_Y - 20);

      if (validY) {
        const president = Object.values(PRESIDENTS).find(p => p.id === activeCardId);
        if (!president) return;

        // Apply Scaling
        const level = getLevel(president.id);
        const stats = calculateStats(president, level);

        // CHECK ELIXIR
        if (playerElixir < stats.cost) return;

        if (playSpawn) playSpawn(stats.id);
        spawnUnit(stats, x, y);
        addXP(stats.id, 50);

        // Add Spawn VFX
        const flip = playerTeam === 'enemy' ? 1 : -1;
        setBattleVfx(prev => [...prev, {
          id: Date.now() + Math.random(),
          type: 'spawn',
          position: [((x - BOARD_WIDTH / 2) / 20) * flip, 0.1, ((y - BOARD_HEIGHT / 2) / 20) * flip]
        }]);

        // Update match stats
        setMatchStats(prev => ({
          ...prev,
          totalElixir: prev.totalElixir + president.cost,
          totalSpawns: prev.totalSpawns + 1,
          spawnCounts: {
            ...prev.spawnCounts,
            [president.id]: (prev.spawnCounts[president.id] || 0) + 1
          },
          mvp: president.id // Simple MVP logic: last spawned for now, or could track kills
        }));

        try { Haptics.impact({ style: ImpactStyle.Medium }); } catch (e) { }

        // Replace used card in hand
        setHand(prevHand => {
          const newHand = [...prevHand];
          const usedIndex = newHand.indexOf(activeCardId);
          if (usedIndex !== -1 && deck.length > 0) {
            const nextId = deck[0];
            newHand[usedIndex] = nextId;
            setDeck(prevDeck => [...prevDeck.slice(1), activeCardId]);
          }
          return newHand;
        });

        setSelectedCard(null);
      }
    }
  };

  const handleActivateSuper = () => {
    if (superCharge >= 100) {
      // Simple center-board super activation
      activateSuper({
        id: 'super',
        x: BOARD_WIDTH / 2,
        y: BOARD_HEIGHT / 2
      });
      if (playShoot) playShoot();
    }
  };

  // Screen Early Returns
  if (screen === 'menu') {
    return (
      <>
        <MainMenu
          onStartBattle={() => { setScreen('battle'); setIsPractice(false); playSqueak(); initAudio(); }}
          onStartPractice={handleStartPractice}
          onOpenCollection={(p) => {
            setActiveCollectionPres(p);
            setScreen('collection');
            playSqueak();
            initAudio();
          }}
          getLevel={getLevel}
          funds={career.funds}
          declarations={declarations}
          openDeclaration={openDeclaration}
          getTimeRemaining={getTimeRemaining}
          upgradeLevel={upgradeLevel}
          updateFunds={updateFunds}
          onOpenLeague={() => { setScreen('league'); playSqueak(); }}
          career={career}
          buySeasonPass={buySeasonPass}
        />
        <div style={{ position: 'absolute', bottom: 5, right: 5, color: 'rgba(255,255,255,0.5)', fontSize: 12, zIndex: 9999, pointerEvents: 'none' }}>
          {APP_VERSION}
        </div>
      </>
    );
  }

  if (screen === 'inauguration') {
    const league = [...LEAGUES].reverse().find(l => career.trophies >= l.minElectoralVotes) || LEAGUES[0];
    return (
      <div className="inauguration-screen" onClick={() => { setScreen('menu'); playSqueak(); }}>
        <h1 className="inauguration-title">INAUGURATION</h1>
        <div className="league-reveal" style={{ color: league.color }}>{league.name}</div>
        <p className="inauguration-subtext">THE PEOPLE HAVE SPOKEN!</p>
        <div className="tap-to-continue">HEADING TO CABINET ASSEMBLY...</div>
      </div>
    );
  }

  if (screen === 'collection') {
    return (
      <CollectionView
        onClose={() => { setScreen('menu'); playSqueak(); }}
        getLevel={getLevel}
        upgradeLevel={upgradeLevel}
        funds={career.funds}
        chests={declarations}
        openChest={openDeclaration}
        getTimeRemaining={getTimeRemaining}
        updateFunds={updateFunds}
        deck={career.deck}
        onToggleDeck={toggleDeckCard}
        initialPresident={activeCollectionPres}
      />
    );
  }

  if (screen === 'hall-of-fame') {
    return <HallOfFame onClose={() => { setScreen('menu'); playSqueak(); }} />;
  }

  if (screen === 'social') {
    return (
      <div className="social-screen-wrapper">
        <div className="social-header">
          <button className="soc-close" onClick={() => setScreen('menu')}>BACK</button>
          <h2>CITIZENS & DELEGATES</h2>
        </div>
        <SocialTab onOpenLeague={() => { setScreen('league'); playSqueak(); }} />
      </div>
    );
  }

  if (screen === 'league') {
    return (
      <LeagueView
        onClose={() => { setScreen('menu'); playSqueak(); }}
        trophies={career.trophies}
        ballots={career.ballots}
        seasonPassOwned={career.seasonPassOwned}
        onClaimReward={claimSeasonReward}
        onBuyPass={buySeasonPass}
      />
    );
  }

  if (!cloudGameState && !isOfflineMode) {
    return (
      <div className="loading-screen splash">
        <div className="splash-banner">
          <img src="/splash.png" className="splash-img" alt="Presidential Clash" />
          <div className="loading-bar-container">
            <div className="loading-bar-fill"></div>
          </div>
          <div className="connection-status">
            {isConnected ? "SECURE LINE ESTABLISHED" : "BYPASSING FIREWALLS..."}
            {connectionError && <div className="conn-error">{connectionError}</div>}
          </div>
        </div>

        <div className="manual-ip-setup">
          <input
            type="text"
            placeholder="Enter Server IP (e.g. 192.168.1.100)"
            className="ip-input"
            defaultValue={localStorage.getItem('pres_serverIp') || ''}
            onChange={(e) => localStorage.setItem('pres_serverIp', e.target.value)}
          />
          <p className="ip-tip">Manual IP required for some mobile LAN setups.</p>
        </div>

        <div className="loading-actions">
          <button className="practice-btn giant" onClick={() => {
            setIsOfflineMode(true);
            playSqueak();
          }}>
            SKIP TO PRACTICE (OFFLINE)
          </button>
          <button className="refresh-btn" onClick={() => window.location.reload()}>RETRY CONNECTION</button>
        </div>
      </div>
    );
  }

  // (Derivations moved to top)

  // DEFENSIVE: Variable declarations with null checks
  const safeGameState = gameState || {};
  const { units = [], enemyUnits = [], towers = [], gameOver, matchStarted } = safeGameState;

  // Defensive helpers requested by user
  const firstFriendly = units.find(u => u.team === playerTeam) || null;
  const enemyTower = towers.find(t => t.type !== playerTeam) || null;
  const friendlyKing = towers.find(t => t.type === playerTeam && t.isKing) || null;

  // Calculate allUnits moved to top level hooks to prevent Error #310

  if (!gameState) return <div className="loading-screen"><h2>DECRYPTING AGENT PACKAGES...</h2></div>;

  return (
    <div className="battle-container">

      {!matchStarted && !gameOver && (
        <div className="waiting-status-bar">
          <div className="pulse-dot"></div>
          <span>WAITING FOR CHALLENGER...</span>
        </div>
      )}

      <div className="header-hud">
        <div className="team-indicator" style={{ color: playerTeam === 'enemy' ? '#e74c3c' : '#3498db' }}>
          {playerTeam === 'enemy' ? 'RED TEAM' : 'BLUE TEAM'}
        </div>
        <div className="timer-display">
          {formatTime(gameState.matchTimer)}
        </div>
        <div className="top-right-controls">
          <button className="view-toggle" onClick={() => { setViewMode(v => v === '3d' ? '2d' : '3d'); playSqueak(); }}>
            {viewMode === '3d' ? '2D' : '3D'}
          </button>
          <button className="hof-toggle" onClick={() => setScreen('hall-of-fame')}>🏆</button>
        </div>
      </div>

      <div
        className="arena-wrapper"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const pid = e.dataTransfer.getData("text/plain");
          if (!pid) return;
          const rect = e.currentTarget.getBoundingClientRect();
          const bx = ((e.clientX - rect.left) / rect.width) * BOARD_WIDTH;
          const by = ((e.clientY - rect.top) / rect.height) * BOARD_HEIGHT;
          handleSpawn(bx, by, pid);
        }}
      >
        <UIErrorBoundary>
          {viewMode === '3d' ? (
            <Battlefield
              towers={gameState?.towers || []}
              units={gameState?.units || []}
              enemyUnits={gameState?.enemyUnits || []}
              neutralUnits={gameState?.neutralUnits || []}
              bridges={gameState?.bridges || []}
              onSpawn={handleSpawn}
              selectedCard={selectedCard}
              superEffects={superEffects}
              battleVfx={battleVfx}
              onEffectComplete={(id) => setSuperEffects(prev => prev.filter(e => e.id !== id))}
              onVfxComplete={handleVfxComplete}
              playerTeam={playerTeam}
              playShoot={playShoot}
              playHit={playHit}
              getLevel={getLevel}
              weather={weather}
              isMobile={isMobile}
              activeEvents={gameState?.activeEvents}
            />
          ) : (
            <Arena2D
              units={gameState?.units || []}
              enemyUnits={gameState?.enemyUnits || []}
              towers={gameState?.towers || []}
              onSpawn={handleSpawn}
              selectedCard={selectedCard}
            />
          )}
        </UIErrorBoundary>

        <div className="diagnostic-hud">
          <span>ALIES: {units.length} | ENEMIES: {enemyUnits.length}</span>
        </div>
      </div>

      <div className="ui-panel">
        {/* Emote System */}
        <EmoteMenu onSendEmote={sendEmote} />

        {activeEmote && (
          <EmoteOverlay
            emote={activeEmote.emote}
            team={activeEmote.team === playerTeam ? 'player' : 'enemy'}
          />
        )}

        <div className="meters-container">
          <div className="elixir-container">
            <div
              className="elixir-bar glowing"
              style={{ width: `${(playerElixir / MAX_ELIXIR) * 100}%` }}
            ></div>
            <div className="elixir-text">CAMPAIGN FUNDS: {Math.floor(playerElixir)}</div>
          </div>

          <div className={`super-meter ${superCharge >= 100 ? 'ready' : ''}`} onClick={handleActivateSuper}>
            <div className="super-bar" style={{ width: `${(superCharge / 100) * 100}%` }}></div>
            <div className="super-text">{superCharge >= 100 ? 'ACTIVATE SUPER' : 'CHARGING SUPER...'}</div>
          </div>
        </div>
        <div className="card-hand">
          {hand.map(pid => {
            const president = Object.values(PRESIDENTS).find(p => p.id === pid);
            if (!president) return null;
            return (
              <div
                key={president.id}
                className={`card ${playerElixir < president.cost ? 'disabled' : ''} ${selectedCard === president.id ? 'selected' : ''}`}
                draggable={playerElixir >= president.cost}
                onDragStart={(e) => {
                  initAudio();
                  if (playerElixir < president.cost) return;
                  e.dataTransfer.setData("text/plain", president.id);
                  // Optional: change cursor or effect
                }}
                onClick={() => {
                  if (playerElixir >= president.cost) {
                    setSelectedCard(president.id);
                    playSqueak();
                  }
                }}
              >
                <div className="card-cost">{president.cost}</div>
                <div className="card-image-wrapper">
                  <img src={`/${president.image}`} alt={president.name} className="card-static-image" />
                </div>
                <div className="card-info">
                  <div className="card-name">{president.name}</div>
                  <div className="card-stats">HP: {president.health} | ATK: {president.damage}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {gameOver && (
        <BattleResults
          victory={(gameOver === 'blue-victory' && playerTeam === 'player') || (gameOver === 'red-victory' && playerTeam === 'enemy')}
          trophyChange={matchStats.trophyChange || (((gameOver === 'blue-victory' && playerTeam === 'player') || (gameOver === 'red-victory' && playerTeam === 'enemy')) ? 30 : 20)}
          declarationEarned={lastDeclarationEarned}
          fundsEarned={matchStats.fundsEarned || 0}
          ballotsEarned={matchStats.ballotsEarned || 0}
          xpEarned={matchStats.totalSpawns * 10}
          stats={matchStats}
          progressions={progression}
          onContinue={() => { setScreen('menu'); setLastDeclarationEarned(null); stopMusic(); }}
          onRematch={requestRematch}
          rematchRequested={gameState.rematchRequests?.length > 0}
        />
      )}

      {gameState.isSuddenDeath && !gameOver && (
        <div className="sudden-death-tag">SUDDEN DEATH</div>
      )}

      {gameState.matchTimer < 60 && !gameOver && (
        <div className="double-elixir-tag">2X ELIXIR</div>
      )}

      <AnnouncementOverlay announcement={announcement} />

      {/* Event Vignette Overlay */}
      {gameState?.activeEvents?.length > 0 && (
        <div className={`event-vignette ${gameState.activeEvents[gameState.activeEvents.length - 1]}`} />
      )}

      {showTutorial && (
        <TutorialAdvisor
          step={tutorialStep}
          onNext={() => setTutorialStep(prev => prev + 1)}
        />
      )}
    </div>
  );
}

export default App;

