import React from 'react';
import { Link } from 'react-router-dom';
import './ShortcutButton.css';

const ShortcutButton = ({ title, to }) => {
    return (
        <Link to={to} className="shortcut-button">
            {title}
        </Link>
    );
};

export default ShortcutButton;
