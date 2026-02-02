import React from 'react';
import './HQStore.css';
import { PRESIDENTS } from '../constants';

export const HQStore = ({ funds, influence, updateFunds, buyInfluence, upgradeLevel }) => {
    const bundles = [
        { id: 'small_ballots', name: 'Grassroots Bundle', funds: 500, cost: 50, icon: '📮' },
        { id: 'medium_ballots', name: 'PAC Contribution', funds: 2500, cost: 200, icon: '💼' },
        { id: 'large_ballots', name: 'Lobbyist Special', funds: 10000, cost: 750, icon: '🏦' },
    ];

    const dailyDeals = [
        { id: 'george_washington', name: 'George Washington', type: 'CARD', cost: 100, icon: '🦅' },
        { id: 'abraham_lincoln', name: 'Abraham Lincoln', type: 'CARD', cost: 100, icon: '🎩' },
        { id: 'exec_order', name: 'Executive Order', type: 'SPELL', cost: 150, icon: '📜' },
    ];

    return (
        <div className="hq-store">
            <div className="store-section">
                <h2 className="section-title">DAILY DEALS</h2>
                <div className="deals-grid">
                    {dailyDeals.map(deal => (
                        <div key={deal.id} className="store-card deal">
                            <div className="card-icon">{deal.icon}</div>
                            <div className="card-name">{deal.name}</div>
                            <button
                                className="buy-btn"
                                onClick={() => {
                                    if (funds >= deal.cost) {
                                        updateFunds(-deal.cost);
                                        // Logic for adding cards/XP could go here
                                        alert(`${deal.name} PURCHASED!`);
                                    }
                                }}
                            >
                                💰 {deal.cost}
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            <div className="store-section">
                <h2 className="section-title">CAMPAIGN BUNDLES</h2>
                <div className="bundles-list">
                    {bundles.map(bundle => (
                        <div key={bundle.id} className="store-bundle">
                            <div className="bundle-icon">{bundle.icon}</div>
                            <div className="bundle-info">
                                <div className="bundle-name">{bundle.name}</div>
                                <div className="bundle-value">💰 {bundle.funds} BALLOTS</div>
                            </div>
                            <button
                                className="buy-btn premium"
                                onClick={() => {
                                    if (influence >= bundle.cost) {
                                        updateFunds(bundle.funds);
                                        // Logic for spending influence
                                        alert(`${bundle.name} UNLOCKED!`);
                                    }
                                }}
                            >
                                💎 {bundle.cost}
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            <div className="store-footer">
                <p>CONTACT YOUR DELEGATE FOR REFUNDS</p>
            </div>
        </div>
    );
};
