import { useState, useEffect, useRef, useCallback } from 'react';
import { MAX_ELIXIR, ELIXIR_REGEN_RATE, BOARD_HEIGHT, LANE_X, PRESIDENTS, TOWER_HEALTH, BOARD_WIDTH, RIVER_Y, BRIDGES, LANDMARKS } from '../constants';

export const useGameEngine = () => {
    const [gameState, setGameState] = useState({
        elixir: 5,
        units: [],
        enemyUnits: [],
        towers: [
            { id: 'player-left', x: BRIDGES[0].x, y: BOARD_HEIGHT - 100, hp: TOWER_HEALTH, type: 'player', landmark: LANDMARKS.LINCOLN_MEMORIAL },
            { id: 'player-right', x: BRIDGES[1].x, y: BOARD_HEIGHT - 100, hp: TOWER_HEALTH, type: 'player', landmark: LANDMARKS.PENTAGON },
            { id: 'player-king', x: 200, y: BOARD_HEIGHT - 50, hp: TOWER_HEALTH * 2, type: 'player', isKing: true, landmark: LANDMARKS.WHITE_HOUSE },
            { id: 'enemy-left', x: BRIDGES[0].x, y: 100, hp: TOWER_HEALTH, type: 'enemy', landmark: LANDMARKS.LINCOLN_MEMORIAL },
            { id: 'enemy-right', x: BRIDGES[1].x, y: 100, hp: TOWER_HEALTH, type: 'enemy', landmark: LANDMARKS.PENTAGON },
            { id: 'enemy-king', x: 200, y: 50, hp: TOWER_HEALTH * 2, type: 'enemy', isKing: true, landmark: LANDMARKS.WHITE_HOUSE },
        ],
        gameOver: null
    });

    const requestRef = useRef();
    const lastTimeRef = useRef();
    const stateRef = useRef(gameState);

    useEffect(() => {
        stateRef.current = gameState;
    }, [gameState]);

    const spawnUnit = (presidentId, x, y) => {
        // Enforce spawning rules: Only on player's side of the river
        if (y < RIVER_Y + 20) return;

        const president = Object.values(PRESIDENTS).find(p => p.id === presidentId);
        if (!president || stateRef.current.elixir < president.cost) return;

        setGameState(prev => ({
            ...prev,
            elixir: prev.elixir - president.cost,
            units: [...prev.units, {
                ...president,
                uid: Date.now() + Math.random(),
                x, y,
                currentHp: president.health,
                team: 'player',
            }]
        }));
    };

    const update = useCallback((time) => {
        if (lastTimeRef.current !== undefined) {
            const deltaTime = Math.min(0.033, (time - lastTimeRef.current) / 1000); // Cap delta time
            const currentState = stateRef.current;

            if (currentState.gameOver) return;

            setGameState(prev => {
                const nextState = { ...prev };

                // 1. Elixir Regen
                nextState.elixir = Math.min(MAX_ELIXIR, nextState.elixir + ELIXIR_REGEN_RATE * deltaTime);

                // 2. Damage calculation pass
                const damageMap = new Map();

                const getTargets = (unit) => {
                    const isPlayer = unit.team === 'player';
                    return [
                        ...prev.towers.filter(t => (isPlayer ? t.type === 'enemy' : t.type === 'player') && t.hp > 0),
                        ...(isPlayer ? prev.enemyUnits : prev.units).filter(u => u.currentHp > 0)
                    ];
                };

                const processUnitAI = (unit) => {
                    const targets = getTargets(unit);
                    let nearest = null;
                    let minDist = Infinity;

                    targets.forEach(t => {
                        const d = Math.sqrt(Math.pow(t.x - unit.x, 2) + Math.pow(t.y - unit.y, 2));
                        if (d < minDist) {
                            minDist = d;
                            nearest = t;
                        }
                    });

                    if (nearest) {
                        if (minDist <= unit.range) {
                            // ATTACK
                            const targetId = nearest.id || nearest.uid;
                            damageMap.set(targetId, (damageMap.get(targetId) || 0) + unit.damage * deltaTime);
                            return { ...unit, isAttacking: true };
                        } else {
                            // MOVE TOWARD
                            let targetX = nearest.x;
                            let targetY = nearest.y;

                            // BRIDGE LOGIC: If target is across the river, move toward nearest bridge
                            const isAcross = (unit.y < RIVER_Y && nearest.y > RIVER_Y) || (unit.y > RIVER_Y && nearest.y < RIVER_Y);
                            if (isAcross) {
                                let nearestBridge = BRIDGES[0];
                                let minBridgeDist = Infinity;
                                BRIDGES.forEach(b => {
                                    const d = Math.sqrt(Math.pow(b.x - unit.x, 2) + Math.pow(b.y - unit.y, 2));
                                    if (d < minBridgeDist) {
                                        minBridgeDist = d;
                                        nearestBridge = b;
                                    }
                                });
                                targetX = nearestBridge.x;
                                targetY = nearestBridge.y;
                            }

                            const angle = Math.atan2(targetY - unit.y, targetX - unit.x);
                            return {
                                ...unit,
                                isAttacking: false,
                                x: unit.x + Math.cos(angle) * (unit.speed * 60 * deltaTime),
                                y: unit.y + Math.sin(angle) * (unit.speed * 60 * deltaTime)
                            };
                        }
                    }
                    // Default fallback: Move toward center horizontal, but vertical toward enemy base
                    const fallbackY = unit.team === 'player' ? 0 : BOARD_HEIGHT;
                    return {
                        ...unit,
                        isAttacking: false,
                        y: unit.y + (unit.team === 'player' ? -1 : 1) * (unit.speed * 60 * deltaTime)
                    };
                };

                // Update positions/actions
                nextState.units = prev.units.map(processUnitAI);
                nextState.enemyUnits = prev.enemyUnits.map(processUnitAI);

                // Apply damage & Filter deaths
                nextState.towers = prev.towers.map(t => ({
                    ...t,
                    hp: Math.max(0, t.hp - (damageMap.get(t.id) || 0))
                }));

                const applyDamageAndFilter = (u) => ({
                    ...u,
                    currentHp: u.currentHp - (damageMap.get(u.uid) || 0)
                });

                nextState.units = nextState.units.map(applyDamageAndFilter).filter(u => u.currentHp > 0);
                nextState.enemyUnits = nextState.enemyUnits.map(applyDamageAndFilter).filter(u => u.currentHp > 0);

                // Win/Loss check
                const playerKing = nextState.towers.find(t => t.isKing && t.type === 'player');
                const enemyKing = nextState.towers.find(t => t.isKing && t.type === 'enemy');
                if (playerKing && playerKing.hp <= 0) nextState.gameOver = 'loss';
                else if (enemyKing && enemyKing.hp <= 0) nextState.gameOver = 'win';

                // Enemy Spawning
                if (Math.random() < 0.008 && nextState.enemyUnits.length < 6) {
                    const pKeys = Object.keys(PRESIDENTS);
                    const randomP = PRESIDENTS[pKeys[Math.floor(Math.random() * pKeys.length)]];
                    nextState.enemyUnits.push({
                        ...randomP,
                        uid: Date.now() + Math.random(),
                        x: Math.random() * BOARD_WIDTH,
                        y: 50,
                        currentHp: randomP.health,
                        team: 'enemy',
                    });
                }

                return nextState;
            });
        }
        lastTimeRef.current = time;
        requestRef.current = requestAnimationFrame(update);
    }, []);

    useEffect(() => {
        requestRef.current = requestAnimationFrame(update);
        return () => cancelAnimationFrame(requestRef.current);
    }, [update]);

    return {
        ...gameState,
        spawnUnit
    };
};
