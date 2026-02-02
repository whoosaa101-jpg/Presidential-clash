import { useRef, useCallback } from 'react';

export const useSound = () => {
    const audioCtxRef = useRef(null);
    const musicSourceRef = useRef(null);
    const soundCacheRef = useRef({});

    const initAudio = useCallback(() => {
        if (!audioCtxRef.current) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            audioCtxRef.current = new AudioContext();
        }
        if (audioCtxRef.current.state === 'suspended') {
            audioCtxRef.current.resume();
        }
    }, []);

    // Helper to load and cache audio files
    const loadSound = useCallback(async (url) => {
        initAudio();

        // Check cache first
        if (soundCacheRef.current[url]) {
            return soundCacheRef.current[url];
        }

        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const buffer = await audioCtxRef.current.decodeAudioData(arrayBuffer);
            soundCacheRef.current[url] = buffer;
            return buffer;
        } catch (e) {
            console.warn(`Failed to load sound: ${url}`, e);
            return null;
        }
    }, [initAudio]);

    // Generic play sound function
    const playSoundEffect = useCallback(async (url, volume = 0.3, playbackRate = 1.0) => {
        initAudio();

        try {
            const buffer = await loadSound(url);
            if (!buffer) return; // Fallback: do nothing if sound failed to load

            const source = audioCtxRef.current.createBufferSource();
            const gainNode = audioCtxRef.current.createGain();

            source.buffer = buffer;
            source.playbackRate.value = playbackRate;
            gainNode.gain.value = volume;

            source.connect(gainNode);
            gainNode.connect(audioCtxRef.current.destination);
            source.start();
        } catch (e) {
            console.warn('Error playing sound:', e);
        }
    }, [initAudio, loadSound]);

    // Synthesized fallback sounds (when audio files aren't available)
    const playTone = useCallback((frequency, duration = 0.1, volume = 0.2) => {
        initAudio();
        const osc = audioCtxRef.current.createOscillator();
        const gain = audioCtxRef.current.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(frequency, audioCtxRef.current.currentTime);
        gain.gain.setValueAtTime(volume, audioCtxRef.current.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtxRef.current.currentTime + duration);

        osc.connect(gain);
        gain.connect(audioCtxRef.current.destination);
        osc.start();
        osc.stop(audioCtxRef.current.currentTime + duration);
    }, [initAudio]);

    // ===== UI SOUNDS =====
    const playButtonClick = useCallback(() => {
        playSoundEffect('/sounds/ui/button_click.mp3', 0.3).catch(() => playTone(800, 0.05));
    }, [playSoundEffect, playTone]);

    const playCardSelect = useCallback(() => {
        playSoundEffect('/sounds/ui/card_select.mp3', 0.4).catch(() => playTone(600, 0.08));
    }, [playSoundEffect, playTone]);

    const playCardPlace = useCallback(() => {
        playSoundEffect('/sounds/battle/card_place.mp3', 0.5).catch(() => playTone(400, 0.15));
    }, [playSoundEffect, playTone]);

    const playMenuOpen = useCallback(() => {
        playSoundEffect('/sounds/ui/menu_open.mp3', 0.3).catch(() => playTone(500, 0.1));
    }, [playSoundEffect, playTone]);

    const playLevelUp = useCallback(() => {
        playSoundEffect('/sounds/ui/level_up.mp3', 0.6).catch(() => {
            // Ascending tone sequence for level up
            playTone(523, 0.1, 0.3); // C
            setTimeout(() => playTone(659, 0.1, 0.3), 100); // E
            setTimeout(() => playTone(784, 0.2, 0.4), 200); // G
        });
    }, [playSoundEffect, playTone]);

    // ===== BATTLE SOUNDS =====
    const playSpawn = useCallback((presidentId = '') => {
        const spawnFile = `/sounds/battle/spawn_${presidentId || 'default'}.mp3`;
        playSoundEffect(spawnFile, 0.4).catch(() => playTone(300, 0.2));
    }, [playSoundEffect, playTone]);

    const playShoot = useCallback((weaponType = 'default') => {
        const shootFile = `/sounds/battle/${weaponType}_shoot.mp3`;
        playSoundEffect(shootFile, 0.5, 1.0 + Math.random() * 0.2).catch(() => playTone(200, 0.05));
    }, [playSoundEffect, playTone]);

    const playHit = useCallback(() => {
        playSoundEffect('/sounds/battle/hit.mp3', 0.4).catch(() => playTone(150, 0.08));
    }, [playSoundEffect, playTone]);

    const playExplosion = useCallback(() => {
        playSoundEffect('/sounds/battle/explosion.mp3', 0.7).catch(() => {
            // Explosive bass thump
            playTone(50, 0.3, 0.5);
        });
    }, [playSoundEffect, playTone]);

    const playTowerDestroy = useCallback(() => {
        playSoundEffect('/sounds/battle/tower_destroy.mp3', 0.8).catch(() => {
            // Big dramatic destruction sound
            playTone(40, 0.5, 0.6);
            setTimeout(() => playTone(80, 0.4, 0.5), 100);
        });
    }, [playSoundEffect, playTone]);

    const playVictory = useCallback(() => {
        playSoundEffect('/sounds/ui/victory.mp3', 0.7).catch(() => {
            // Victory fanfare
            playTone(523, 0.2, 0.4); // C
            setTimeout(() => playTone(659, 0.2, 0.4), 150); // E
            setTimeout(() => playTone(784, 0.3, 0.5), 300); // G
            setTimeout(() => playTone(1047, 0.4, 0.6), 500); // C (octave up)
        });
    }, [playSoundEffect, playTone]);

    const playDefeat = useCallback(() => {
        playSoundEffect('/sounds/ui/defeat.mp3', 0.6).catch(() => {
            // Sad descending tones
            playTone(392, 0.3, 0.4); // G
            setTimeout(() => playTone(330, 0.3, 0.4), 200); // E
            setTimeout(() => playTone(262, 0.5, 0.5), 400); // C
        });
    }, [playSoundEffect, playTone]);

    const playSqueak = useCallback(() => {
        // Playful squeak sound (ballots earned, chest opening, etc.)
        playSoundEffect('/sounds/ui/squeak.mp3', 0.4).catch(() => playTone(1200, 0.08, 0.3));
    }, [playSoundEffect, playTone]);

    // ===== PRESIDENTIAL VOICELINES =====
    const playVoiceline = useCallback((presidentId, lineType = 'spawn') => {
        const voicelineFile = `/sounds/voicelines/${presidentId}_${lineType}.mp3`;
        playSoundEffect(voicelineFile, 0.7).catch(() => {
            // No fallback for voicelines - just log
            console.log(`Voiceline not available: ${presidentId} - ${lineType}`);
        });
    }, [playSoundEffect]);

    // ===== MUSIC CONTROL =====
    const playMusic = useCallback(async (url) => {
        initAudio();
        if (musicSourceRef.current) {
            try {
                musicSourceRef.current.stop();
            } catch (e) {
                // Ignore if already stopped
            }
        }

        try {
            const buffer = await loadSound(url);
            if (!buffer) return;

            const source = audioCtxRef.current.createBufferSource();
            const gainNode = audioCtxRef.current.createGain();

            source.buffer = buffer;
            source.loop = true;
            gainNode.gain.value = 0.3; // Background music volume

            source.connect(gainNode);
            gainNode.connect(audioCtxRef.current.destination);
            source.start();
            musicSourceRef.current = source;
        } catch (e) {
            console.warn('Music playback failed:', e);
        }
    }, [initAudio]);

    const stopMusic = useCallback(() => {
        if (musicSourceRef.current) {
            try {
                musicSourceRef.current.stop();
                musicSourceRef.current = null;
            } catch (e) {
                // Already stopped
            }
        }
    }, []);

    return {
        initAudio,

        // UI Sounds
        playButtonClick,
        playCardSelect,
        playCardPlace,
        playMenuOpen,
        playLevelUp,
        playSqueak,

        // Battle Sounds
        playSpawn,
        playShoot,
        playHit,
        playExplosion,
        playTowerDestroy,
        playVictory,
        playDefeat,

        // Voicelines
        playVoiceline,

        // Music
        playMusic,
        stopMusic
    };
};
