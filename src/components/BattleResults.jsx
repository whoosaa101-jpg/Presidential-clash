import React from 'react';
import './BattleResults.css';

export const BattleResults = ({ victory, trophyChange, declarationEarned, fundsEarned, ballotsEarned, xpEarned, onContinue, stats, progressions, onRematch, rematchRequested }) => {
    return (
        <div className="battle-results-overlay">
            <div className={`results-container ${victory ? 'win' : 'loss'}`}>
                {/* Victory/Defeat Banner */}
                <div className={`result-banner ${victory ? 'victory' : 'defeat'}`}>
                    {victory ? 'VICTORY' : 'DEFEAT'}
                </div>

                <div className="mvp-banner">MATCH MVP: {stats?.mvp?.toUpperCase() || 'N/A'}</div>

                {/* Trophy Change */}
                <div className="trophy-change">
                    <span className="trophy-icon">🏆</span>
                    <span className={`trophy-value ${victory ? 'gain' : 'loss'}`}>
                        {victory ? '+' : '-'}{trophyChange}
                    </span>
                </div>

                {/* Chest Earned */}
                {declarationEarned && victory && (
                    <div className="chest-earned">
                        <div className="chest-visual">📜</div>
                        <div className="chest-label">{declarationEarned} PIECE SECURED!</div>
                    </div>
                )}

                {/* Reward Breakdown */}
                <div className="reward-breakdown">
                    <div className="reward-item">
                        <span className="reward-icon">💰</span>
                        <span className="reward-value">+{fundsEarned} Gold</span>
                    </div>
                    {ballotsEarned > 0 && (
                        <div className="reward-item">
                            <span className="reward-icon">🗳️</span>
                            <span className="reward-value">+{ballotsEarned} Ballots</span>
                        </div>
                    )}
                    {xpEarned > 0 && (
                        <div className="reward-item">
                            <span className="reward-icon">⭐</span>
                            <span className="reward-value">+{xpEarned} XP</span>
                        </div>
                    )}
                </div>

                {/* XP Progression - Borrowed from ActionReport style */}
                <div className="xp-column">
                    <h3 className="xp-title">POLITICAL STANDING</h3>
                    {stats?.spawnCounts && Object.entries(stats.spawnCounts).map(([id, count]) => {
                        if (count === 0) return null;
                        const prog = progressions[id] || { level: 1, xp: 0 };
                        return (
                            <div key={id} className="xp-gain-row">
                                <div className="xp-name">{id.split('_').map(word => word[0]).join('').toUpperCase()}</div>
                                <div className="xp-bar-container">
                                    <div className="xp-bar-fill" style={{ width: `${(prog.xp % 1000) / 10}%` }}></div>
                                </div>
                                <div className="xp-level">LVL {prog.level}</div>
                            </div>
                        );
                    })}
                </div>

                {/* Buttons */}
                <div className="results-footer">
                    <button className="rematch-btn" onClick={onRematch} disabled={rematchRequested}>
                        {rematchRequested ? 'WAITING...' : 'REMATCH'}
                    </button>
                    <button className="results-continue-btn" onClick={onContinue}>
                        CONTINUE
                    </button>
                </div>
            </div>

            {/* Victory Confetti */}
            {victory && (
                <div className="confetti-container">
                    {[...Array(30)].map((_, i) => (
                        <div
                            key={i}
                            className="confetti"
                            style={{
                                left: `${Math.random() * 100}%`,
                                animationDelay: `${Math.random() * 2}s`,
                                backgroundColor: ['#f1c40f', '#e74c3c', '#3498db', '#2ecc71'][Math.floor(Math.random() * 4)]
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};
