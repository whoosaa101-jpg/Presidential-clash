import React from 'react';
import './SocialTab.css';

const LEADERBOARD_DATA = [
    { rank: 1, name: "TRUMPINATOR", trophies: 4200, status: "ONLINE" },
    { rank: 2, name: "LINCOLN_LOGS", trophies: 3850, status: "IN BATTLE" },
    { rank: 3, name: "BIDEN_BLAST", trophies: 3500, status: "ONLINE" },
    { rank: 4, name: "ROOSEVELT_ROUGH", trophies: 3200, status: "OFFLINE" },
    { rank: 5, name: "WASHINGTON_DC", trophies: 2900, status: "ONLINE" },
];

export const SocialTab = ({ onOpenLeague }) => {
    const stats = JSON.parse(localStorage.getItem('clash_career_stats') || '{"wins": 0, "losses": 0, "approval": 0, "trophies": 0}');

    return (
        <div className="social-tab">
            <div className="social-section personal-rank">
                <div className="section-title">YOUR STANDING</div>
                <div className="personal-card" onClick={onOpenLeague}>
                    <div className="rank">#42</div>
                    <div className="info">
                        <div className="name">CHIEF EXECUTIVE</div>
                        <div className="trophies">🏆 {stats.trophies || 0}</div>
                    </div>
                    <div className="stats-mini">
                        <span>W: {stats.wins}</span>
                        <span>L: {stats.losses}</span>
                    </div>
                </div>
            </div>

            <div className="social-section global-leaderboard">
                <div className="section-title">GLOBAL LEADERBOARD</div>
                <div className="leaderboard-list">
                    {LEADERBOARD_DATA.map((player) => (
                        <div key={player.rank} className="leaderboard-item">
                            <div className="rank-badge">{player.rank}</div>
                            <div className="player-info">
                                <span className="player-name">{player.name}</span>
                                <span className={`status-dot ${player.status.toLowerCase().replace(' ', '-')}`}></span>
                            </div>
                            <div className="player-trophies">🏆 {player.trophies}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="social-section friends-list">
                <div className="section-title">CLAN: THE OVAL OFFICE</div>
                <div className="clan-info">
                    <div className="clan-stat">
                        <span className="label">MEMBERS</span>
                        <span className="value">24/50</span>
                    </div>
                    <div className="clan-stat">
                        <span className="label">REQ. TROPHIES</span>
                        <span className="value">1000</span>
                    </div>
                </div>
                <button className="clan-btn">VIEW CLAN</button>
            </div>
        </div>
    );
};
