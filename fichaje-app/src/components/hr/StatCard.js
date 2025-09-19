import React from 'react';
import './StatCard.css';

const StatCard = ({ title, value }) => {
    return (
        <div className="stat-card">
            <h3 className="stat-card-title">{title}</h3>
            <p className="stat-card-value">{value}</p>
        </div>
    );
};

export default StatCard;
