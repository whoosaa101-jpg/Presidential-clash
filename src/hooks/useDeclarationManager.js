import { useState, useEffect, useCallback } from 'react';

const DECLARATION_TYPES = {
    PREAMBLE: { type: 'preamble', unlockTime: 3 * 60 * 60 * 1000, funds: 50, label: 'PREAMBLE' },
    ARTICLE: { type: 'article', unlockTime: 8 * 60 * 60 * 1000, funds: 150, label: 'ARTICLE' },
    AMENDMENT: { type: 'amendment', unlockTime: 12 * 60 * 60 * 1000, funds: 300, label: 'AMENDMENT' },
    FINAL: { type: 'final', unlockTime: 24 * 60 * 60 * 1000, funds: 1000, label: 'DECLARATION' }
};

export const useDeclarationManager = () => {
    const [declarations, setDeclarations] = useState(() => {
        const saved = localStorage.getItem('pres_declarations');
        return saved ? JSON.parse(saved) : [null, null, null, null];
    });

    const [now, setNow] = useState(Date.now());

    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        localStorage.setItem('pres_declarations', JSON.stringify(declarations));
    }, [declarations]);

    const awardDeclaration = useCallback((rarity = 'PREAMBLE') => {
        setDeclarations(prev => {
            const emptyIndex = prev.findIndex(c => c === null);
            if (emptyIndex === -1) return prev;

            const newDecs = [...prev];
            const data = DECLARATION_TYPES[rarity];
            newDecs[emptyIndex] = {
                ...data,
                startTime: Date.now(),
                unlockAt: Date.now() + data.unlockTime
            };
            return newDecs;
        });
    }, []);

    const openDeclaration = useCallback((index, updateFunds, upgradeLevel) => {
        const doc = declarations[index];
        if (!doc || doc.unlockAt > now) return null;

        updateFunds(doc.funds);

        const presidents = ['abraham_lincoln', 'donald_trump', 'george_washington', 'teddy_roosevelt', 'joe_biden', 'john_f_kennedy', 'secret_service', 'fdr', 'truman', 'grant'];
        const randomPres = presidents[Math.floor(Math.random() * presidents.length)];
        upgradeLevel(randomPres);

        setDeclarations(prev => {
            const newDecs = [...prev];
            newDecs[index] = null;
            return newDecs;
        });

        return { funds: doc.funds, president: randomPres };
    }, [declarations, now]);

    const getTimeRemaining = useCallback((index) => {
        const doc = declarations[index];
        if (!doc) return null;
        const remaining = doc.unlockAt - now;
        if (remaining <= 0) return 'READY';

        const hours = Math.floor(remaining / (60 * 60 * 1000));
        const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
        const seconds = Math.floor((remaining % (60 * 1000)) / 1000);

        if (hours > 0) return `${hours}h ${minutes}m`;
        if (minutes > 0) return `${minutes}m ${seconds}s`;
        return `${seconds}s`;
    }, [declarations, now]);

    return { declarations, awardDeclaration, openDeclaration, getTimeRemaining };
};
