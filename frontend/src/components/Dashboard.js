import React, { useState, useEffect, useRef, useCallback } from 'react';
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

// PREMIUM: Enhanced color scheme for sensors
const PREMIUM_COLORS = {
  IAQ: { GOOD: '#00FF9C', WARNING: '#FFD700', DANGER: '#FF4D4D' },
  CO2: { GOOD: '#00FFCC', WARNING: '#FFAA00', DANGER: '#FF2C2C' },
  PM25: { GOOD: '#00FFCC', WARNING: '#FFAA00', DANGER: '#FF2C2C' },
  TEMPERATURE: { GOOD: '#3E92CC', WARNING: '#FFA500', DANGER: '#FF6B6B' },
  HUMIDITY: { GOOD: '#00D5FF', WARNING: '#FCE83A', DANGER: '#FF4D4D' },
  TVOC: { GOOD: '#00FFCC', WARNING: '#FFAA00', DANGER: '#FF2C2C' },
  DIFFERENTIAL_PRESSURE: { GOOD: '#8D99AE', WARNING: '#FFD166', DANGER: '#EF476F' }
};

// Get dynamic color based on sensor status
const getPremiumColor = (sensorType, value) => {
  const status = getSensorStatus(sensorType, value);
  const colors = PREMIUM_COLORS[sensorType] || PREMIUM_COLORS.CO2;
  
  if (status === STATUS_COLORS.GOOD) return colors.GOOD;
  if (status === STATUS_COLORS.WARNING) return colors.WARNING;
  return colors.DANGER;
};

const getTempStatusAndColor = (value, range) => {
  if (value < range.good.min) {
    return { status: 'Too Cold', color: '#3E92CC' };
  } else if (value > range.good.max) {
    return { status: 'Too Hot', color: '#FF3B3B' };
  } else {
    return { status: 'Comfortable', color: '#00FFCC' };
  }
};



// Enhanced smooth transition hook
const useSmoothTransition = (targetValue, duration = 1500) => {
  const [currentValue, setCurrentValue] = useState(targetValue || 0);
  const animationRef = useRef(null);
  const startValueRef = useRef(targetValue || 0);
  const startTimeRef = useRef(null);
  const lastTargetRef = useRef(targetValue);

  useEffect(() => {
    if (targetValue === null || targetValue === undefined) return;
    if (Math.abs(targetValue - currentValue) < 0.01) return;
    if (lastTargetRef.current === targetValue) return;

    lastTargetRef.current = targetValue;
    startValueRef.current = currentValue;
    startTimeRef.current = Date.now();

    const animate = () => {
      if (!startTimeRef.current) return;
      
      const elapsed = Date.now() - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const newValue = startValueRef.current + (targetValue - startValueRef.current) * easeOutQuart;
      
      setCurrentValue(newValue);
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        animationRef.current = null;
        startTimeRef.current = null;
      }
    };

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      startTimeRef.current = null;
    };
  }, [targetValue, duration]);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return currentValue;
};

const Dashboard = () => {
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

  const subscriptionRef = useRef(null);
  const lastUpdateTimeRef = useRef(0);

  const getDisplayValue = (value, fallback = 0) => {
    if (value === null || value === undefined || isNaN(value)) {
      return fallback;
    }
    return value;
  };

  // Create smooth values with different durations
  const smoothPM25 = useSmoothTransition(getDisplayValue(sensorData.PM25, 16.5), 1200);
  const smoothCO2 = useSmoothTransition(getDisplayValue(sensorData.CO2, 725), 1400);
  const smoothTemperature = useSmoothTransition(getDisplayValue(sensorData.TEMPERATURE, 25), 1600);
  const smoothHumidity = useSmoothTransition(getDisplayValue(sensorData.HUMIDITY, 53), 1800);
  const smoothTVOC = useSmoothTransition(getDisplayValue(sensorData.TVOC, 0.225), 1300);
  const smoothPressure = useSmoothTransition(getDisplayValue(sensorData.DIFFERENTIAL_PRESSURE, 2.1), 1500);

  // Calculate smooth IAQ
  const currentSensorData = {
    PM25: smoothPM25,
    CO2: smoothCO2,
    TEMPERATURE: smoothTemperature,
    HUMIDITY: smoothHumidity,
    TVOC: smoothTVOC
  };
  const iaqValue = calculateIAQ(currentSensorData);
  const smoothIAQ = useSmoothTransition(iaqValue, 2000);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSensorUpdate = useCallback((data) => {
    const now = Date.now();
    
    if (now - lastUpdateTimeRef.current < 1000) {
      console.log('⏭️ Dashboard: Throttling update (too frequent)');
      return;
    }
    
    lastUpdateTimeRef.current = now;
    console.log('📊 Dashboard: Processing sensor data update:', data);
    
    setSensorData(prevData => {
      const hasChanges = 
        data.PM25 !== prevData.PM25 ||
        data.CO2 !== prevData.CO2 ||
        data.TEMPERATURE !== prevData.TEMPERATURE ||
        data.HUMIDITY !== prevData.HUMIDITY ||
        data.TVOC !== prevData.TVOC ||
        data.DIFFERENTIAL_PRESSURE !== prevData.DIFFERENTIAL_PRESSURE;
      
      if (!hasChanges) {
        console.log('📊 Dashboard: No sensor value changes, skipping update');
        return prevData;
      }
      
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
    
    if (data.connectionStatus) {
      setConnectionStatus(prevStatus => {
        if (prevStatus.connected !== data.connectionStatus.connected || 
            prevStatus.simulation !== data.connectionStatus.simulation) {
          return data.connectionStatus;
        }
        return prevStatus;
      });
    }
    
    if (data.timestamp) {
      setLastUpdate(new Date(data.timestamp));
    }
    
    if (data.error) {
      setError(data.error);
    } else {
      setError(null);
    }
    
    setIsDataLoading(false);
  }, []);

  useEffect(() => {
    console.log('🔄 Dashboard: Setting up sensor service subscription');
    
    if (subscriptionRef.current) {
      console.log('⚠️ Dashboard: Subscription already exists, skipping');
      return;
    }
    
    const unsubscribe = sensorService.subscribe(handleSensorUpdate);
    subscriptionRef.current = unsubscribe;
    
    console.log('🔄 Dashboard: Starting sensor monitoring');
    sensorService.startMonitoring(5000);

    return () => {
      console.log('🔄 Dashboard: Cleaning up sensor monitoring');
      if (subscriptionRef.current) {
        subscriptionRef.current();
        subscriptionRef.current = null;
      }
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

  // PREMIUM: Enhanced Pill Badge Status Indicator
  const PremiumStatusBadge = ({ value, sensorType }) => {
      const displayValue = getDisplayValue(value);
      const range = SENSOR_RANGES[sensorType];

      let color, statusText;

      if (sensorType === 'HUMIDITY') {
        if (displayValue < range.good.min) {
          color = '#C97C5D'; // Brownish bright
          statusText = 'Too Dry';
        } else if (displayValue > range.good.max) {
          color = '#FF3B3B'; // Red
          statusText = 'Too Damp';
        } else {
          color = '#00FFCC'; // Green
          statusText = 'Comfortable';
        }
      } else {
        const status = getSensorStatus(sensorType, displayValue);
        color = getPremiumColor(sensorType, displayValue);
        statusText = status === STATUS_COLORS.GOOD
          ? 'EXCELLENT'
          : status === STATUS_COLORS.WARNING
            ? 'WARNING'
            : 'CRITICAL';
      }

      return (
        <div 
          className="px-4 py-2 rounded-full text-lg font-extrabold text-white relative overflow-hidden transition-all duration-500"
          style={{ 
            background: `linear-gradient(135deg, ${color}40, ${color}20)`,
            border: `1px solid ${color}60`,
            boxShadow: `0 0 20px ${color}40, inset 0 1px 0 rgba(255,255,255,0.2)`,
            textShadow: '0 1px 2px rgba(0,0,0,0.8)'
          }}
        >
          <div 
            className="absolute inset-0 opacity-30"
            style={{
              background: `linear-gradient(45deg, transparent, ${color}30, transparent)`,
              animation: 'shimmer 3s ease-in-out infinite'
            }}
          />
          <span className="relative z-10">{statusText}</span>
        </div>
      );
    };


  // Professional IAQ Index Display
  const renderIAQCard = () => {
    const color = getPremiumColor('IAQ', smoothIAQ);
    const iaqStatus = getIAQStatus(smoothIAQ);
    const circumference = 2 * Math.PI * 90;
    const offset = circumference - (smoothIAQ / 100 * circumference);
    
    return (
      <div className="glass-card relative overflow-hidden row-span-2 flex flex-col h-full" style={{ animation: 'float 6s ease-in-out infinite' }}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-3xl font-extrabold text-white" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.7)' }}>
            Indoor Air Quality
          </h3>
          <PremiumStatusBadge value={smoothIAQ} sensorType="IAQ" />
        </div>
        
        <div className="flex-grow flex items-center justify-center relative p-4">
          <div 
            className="absolute w-80 h-80 rounded-full blur-3xl opacity-30"
            style={{
              background: `radial-gradient(circle, ${color}60, ${color}20, transparent)`,
              animation: 'pulse-glow 4s ease-in-out infinite'
            }}
          />
          
          <div className="relative w-80 h-80 flex flex-col items-center justify-center">
            <svg className="w-full h-full" viewBox="0 0 200 200">
              <defs>
                <linearGradient id="iaqGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={color} stopOpacity="0.8" />
                  <stop offset="100%" stopColor={color} stopOpacity="0.4" />
                </linearGradient>
                <filter id="iaqGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur in="SourceAlpha" stdDeviation="4"/>
                  <feOffset dx="0" dy="0" result="offsetblur"/>
                  <feFlood floodColor={color} floodOpacity="0.6"/>
                  <feComposite in2="offsetblur" operator="in"/>
                  <feMerge>
                    <feMergeNode/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              
              <circle 
                cx="100" 
                cy="100" 
                r="90" 
                fill="none" 
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="8"
              />
              
              <circle 
                cx="100" 
                cy="100" 
                r="90" 
                fill="none" 
                stroke="url(#iaqGradient)"
                strokeWidth="10" 
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                transform="rotate(-90 100 100)"
                filter="url(#iaqGlow)"
                style={{
                  transition: 'stroke-dashoffset 1.5s ease-out'
                }}
              />
            </svg>
            
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div 
                className="text-6xl font-extrabold text-white mb-2"
                style={{ 
                  textShadow: `0 0 30px ${color}80, 0 4px 8px rgba(0,0,0,0.8)`,
                  animation: 'value-glow 3s ease-in-out infinite'
                }}
              >
                {Math.round(smoothIAQ)}
              </div>
              <div 
                className="text-3xl font-bold mt-2"
                style={{ 
                  color: color,
                  textShadow: '0 2px 4px rgba(0,0,0,0.8)'
                }}
              >
                {iaqStatus.label}
              </div>
              <div className="mt-4 text-5xl" style={{ animation: 'float-icon 4s ease-in-out infinite' }}>
                {iaqStatus.icon}
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-2 text-center">
          <div className="text-2xl text-white opacity-90 font-medium" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
            {iaqStatus.description}
          </div>
        </div>
      </div>
    );
  };

  // Enhanced Thermometer Display
  const ThermometerDisplay = ({ value, min = 15, max = 35 }) => {
    const displayValue = smoothTemperature;
    const percentage = Math.min(100, Math.max(0, ((displayValue - min) / (max - min)) * 100));
    const color = '#FF3B3B';
    const range = SENSOR_RANGES.TEMPERATURE;
    const tempindicolor = getTempStatusAndColor(displayValue, range);
    const generateScaleMarks = () => {
      const marks = [];
      const step = 5;
      const startTemp = Math.ceil(min / step) * step;
      const endTemp = Math.floor(max / step) * step;
      
      for (let temp = startTemp; temp <= endTemp; temp += step) {
        const position = ((temp - min) / (max - min)) * 100;
        marks.push({ temp, position: 100 - position });
      }
      return marks;
    };
    
    const scaleMarks = generateScaleMarks();
    
    return (
      <div className="flex items-center justify-around w-full h-full p-2">
        <div className="relative h-56 w-16">
          <div className="absolute left-1/2 transform -translate-x-1/2 w-10 h-48 rounded-t-full rounded-b-full bg-gradient-to-r from-gray-200 to-gray-300 overflow-hidden shadow-lg">
            <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-44 top-2 bg-white bg-opacity-30 rounded-t-full rounded-b-full border border-white border-opacity-50">
              <div 
                className="absolute bottom-0 w-full rounded-b-full"
                style={{ 
                  height: `${percentage}%`,
                  background: `linear-gradient(to top, ${color}, ${color}80)`,
                  transition: 'height 0.8s ease-out',
                  boxShadow: `0 0 10px ${color}60`
                }}
              />
            </div>
          </div>
          
          <div 
            className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-12 h-12 rounded-full shadow-lg"
            style={{
              background: `radial-gradient(circle, ${color}, ${color}80)`,
              boxShadow: `0 0 20px ${color}60`
            }}
          />
          
          <div className="absolute top-2 bottom-12 left-0 flex flex-col justify-between">
            {Array.from({ length: 21 }).map((_, i) => (
              <div key={i} className="w-2 h-px bg-white bg-opacity-20" />
            ))}
          </div>
          
          <div className="absolute top-2 bottom-12 -right-0">
            {scaleMarks.map(({ temp, position }) => (
              <div 
                key={temp}
                className="absolute flex items-center"
                style={{ top: `${position}%`, transform: 'translateY(-50%)' }}
              >
                <div className="w-3 h-px bg-white bg-opacity-80 mr-1" />
                <span className="text-xs text-white font-bold">{temp}°</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="text-center w-1/2">
          <span 
            className="text-7xl font-extrabold text-white"
            style={{ 
              textShadow: `0 0 20px ${tempindicolor.color}80, 0 4px 8px rgba(0,0,0,0.8)`,
              transition: 'all 0.5s ease-out'
            }}
          >
            {displayValue.toFixed(range.decimals)}
          </span>
          <span className="text-4xl text-white ml-2 font-bold">{range.unit}</span>
          <div className="mt-4 text-3xl text-white font-bold" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
            Temperature
          </div>

          <div 
            className="mt-4 text-xl px-4 py-2 rounded-full inline-block font-extrabold text-white transition-all duration-500"
            style={{ 
              background: `linear-gradient(135deg, ${tempindicolor.color}40, ${tempindicolor.color}20)`,
              border: `1px solid ${tempindicolor.color}60`,
              boxShadow: `0 0 15px ${tempindicolor.color}40`,
              textShadow: '0 1px 2px rgba(0,0,0,0.8)'
            }}
          >
            {tempindicolor.status}
          </div>
        </div>
      </div>
    );
  };

  // Enhanced Humidity Display
  const HumidityDisplay = ({ value }) => {
    const displayValue = smoothHumidity;
    const color = getPremiumColor('HUMIDITY', displayValue);
    const range = SENSOR_RANGES.HUMIDITY;
    
    return (
      <div className="flex items-center justify-around w-full h-full p-2">
        <div className="relative w-40 h-52">
          <svg viewBox="0 0 100 140" className="w-full h-full">
            <defs>
              <linearGradient id="premiumWaterFill" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={color} stopOpacity="0.9" />
                <stop offset="100%" stopColor={color} stopOpacity="0.6" />
              </linearGradient>
              
              <filter id="premiumWaterGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
                <feOffset dx="0" dy="1" result="offsetblur" />
                <feFlood floodColor={color} floodOpacity="0.4" />
                <feComposite in2="offsetblur" operator="in" />
                <feMerge>
                  <feMergeNode />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <path 
              d="M50,10 C50,10 0,60 0,100 C0,123 22,140 50,140 C78,140 100,123 100,100 C100,60 50,10 50,10 Z" 
              fill="rgba(255,255,255,0.1)" 
              stroke="rgba(255,255,255,0.3)" 
              strokeWidth="1"
            />

            {displayValue > 50 && (
              <g style={{ animation: 'ripple 4s ease-in-out infinite' }} opacity="0.4">
                <ellipse cx="30" cy="90" rx="8" ry="4" fill="rgba(255,255,255,0.6)" />
                <ellipse cx="70" cy="105" rx="10" ry="5" fill="rgba(255,255,255,0.5)" />
              </g>
            )}

            <path 
              d="M50,10 C50,10 0,60 0,100 C0,123 22,140 50,140 C78,140 100,123 100,100 C100,60 50,10 50,10 Z" 
              fill="url(#premiumWaterFill)" 
              filter="url(#premiumWaterGlow)"
              style={{ 
                clipPath: `polygon(0% ${100 - displayValue}%, 100% ${100 - displayValue}%, 100% 100%, 0% 100%)`,
                transition: 'clip-path 0.8s ease-out'
              }}
            />

            <g stroke="rgba(255,255,255,0.7)" strokeWidth="1">
              <line x1="10" y1="40" x2="18" y2="40" />
              <line x1="10" y1="70" x2="18" y2="70" />
              <line x1="10" y1="100" x2="18" y2="100" />
              <line x1="10" y1="130" x2="18" y2="130" />
              <text x="22" y="44" fill="rgba(255,255,255,0.8)" fontSize="9" fontWeight="bold">75%</text>
              <text x="22" y="74" fill="rgba(255,255,255,0.8)" fontSize="9" fontWeight="bold">50%</text>
              <text x="22" y="104" fill="rgba(255,255,255,0.8)" fontSize="9" fontWeight="bold">25%</text>
              <text x="22" y="134" fill="rgba(255,255,255,0.8)" fontSize="9" fontWeight="bold">0%</text>
            </g>
          </svg>
        </div>
        
        <div className="text-center w-1/2">
          <div 
            className="text-6xl font-extrabold text-white"
            style={{ 
              textShadow: `0 0 20px ${color}80, 0 4px 8px rgba(0,0,0,0.8)`,
              transition: 'all 0.5s ease-out'
            }}
          >
            {displayValue.toFixed(range.decimals)} {range.unit}
          </div>
          <div className="mt-4 text-3xl text-white font-bold" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
            Humidity
          </div>
          
          <div className="mt-4 relative h-4 bg-gray-700 rounded-full overflow-hidden w-full">
            <div className="absolute inset-0 flex">
              <div className="w-1/3 h-full bg-blue-500"></div>
              <div className="w-1/3 h-full bg-green-500"></div>
              <div className="w-1/3 h-full bg-red-500"></div>
            </div>
            <div 
              className="absolute top-0 w-5 h-5 bg-white rounded-full transform -translate-y-1/4 shadow-lg"
              style={{ 
                left: `calc(${Math.min(100, Math.max(0, displayValue))}% - 10px)`,
                transition: 'left 0.8s ease-out',
                boxShadow: `0 0 10px ${color}60, 0 2px 4px rgba(0,0,0,0.8)`
              }}
            />
          </div>
          <div className="flex justify-between text-lg text-white text-opacity-70 mt-2 font-medium">
            <span>Dry</span>
            <span>Optimal</span>
            <span>Humid</span>
          </div>
        </div>
      </div>
    );
  };

  // Enhanced Circular Gauge
  const CircularGauge = ({ value, sensorType, title, icon, min = 0, max = 1000 }) => {
    const displayValue = value;
    const percentage = Math.min(100, Math.max(0, ((displayValue - min) / (max - min)) * 100));
    const circumference = 2 * Math.PI * 80;
    const offset = circumference - (percentage / 100 * circumference);
    const color = getPremiumColor(sensorType, displayValue);
    const range = SENSOR_RANGES[sensorType];
    
    return (
      <div className="flex flex-col items-center justify-center w-full h-full p-2">
        <div className="relative w-full h-full max-w-60 max-h-60">
          <svg viewBox="0 0 180 180" className="w-full h-full">
            <defs>
              <linearGradient id={`premiumGradient-${title}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={color} stopOpacity="0.8" />
                <stop offset="100%" stopColor={color} stopOpacity="0.4" />
              </linearGradient>
              <filter id={`premiumGlow-${title}`} x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="4"/>
                <feOffset dx="0" dy="0" result="offsetblur"/>
                <feFlood floodColor={color} floodOpacity="0.5"/>
                <feComposite in2="offsetblur" operator="in"/>
                <feMerge>
                  <feMergeNode/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            
            <circle 
              cx="90" 
              cy="90" 
              r="80" 
              fill="none" 
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="12"
            />
            
            <circle 
              cx="90" 
              cy="90" 
              r="80" 
              fill="none" 
              stroke={`url(#premiumGradient-${title})`}
              strokeWidth="12" 
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              transform="rotate(-90 90 90)"
              filter={`url(#premiumGlow-${title})`}
              style={{
                transition: 'stroke-dashoffset 1s ease-out'
              }}
            />
            
            <circle 
              cx="90" 
              cy="90" 
              r="65" 
              fill="rgba(0,0,0,0.3)"
              stroke={color}
              strokeWidth="2"
              strokeOpacity="0.4"
            >
              <animate
                attributeName="r"
                values="65;75;65"
                dur="3s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="stroke-opacity"
                values="0.4;0.8;0.4"
                dur="3s"
                repeatCount="indefinite"
              />
            </circle>
            
            <g transform="translate(90, 75)">
              <g transform="translate(-25, -25) scale(1)">
                {icon}
              </g>
            </g>
            
            <text 
              x="90" 
              y="120" 
              textAnchor="middle" 
              fill="white" 
              fontSize="20" 
              fontWeight="900"
              style={{ 
                textShadow: `0 0 15px ${color}80, 0 2px 4px rgba(0,0,0,0.8)`,
                transition: 'all 0.5s ease-out'
              }}
            >
              {displayValue.toFixed(range.decimals)}
            </text>
            <text 
              x="90" 
              y="135" 
              textAnchor="middle" 
              fill="white" 
              fontSize="12"
              fillOpacity="0.8"
              fontWeight="bold"
            >
              {range.unit}
            </text>
          </svg>
        </div>
        <div className="text-center mt-2 text-2xl text-white font-extrabold" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
          {title}
        </div>
        {/*<div className="mt-2">
          <PremiumStatusBadge value={displayValue} sensorType={sensorType} />
        </div>*/}
      </div>
    );
  };

  // Enhanced Weather Card
  const WeatherCard = () => (
    <div className="flex flex-col h-full">
      <h3 className="text-3xl font-extrabold mb-3 text-white" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
        {WEATHER_CONFIG.location}
      </h3>
      <div className="flex-grow flex items-center justify-center p-2">
        <div className="text-center w-full">
          <div className="mb-2 relative">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" className="h-24 w-24 mx-auto" style={{ filter: 'drop-shadow(0 0 10px #FFD700)' }}>
              <defs>
                <radialGradient id="premiumSunGradient" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#FFD700" />
                  <stop offset="90%" stopColor="#FFA500" />
                </radialGradient>
              </defs>
              <circle cx="32" cy="32" r="14" fill="url(#premiumSunGradient)" />
              <g stroke="#FFA500" strokeWidth="3" strokeLinecap="round" style={{ filter: 'drop-shadow(0 0 2px #FFD700)' }}>
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
          <div className="text-5xl font-extrabold text-white mb-1 flex items-center justify-center" style={{ textShadow: '0 0 20px #FFD70080, 0 4px 8px rgba(0,0,0,0.8)' }}>
            {WEATHER_CONFIG.defaultTemperature}<span className="text-3xl ml-1">°C</span>
          </div>
          <div className="text-3xl text-yellow-400 mb-2 font-bold" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
            {WEATHER_CONFIG.defaultCondition}
          </div>
          <div className="text-xl text-white opacity-85 flex items-center justify-center font-medium">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L6 8c-3 3-3 8 0 12h12c3-4 3-9 0-12L12 2z" />
            </svg>
            <span>{WEATHER_CONFIG.defaultHumidity}% Humidity</span>
          </div>
        </div>
      </div>
    </div>
  );

  // Realistic Pressure Gauge
  const PressureGauge = ({ value, min = 0, max = 10 }) => {
    const displayValue = smoothPressure;
    const clampedValue = Math.max(min, Math.min(max, displayValue));
    const valueRange = max - min;
    const normalizedValue = (clampedValue - min) / valueRange;
    const needleAngle = -45 + (normalizedValue * 270);
    const color = getPremiumColor('DIFFERENTIAL_PRESSURE', displayValue);
    
    const generateScaleNumbers = () => {
      const numbers = [];
      for (let i = 0; i <= 5; i++) {
        const val = (max / 5) * i;
        const angle = -135 + (i * 54);
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
              <linearGradient id="premiumGaugeRim" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#6B7280" />
                <stop offset="50%" stopColor="#9CA3AF" />
                <stop offset="100%" stopColor="#4B5563" />
              </linearGradient>
              <radialGradient id="premiumGaugeFace" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#1F2937" />
                <stop offset="100%" stopColor="#111827" />
              </radialGradient>
              <linearGradient id="premiumNeedle" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={color} />
                <stop offset="100%" stopColor="#DC2626" />
              </linearGradient>
           </defs>
           
           <circle cx="100" cy="100" r="95" fill="url(#premiumGaugeRim)" stroke="#374151" strokeWidth="2" />
           <circle cx="100" cy="100" r="85" fill="url(#premiumGaugeFace)" stroke="#4B5563" strokeWidth="1" />
           
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
           
           {Array.from({ length: 21 }).map((_, i) => {
             if (i % 4 === 0) return null;
             const tickAngle = -135 + i * 13.5;
             const x1 = 100 + 78 * Math.cos(tickAngle * Math.PI / 180);
             const y1 = 100 + 78 * Math.sin(tickAngle * Math.PI / 180);
             const x2 = 100 + 82 * Math.cos(tickAngle * Math.PI / 180);
             const y2 = 100 + 82 * Math.sin(tickAngle * Math.PI / 180);
             
             return (
               <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="white" strokeWidth="1" strokeOpacity="0.6" />
             );
           })}
           
           <circle cx="100" cy="100" r="8" fill="url(#premiumGaugeRim)" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
           
           <g transform={`rotate(${needleAngle}, 100, 100)`} style={{ transition: 'transform 1s ease-out' }}>
             <polygon 
               points="100,30 102,100 100,105 98,100" 
               fill="url(#premiumNeedle)" 
               stroke="#000000" 
               strokeWidth="0.5"
               style={{ filter: `drop-shadow(0 0 3px ${color})` }}
             />
           </g>
           
           <circle cx="100" cy="100" r="4" fill={color} stroke="#000000" strokeWidth="1" style={{ filter: `drop-shadow(0 0 5px ${color})` }} />
           
           <text x="105" y="140" textAnchor="middle" fill="white" fontSize="18" fontWeight="900" style={{ textShadow: `0 0 10px ${color}80, 0 2px 4px rgba(0,0,0,0.8)` }}>
             {clampedValue.toFixed(2)} Pa
           </text>
           
           <path 
             d="M 30 100 A 70 70 0 0 1 170 100" 
             fill="none" 
             stroke={color} 
             strokeWidth="4" 
             strokeOpacity="0.4"
             style={{ 
               transition: 'stroke 0.5s ease-out',
               filter: `drop-shadow(0 0 5px ${color})`
             }}
           />
         </svg>
       </div>
       <div className="text-center mt-2 text-2xl text-white font-extrabold" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
         Differential Pressure
       </div>
     </div>
   );
 };

 // Building Page Component
 const BuildingPage = () => {
   return (
     <div className="h-screen w-screen flex flex-col relative overflow-hidden">
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
             </div>
           </div>
         )}
       </div>
       
       <header className="relative z-10 flex flex-wrap justify-between items-center mb-4 md:mb-6 glass-card p-4 m-4">
         <div className="flex items-center">
           <img src={daikinLogo} alt="DAIKIN" className="h-12 w-auto" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))' }} />
         </div>
         
         <div className="text-center flex items-center justify-center space-x-6">
           <div className="text-2xl font-extrabold text-white" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>Building Overview</div>
         </div>
         
         <div className="flex gap-4">
           <button 
             onClick={() => setCurrentPage('dashboard')}
             className="p-3 rounded-full bg-white bg-opacity-20 shadow-lg hover:bg-opacity-30 transition-all duration-300"
             title="Back to Dashboard"
             style={{ backdropFilter: 'blur(10px)' }}
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

 if (isDataLoading) {
   return (
     <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
       <div className="text-center text-white">
         <div className="animate-spin rounded-full h-32 w-32 border-t-4 border-b-4 border-blue-400 mb-4" style={{ filter: 'drop-shadow(0 0 10px #3B82F6)' }}></div>
         <h2 className="text-3xl font-extrabold mb-2" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>Loading Sensor Data...</h2>
         <p className="text-xl opacity-75">Connecting to backend server</p>
         {error && (
           <div className="mt-4 p-4 glass-card">
             <p className="text-red-300 font-bold">Error: {error}</p>
           </div>
         )}
       </div>
     </div>
   );
 }

 if (currentPage === 'building') {
   return <BuildingPage />;
 }

 return (
   <div className="h-screen w-screen flex flex-col relative overflow-hidden">
     {/* Premium Background */}
     <div className="fixed inset-0 z-0">
       <div 
         className="absolute inset-0 bg-cover bg-center" 
         style={{ 
           backgroundImage: `url(${backgroundImage})`,
           filter: 'brightness(0.4) saturate(1.2)'
         }} 
       />
       
       {/* Premium ambient lighting */}
       <div className="fixed inset-0 overflow-hidden z-0">
         <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-cyan-500 bg-opacity-10 blur-3xl" style={{ animation: 'float-glow 8s ease-in-out infinite' }}></div>
         <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-purple-500 bg-opacity-10 blur-3xl" style={{ animation: 'float-glow 10s ease-in-out infinite', animationDelay: '2s' }}></div>
         <div className="absolute top-1/2 left-1/2 w-96 h-96 rounded-full bg-teal-400 bg-opacity-8 blur-3xl" style={{ animation: 'float-glow 12s ease-in-out infinite', animationDelay: '4s' }}></div>
       </div>
     </div>
     
     <div className="relative z-10 flex-1 flex flex-col p-4 md:p-6">
       {/* Premium Header */}
       <header className="flex flex-wrap justify-between items-center mb-4 md:mb-4 glass-card p-4" >
         <div className="flex items-center">
           <img src={daikinLogo} alt="DAIKIN" className="h-12 w-auto" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))' }} />
         </div>
         <div className="text-2xl font-extrabold text-white" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
              {currentTime.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })} • {currentTime.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              })}
          </div>
         
         <div className="flex gap-4">
           <button className="p-3 rounded-full bg-white bg-opacity-20 shadow-lg hover:bg-opacity-30 transition-all duration-300" style={{ backdropFilter: 'blur(10px)' }}>
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
             </svg>
           </button>
           <button 
             onClick={() => setCurrentPage('building')}
             className="p-3 rounded-full bg-white bg-opacity-20 hover:bg-white hover:bg-opacity-30 transition-all duration-300"
             style={{ backdropFilter: 'blur(10px)' }}
           >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
             </svg>
           </button>
           <button className="p-3 rounded-full bg-white bg-opacity-20 hover:bg-white hover:bg-opacity-30 transition-all duration-300" onClick={handleRefresh} style={{ backdropFilter: 'blur(10px)' }}>
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
             </svg>
           </button>
         </div>
       </header>
       
       {/* Premium Dashboard Grid */}
       <main className="flex-grow" style={{ height: `calc(100vh - 185px)` }}>
         <div className="h-full grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-6 lg:gap-8 xl:gap-8">
           {/* Premium IAQ Index Card */}
           <div className="row-span-2 row-start-1">
             {renderIAQCard()}
           </div>
           
           {/* Premium Temperature Card */}
           <div className="glass-card overflow-hidden flex flex-col row-span-1 row-start-1" style={{ animation: 'float 8s ease-in-out infinite' }}>
             <div className="flex justify-between items-center mb-6">
               <h3 className="text-3xl font-extrabold text-white" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>Temperature</h3>
               {/*<PremiumStatusBadge value={smoothTemperature} sensorType="TEMPERATURE" />*/}
             </div>
             <div className="flex-grow">
               <ThermometerDisplay value={smoothTemperature} />
             </div>
           </div>
           
           {/* Premium Humidity Card */}
           <div className="glass-card overflow-hidden flex flex-col row-span-1 row-start-1" style={{ animation: 'float 7s ease-in-out infinite', animationDelay: '1s' }}>
             <div className="flex justify-between items-center mb-2">
               <h3 className="text-3xl font-extrabold text-white" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>Humidity</h3>
               <PremiumStatusBadge value={smoothHumidity} sensorType="HUMIDITY" />
             </div>
             <div className="flex-grow">
               <HumidityDisplay value={smoothHumidity} />
             </div>
           </div>
           
           {/* Premium CO2 Card */}
           <div className="glass-card overflow-hidden flex flex-col row-span-1 row-start-2" style={{ animation: 'float 9s ease-in-out infinite', animationDelay: '2s' }}>
             <div className="flex justify-between items-center mb-2">
               <h3 className="text-3xl font-extrabold text-white" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>Carbon Dioxide</h3>
               <PremiumStatusBadge value={smoothCO2} sensorType="CO2" />
             </div>
             <div className="flex-grow">
               <CircularGauge 
                 value={smoothCO2} 
                 sensorType="CO2"
                 title="CO₂"
                 min={0}
                 max={5000}
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
           
           {/* Premium PM2.5 Card */}
           <div className="glass-card overflow-hidden flex flex-col row-span-1 row-start-2" style={{ animation: 'float 6s ease-in-out infinite', animationDelay: '3s' }}>
             <div className="flex justify-between items-center mb-2">
               <h3 className="text-3xl font-extrabold text-white" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>Particulate Matter</h3>
               <PremiumStatusBadge value={smoothPM25} sensorType="PM25" />
             </div>
             <div className="flex-grow">
               <CircularGauge 
                 value={smoothPM25} 
                 sensorType="PM25"
                 title="PM2.5"
                 min={0}
                 max={50}
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
           
           {/* Premium Weather Card */}
           <div className="glass-card overflow-hidden flex flex-col row-span-1 row-start-3" style={{ animation: 'float 10s ease-in-out infinite', animationDelay: '4s' }}>
             <WeatherCard />
           </div>
           
           {/* Premium TVOC Card */}
           <div className="glass-card overflow-hidden flex flex-col row-span-1 row-start-3" style={{ animation: 'float 8s ease-in-out infinite', animationDelay: '5s' }}>
             <div className="flex justify-between items-center mb-2">
               <h3 className="text-3xl font-extrabold text-white" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>Volatile Compounds</h3>
               <PremiumStatusBadge value={smoothTVOC} sensorType="TVOC" />
             </div>
             <div className="flex-grow">
               <CircularGauge 
                 value={smoothTVOC} 
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
           
           {/* Premium Differential Pressure Card */}
           <div className="glass-card overflow-hidden flex flex-col row-span-1 row-start-3" style={{ animation: 'float 7s ease-in-out infinite', animationDelay: '6s' }}>
             <div className="flex justify-between items-center mb-2">
               <h3 className="text-3xl font-extrabold text-white" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>Differential Pressure</h3>
               <PremiumStatusBadge value={smoothPressure} sensorType="DIFFERENTIAL_PRESSURE" />
             </div>
             <div className="flex-grow">
               <PressureGauge value={smoothPressure} />
             </div>
           </div>
         </div>
       </main>
       
       {/* Premium Footer */}
       <footer className="mt-2 md:mt-2 flex justify-between items-center text-white text-sm glass-card p-3">
         <div>
           <span className="flex items-center">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-green-400" style={{ animation: 'pulse 2s ease-in-out infinite', filter: 'drop-shadow(0 0 4px #10B981)' }} viewBox="0 0 20 20" fill="currentColor">
               <circle cx="10" cy="10" r="10" />
             </svg>
             <span className="font-bold">Last updated: {lastUpdate.toLocaleTimeString()}</span>
             {connectionStatus.simulation && (
               <span className="ml-3 px-3 py-1 bg-blue-500 bg-opacity-40 rounded-full text-xs font-extrabold border border-blue-400 border-opacity-50" style={{ backdropFilter: 'blur(10px)', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
                 SIMULATION
               </span>
             )}
           </span>
         </div>
         <div className="font-bold" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>© Siam Daikin Sales Co., Ltd.</div>
       </footer>
     </div>

     {/* Premium CSS Styles */}
     <style jsx>{`
       @keyframes float {
         0%, 100% { transform: translateY(0px) rotate(0deg); }
         33% { transform: translateY(-6px) rotate(0.5deg); }
         66% { transform: translateY(4px) rotate(-0.5deg); }
       }

       @keyframes float-glow {
         0%, 100% { transform: translateY(0px) scale(1); opacity: 0.1; }
         50% { transform: translateY(-20px) scale(1.1); opacity: 0.15; }
       }

       @keyframes float-icon {
         0%, 100% { transform: translateY(0px); }
         50% { transform: translateY(-8px); }
       }

       @keyframes pulse-glow {
         0%, 100% { opacity: 0.3; transform: scale(1); }
         50% { opacity: 0.5; transform: scale(1.05); }
       }

       @keyframes value-glow {
         0%, 100% { filter: drop-shadow(0 0 20px currentColor); }
         50% { filter: drop-shadow(0 0 30px currentColor); }
       }

       @keyframes shimmer {
         0% { transform: translateX(-100%); }
         100% { transform: translateX(100%); }
       }

       @keyframes ripple {
         0%, 100% { transform: scale(1); opacity: 0.4; }
         50% { transform: scale(1.1); opacity: 0.6; }
       }
     `}</style>
   </div>
 );
};

export default Dashboard;
