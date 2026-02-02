import React, { useEffect, useState } from 'react';
import './ActionReport.css';

export const ActionReport = ({ result, stats, onExit, onRematch, progressions, rematchRequested }) => {
    const isWin = result === 'victory';

    return (
        <div className="action-report-overlay">
            <div className={`results-card ${isWin ? 'win' : 'loss'}`}>
                <div className="results-header">
                    <h1 className="result-title">{isWin ? 'MISSION ACCOMPLISHED' : 'STRATEGIC WITHDRAWAL'}</h1>
                    <div className="mvp-banner">MATCH MVP: {stats.mvp.toUpperCase() || 'N/A'}</div>
                </div>

                <div className="results-body">
                    <div className="stats-column">
                        <div className="summary-stat">
                            <span className="label">TOTAL ELIXIR SPENT:</span>
                            <span className="value">{Math.floor(stats.totalElixir)}</span>
                        </div>
                        <div className="summary-stat">
                            <span className="label">UNITS DEPLOYED:</span>
                            <span className="value">{stats.totalSpawns}</span>
                        </div>
                        <div className="summary-stat">
                            <span className="label">MATCH DURATION:</span>
                            <span className="value">{stats.duration}s</span>
                        </div>
                    </div>

                    <div className="xp-column">
                        <h3 className="xp-title">POLITICAL STANDING GAINS</h3>
                        {stats.spawnCounts && Object.entries(stats.spawnCounts).map(([id, count]) => {
                            if (count === 0) return null;
                            const prog = progressions[id] || { level: 1, xp: 0 };
                            return (
                                <div key={id} className="xp-gain-row">
                                    <div className="xp-name">{id.toUpperCase()}</div>
                                    <div className="xp-bar-container">
                                        <div className="xp-bar-fill" style={{ width: `${(prog.xp % 1000) / 10}%` }}></div>
                                    </div>
                                    <div className="xp-level">LVL {prog.level}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="results-footer">
                    <button className="rematch-btn" onClick={onRematch} disabled={rematchRequested}>
                        {rematchRequested ? 'WAITING FOR OPPONENT...' : 'REQUEST REMATCH'}
                    </button>
                    <button className="exit-btn" onClick={onExit}>RETURN TO HQ</button>
                </div>
            </div>
        </div>
    );
};
