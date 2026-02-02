import { useRef, useCallback } from 'react';

export const useAudio = () => {
    const audioContext = useRef(null);

    const initAudio = useCallback(() => {
        if (!audioContext.current) {
            audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
        }
    }, []);

    const playSound = useCallback((type) => {
        initAudio();
        // Since we don't have actual files, we can simulate with synth sounds 
        // OR log to console where the sound WOULD play.
        const osc = audioContext.current.createOscillator();
        const gain = audioContext.current.createGain();

        osc.connect(gain);
        gain.connect(audioContext.current.destination);

        if (type === 'laser') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(800, audioContext.current.currentTime);
            osc.frequency.exponentialRampToValueAtTime(100, audioContext.current.currentTime + 0.1);
            gain.gain.setValueAtTime(0.1, audioContext.current.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioContext.current.currentTime + 0.1);
            osc.start();
            osc.stop(audioContext.current.currentTime + 0.1);
        } else if (type === 'spawn') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(200, audioContext.current.currentTime);
            osc.frequency.exponentialRampToValueAtTime(600, audioContext.current.currentTime + 0.3);
            gain.gain.setValueAtTime(0.2, audioContext.current.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioContext.current.currentTime + 0.3);
            osc.start();
            osc.stop(audioContext.current.currentTime + 0.3);
        } else if (type === 'hit') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(150, audioContext.current.currentTime);
            gain.gain.setValueAtTime(0.05, audioContext.current.currentTime);
            gain.gain.linearRampToValueAtTime(0, audioContext.current.currentTime + 0.05);
            osc.start();
            osc.stop(audioContext.current.currentTime + 0.05);
        }
    }, [initAudio]);

    return { playSound };
};
