import React, { useState, useEffect } from 'react';
import sensorService from '../services/sensorService';
import { 
  SENSOR_RANGES, 
  STATUS_COLORS, 
  getSensorStatus, 
  calculateIAQ, 
  getIAQStatus,
  WEATHER_CONFIG 
} from '../utils/constants';
// Import your background image and logo
import backgroundImage from '../assets/room-background.jpg';
import daikinLogo from '../assets/daikin-logo.png';

// Try to import building overview image
let buildingOverviewImage;
try {
  buildingOverviewImage = require('../assets/building-overview.png');
} catch (e) {
  try {
    buildingOverviewImage = require('../assets/building-overview.jpg');
  } catch (e) {
    buildingOverviewImage = null;
  }
}

const Dashboard = () => {
  // Initialize with null values to show loading state
  const [sensorData, setSensorData] = useState({
    PM25: null,
    CO2: null,
    TEMPERATURE: null,
    HUMIDITY: null,
    TVOC: null,
    DIFFERENTIAL_PRESSURE: null
  });
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [connectionStatus, setConnectionStatus] = useState({
    connected: false,
    simulation: true
  });
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isDataLoading, setIsDataLoading] = useState(true);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    console.log('🔄 Dashboard: Setting up sensor service subscription');
    
    const unsubscribe = sensorService.subscribe((data) => {
      console.log('📊 Dashboard: Received sensor data:', data);
      
      // Update sensor data with actual values from backend
      setSensorData(prevData => {
        const newData = {
          PM25: data.PM25 !== undefined ? data.PM25 : prevData.PM25,
          CO2: data.CO2 !== undefined ? data.CO2 : prevData.CO2,
          TEMPERATURE: data.TEMPERATURE !== undefined ? data.TEMPERATURE : prevData.TEMPERATURE,
          HUMIDITY: data.HUMIDITY !== undefined ? data.HUMIDITY : prevData.HUMIDITY,
          TVOC: data.TVOC !== undefined ? data.TVOC : prevData.TVOC,
          DIFFERENTIAL_PRESSURE: data.DIFFERENTIAL_PRESSURE !== undefined ? data.DIFFERENTIAL_PRESSURE : prevData.DIFFERENTIAL_PRESSURE
        };
        
        console.log('📊 Dashboard: Updated sensor data state:', newData);
        return newData;
      });
      
      // Update connection status
      if (data.connectionStatus) {
        setConnectionStatus(data.connectionStatus);
      }
      
      // Update last update time
      if (data.timestamp) {
        setLastUpdate(new Date(data.timestamp));
      }
      
      // Handle errors
      if (data.error) {
        setError(data.error);
      } else {
        setError(null);
      }
      
      // Mark as loaded
      setIsDataLoading(false);
    });

    // Start monitoring
    console.log('🔄 Dashboard: Starting sensor monitoring');
    sensorService.startMonitoring(5000);

    return () => {
      console.log('🔄 Dashboard: Cleaning up sensor monitoring');
      unsubscribe();
      sensorService.stopMonitoring();
    };
  }, []);

  const handleRefresh = async () => {
    console.log('🔄 Dashboard: Manual refresh requested');
    try {
      await sensorService.refreshData();
    } catch (error) {
      console.error('❌ Dashboard: Refresh failed:', error);
      setError('Failed to refresh data');
    }
  };

  // Helper function to get display value with fallback
  const getDisplayValue = (value, fallback = 0) => {
    if (value === null || value === undefined || isNaN(value)) {
      return fallback;
    }
    return value;
  };

  // Enhanced Status Indicator with meaningful animations
  const EnhancedStatusIndicator = ({ value, sensorType }) => {
    const displayValue = getDisplayValue(value);
    const status = getSensorStatus(sensorType, displayValue);
    
    return (
      <div className="flex items-center gap-2">
        <div 
          className={`h-3 w-3 rounded-full ${status.bgColor} animate-pulse-gentle`}
          style={{ 
            boxShadow: status.shadowColor,
            animation: 'pulse-gentle 3s ease-in-out infinite'
          }}
        />
        {isDataLoading && (
          <span className="text-xs text-white opacity-60">Loading...</span>
        )}
      </div>
    );
  };

  // Professional IAQ Index Display
  const renderIAQCard = () => {
    const currentSensorData = {
      PM25: getDisplayValue(sensorData.PM25, 6.5),
      CO2: getDisplayValue(sensorData.CO2, 725),
      TEMPERATURE: getDisplayValue(sensorData.TEMPERATURE, 25),
      HUMIDITY: getDisplayValue(sensorData.HUMIDITY, 53),
      TVOC: getDisplayValue(sensorData.TVOC, 0.225)
    };
    
    const iaqValue = calculateIAQ(currentSensorData);
    const iaqStatus = getIAQStatus(iaqValue);
    const circumference = 2 * Math.PI * 90;
    const offset = circumference - (iaqValue / 100 * circumference);
    
    return (
      <div className="glass-card relative overflow-hidden row-span-2 flex flex-col h-full">
        <h3 className="text-2xl font-medium mb-4 text-white">Indoor Air Quality</h3>
        
        <div className="flex-grow flex items-center justify-center relative p-4">
          {/* Gentle glowing background effect */}
          <div 
            className={`absolute w-80 h-80 rounded-full bg-gradient-to-r ${iaqStatus.bgColor} opacity-20 blur-3xl transition-all duration-1000 animate-softglow`}
          />
          
          {/* Circular progress indicator */}
          <div className="relative w-80 h-80 flex flex-col items-center justify-center">
            <svg className="w-full h-full" viewBox="0 0 200 200">
              {/* Background circle */}
              <circle 
                cx="100" 
                cy="100" 
                r="90" 
                fill="none" 
                stroke="#FFFFFF" 
                strokeOpacity="0.1"
                strokeWidth="8"
              />
              
              {/* Progress circle with smooth animation */}
              <circle 
                cx="100" 
                cy="100" 
                r="90" 
                fill="none" 
                stroke={iaqStatus.color}
                strokeWidth="8" 
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                transform="rotate(-90 100 100)"
                className="transition-all duration-1000 ease-out"
                style={{
                  filter: `drop-shadow(0 0 8px ${iaqStatus.color}40)`
                }}
              />
            </svg>
            
            {/* Value and status in center */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-7xl font-bold text-white transition-all duration-500">
                {iaqValue}
              </div>
              <div className={`text-2xl font-medium mt-2 ${iaqStatus.textColor} transition-colors duration-500`}>
                {iaqStatus.label}
              </div>
              <div className="mt-4 text-4xl animate-float">
                {iaqStatus.icon}
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-2 text-center">
          <div className={'text-2xl text-white opacity-90'}>
            {iaqStatus.description}
          </div>
        </div>
      </div>
    );
  };

  // Enhanced Thermometer with proper mercury color and scale
  const ThermometerDisplay = ({ value, min = 15, max = 35 }) => {
    const displayValue = getDisplayValue(value, 25);
    const percentage = Math.min(100, Math.max(0, ((displayValue - min) / (max - min)) * 100));
    const status = getSensorStatus('TEMPERATURE', displayValue);
    const range = SENSOR_RANGES.TEMPERATURE;
    
    // Generate scale marks every 5 degrees
    const generateScaleMarks = () => {
      const marks = [];
      const step = 5;
      const startTemp = Math.ceil(min / step) * step;
      const endTemp = Math.floor(max / step) * step;
      
      for (let temp = startTemp; temp <= endTemp; temp += step) {
        const position = ((temp - min) / (max - min)) * 100;
        marks.push({ temp, position: 100 - position }); // Invert for thermometer
      }
      return marks;
    };
    
    const scaleMarks = generateScaleMarks();
    
    return (
      <div className="flex items-center justify-around w-full h-full p-2">
        <div className="relative h-56 w-16">
          {/* Thermometer outer casing */}
          <div className="absolute left-1/2 transform -translate-x-1/2 w-10 h-48 rounded-t-full rounded-b-full bg-gradient-to-r from-gray-200 to-gray-300 overflow-hidden shadow-lg">
            {/* Glass tube */}
            <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-44 top-2 bg-white bg-opacity-30 rounded-t-full rounded-b-full border border-white border-opacity-50">
              {/* Mercury column - classic red/orange mercury color */}
              <div 
                className="absolute bottom-0 w-full rounded-b-full transition-all duration-700 ease-out"
                style={{ 
                  height: `${percentage}%`,
                  background: 'linear-gradient(to top, #DC2626, #EF4444, #F97316)'
                }}
              />
            </div>
          </div>
          
          {/* Mercury bulb at bottom with glow effect */}
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-12 h-12 rounded-full bg-gradient-to-t from-red-700 to-red-500 shadow-lg shadow-red-500 shadow-opacity-50"></div>
          
          {/* Minor scale marks - between major marks */}
          <div className="absolute top-2 bottom-12 left-0 flex flex-col justify-between">
            {Array.from({ length: 21 }).map((_, i) => (
              <div key={i} className="w-2 h-px bg-white bg-opacity-20" />
            ))}
          </div>
          
          {/* Major scale marks every 5 degrees */}
          <div className="absolute top-2 bottom-12 -right-0">
            {scaleMarks.map(({ temp, position }) => (
              <div 
                key={temp}
                className="absolute flex items-center"
                style={{ top: `${position}%`, transform: 'translateY(-50%)' }}
              >
                <div className="w-3 h-px bg-white bg-opacity-80 mr-1" />
                <span className="text-xs text-white">{temp}°</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="text-center w-1/2">
          <span className="text-6xl font-bold text-white transition-all duration-500">
            {displayValue.toFixed(range.decimals)}
          </span>
          <span className="text-3xl text-white ml-2">{range.unit}</span>
          <div className="mt-4 text-2xl text-white">Temperature</div>

          <div className={`mt-4 text-lg px-3 py-1 rounded-full inline-block transition-colors duration-500 ${status.textColor}`}
               style={{ backgroundColor: `${status.color}20` }}>
            {displayValue < range.good.min ? 'Too Cold' : 
             displayValue > range.good.max ? 'Too Hot' : 
             'Comfortable'}
          </div>
        </div>
      </div>
    );
  };

  // Enhanced Humidity Display with water colors
  const HumidityDisplay = ({ value }) => {
    const displayValue = getDisplayValue(value, 53);
    const status = getSensorStatus('HUMIDITY', displayValue);
    const range = SENSOR_RANGES.HUMIDITY;
    
    return (
      <div className="flex items-center justify-around w-full h-full p-2">
        <div className="relative w-40 h-52">
          <svg viewBox="0 0 100 140" className="w-full h-full">
            <defs>
              <linearGradient id="waterDropFill" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0EA5E9" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#0284C7" stopOpacity="0.9" />
              </linearGradient>
              
              <filter id="waterDropGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
                <feOffset dx="0" dy="1" result="offsetblur" />
                <feFlood floodColor="#0EA5E9" floodOpacity="0.3" />
                <feComposite in2="offsetblur" operator="in" />
                <feMerge>
                  <feMergeNode />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Droplet outline */}
            <path 
              d="M50,10 C50,10 0,60 0,100 C0,123 22,140 50,140 C78,140 100,123 100,100 C100,60 50,10 50,10 Z" 
              fill="rgba(255,255,255,0.1)" 
              stroke="rgba(255,255,255,0.3)" 
              strokeWidth="1"
            />

            {/* Subtle water ripples only when meaningful */}
            {displayValue > 50 && (
              <g className="animate-pulse duration-[4000ms]" opacity="0.3">
                <ellipse cx="30" cy="90" rx="8" ry="4" fill="rgba(255,255,255,0.4)" />
                <ellipse cx="70" cy="105" rx="10" ry="5" fill="rgba(255,255,255,0.3)" />
              </g>
            )}

            {/* Water filled part with beautiful blue water color */}
            <path 
              d="M50,10 C50,10 0,60 0,100 C0,123 22,140 50,140 C78,140 100,123 100,100 C100,60 50,10 50,10 Z" 
              fill="url(#waterDropFill)" 
              filter="url(#waterDropGlow)"
              className="transition-all duration-700 ease-out"
              style={{ 
                clipPath: `polygon(0% ${100 - displayValue}%, 100% ${100 - displayValue}%, 100% 100%, 0% 100%)`
              }}
            />

            {/* Clean scale markings */}
            <g stroke="rgba(255,255,255,0.6)" strokeWidth="1">
              <line x1="10" y1="40" x2="18" y2="40" />
              <line x1="10" y1="70" x2="18" y2="70" />
              <line x1="10" y1="100" x2="18" y2="100" />
              <line x1="10" y1="130" x2="18" y2="130" />
              <text x="22" y="44" fill="rgba(255,255,255,0.7)" fontSize="9">75%</text>
              <text x="22" y="74" fill="rgba(255,255,255,0.7)" fontSize="9">50%</text>
              <text x="22" y="104" fill="rgba(255,255,255,0.7)" fontSize="9">25%</text>
              <text x="22" y="134" fill="rgba(255,255,255,0.7)" fontSize="9">0%</text>
            </g>
          </svg>
        </div>
        
        <div className="text-center w-1/2">
          <div className="text-5xl font-bold text-white transition-all duration-500">
            {displayValue.toFixed(range.decimals)} {range.unit}
          </div>
          <div className="mt-4 text-2xl text-white">Humidity</div>
          
          {/* Enhanced comfort indicator */}
          <div className="mt-4 relative h-3 bg-gray-700 rounded-full overflow-hidden w-full">
            <div className="absolute inset-0 flex">
              <div className="w-1/3 h-full bg-blue-500"></div>
              <div className="w-1/3 h-full bg-green-500"></div>
              <div className="w-1/3 h-full bg-red-500"></div>
            </div>
            <div 
              className="absolute top-0 w-4 h-4 bg-white rounded-full transform -translate-y-1/4 shadow-lg transition-all duration-700 ease-out"
              style={{ left: `calc(${Math.min(100, Math.max(0, displayValue))}% - 8px)` }}
            />
          </div>
          <div className="flex justify-between text-base text-white text-opacity-60 mt-1">
            <span>Dry</span>
            <span>Optimal</span>
            <span>Humid</span>
          </div>
        </div>
      </div>
    );
  };

  // Enhanced Circular Gauge with proper alignment
  const CircularGauge = ({ value, sensorType, title, icon, min = 0, max = 1000 }) => {
    const displayValue = getDisplayValue(value, min + (max - min) / 2);
    const percentage = Math.min(100, Math.max(0, ((displayValue - min) / (max - min)) * 100));
    const circumference = 2 * Math.PI * 60;
    const offset = circumference - (percentage / 100 * circumference);
    const status = getSensorStatus(sensorType, displayValue);
    const range = SENSOR_RANGES[sensorType];
    
    return (
      <div className="flex flex-col items-center justify-center w-full h-full p-2">
        <div className="relative w-full h-full max-w-60 max-h-60">
          <svg viewBox="0 0 180 180" className="w-full h-full">
            <defs>
              <filter id={`glow-${title}`} x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
                <feOffset dx="0" dy="0" result="offsetblur"/>
                <feFlood floodColor={status.color} floodOpacity="0.4"/>
                <feComposite in2="offsetblur" operator="in"/>
                <feMerge>
                  <feMergeNode/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            
            {/* Background circle */}
            <circle 
              cx="90" 
              cy="90" 
              r="80" 
              fill="none" 
              stroke="#FFFFFF" 
              strokeOpacity="0.08"
              strokeWidth="12"
            />
            
            {/* Value track with smooth transitions */}
            <circle 
              cx="90" 
              cy="90" 
              r="80" 
              fill="none" 
              stroke={status.color}
              strokeWidth="10" 
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              transform="rotate(-90 90 90)"
              className="transition-all duration-1000 ease-out"
              filter={`url(#glow-${title})`}
            />
            
            {/* Center area */}
            <circle 
              cx="90" 
              cy="90" 
              r="65" 
              fill="rgba(0,0,0,0.2)"
              stroke={status.color}
              strokeWidth="1.5"
              strokeOpacity="0.3"
              className='animate-scale-center duration-500'
            />
            
            {/* Properly centered icon */}
            <g transform="translate(90, 75)">
              <g transform="translate(-25, -25) scale(1)">
                {icon}
              </g>
            </g>
            
            {/* Properly centered value display */}
            <text 
              x="90" 
              y="120" 
              textAnchor="middle" 
              fill="white" 
              fontSize="18" 
              fontWeight="bold"
              className="transition-all duration-500"
            >
              {displayValue.toFixed(range.decimals)}
            </text>
            <text 
              x="90" 
              y="135" 
              textAnchor="middle" 
              fill="white" 
              fontSize="11"
              fillOpacity="0.7"
            >
              {range.unit}
            </text>
          </svg>
        </div>
        <div className="text-center mt-2 text-xl text-white font-medium">{title}</div>
        <div 
          className={`text-base px-2 py-1 rounded-full mt-1 text-white transition-all duration-500`}
          style={{ backgroundColor: `${status.color}20` }}
        >
          {status === STATUS_COLORS.GOOD ? 'GOOD' : 
           status === STATUS_COLORS.WARNING ? 'WARNING' : 'DANGER'}
        </div>
      </div>
    );
  };

  // Enhanced Weather Card
  const WeatherCard = () => (
    <div className="flex flex-col h-full">
      <h3 className="text-2xl font-medium mb-3 text-white">{WEATHER_CONFIG.location}</h3>
      <div className="flex-grow flex items-center justify-center p-2">
        <div className="text-center w-full">
          {/* Weather icon */}
          <div className="mb-2 relative">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" className="h-20 w-20 mx-auto animate-glow">
              <defs>
                <radialGradient id="sunGradient" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#FFD700" />
                  <stop offset="90%" stopColor="#FFA500" />
                </radialGradient>
              </defs>
              <circle cx="32" cy="32" r="14" fill="url(#sunGradient)" />
              <g stroke="#FFA500" strokeWidth="2" strokeLinecap="round">
                <line x1="32" y1="8" x2="32" y2="4" />
                <line x1="32" y1="60" x2="32" y2="56" />
                <line x1="8" y1="32" x2="4" y2="32" />
                <line x1="60" y1="32" x2="56" y2="32" />
                <line x1="16" y1="16" x2="12" y2="12" />
                <line x1="48" y1="48" x2="52" y2="52" />
                <line x1="16" y1="48" x2="12" y2="52" />
                <line x1="48" y1="16" x2="52" y2="12" />
              </g>
            </svg>
          </div>
          <div className="text-4xl font-bold text-white mb-1 flex items-center justify-center">
            {WEATHER_CONFIG.defaultTemperature}<span className="text-2xl ml-1">°C</span>
          </div>
          <div className="text-2xl text-yellow-400 mb-2 ">{WEATHER_CONFIG.defaultCondition}</div>
          <div className="text-xl text-white opacity-75 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L6 8c-3 3-3 8 0 12h12c3-4 3-9 0-12L12 2z" />
            </svg>
            <span>{WEATHER_CONFIG.defaultHumidity}% Humidity</span>
          </div>
        </div>
      </div>
    </div>
  );

  // Realistic Pressure Gauge with proper number scaling
  const PressureGauge = ({ value, min = 0, max = 10 }) => {
    const displayValue = getDisplayValue(value, 1.75);
    const clampedValue = Math.max(min, Math.min(max, displayValue));
    const valueRange = max - min;
    const normalizedValue = (clampedValue - min) / valueRange;
    const needleAngle = -45 + (normalizedValue * 270); // -45° to +135° (270° total)
    const status = getSensorStatus('DIFFERENTIAL_PRESSURE', displayValue);
    
    // Generate scale numbers (0, 2, 4, 6, 8, 10)
    const generateScaleNumbers = () => {
      const numbers = [];
      for (let i = 0; i <= 5; i++) {
        const val = (max / 5) * i;
        const angle = -135 + (i * 54); // 270° / 5 = 54° per step
        const radian = (angle * Math.PI) / 180;
        const x = 100 + 65 * Math.cos(radian);
        const y = 100 + 65 * Math.sin(radian);
        numbers.push({ value: val, x, y, angle });
      }
      return numbers;
    };
    
    const scaleNumbers = generateScaleNumbers();
    
    return (
      <div className="flex flex-col items-center justify-center w-full h-full p-2">
        <div className="relative w-64 h-64">
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <defs>
              <linearGradient id="gaugeRim" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#6B7280" />
                <stop offset="50%" stopColor="#9CA3AF" />
                <stop offset="100%" stopColor="#4B5563" />
              </linearGradient>
              <radialGradient id="gaugeFace" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#1F2937" />
                <stop offset="100%" stopColor="#111827" />
              </radialGradient>
              <linearGradient id="needleGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={status.color} />
                <stop offset="100%" stopColor="#DC2626" />
              </linearGradient>
            </defs>
            
            {/* Outer rim */}
            <circle cx="100" cy="100" r="95" fill="url(#gaugeRim)" stroke="#374151" strokeWidth="2" />
            
            {/* Gauge face */}
            <circle cx="100" cy="100" r="85" fill="url(#gaugeFace)" stroke="#4B5563" strokeWidth="1" />
            
            {/* Major tick marks and numbers */}
            {scaleNumbers.map(({ value, x, y, angle }, i) => {
              const tickAngle = angle;
              const x1 = 100 + 75 * Math.cos(tickAngle * Math.PI / 180);
              const y1 = 100 + 75 * Math.sin(tickAngle * Math.PI / 180);
              const x2 = 100 + 82 * Math.cos(tickAngle * Math.PI / 180);
              const y2 = 100 + 82 * Math.sin(tickAngle * Math.PI / 180);
              
              return (
                <g key={i}>
                  <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="white" strokeWidth="2" />
                  <text 
                    x={x} 
                    y={y + 4} 
                    textAnchor="middle" 
                    dominantBaseline="middle" 
                    fill="white" 
                    fontSize="12"
                    fontWeight="bold"
                  >
                    {value.toFixed(0)}
                  </text>
                </g>
              );
            })}
            
            {/* Minor tick marks */}
            {Array.from({ length: 21 }).map((_, i) => {
              if (i % 4 === 0) return null; // Skip major ticks
              const tickAngle = -135 + i * 13.5; // 270° / 20 = 13.5° per tick
              const x1 = 100 + 78 * Math.cos(tickAngle * Math.PI / 180);
              const y1 = 100 + 78 * Math.sin(tickAngle * Math.PI / 180);
              const x2 = 100 + 82 * Math.cos(tickAngle * Math.PI / 180);
              const y2 = 100 + 82 * Math.sin(tickAngle * Math.PI / 180);
              
              return (
                <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="white" strokeWidth="1" strokeOpacity="0.6" />
              );
            })}
            
            {/* Center hub */}
            <circle cx="100" cy="100" r="8" fill="url(#gaugeRim)" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
            
            {/* Needle with realistic design */}
            <g transform={`rotate(${needleAngle}, 100, 100)`}>
              <polygon 
                points="100,30 102,100 100,105 98,100" 
                fill="url(#needleGradient)" 
                stroke="#000000" 
                strokeWidth="0.5"
                className="transition-transform duration-1000 ease-out"
              />
            </g>
            
            <circle cx="100" cy="100" r="4" fill={status.color} stroke="#000000" strokeWidth="1" />
            
            {/* Value display at bottom */}
            <text x="105" y="140" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">
              {clampedValue.toFixed(2)} Pa
            </text>
            
            {/* Status color arc at top */}
            <path 
              d="M 30 100 A 70 70 0 0 1 170 100" 
              fill="none" 
              stroke={status.color} 
              strokeWidth="3" 
              strokeOpacity="0.3"
            />
          </svg>
        </div>
        <div className="text-center mt-2 text-xl text-white">Differential Pressure</div>
      </div>
    );
  };

  // Building Page Component with PNG background support
  const BuildingPage = () => {
    return (
      <div className="h-screen w-screen flex flex-col relative overflow-hidden">
        {/* Background with PNG or placeholder */}
        <div className="fixed inset-0 z-0">
          {buildingOverviewImage ? (
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat" 
              style={{ 
                backgroundImage: `url(${buildingOverviewImage})`,
                filter: 'brightness(0.8)'
              }} 
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-800 via-gray-900 to-black flex items-center justify-center">
              <div className="text-center text-white">
                <div className="text-6xl mb-4">🏢</div>
                <h1 className="text-4xl font-bold mb-2">Building Overview</h1>
                <p className="text-xl opacity-75 mb-4">Add PNG background image at:</p>
                <div className="bg-gray-800 bg-opacity-50 p-4 rounded-lg mb-6">
                  <code className="text-sm text-cyan-300">
                    /src/assets/building-overview.png
                  </code>
                  <br />
                  <code className="text-sm text-cyan-300">
                    /src/assets/building-overview.jpg
                  </code>
                </div>
                <div className="mt-8 p-8 border-2 border-dashed border-white border-opacity-30 rounded-lg max-w-md">
                  <p className="text-lg">Drop PNG/JPG file here</p>
                  <p className="text-sm opacity-60 mt-2">1920x1080 recommended</p>
                  <p className="text-xs opacity-40 mt-2">Supports: .png, .jpg, .jpeg</p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Header with back button */}
        <header className="relative z-10 flex flex-wrap justify-between items-center mb-4 md:mb-6 bg-white bg-opacity-10 backdrop-blur-[2px] rounded-2xl p-3 border border-white border-opacity-30 shadow-lg m-4">
          <div className="flex items-center">
            <img src={daikinLogo} alt="DAIKIN" className="h-10 w-auto" />
          </div>
          
          <div className="text-center flex items-center justify-center space-x-6">
            <div className="text-lg md:text-xl font-light text-white">Building Overview</div>
          </div>
          
          <div className="flex gap-4">
            <button 
              onClick={() => setCurrentPage('dashboard')}
              className="p-2 rounded-full bg-white bg-opacity-30 shadow-lg hover:bg-opacity-40 transition-all"
              title="Back to Dashboard"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
          </div>
        </header>
      </div>
    );
  };

  // Show loading state when data is not yet available
  if (isDataLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <h2 className="text-2xl font-bold mb-2">Loading Sensor Data...</h2>
          <p className="text-lg opacity-75">Connecting to backend server</p>
          {error && (
            <div className="mt-4 p-4 bg-red-900 bg-opacity-50 rounded-lg">
              <p className="text-red-300">Error: {error}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Main render logic
  if (currentPage === 'building') {
    return <BuildingPage />;
  }

  return (
    <div className="h-screen w-screen flex flex-col relative overflow-hidden">
      {/* Background room image */}
      <div className="fixed inset-0 z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center" 
          style={{ 
            backgroundImage: `url(${backgroundImage})`,
            filter: 'brightness(0.6)'
          }} 
        />
        
        {/* Subtle ambient lighting */}
        <div className="fixed inset-0 overflow-hidden z-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-cyan-500 bg-opacity-5 blur-3xl animate-pulse-gentle"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-blue-500 bg-opacity-5 blur-3xl animate-pulse-gentle" style={{ animationDelay: '1s' }}></div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="relative z-10 flex-1 flex flex-col p-4 md:p-6">
        {/* Header */}
        <header className="flex flex-wrap justify-between items-center mb-4 md:mb-6 bg-white bg-opacity-10 backdrop-blur-[2px] rounded-2xl p-3 border border-white border-opacity-30 shadow-lg">
          <div className="flex items-center">
            <img src={daikinLogo} alt="DAIKIN" className="h-10 w-auto" />
          </div>
          <div className="text-xl font-medium text-white">
            Indoor Air Quality Dashboard
          </div>
          
          <div className="flex gap-4">
            <button className="p-2 rounded-full bg-white bg-opacity-30 shadow-lg hover:bg-opacity-40 transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </button>
            <button 
              onClick={() => setCurrentPage('building')}
              className="p-2 rounded-full bg-white bg-opacity-10 hover:bg-white hover:bg-opacity-20 transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </button>
            <button className="p-2 rounded-full bg-white bg-opacity-10 hover:bg-white hover:bg-opacity-20 transition-all" onClick={handleRefresh}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </header>
        
        {/* Main Dashboard Grid */}
        <main className="flex-grow" style={{ height: `calc(100vh - 160px)` }}>
          <div className="h-full grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-4 lg:gap-7 xl:gap-7">
            {/* IAQ Index Card - 1x2 vertical */}
            <div className="row-span-2 row-start-1">
              {renderIAQCard()}
            </div>
            
            {/* Temperature Card */}
            <div className="glass-card overflow-hidden flex flex-col row-span-1 row-start-1">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-medium text-white">Temperature</h3>
                <EnhancedStatusIndicator value={sensorData.TEMPERATURE} sensorType="TEMPERATURE" />
              </div>
              <div className="flex-grow">
                <ThermometerDisplay value={sensorData.TEMPERATURE} />
              </div>
            </div>
            
            {/* Humidity Card */}
            <div className="glass-card overflow-hidden flex flex-col row-span-1 row-start-1">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-2xl font-medium text-white">Humidity</h3>
                <EnhancedStatusIndicator value={sensorData.HUMIDITY} sensorType="HUMIDITY" />
              </div>
              <div className="flex-grow">
                <HumidityDisplay value={sensorData.HUMIDITY} />
              </div>
            </div>
            
            {/* CO2 Card */}
            <div className="glass-card overflow-hidden flex flex-col row-span-1 row-start-2">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-2xl font-medium text-white">Carbon Dioxide</h3>
                <EnhancedStatusIndicator value={sensorData.CO2} sensorType="CO2" />
              </div>
              <div className="flex-grow">
                <CircularGauge 
                  value={sensorData.CO2} 
                  sensorType="CO2"
                  title="CO₂"
                  min={300}
                  max={1500}
                  icon={
                    <svg width="50" height="50" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M5 12C5 10.3431 6.34315 9 8 9H9C10.6569 9 12 10.3431 12 12C12 13.6569 10.6569 15 9 15H8C6.34315 15 5 13.6569 5 12Z" stroke="white" strokeWidth="1.5"/>
                      <path d="M12 7C12 5.34315 13.3431 4 15 4H16C17.6569 4 19 5.34315 19 7C19 8.65685 17.6569 10 16 10H15" stroke="white" strokeWidth="1.5"/>
                      <path d="M12 17C12 18.6569 13.3431 20 15 20H16C17.6569 20 19 18.6569 19 17C19 15.3431 17.6569 14 16 14H15" stroke="white" strokeWidth="1.5"/>
                      <circle cx="7" cy="5" r="1" fill="white"/>
                      <circle cx="17" cy="12" r="1" fill="white"/>
                      <circle cx="7" cy="19" r="1" fill="white"/>
                    </svg>
                  }
                />
              </div>
            </div>
            
            {/* PM2.5 Card */}
            <div className="glass-card overflow-hidden flex flex-col row-span-1 row-start-2">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-2xl font-medium text-white">Particulate Matter</h3>
                <EnhancedStatusIndicator value={sensorData.PM25} sensorType="PM25" />
              </div>
              <div className="flex-grow">
                <CircularGauge 
                  value={sensorData.PM25} 
                  sensorType="PM25"
                  title="PM2.5"
                  min={0}
                  max={100}
                  icon={
                    <svg width="50" height="50" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4Z" stroke="white" strokeWidth="1.5"/>
                      <circle cx="15" cy="9" r="1" fill="white"/>
                      <circle cx="9" cy="9" r="1" fill="white"/>
                      <circle cx="15" cy="15" r="1" fill="white"/>
                      <circle cx="9" cy="15" r="1" fill="white"/>
                      <circle cx="12" cy="12" r="1.5" fill="white"/>
                      <circle cx="12" cy="7" r="0.5" fill="white"/>
                      <circle cx="12" cy="17" r="0.5" fill="white"/>
                    </svg>
                  }
                />
              </div>
            </div>
            
            {/* Weather Card - Bottom Left Position */}
            <div className="glass-card overflow-hidden flex flex-col row-span-1 row-start-3">
              <WeatherCard />
            </div>
            
            {/* TVOC Card */}
            <div className="glass-card overflow-hidden flex flex-col row-span-1 row-start-3">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-2xl font-medium text-white">Volatile Compounds</h3>
                <EnhancedStatusIndicator value={sensorData.TVOC} sensorType="TVOC" />
              </div>
              <div className="flex-grow">
                <CircularGauge 
                  value={sensorData.TVOC} 
                  sensorType="TVOC"
                  title="TVOC"
                  min={0}
                  max={5}
                  icon={
                    <svg width="50" height="50" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M19.7 10.7C18.5 9.5 16.7 9.9 15 11.7C13.5 13.2 11.3 13.3 9.9 12.1C8.5 10.9 8.3 8.7 9.6 7C10.9 5.3 11 3.5 9.5 2.5C8 1.5 5.2 2 3.9 4.5C2.6 7 3.1 11.3 5.8 13.8C8.5 16.3 13 16.5 15.8 15C18.6 13.5 20.9 11.9 19.7 10.7Z" stroke="white" strokeWidth="1.5"/>
                      <path d="M10 10L11 8H14L15 10L14 12H11L10 10Z" fill="white" opacity="0.5"/>
                      <path d="M7 14L8 12H11L12 14L11 16H8L7 14Z" fill="white" opacity="0.5"/>
                    </svg>
                  }
                />
              </div>
            </div>
            
            {/* Differential Pressure Card */}
            <div className="glass-card overflow-hidden flex flex-col row-span-1 row-start-3">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-2xl font-medium text-white">Differential Pressure</h3>
                <EnhancedStatusIndicator value={sensorData.DIFFERENTIAL_PRESSURE} sensorType="DIFFERENTIAL_PRESSURE" />
              </div>
              <div className="flex-grow">
                <PressureGauge value={sensorData.DIFFERENTIAL_PRESSURE} />
              </div>
            </div>
          </div>
        </main>
        
        {/* Footer */}
        <footer className="mt-3 md:mt-3 flex justify-between items-center text-white text-sm bg-zinc-600 bg-opacity-20 backdrop-blur-sm rounded-xl p-2 border border-white border-opacity-20">
          <div>
            <span className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-green-400 animate-pulse-gentle" viewBox="0 0 20 20" fill="currentColor">
                <circle cx="10" cy="10" r="10" />
              </svg>
              Last updated: {lastUpdate.toLocaleTimeString()}
              {connectionStatus.simulation && (
                <span className="ml-2 px-2 py-1 bg-blue-500 bg-opacity-30 rounded text-xs">
                  SIMULATION
                </span>
              )}
            </span>
          </div>
          <div>© Siam Daikin Sales Co., Ltd.</div>
        </footer>
      </div>
    </div>
  );
};

export default Dashboard;
