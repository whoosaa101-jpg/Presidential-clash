import React, { useState } from 'react';
import { LEAGUES, SEASON_PASS_REWARDS } from '../constants';
import './LeagueView.css';

export const LeagueView = ({ onClose, trophies, ballots, seasonPassOwned, onClaimReward, onBuyPass }) => {
    const currentLeague = [...LEAGUES].reverse().find(l => trophies >= l.minTrophies) || LEAGUES[0];
    const nextLeague = LEAGUES[LEAGUES.indexOf(currentLeague) + 1];

    const progressToNext = nextLeague
        ? ((trophies - currentLeague.minTrophies) / (nextLeague.minTrophies - currentLeague.minTrophies)) * 100
        : 100;

    return (
        <div className="league-view-container">
            <div className="league-header">
                <button className="close-btn" onClick={onClose}>×</button>
                <div className="league-badge" style={{ backgroundColor: currentLeague.color }}>
                    <span className="league-rank">{currentLeague.name}</span>
                </div>
                <div className="trophy-count">🏆 {trophies}</div>
            </div>

            <div className="campaign-trail">
                <h3>CAMPAIGN TRAIL</h3>
                <div className="progression-bar-container">
                    <div className="progression-bar" style={{ width: `${progressToNext}%` }}></div>
                    <div className="progression-text">
                        {nextLeague ? `NEXT: ${nextLeague.name} at ${nextLeague.minTrophies} 🏆` : 'MAX RANK REACHED'}
                    </div>
                </div>
            </div>

            <div className="season-pass-section">
                <div className="pass-header">
                    <h2>SEASON 1: THE PRIMARY</h2>
                    <div className="ballot-count">🗳️ {ballots} BALLOTS</div>
                </div>

                {!seasonPassOwned && (
                    <div className="buy-pass-banner" onClick={onBuyPass}>
                        <span>UNLOCK THE <b>SUPER PAC</b> PASS</span>
                        <button className="buy-btn">500 💰</button>
                    </div>
                )}

                <div className="reward-tiers">
                    {SEASON_PASS_REWARDS.map(reward => {
                        const isUnlocked = ballots >= reward.ballots;
                        return (
                            <div key={reward.tier} className={`reward-tier ${isUnlocked ? 'unlocked' : 'locked'}`}>
                                <div className="tier-info">
                                    <span className="tier-num">TIER {reward.tier}</span>
                                    <span className="tier-cost">🗳️ {reward.ballots}</span>
                                </div>
                                <div className="tier-rewards">
                                    <div className="reward-box free" onClick={() => isUnlocked && onClaimReward(reward.tier, 'free')}>
                                        <div className="reward-label">FREE</div>
                                        <div className="reward-icon">{reward.free.type === 'funds' ? '💰' : '📜'}</div>
                                        <div className="reward-value">{reward.free.amount || reward.free.rarity}</div>
                                    </div>
                                    <div className={`reward-box premium ${!seasonPassOwned ? 'blurred' : ''}`} onClick={() => isUnlocked && seasonPassOwned && onClaimReward(reward.tier, 'premium')}>
                                        <div className="reward-label">SUPER PAC</div>
                                        <div className="reward-icon">{reward.premium.type === 'funds' ? '💰' : reward.premium.type === 'declaration' ? '📜' : '👑'}</div>
                                        <div className="reward-value">{reward.premium.amount || reward.premium.rarity || 'SKIN'}</div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
