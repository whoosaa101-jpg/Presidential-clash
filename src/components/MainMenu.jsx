import React, { useState, Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Stage, ContactShadows } from '@react-three/drei';
import { ToyUnit } from './ToyUnit';
import { PRESIDENTS } from '../constants';
import * as THREE from 'three';
import './MainMenu.css';

import { SocialTab } from './SocialTab';
import './SocialTab.css';
import { HQStore } from './HQStore';
import './HQStore.css';

const CardItem = ({ president, level, onSelect }) => (
    <div className="card-item" onClick={() => onSelect(president)}>

        <div className="card-canvas">
            <Canvas shadows camera={{ position: [0, 1.5, 3.5], fov: 40 }}>
                <Suspense fallback={null}>
                    <Stage environment="city" intensity={0.5} contactShadow={false}>
                        <ToyUnit id={president.id} team="blue" scale={1.2} level={level} />
                    </Stage>
                    <ContactShadows position={[0, -0.6, 0]} opacity={0.4} scale={5} blur={2.5} far={2} />
                </Suspense>
            </Canvas>
        </div>
        <div className="card-info">
            <div className="card-level">LVL {level}</div>
            <div className="card-name">{president.name}</div>
        </div>
    </div>
);

export const MainMenu = ({ onStartBattle, onOpenCollection, onStartPractice, onOpenLeague, getLevel, funds, declarations, openDeclaration, getTimeRemaining, upgradeLevel, updateFunds }) => {
    const [activeTab, setActiveTab] = useState('battle');
    const [showcaseIndex, setShowcaseIndex] = useState(0);
    const [openingDeclaration, setOpeningDeclaration] = useState(null);

    // Mock career data
    const career = JSON.parse(localStorage.getItem('clash_career_stats') || '{"wins": 0, "approval": 0, "funds": 100, "influence": 10}');

    // Rotate presidential showcase every 3 seconds
    useEffect(() => {
        const presidents = Object.values(PRESIDENTS).filter(p => !p.isSpell);
        const interval = setInterval(() => {
            setShowcaseIndex(prev => (prev + 1) % presidents.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const renderTabContent = () => {
        switch (activeTab) {
            case 'battle':
                const showcasePresidents = Object.values(PRESIDENTS).filter(p => !p.isSpell);
                const currentShowcase = showcasePresidents[showcaseIndex];
                return (
                    <div className="battle-tab">
                        <div className="arena-preview" onClick={onOpenLeague}>
                            <div className="arena-name">RANKED MATCH</div>
                            <div className="arena-trophies">{career.trophies || 0} TROPHIES</div>
                            <div className="presidential-showcase">
                                <Canvas shadows camera={{ position: [0, 0, 3], fov: 50 }}>
                                    <Suspense fallback={null}>
                                        <ambientLight intensity={0.5} />
                                        <pointLight position={[2, 2, 2]} intensity={2} />
                                        <pointLight position={[-2, 1, 1]} intensity={1} color="#2563eb" />

                                        {/* Rotating Portrait Display */}
                                        <group rotation={[0, Date.now() * 0.001 % (Math.PI * 2), 0]}>
                                            <mesh>
                                                <planeGeometry args={[2, 2]} />
                                                <meshStandardMaterial
                                                    map={null}
                                                    color="#2563eb"
                                                    transparent
                                                    opacity={0.9}
                                                />
                                            </mesh>

                                            {/* Portrait Image */}
                                            <mesh position={[0, 0, 0.01]}>
                                                <planeGeometry args={[1.8, 1.8]} />
                                                <meshStandardMaterial>
                                                    <primitive
                                                        attach="map"
                                                        object={(() => {
                                                            const texture = new THREE.TextureLoader().load(`/${currentShowcase.image}`);
                                                            texture.colorSpace = THREE.SRGBColorSpace;
                                                            return texture;
                                                        })()}
                                                    />
                                                </meshStandardMaterial>
                                            </mesh>

                                            {/* Golden Frame */}
                                            <mesh position={[0, 0, -0.01]}>
                                                <ringGeometry args={[0.95, 1.05, 48]} />
                                                <meshBasicMaterial color="#f1c40f" />
                                            </mesh>
                                        </group>

                                        <ContactShadows position={[0, -0.8, 0]} opacity={0.5} scale={8} blur={2} />
                                    </Suspense>
                                </Canvas>
                                <div className="showcase-label">{currentShowcase.name}</div>
                            </div>
                        </div>

                        <div className="main-actions">
                            <button className="battle-btn" onClick={onStartBattle}>
                                BATTLE
                            </button>
                        </div>

                        <div className="chest-slots">
                            {[0, 1, 2, 3].map(i => {
                                const doc = declarations ? declarations[i] : null;
                                const timeRemaining = doc && getTimeRemaining ? getTimeRemaining(i) : null;
                                const isReady = timeRemaining === 'READY';

                                return (
                                    <div
                                        key={i}
                                        className={`chest-slot ${doc ? 'filled' : 'empty'} ${isReady ? 'ready' : ''}`}
                                        onClick={() => {
                                            if (isReady && openDeclaration) {
                                                const reward = openDeclaration(i, updateFunds, upgradeLevel);
                                                if (reward) setOpeningDeclaration(reward);
                                            }
                                        }}
                                    >
                                        {doc ? (
                                            <>
                                                <div className="chest-icon">📜</div>
                                                <div className="chest-label">{doc.label}</div>
                                                <div className="chest-timer">{isReady ? 'TAP!' : timeRemaining}</div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="chest-icon">📜</div>
                                                <div className="chest-label">EMPTY</div>
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {openingDeclaration && (
                            <div className="chest-open-modal" onClick={() => setOpeningDeclaration(null)}>
                                <div className="modal-content">
                                    <div className="reward-title">DECLARATION SECURED!</div>
                                    <div className="reward-funds">💰 +{openingDeclaration.funds}</div>
                                    <div className="reward-upgrade">Upgraded: {openingDeclaration.president}</div>
                                    <button className="continue-btn">CONTINUE</button>
                                </div>
                            </div>
                        )}
                    </div>
                );
            case 'shop':
                return (
                    <HQStore
                        funds={funds}
                        influence={career.influence}
                        updateFunds={updateFunds}
                        upgradeLevel={upgradeLevel}
                    />
                );
            case 'cards':
                const presidents = Object.values(PRESIDENTS).filter(p => !p.isSpell);
                return (
                    <div className="deck-tab">
                        <div className="tab-header">
                            <div className="tab-title">BATTLE DECK</div>
                        </div>
                        <div className="card-grid">
                            {presidents.map(p => (
                                <CardItem
                                    key={p.id}
                                    president={p}
                                    level={getLevel ? getLevel(p.id) : 1}
                                    onSelect={() => onOpenCollection(p)}
                                />
                            ))}
                        </div>
                    </div>
                );
            case 'social':
                return <SocialTab />;
            default:
                return (
                    <div className="tab-placeholder">
                        <h2 style={{ textTransform: 'uppercase' }}>{activeTab} COMING SOON</h2>
                        <p>Strategic updates in progress...</p>
                    </div>
                );
        }
    };

    return (
        <div className="main-menu-royale">
            {/* TOP BAR */}
            <div className="top-status-bar">
                <div className="player-info">
                    <div className="level-badge">12</div>
                    <div className="player-name">CHIEF EXECUTIVE</div>
                </div>
                <div className="resource-group">
                    <div className="resource-item funds">
                        <span className="icon">💰</span>
                        <span className="value">{career.funds}</span>
                        <div className="add-btn">+</div>
                    </div>
                    <div className="resource-item influence">
                        <span className="icon">💎</span>
                        <span className="value">{career.influence}</span>
                        <div className="add-btn">+</div>
                    </div>
                </div>
            </div>

            <div className="trophy-row" onClick={onOpenLeague}>
                <div className="trophy-badge">
                    <span className="icon">🏆</span>
                    <span className="value">{career.trophies || 0}</span>
                </div>
                <div className={`pass-status ${career.seasonPassOwned ? 'premium' : ''}`}>
                    {career.seasonPassOwned ? 'SUPER PAC PASS' : 'PASS ROYALE'}
                </div>
            </div>

            {/* TAB CONTENT */}
            <div className="tab-view-container">
                {renderTabContent()}
            </div>

            {/* BOTTOM NAV */}
            <div className="bottom-nav">
                <div className={`nav-item ${activeTab === 'shop' ? 'active' : ''}`} onClick={() => setActiveTab('shop')}>
                    <span className="icon">🛒</span>
                    <span className="label">SHOP</span>
                </div>
                <div className={`nav-item ${activeTab === 'cards' ? 'active' : ''}`} onClick={() => setActiveTab('cards')}>
                    <span className="icon">🃏</span>
                    <span className="label">CARDS</span>
                </div>
                <div className={`nav-item ${activeTab === 'battle' ? 'active' : ''}`} onClick={() => setActiveTab('battle')}>
                    <span className="icon">⚔️</span>
                    <span className="label">BATTLE</span>
                </div>
                <div className={`nav-item ${activeTab === 'social' ? 'active' : ''}`} onClick={() => setActiveTab('social')}>
                    <span className="icon">🤝</span>
                    <span className="label">SOCIAL</span>
                </div>
                <div className={`nav-item ${activeTab === 'events' ? 'active' : ''}`} onClick={() => setActiveTab('events')}>
                    <span className="icon">🏙️</span>
                    <span className="label">EVENTS</span>
                </div>
            </div>
        </div>
    );
};
