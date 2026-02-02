import { useState, useEffect, useCallback } from 'react';

const XP_PER_LEVEL = 1000;

export const useProgression = () => {
    const [progression, setProgression] = useState(() => {
        const saved = localStorage.getItem('pres_progression');
        return saved ? JSON.parse(saved) : {};
    });

    useEffect(() => {
        localStorage.setItem('pres_progression', JSON.stringify(progression));
    }, [progression]);

    const addXP = useCallback((presidentId, amount) => {
        setProgression(prev => {
            const current = prev[presidentId] || { xp: 0, level: 1 };
            const newXP = current.xp + amount;
            const newLevel = Math.floor(newXP / XP_PER_LEVEL) + 1;

            return {
                ...prev,
                [presidentId]: {
                    xp: newXP,
                    level: newLevel
                }
            };
        });
    }, []);

    const getLevel = useCallback((presidentId) => {
        return progression[presidentId]?.level || 1;
    }, [progression]);

    const getXPProgress = useCallback((presidentId) => {
        const current = progression[presidentId] || { xp: 0, level: 1 };
        const levelXP = (current.level - 1) * XP_PER_LEVEL;
        const currentXP = current.xp - levelXP;
        return (currentXP / XP_PER_LEVEL) * 100;
    }, [progression]);

    const upgradeLevel = useCallback((presidentId) => {
        setProgression(prev => {
            const current = prev[presidentId] || { xp: 0, level: 1 };
            return {
                ...prev,
                [presidentId]: {
                    ...current,
                    level: current.level + 1
                }
            };
        });
    }, []);

    return { progression, addXP, upgradeLevel, getLevel, getXPProgress };
};
