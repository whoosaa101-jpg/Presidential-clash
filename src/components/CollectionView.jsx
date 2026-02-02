import React, { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage, Environment, ContactShadows } from '@react-three/drei';
import { ToyUnit } from './ToyUnit';
import { PRESIDENTS } from '../constants';
import './CollectionView.css';

export const CollectionView = ({ onClose, getLevel, upgradeLevel, funds, updateFunds, initialPresident, deck = [], onToggleDeck }) => {
    const presidents = Object.values(PRESIDENTS);
    const [currentIndex, setCurrentIndex] = useState(() => {
        if (initialPresident) {
            const idx = presidents.findIndex(p => p.id === initialPresident.id);
            return idx !== -1 ? idx : 0;
        }
        return 0;
    });
    const currentPres = presidents[currentIndex];
    const level = getLevel ? getLevel(currentPres.id) : 1;

    const nextPres = () => setCurrentIndex((currentIndex + 1) % presidents.length);
    const prevPres = () => setCurrentIndex((currentIndex - 1 + presidents.length) % presidents.length);

    // Exponential cost: 5, 10, 20, 40, 80...
    const upgradeCost = Math.pow(2, level - 1) * 5;
    const canUpgrade = funds >= upgradeCost;

    const handleUpgrade = () => {
        if (canUpgrade) {
            updateFunds(-upgradeCost);
            upgradeLevel(currentPres.id);
        }
    };

    const isInDeck = deck.includes(currentPres.id);
    const deckFull = deck.length >= 8 && !isInDeck;

    return (
        <div className="collection-view">
            <button className="back-btn" onClick={onClose}>
                <span className="btn-icon">⬅️</span> BACK TO HQ
            </button>

            <div className="deck-counter-badge">
                DECK: {deck.length} / 8
            </div>

            <div className="viewer-container">
                <Canvas shadows camera={{ position: [0, 2, 5], fov: 40 }}>
                    <Suspense fallback={null}>
                        <Stage environment="city" intensity={0.5} contactShadow={false}>
                            <ToyUnit
                                id={currentPres.id}
                                team="blue"
                                isFlying={currentPres.id === 'obama'}
                                isAttacking={false}
                                scale={1.5}
                                level={level}
                            />
                        </Stage>
                        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
                            <planeGeometry args={[10, 10]} />
                            <meshStandardMaterial color="#2c3e50" roughness={1} />
                        </mesh>
                        <ContactShadows position={[0, 0, 0]} opacity={0.4} scale={10} blur={2.5} far={4} color="#000" />
                    </Suspense>
                    <OrbitControls makeDefault autoRotate autoRotateSpeed={0.5} minPolarAngle={0} maxPolarAngle={Math.PI / 2} />
                </Canvas>
            </div>

            <div className="info-overlay">
                <div className="info-header">
                    <div className="pres-level-badge">LVL {level}</div>
                    <h2 className="pres-name">{currentPres.name}</h2>
                    <div className="pres-role">UNIT_TYPE: {currentPres.isSpell ? "TACTICAL_SPELL" : "ASSAULT_LEADER"}</div>
                </div>

                <div className="action-row">
                    <button
                        className={`use-btn ${isInDeck ? 'in-deck' : ''} ${deckFull ? 'locked' : ''}`}
                        onClick={() => onToggleDeck(currentPres.id)}
                        disabled={deckFull}
                    >
                        {isInDeck ? 'IN DECK' : 'USE'}
                    </button>

                    <button
                        className={`upgrade-btn ${!canUpgrade ? 'locked' : ''}`}
                        onClick={handleUpgrade}
                        disabled={!canUpgrade}
                    >
                        <div className="upgrade-label">UPGRADE</div>
                        <div className="upgrade-price">💰 {upgradeCost}</div>
                    </button>
                </div>
                {!canUpgrade && <div className="funds-warning">INSUFFICIENT FUNDS</div>}


                <div className="pres-desc">
                    {currentPres.superAbility?.type === 'damage' ? "High-impact explosive capabilities." :
                        currentPres.superAbility?.type === 'heal' ? "Advanced regenerative support systems." :
                            "Versatile tactical deployment unit."}
                </div>

                <div className="viewer-controls">
                    <button className="control-btn" onClick={prevPres}>PREVIOUS</button>
                    <div className="pres-counter">{currentIndex + 1} / {presidents.length}</div>
                    <button className="control-btn" onClick={nextPres}>NEXT</button>
                </div>
            </div>
        </div>
    );
};
