import React from 'react';

const SensorCard = ({ title, value, unit, icon, sensorType, cardType = "standard" }) => {
  const formatValue = (val, decimals = 2) => {
    if (val === null || val === undefined) return '--';
    return Number(val).toFixed(decimals);
  };

  const getStatusColor = (type) => {
    switch (type) {
      case 'excellent': return '#00ff88';
      case 'good': return '#74b9ff';
      case 'moderate': return '#fdcb6e';
      case 'poor': return '#ff7675';
      default: return '#74b9ff';
    }
  };

  // Temperature Card with Thermometer
  if (cardType === 'temperature') {
    const tempPercentage = Math.min(100, Math.max(0, (value / 35) * 100));
    
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-200">{title}</h3>
          <div className="text-xl">{icon}</div>
        </div>
        <div className="flex-1 flex items-center">
          <div className="relative mr-6">
            {/* Thermometer container */}
            <div className="w-8 h-32 bg-gray-700 rounded-full relative overflow-hidden">
              {/* Mercury fill */}
              <div 
                className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-red-500 to-orange-500 rounded-full transition-all duration-1000"
                style={{ height: `${tempPercentage}%` }}
              ></div>
              {/* Temperature scale */}
              <div className="absolute -right-10 top-0 h-full flex flex-col justify-between text-xs text-gray-400 py-1">
                <span>35</span>
                <span>30</span>
                <span>25</span>
                <span>20</span>
                <span>15</span>
              </div>
            </div>
          </div>
          <div className="flex-1">
            <div className="text-4xl font-bold text-white mb-2">
              {formatValue(value, 1)}°C
            </div>
            <div className="text-sm text-gray-400 mb-2">Temperature</div>
            <div className="flex items-center gap-2">
              <div className="text-blue-400 text-sm">❄️</div>
              <div className="text-xs text-blue-400 bg-blue-400/20 rounded-full px-2 py-1">
                Comfortable Range
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Humidity Card with Water Drop and Scale
  if (cardType === 'humidity') {
    const humidityPercentage = Math.min(100, Math.max(0, value));
    
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-200">{title}</h3>
          <div className="text-xl">{icon}</div>
        </div>
        <div className="flex-1 flex items-center">
          {/* Water Drop Animation */}
          <div className="relative mr-6">
            <div className="w-20 h-20 relative">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <defs>
                  <clipPath id="dropClip">
                    <path d="M50,10 C30,30 15,45 15,65 C15,80 30,90 50,90 C70,90 85,80 85,65 C85,45 70,30 50,10 Z" />
                  </clipPath>
                  <linearGradient id="waterGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#1d4ed8" />
                  </linearGradient>
                </defs>
                
                {/* Drop outline */}
                <path d="M50,10 C30,30 15,45 15,65 C15,80 30,90 50,90 C70,90 85,80 85,65 C85,45 70,30 50,10 Z" 
                      fill="rgba(59, 130, 246, 0.2)" 
                      stroke="rgba(59, 130, 246, 0.5)" 
                      strokeWidth="2"/>
                
                {/* Water fill */}
                <rect x="0" y={90 - (humidityPercentage * 0.8)} width="100" height={humidityPercentage * 0.8} 
                      fill="url(#waterGrad)" 
                      clipPath="url(#dropClip)"
                      className="transition-all duration-1000" />
              </svg>
              
              {/* Percentage in center */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-lg font-bold text-white">{formatValue(value, 0)}</div>
                  <div className="text-xs text-white/60">%</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex-1">
            <div className="text-3xl font-bold text-white mb-2">
              {formatValue(value, 2)}%
            </div>
            <div className="text-sm text-gray-400 mb-4">Humidity</div>
            
            {/* Comfort Scale */}
            <div className="w-full">
              <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden relative">
                <div className="h-full bg-gradient-to-r from-red-500 via-green-500 to-red-500 rounded-full"></div>
                <div 
                  className="absolute top-0 h-full w-1 bg-white rounded-full transition-all duration-1000"
                  style={{ left: `${humidityPercentage}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>Dry</span>
                <span>Optimal</span>
                <span>Humid</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Standard circular progress cards for CO2, PM2.5, TVOC
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-200">{title}</h3>
        <div className="text-xl">{icon}</div>
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center">
        {/* Circular Progress */}
        <div className="relative w-32 h-32 mb-4">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="8"
              fill="none"
            />
            {/* Progress circle */}
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke={
                sensorType === 'CO2' ? '#3b82f6' :
                sensorType === 'PM25' ? '#10b981' :
                sensorType === 'TVOC' ? '#8b5cf6' : '#74b9ff'
              }
              strokeWidth="8"
              strokeLinecap="round"
              fill="none"
              strokeDasharray={`${Math.min(100, (value / (sensorType === 'CO2' ? 2000 : sensorType === 'PM25' ? 100 : 1000)) * 100) * 2.51} 251`}
              className="transition-all duration-1000"
            />
          </svg>
          
          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <div className="text-2xl mb-1">{icon}</div>
            <div className="text-xl font-bold text-white">{formatValue(value, 2)}</div>
            <div className="text-xs text-gray-400">{unit}</div>
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-xs text-gray-400">
            {title.includes('Carbon') ? 'CO₂ Concentration' : 
             title.includes('Particulate') ? 'PM2.5' : 
             title.includes('Volatile') ? 'TVOC' : title}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SensorCard;