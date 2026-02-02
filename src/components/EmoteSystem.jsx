import React, { useState } from 'react';
import './EmoteSystem.css';

const EMOTES = [
    { id: 'sad', text: 'SAD!', icon: '😢' },
    { id: 'tremendous', text: 'TREMENDOUS!', icon: '👍' },
    { id: 'fired', text: "YOU'RE FIRED!", icon: '🔥' },
    { id: 'blast', text: 'BIDEN BLAST!', icon: '⚡' },
    { id: 'wall', text: 'BUILD THE WALL!', icon: '🧱' },
    { id: 'hope', text: 'HOPE!', icon: '🌟' },
    { id: 'deal', text: 'NEW DEAL!', icon: '📜' },
    { id: 'saber', text: 'FOR THE UNION!', icon: '⚔️' }
];

export const EmoteMenu = ({ onSendEmote }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className={`emote-menu-container ${isOpen ? 'open' : ''}`}>
            <button className="emote-trigger-btn" onClick={() => setIsOpen(!isOpen)}>
                💬
            </button>
            {isOpen && (
                <div className="emote-grid">
                    {EMOTES.map(emote => (
                        <button
                            key={emote.id}
                            className="emote-item"
                            onClick={() => {
                                onSendEmote(emote);
                                setIsOpen(false);
                            }}
                        >
                            <span className="emote-icon">{emote.icon}</span>
                            <span className="emote-text">{emote.text}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export const EmoteOverlay = ({ emote, team }) => {
    return (
        <div className={`emote-bubble-overlay ${team}`}>
            <div className="bubble-content">
                <span className="bubble-icon">{emote.icon}</span>
                <span className="bubble-text">{emote.text}</span>
            </div>
            <div className="bubble-tail"></div>
        </div>
    );
};
