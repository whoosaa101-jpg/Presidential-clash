import React from 'react';
import './HallOfFame.css';

export const HallOfFame = ({ onClose }) => {
    const stats = JSON.parse(localStorage.getItem('clash_career_stats') || '{"wins": 0, "losses": 0, "totalSpawns": 0, "bestStreak": 0, "mostUsed": "N/A"}');

    return (
        <div className="hall-of-fame">
            <button className="back-btn" onClick={onClose}>
                <span className="btn-icon">⬅️</span> BACK TO HQ
            </button>

            <div className="hof-header">
                <div className="hof-icon">🏆</div>
                <h1 className="hof-title">HALL OF FAME</h1>
                <div className="hof-subtitle">OFFICIAL CAREER SERVICE RECORD</div>
            </div>

            <div className="stats-grid">
                <div className="stat-card gold">
                    <div className="stat-value">{stats.wins}</div>
                    <div className="stat-label">VICTORIES</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{stats.losses}</div>
                    <div className="stat-label">DEFEATS</div>
                </div>
                <div className="stat-card highlight">
                    <div className="stat-value">{stats.bestStreak}</div>
                    <div className="stat-label">BEST STREAK</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{stats.totalSpawns}</div>
                    <div className="stat-label">UNITS DEPLOYED</div>
                </div>
            </div>

            <div className="career-highlight">
                <div className="highlight-label">MOST VALUABLE PRESIDENT</div>
                <div className="highlight-value">{stats.mostUsed.toUpperCase()}</div>
            </div>

            <div className="hof-footer">
                PRESERVING DEMOCRACY SINCE 2026
            </div>
        </div>
    );
};
