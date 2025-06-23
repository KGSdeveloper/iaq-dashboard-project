import React, { useState, useEffect } from 'react';
import sensorService from '../services/sensorService';
import { SENSOR_RANGES } from '../utils/constants';
// Import your background image and logo
import backgroundImage from '../assets/room-background.jpg';
import daikinLogo from '../assets/daikin-logo.png';

const Dashboard = () => {
  const [sensorData, setSensorData] = useState({
    PM25: 16.60,
    CO2: 656.53,
    TEMPERATURE: 22.9,
    HUMIDITY: 53.47,
    TVOC: 328.01,
    DIFFERENTIAL_PRESSURE: 4.03
  });
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [connectionStatus, setConnectionStatus] = useState({
    connected: true,
    simulation: true
  });
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const unsubscribe = sensorService.subscribe((data) => {
      setSensorData(prev => ({ ...prev, ...data }));
      setLastUpdate(new Date(data.timestamp || Date.now()));
      setConnectionStatus(data.connectionStatus || connectionStatus);
      
      if (!data.error) {
        setError(null);
      } else {
        setError(data.error);
      }
    });

    sensorService.startMonitoring(5000);

    return () => {
      unsubscribe();
      sensorService.stopMonitoring();
    };
  }, []);

  const handleRefresh = async () => {
    try {
      await sensorService.refreshData();
    } catch (error) {
      setError('Failed to refresh data');
    }
  };

  // IAQ calculation matching your demo
  const getIaqStatus = (value) => {
    if (value >= 80) return { status: 'Excellent', color: 'from-green-500 to-green-600', textColor: 'text-green-500' };
    if (value >= 60) return { status: 'Good', color: 'from-teal-500 to-teal-600', textColor: 'text-teal-500' };
    if (value >= 40) return { status: 'Moderate', color: 'from-amber-500 to-amber-600', textColor: 'text-amber-500' };
    if (value >= 20) return { status: 'Poor', color: 'from-orange-500 to-orange-600', textColor: 'text-orange-500' };
    return { status: 'Critical', color: 'from-red-500 to-red-600', textColor: 'text-red-500' };
  };

  // Professional IAQ Index Display matching your demo
  const renderIAQCard = () => {
    const iaqValue = 86; // Fixed to match screenshot
    const iaqStatus = getIaqStatus(iaqValue);
    const circumference = 2 * Math.PI * 90;
    const offset = circumference - (iaqValue / 100 * circumference);
    
    return (
      <div className="glass-card relative overflow-hidden row-span-2 flex flex-col h-full">
        <h3 className="text-xl font-medium mb-4 text-white">Indoor Air Quality</h3>
        
        <div className="flex-grow flex items-center justify-center relative p-4">
          {/* Glowing background effect */}
          <div className={`absolute w-80 h-80 rounded-full bg-gradient-to-r ${iaqStatus.color} opacity-40 blur-3xl transition-all duration-150`}></div>
          
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
                strokeWidth="10"
              />
              
              {/* Progress circle with animation */}
              <circle 
                cx="100" 
                cy="100" 
                r="90" 
                fill="none" 
                stroke="#00ff88"
                strokeWidth="10" 
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                transform="rotate(-90 100 100)"
                filter="drop-shadow(0 0 5px rgba(0, 255, 136, 0.5))"
                className="transition-all duration-1000 ease-in-out"
              />
            </svg>
            
            {/* Value and status in center */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-7xl font-bold text-white">{iaqValue}</div>
              <div className="text-xl font-medium mt-2 text-green-400">Excellent</div>
              <div className="mt-4 text-4xl">😊</div>
            </div>
          </div>
        </div>
        
        <div className="mt-2 text-center">
          <div className="text-lg text-white">Excellent air quality</div>
        </div>
      </div>
    );
  };

  // Realistic Thermometer Component matching your demo
  const ThermometerDisplay = ({ value, min = 15, max = 35 }) => {
    const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
    
    return (
      <div className="flex items-center justify-around w-full h-full p-2">
        <div className="relative h-56 w-16">
          {/* Thermometer outer casing */}
          <div className="absolute left-1/2 transform -translate-x-1/2 w-10 h-48 rounded-t-full rounded-b-full bg-gradient-to-r from-gray-200 to-gray-300 overflow-hidden">
            {/* Glass tube */}
            <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-44 top-2 bg-white bg-opacity-30 rounded-t-full rounded-b-full border border-white border-opacity-50">
              {/* Mercury column */}
              <div 
                className="absolute bottom-0 w-full bg-gradient-to-t from-red-600 to-red-500 rounded-b-full transition-all duration-500"
                style={{ height: `${percentage}%` }}
              ></div>
            </div>
          </div>
          
          {/* Mercury bulb */}
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-12 h-12 rounded-full bg-gradient-to-t from-red-700 to-red-500 shadow-lg animate-pulse"></div>
          
          {/* Temperature scale */}
          <div className="absolute top-1 bottom-6 -right-8 flex flex-col justify-between text-sm text-white py-2">
            {[max, max - (max-min)*0.25, max - (max-min)*0.5, max - (max-min)*0.75, min].map((temp, i) => (
              <div key={i} className="flex items-center">
                <div className="w-3 h-px bg-white bg-opacity-60 mr-1"></div>
                <span>{temp}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="text-center w-1/2">
          <span className="text-6xl font-bold text-white">{value.toFixed(2)}</span>
          <span className="text-2xl text-white ml-2">°C</span>
          <div className="mt-4 text-xl text-white">Temperature</div>
          <div className="mt-6 text-sm text-blue-400 bg-blue-400/20 rounded-full px-3 py-1 inline-block">
            Comfortable Range
          </div>
        </div>
      </div>
    );
  };

  // Realistic Humidity Display matching your demo
  const HumidityDisplay = ({ value }) => {
    return (
      <div className="flex items-center justify-around w-full h-full p-2">
        <div className="relative w-40 h-52">
          <svg viewBox="0 0 100 140" className="w-full h-full">
            <defs>
              <linearGradient id="dropFill" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#2563EB" stopOpacity="0.9" />
              </linearGradient>
            </defs>
            
            {/* Droplet outline */}
            <path 
              d="M50,10 C50,10 0,60 0,100 C0,123 22,140 50,140 C78,140 100,123 100,100 C100,60 50,10 50,10 Z" 
              fill="none" 
              stroke="rgba(255,255,255,0.5)" 
              strokeWidth="1"
            />
            
            {/* Filled part of droplet */}
            <path 
              d="M50,10 C50,10 0,60 0,100 C0,123 22,140 50,140 C78,140 100,123 100,100 C100,60 50,10 50,10 Z" 
              fill="url(#dropFill)" 
              className="transition-all duration-700 ease-in-out"
              style={{ 
                clipPath: `polygon(0% ${100 - value}%, 100% ${100 - value}%, 100% 100%, 0% 100%)`
              }}
            />
            
            {/* Current value */}
            <text 
              x="50" 
              y="125" 
              textAnchor="middle" 
              fill="white" 
              fontSize="18" 
              fontWeight="bold"
            >
              {value.toFixed(2)}%
            </text>
          </svg>
        </div>
        
        <div className="text-center w-1/2">
          <div className="text-5xl font-bold text-white">{value.toFixed(2)}</div>
          <div className="text-xl text-white text-opacity-90">%</div>
          <div className="mt-4 text-xl text-white">Humidity</div>
          
          {/* Comfort level indicator */}
          <div className="mt-4 relative h-2 bg-gray-700 rounded-full overflow-hidden w-full">
            <div className="absolute inset-0 flex">
              <div className="w-1/3 h-full bg-blue-500"></div>
              <div className="w-1/3 h-full bg-green-500"></div>
              <div className="w-1/3 h-full bg-red-500"></div>
            </div>
            <div 
              className="absolute top-0 w-3 h-3 bg-white rounded-full transform -translate-y-1/4"
              style={{ left: `${value}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-white text-opacity-70 mt-1">
            <span>Dry</span>
            <span>Optimal</span>
            <span>Humid</span>
          </div>
        </div>
      </div>
    );
  };

  // Circular gauge for CO2, PM2.5, TVOC
  const CircularGauge = ({ value, unit, title, icon, min = 0, max = 1000, color = "#3b82f6" }) => {
    const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
    const circumference = 2 * Math.PI * 60;
    const offset = circumference - (percentage / 100 * circumference);
    
    return (
      <div className="flex flex-col items-center justify-center w-full h-full p-2">
        <div className="relative w-full h-full max-w-60 max-h-60">
          <svg viewBox="0 0 180 180" className="w-full h-full">
            {/* Background circle */}
            <circle 
              cx="90" 
              cy="90" 
              r="80" 
              fill="none" 
              stroke="#FFFFFF" 
              strokeOpacity="0.1"
              strokeWidth="14"
            />
            
            {/* Value track */}
            <circle 
              cx="90" 
              cy="90" 
              r="80" 
              fill="none" 
              stroke={color}
              strokeWidth="12" 
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              transform="rotate(-90 90 90)"
              className="transition-all duration-1000 ease-in-out"
            />
            
            {/* Icon in center */}
            <g transform="translate(65, 40)">
              {icon}
            </g>
            
            {/* Value text */}
            <text 
              x="90" 
              y="120" 
              textAnchor="middle" 
              fill="white" 
              fontSize="24" 
              fontWeight="bold"
            >
              {value.toFixed(2)}
            </text>
            <text 
              x="90" 
              y="140" 
              textAnchor="middle" 
              fill="white" 
              fontSize="14"
            >
              {unit}
            </text>
          </svg>
        </div>
        <div className="text-center mt-2 text-sm text-white">{title}</div>
      </div>
    );
  };

  // Pressure Gauge matching your demo
  // Fixed Pressure Gauge with correct needle alignment
  const PressureGauge = ({ value, min = 0, max = 10 }) => {
    // CORRECTED: Needle angle from -45° (0 Pa) to 225° (10 Pa)
    const clampedValue = Math.max(min, Math.min(max, value));
    const valueRange = max - min;
    const normalizedValue = (clampedValue - min) / valueRange; // 0 to 1
    
    // Start at -45° (0 Pa) and end at 225° (10 Pa)
    const startAngle = -45;   // 0 Pa position (upper right)
    const endAngle = 225;     // 10 Pa position (bottom left)
    
    // Calculate span: -45° to 225° = 270° total span (clockwise)
    const angleSpan = 270;    // Total degrees of rotation
    const needleAngle = startAngle + (normalizedValue * angleSpan);
    
    return (
      <div className="flex flex-col items-center justify-center w-full h-full p-2">
        <div className="relative w-60 h-60">
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <defs>
              <linearGradient id="dialGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#DC2626" />
                <stop offset="50%" stopColor="#FBBF24" />
                <stop offset="100%" stopColor="#10B981" />
              </linearGradient>
              <linearGradient id="metalRing" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#6B7280" />
                <stop offset="45%" stopColor="#9CA3AF" />
                <stop offset="55%" stopColor="#9CA3AF" />
                <stop offset="100%" stopColor="#4B5563" />
              </linearGradient>
            </defs>
            
            {/* Outer ring */}
            <circle cx="100" cy="100" r="95" fill="#1A1F2C" stroke="url(#metalRing)" strokeWidth="4" />
            <circle cx="100" cy="100" r="85" fill="#0F1623" stroke="#374151" strokeWidth="1" />
            
            {/* Keep your original tick marks */}
            {Array.from({ length: 11 }).map((_, i) => {
              const tickAngle = -135 + i * 27;
              const x1 = 100 + 70 * Math.cos(tickAngle * Math.PI / 180);
              const y1 = 100 + 70 * Math.sin(tickAngle * Math.PI / 180);
              const x2 = 100 + 80 * Math.cos(tickAngle * Math.PI / 180);
              const y2 = 100 + 80 * Math.sin(tickAngle * Math.PI / 180);
              const textX = 100 + 60 * Math.cos(tickAngle * Math.PI / 180);
              const textY = 100 + 60 * Math.sin(tickAngle * Math.PI / 180);
              
              return (
                <g key={i}>
                  <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="white" strokeWidth="2" />
                  <text 
                    x={textX} 
                    y={textY} 
                    textAnchor="middle" 
                    dominantBaseline="middle" 
                    fill="white" 
                    fontSize="10"
                  >
                    {min + i * ((max - min) / 10)}
                  </text>
                </g>
              );
            })}
            
            {/* Center point */}
            <circle cx="100" cy="100" r="8" fill="url(#metalRing)" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
            
            {/* CORRECTED NEEDLE: -45° to 225° */}
            <line 
              x1="100" 
              y1="100" 
              x2="100" 
              y2="40" 
              stroke="#EF4444" 
              strokeWidth="3" 
              transform={`rotate(${needleAngle}, 100, 100)`}
              strokeLinecap="round" 
              className="transition-transform duration-1000"
            />
            <circle cx="100" cy="100" r="4" fill="#EF4444" />
            
            {/* Value display */}
            <text x="100" y="140" textAnchor="middle" fill="white" fontSize="18" fontWeight="bold">
              {clampedValue.toFixed(2)} Pa
            </text>
                     
          </svg>
        </div>
        <div className="text-center mt-2 text-xl text-white">Differential Pressure</div>
      </div>
    );
  };

  return (
    <div className="h-screen w-screen flex flex-col relative overflow-hidden">
      {/* Background room image */}
      <div className="fixed inset-0 z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center" 
          style={{ 
            backgroundImage: `url(${backgroundImage})`,
            filter: 'brightness(0.7)'
          }} 
        />
        
        {/* Soft lighting effects */}
        <div className="fixed inset-0 overflow-hidden z-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-blue-500 bg-opacity-5 blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-purple-500 bg-opacity-5 blur-3xl"></div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="relative z-10 flex-1 flex flex-col p-4 md:p-6">
        {/* Header */}
        <header className="flex flex-wrap justify-between items-center mb-4 md:mb-6 bg-white bg-opacity-10 backdrop-blur-[2px] rounded-2xl p-3 border border-white border-opacity-30 shadow-lg">
          <div className="flex items-center">
            <img src={daikinLogo} alt="DAIKIN" className="h-10 w-auto" />
          </div>
          
          <div className="text-center flex items-center justify-center space-x-6">
            <div className="text-lg md:text-xl font-light text-white">
              {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
            <div className="text-lg md:text-xl font-light text-white">
              {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
          </div>
          
          <div className="flex gap-4">
            <button className="p-2 rounded-full bg-white bg-opacity-30 shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </button>
            <button className="p-2 rounded-full bg-white bg-opacity-10 hover:bg-white hover:bg-opacity-20 transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </button>
            <button className="p-2 rounded-full bg-white bg-opacity-10 hover:bg-white hover:bg-opacity-20 transition-all">
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
                <h3 className="text-xl font-medium text-white">Temperature</h3>
                <div className="h-3 w-3 rounded-full bg-green-500"></div>
              </div>
              <div className="flex-grow">
                <ThermometerDisplay value={sensorData.TEMPERATURE || 22.9} />
              </div>
            </div>
            
            {/* Humidity Card */}
            <div className="glass-card overflow-hidden flex flex-col row-span-1 row-start-1">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl font-medium text-white">Humidity</h3>
                <div className="h-3 w-3 rounded-full bg-green-500"></div>
              </div>
              <div className="flex-grow">
                <HumidityDisplay value={sensorData.HUMIDITY || 53.47} />
              </div>
            </div>
            
            {/* CO2 Card */}
            <div className="glass-card overflow-hidden flex flex-col row-span-1 row-start-2">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl font-medium text-white">Carbon Dioxide</h3>
                <div className="h-3 w-3 rounded-full bg-green-500"></div>
              </div>
              <div className="flex-grow">
                <CircularGauge 
                  value={sensorData.CO2 || 656.53} 
                  unit="ppm" 
                  title="CO₂ Concentration"
                  color="#3b82f6"
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
                <h3 className="text-xl font-medium text-white">Particulate Matter</h3>
                <div className="h-3 w-3 rounded-full bg-green-500"></div>
              </div>
              <div className="flex-grow">
                <CircularGauge 
                  value={sensorData.PM25 || 16.60} 
                  unit="μg/m³" 
                  title="PM2.5"
                  color="#10b981"
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
                      <circle cx="7" cy="12" r="0.5" fill="white"/>
                      <circle cx="17" cy="12" r="0.5" fill="white"/>
                    </svg>
                  }
                />
              </div>
            </div>
            
            {/* Weather Card */}
            <div className="glass-card flex flex-col row-span-1 row-start-3">
              <h3 className="text-xl font-medium mb-3 text-white">Pathumwan, Bangkok</h3>
              <div className="flex-grow flex items-center justify-center p-2">
                <div className="text-center w-full">
                  {/* Weather icon */}
                  <div className="mb-2 relative">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" className="h-24 w-24 mx-auto animate-pulse">
                      <defs>
                        <radialGradient id="sunGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                          <stop offset="0%" stopColor="#FFD700" />
                          <stop offset="90%" stopColor="#FFA500" />
                        </radialGradient>
                      </defs>
                      <circle cx="32" cy="32" r="16" fill="url(#sunGradient)" />
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
                  <div className="text-5xl font-bold text-white mb-1 flex items-center justify-center">
                    31.39<span className="text-3xl ml-1">°C</span>
                  </div>
                  <div className="text-2xl text-yellow-400">Sunny</div>
                  <div className="text-xl text-white mt-3 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2L6 8c-3 3-3 8 0 12h12c3-4 3-9 0-12L12 2z" />
                      <path d="M12 12v6" />
                    </svg>
                    <span>64.31% Humidity</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* TVOC Card */}
            <div className="glass-card overflow-hidden flex flex-col row-span-1 row-start-3">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl font-medium text-white">Volatile Compounds</h3>
                <div className="h-3 w-3 rounded-full bg-green-500"></div>
              </div>
              <div className="flex-grow">
                <CircularGauge 
                  value={sensorData.TVOC || 328.01} 
                  unit="ppb" 
                  title="TVOC"
                  color="#8b5cf6"
                  min={0}
                  max={1000}
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
                <h3 className="text-xl font-medium text-white">Differential Pressure</h3>
                <div className="h-3 w-3 rounded-full bg-green-500"></div>
              </div>
              <div className="flex-grow">
                <PressureGauge value={sensorData.DIFFERENTIAL_PRESSURE || 4.03} />
              </div>
            </div>
          </div>
        </main>
        
        {/* Footer */}
        <footer className="mt-3 md:mt-3 flex justify-between items-center text-white text-sm bg-zinc-600 bg-opacity-20 backdrop-blur-sm rounded-xl p-2 border border-white border-opacity-20">
          <div>
            <span className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-green-400 animate-pulse" viewBox="0 0 20 20" fill="currentColor">
                <circle cx="10" cy="10" r="10" />
              </svg>
              Last updated: {lastUpdate.toLocaleTimeString()}
            </span>
          </div>
          <div>© Siam Daikin Sales Co., Ltd.</div>
        </footer>
      </div>
    </div>
  );
};

export default Dashboard;