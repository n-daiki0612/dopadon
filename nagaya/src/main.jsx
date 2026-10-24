import React from 'react';
import { createRoot } from 'react-dom/client';
import { GameProvider } from './game/GameContext.jsx';
import App from './App.jsx';
import './styles/global.css';

createRoot(document.getElementById('root')).render(<React.StrictMode><GameProvider><App /></GameProvider></React.StrictMode>);
