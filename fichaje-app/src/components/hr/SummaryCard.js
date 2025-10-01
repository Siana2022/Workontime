import React from 'react';
import './SummaryCard.css';
import { FiMoreHorizontal } from 'react-icons/fi';

const SummaryCard = ({ title, stats }) => {
    return (
        <div className="summary-card card">
            <div className="card-header">
                <h3 className="card-title">{title}</h3>
                <button className="card-options-btn"><FiMoreHorizontal /></button>
            </div>
            <div className="card-body">
                {stats.map((stat, index) => (
                    <div key={index} className="stat-item">
                        <p className="stat-value" style={{ color: stat.color }}>{stat.value}</p>
                        <p className="stat-label">{stat.label}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SummaryCard;