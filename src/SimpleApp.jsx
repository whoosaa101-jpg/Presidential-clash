import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import './App.css';

const PRESIDENTS = {
    fdr: { name: 'FDR', cost: 5, color: '#2563eb' },
    truman: { name: 'Truman', cost: 4, color: '#dc2626' },
    grant: { name: 'Grant', cost: 4, color: '#16a34a' }
};

function SimpleApp() {
    const [gameState, setGameState] = useState(null);
    const [connected, setConnected] = useState(false);
    const [elixir, setElixir] = useState(10);
    const [units, setUnits] = useState([]);
    const [playerTower, setPlayerTower] = useState(5000);
    const [enemyTower, setEnemyTower] = useState(5000);
    const socketRef = useRef(null);

    // Connect to server
    useEffect(() => {
        // Use relative path for Vite proxy or environment variable
        const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (window.location.hostname === 'localhost' ? '/' : `http://${window.location.hostname}:3001`);
        console.log(`📡 Connecting to socket at: ${SOCKET_URL}`);

        socketRef.current = io(SOCKET_URL, {
            reconnectionAttempts: 5,
            timeout: 10000,
            transports: ['websocket', 'polling']
        });

        socketRef.current.on('connect', () => {
            console.log('✅ Socket connected successfully!');
            setConnected(true);
        });

        socketRef.current.on('connect_error', (err) => {
            console.error('❌ Socket connection error:', err.message);
        });

        socketRef.current.on('disconnect', (reason) => {
            console.warn('⚠️ Socket disconnected:', reason);
            setConnected(false);
        });

        socketRef.current.on('init', (data) => {
            console.log('✅ Connected to server!', data);
            setConnected(true);
            setGameState(data.gameState);
            setElixir(data.playerState.elixir);
        });

        socketRef.current.on('unitSpawned', (unit) => {
            console.log('Unit spawned:', unit);
            setUnits(prev => [...prev, unit]);
        });

        return () => socketRef.current?.disconnect();
    }, []);

    // Elixir regeneration
    useEffect(() => {
        if (!connected) return;
        const interval = setInterval(() => {
            setElixir(prev => Math.min(prev + 1, 10));
        }, 2000);
        return () => clearInterval(interval);
    }, [connected]);

    const spawnUnit = (presidentId) => {
        const president = PRESIDENTS[presidentId];
        if (elixir < president.cost) return;

        setElixir(prev => prev - president.cost);
        socketRef.current.emit('spawn', {
            presidentId,
            team: 'player',
            position: { x: Math.random() * 4 - 2, y: -4, z: 0 }
        });
    };

    if (!connected) {
        return (
            <div className="loading-screen">
                <div className="flag-animation">🇺🇸</div>
                <h1>PRESIDENTIAL CLASH</h1>
                <p>Establishing secure line to D.C...</p>
            </div>
        );
    }

    return (
        <div className="simple-game">
            {/* Battlefield */}
            <div className="battlefield">
                <div className="tower enemy-tower">
                    <div className="tower-label">Enemy Tower</div>
                    <div className="health-bar">
                        <div className="health-fill" style={{ width: `${(enemyTower / 5000) * 100}%` }}></div>
                    </div>
                    <div className="health-text">{enemyTower}</div>
                </div>

                {/* Units */}
                <div className="units-container">
                    {units.map(unit => (
                        <div
                            key={unit.id}
                            className={`unit ${unit.team}`}
                            style={{
                                backgroundColor: PRESIDENTS[unit.presidentId]?.color,
                                left: `${(unit.position.x + 5) * 10}%`,
                                bottom: `${(unit.position.y + 5) * 10}%`
                            }}
                        >
                            {PRESIDENTS[unit.presidentId]?.name[0]}
                        </div>
                    ))}
                </div>

                <div className="tower player-tower">
                    <div className="health-bar">
                        <div className="health-fill player" style={{ width: `${(playerTower / 5000) * 100}%` }}></div>
                    </div>
                    <div className="health-text">{playerTower}</div>
                    <div className="tower-label">Your Tower</div>
                </div>
            </div>

            {/* Cards */}
            <div className="card-hand">
                <div className="elixir-display">
                    <span className="elixir-icon">⚡</span>
                    <span className="elixir-count">{elixir}/10</span>
                </div>
                {Object.entries(PRESIDENTS).map(([id, pres]) => (
                    <button
                        key={id}
                        className={`president-card ${elixir < pres.cost ? 'disabled' : ''}`}
                        onClick={() => spawnUnit(id)}
                        style={{ borderColor: pres.color }}
                    >
                        <div className="card-name">{pres.name}</div>
                        <div className="card-cost">{pres.cost}</div>
                    </button>
                ))}
            </div>
        </div>
    );
}

export default SimpleApp;
