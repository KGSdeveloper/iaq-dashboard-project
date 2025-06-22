import React from 'react';
import { formatValue, getSensorStatus } from '../utils/helpers';

const SensorCard = ({ title, value, unit, icon, sensorType, cardType = 'standard' }) => {
  const status = getSensorStatus(sensorType, value);
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'excellent': return '#00ff88';
      case 'good': return '#74b9ff';
      case 'moderate': return '#fdcb6e';
      case 'poor': return '#ff7675';
      default: return '#9CA3AF';
    }
  };

  // Enhanced Thermometer Component
  const EnhancedThermometer = ({ value, min = 15, max = 35 }) => {
    const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
    
    return (
      <div className="flex items-center justify-center h-full">
        <svg viewBox="0 0 80 200" className="w-12 h-24">
          <defs>
            <linearGradient id="mercuryGrad" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#dc2626" />
              <stop offset="50%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#f97316" />
            </linearGradient>
            <filter id="thermGlow">
              <feGaussianBlur stdDeviation="2" />
            </filter>
          </defs>

          {/* Thermometer tube */}
          <rect x="25" y="20" width="30" height="140" rx="15" 
                fill="rgba(255,255,255,0.1)" 
                stroke="rgba(255,255,255,0.3)" 
                strokeWidth="1" />

          {/* Mercury fill */}
          <rect 
            x="30" y={155 - (percentage * 1.2)} 
            width="20" height={percentage * 1.2} 
            rx="10" 
            fill="url(#mercuryGrad)"
            className="transition-all duration-1000 ease-out"
            filter="url(#thermGlow)"
          />

          {/* Mercury bulb */}
          <circle cx="40" cy="175" r="18" 
                  fill="url(#mercuryGrad)" 
                  className="animate-pulse"
                  filter="url(#thermGlow)" />

          {/* Scale marks */}
          <g stroke="rgba(255,255,255,0.5)" strokeWidth="1">
            <line x1="55" y1="30" x2="65" y2="30" />
            <line x1="55" y1="80" x2="65" y2="80" />
            <line x1="55" y1="130" x2="65" y2="130" />
          </g>
        </svg>
      </div>
    );
  };

  // Enhanced Water Drop Component
  const EnhancedWaterDrop = ({ value }) => {
    const percentage = Math.min(100, Math.max(0, value));
    
    return (
      <div className="flex items-center justify-center h-full">
        <svg viewBox="0 0 120 160" className="w-16 h-20">
          <defs>
            <linearGradient id="waterGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1e40af" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.7" />
            </linearGradient>
            <clipPath id="dropClip">
              <path d="M60,15 C60,15 15,70 15,110 C15,135 35,150 60,150 C85,150 105,135 105,110 C105,70 60,15 60,15 Z" />
            </clipPath>
          </defs>

          {/* Drop outline */}
          <path d="M60,15 C60,15 15,70 15,110 C15,135 35,150 60,150 C85,150 105,135 105,110 C105,70 60,15 60,15 Z" 
                fill="rgba(255,255,255,0.1)" 
                stroke="rgba(255,255,255,0.3)" 
                strokeWidth="1" />

          {/* Water fill */}
          <g clipPath="url(#dropClip)">
            <rect x="15" y={150 - (percentage * 1.35)} width="90" height={percentage * 1.35} 
                  fill="url(#waterGrad)" 
                  className="transition-all duration-1000 ease-out" />
          </g>

          {/* Shine effect */}
          <ellipse cx="45" cy="70" rx="6" ry="15" fill="rgba(255,255,255,0.3)" />
        </svg>
      </div>
    );
  };

  if (cardType === 'temperature') {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-200">{title}</h3>
          <div className="text-2xl">{icon}</div>
        </div>
        <div className="flex-1 flex items-center">
          <div className="w-1/3">
            <EnhancedThermometer value={value} />
          </div>
          <div className="w-2/3 text-center">
            <div className="text-4xl font-bold text-white">
              {formatValue(value, 1)}<span className="text-xl ml-1">{unit}</span>
            </div>
            <div className="text-sm text-green-400 bg-green-400/20 rounded-full px-3 py-1 inline-block mt-2">
              Comfortable
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (cardType === 'humidity') {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-200">{title}</h3>
          <div className="text-2xl">{icon}</div>
        </div>
        <div className="flex-1 flex items-center">
          <div className="w-1/3">
            <EnhancedWaterDrop value={value} />
          </div>
          <div className="w-2/3 text-center">
            <div className="text-4xl font-bold text-white">
              {formatValue(value, 1)}<span className="text-xl ml-1">{unit}</span>
            </div>
            <div className="text-sm text-blue-400 bg-blue-400/20 rounded-full px-3 py-1 inline-block mt-2">
              Optimal
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Standard card layout
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-200">{title}</h3>
        <div className="text-xl">{icon}</div>
      </div>
      <div className="flex-1 flex flex-col justify-center text-center">
        <div className="text-3xl font-bold text-white mb-2">
          {formatValue(value, 2)}
        </div>
        <div className="text-sm text-gray-400 mb-4">{unit}</div>
        <div className="text-sm" style={{ color: getStatusColor(status) }}>
          {title.includes('Carbon') ? 'CO₂ Concentration' : 
           title.includes('Particulate') ? 'PM2.5' : 
           title.includes('Volatile') ? 'TVOC' : title}
        </div>
      </div>
    </div>
  );
};

export default SensorCard;