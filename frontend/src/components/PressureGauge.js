import React from 'react';

const PressureGauge = ({ value, unit, min = 0, max = 10 }) => {
  const angle = -90 + ((value - min) / (max - min)) * 180;
  const progress = ((value - min) / (max - min)) * 180;

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <h3 className="text-lg font-medium text-gray-200 mb-6">Differential Pressure</h3>
      
      <div className="relative w-40 h-24 mb-6">
        <svg viewBox="0 0 200 120" className="w-full h-full">
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
          </defs>

          {/* Background arc */}
          <path 
            d="M 20 100 A 80 80 0 0 1 180 100" 
            fill="none" 
            stroke="rgba(255,255,255,0.2)" 
            strokeWidth="8" 
            strokeLinecap="round"
          />

          {/* Progress arc */}
          <path 
            d={`M 20 100 A 80 80 0 0 1 ${100 + 80 * Math.cos((progress - 90) * Math.PI / 180)} ${100 + 80 * Math.sin((progress - 90) * Math.PI / 180)}`}
            fill="none" 
            stroke="url(#gaugeGradient)" 
            strokeWidth="8" 
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />

          {/* Needle */}
          <line 
            x1="100" 
            y1="100" 
            x2={100 + 60 * Math.cos(angle * Math.PI / 180)} 
            y2={100 + 60 * Math.sin(angle * Math.PI / 180)} 
            stroke="#ffffff" 
            strokeWidth="3" 
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />

          {/* Center dot */}
          <circle cx="100" cy="100" r="4" fill="#ffffff" />

          {/* Scale markers */}
          <text x="25" y="110" fontSize="10" fill="#888" textAnchor="middle">0</text>
          <text x="60" y="45" fontSize="10" fill="#888" textAnchor="middle">2</text>
          <text x="100" y="30" fontSize="10" fill="#888" textAnchor="middle">5</text>
          <text x="140" y="45" fontSize="10" fill="#888" textAnchor="middle">8</text>
          <text x="175" y="110" fontSize="10" fill="#888" textAnchor="middle">10</text>
        </svg>
      </div>
      
      <div className="text-center">
        <div className="text-3xl font-bold text-white mb-1">
          {value.toFixed(2)} <span className="text-lg text-gray-300">{unit}</span>
        </div>
        <div className="text-sm text-gray-400">
          Differential Pressure
        </div>
      </div>
    </div>
  );
};

export default PressureGauge;