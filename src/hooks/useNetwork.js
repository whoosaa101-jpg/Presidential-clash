import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const getSocketURL = () => {
    // Priority: 1. Manual Override, 2. Env Var, 3. Dynamic Hostname
    const overrideIp = localStorage.getItem('pres_serverIp');
    if (overrideIp) return `http://${overrideIp}:3001`;

    if (import.meta.env.VITE_SOCKET_URL) return import.meta.env.VITE_SOCKET_URL;
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:3001';
    }
    // Default to the same host but port 3001 (standard for our deployment)
    return `http://${window.location.hostname}:3001`;
};

const SERVER_URL = getSocketURL();

export const useNetwork = (onSuperEffect, onAnnouncement, onEmote, trophies = 0, onMatchResult) => {
    const socketRef = useRef(null);
    const [gameState, setGameState] = useState(null);
    const [playerElixir, setPlayerElixir] = useState(0);
    const [superCharge, setSuperCharge] = useState(0);
    const [playerTeam, setPlayerTeam] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [connectionError, setConnectionError] = useState(null);
    const [playerId] = useState(() => {
        let id = localStorage.getItem('pres_playerId');
        if (!id) {
            id = 'player_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('pres_playerId', id);
        }
        return id;
    });

    useEffect(() => {
        socketRef.current = io(SERVER_URL);

        socketRef.current.on('connect', () => {
            setIsConnected(true);
            setConnectionError(null);
            socketRef.current.emit('register', { playerId, trophies });
        });

        socketRef.current.on('connect_error', (err) => {
            setIsConnected(false);
            setConnectionError(err.message);
        });

        socketRef.current.on('init', (data) => {
            setGameState(data.gameState);
            if (data.playerState) {
                setPlayerElixir(data.playerState.elixir);
                setSuperCharge(data.playerState.superCharge);
                setPlayerTeam(data.playerState.team);
            }
        });

        socketRef.current.on('snapshot', (data) => {
            setGameState(data.gameState);
            const myState = data.players[playerId];
            if (myState) {
                setPlayerElixir(myState.elixir);
                setSuperCharge(myState.superCharge);
                setPlayerTeam(myState.team);
            }
        });

        socketRef.current.on('matchResult', (data) => {
            if (onMatchResult) onMatchResult(data);
        });

        socketRef.current.on('announcement', (data) => {
            if (onAnnouncement) onAnnouncement(data);
        });

        socketRef.current.on('superEffect', (data) => {
            if (onSuperEffect) onSuperEffect(data);
        });

        socketRef.current.on('emote', (data) => {
            if (onEmote) onEmote(data);
        });

        return () => socketRef.current.disconnect();
    }, [onSuperEffect, onAnnouncement, onEmote, playerId, trophies, onMatchResult]);

    const spawnUnit = (president, x, y) => {
        if (!socketRef.current?.connected) return;
        socketRef.current.emit('spawn', { president, x, y, playerId });
    };

    const activateSuper = (superData) => {
        if (!socketRef.current?.connected) return;
        socketRef.current.emit('activateSuper', { ...superData, playerId });
    };

    const requestRematch = () => {
        if (!socketRef.current?.connected) return;
        socketRef.current.emit('requestRematch', { playerId });
    };

    const sendEmote = (emote) => {
        if (!socketRef.current?.connected) return;
        socketRef.current.emit('sendEmote', { emote, playerId });
    };

    return { gameState, playerElixir, superCharge, playerTeam, isConnected, connectionError, spawnUnit, activateSuper, requestRematch, sendEmote };
};
