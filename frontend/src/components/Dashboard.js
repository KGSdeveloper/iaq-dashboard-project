import React, { useState, useEffect } from 'react';
import IAQIndex from './IAQIndex';
import SensorCard from './SensorCard';
import WeatherWidget from './WeatherWidget';
import PressureGauge from './PressureGauge';
import sensorService from '../services/sensorService';
import { SENSOR_RANGES } from '../utils/constants';

const Dashboard = () => {
  const [sensorData, setSensorData] = useState({});
  const [lastUpdate, setLastUpdate] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState({
    connected: false,
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
      setSensorData(data);
      setLastUpdate(new Date(data.timestamp));
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

  const calculateIAQIndex = () => {
    if (!sensorData.PM25 || !sensorData.CO2 || !sensorData.TVOC) return 86;
    const pm25Score = sensorData.PM25 <= 35 ? 50 : Math.min(300, sensorData.PM25 * 3);
    const co2Score = sensorData.CO2 <= 1000 ? 50 : Math.min(300, sensorData.CO2 / 10);
    const tvocScore = sensorData.TVOC <= 300 ? 50 : Math.min(300, sensorData.TVOC / 3);
    const avgScore = (pm25Score + co2Score + tvocScore) / 3;
    return Math.max(0, Math.min(300, Math.round(avgScore)));
  };

  const getIAQLevel = (index) => {
    if (index <= 50) return { label: 'Excellent', color: '#00ff88' };
    if (index <= 100) return { label: 'Good', color: '#74b9ff' };
    if (index <= 150) return { label: 'Moderate', color: '#fdcb6e' };
    if (index <= 200) return { label: 'Poor', color: '#ff7675' };
    return { label: 'Very Poor', color: '#d63031' };
  };

  const iaqIndex = calculateIAQIndex();
  const iaqLevel = getIAQLevel(iaqIndex);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Header */}
      <header className="flex justify-between items-center p-6 glass-morphism border-b border-white/10">
        <div className="text-3xl font-bold text-blue-400 tracking-wider">DAIKIN</div>
        <div className="text-center">
          <div className="text-xl font-semibold">
            {currentTime.toLocaleTimeString('en-US', { 
              hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' 
            })}
          </div>
          <div className="text-sm text-gray-400">
            {currentTime.toLocaleDateString('en-US', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            })}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${connectionStatus.connected ? 'bg-green-400' : 'bg-red-400'} animate-pulse`}></div>
            <span className="text-sm">
              {connectionStatus.connected ? 'Connected' : 'Disconnected'}
              {connectionStatus.simulation && ' (Sim)'}
            </span>
          </div>
          <button onClick={handleRefresh} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            🔄
          </button>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-red-400">⚠️</span>
            <span className="text-red-200">{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">✕</button>
        </div>
      )}

      {/* Main Dashboard Grid */}
      <div className="p-6 h-[calc(100vh-100px)]">
        <div className="grid grid-cols-3 gap-6 h-full">
          
          {/* IAQ Index - Large Card (2 rows) */}
          <div className="row-span-2 glass-card">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 rounded-t-2xl"></div>
            <div className="flex flex-col h-full pt-4">
              <h2 className="text-xl font-medium text-center mb-6 text-gray-200">Indoor Air Quality</h2>
              <div className="flex-1 flex items-center justify-center">
                <IAQIndex value={iaqIndex} level={iaqLevel} size="large" />
              </div>
              <div className="text-center text-lg text-gray-300 mt-4">
                {iaqLevel.label} air quality
              </div>
            </div>
          </div>

          {/* Temperature Card */}
          <div className="glass-card">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-400 to-orange-500 rounded-t-2xl"></div>
            <div className="pt-4 h-full">
              <SensorCard
                title="Temperature"
                value={sensorData.TEMPERATURE || 22.9}
                unit="°C"
                icon="🌡️"
                sensorType="TEMPERATURE"
                cardType="temperature"
              />
            </div>
          </div>

          {/* Humidity Card */}
          <div className="glass-card">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-t-2xl"></div>
            <div className="pt-4 h-full">
              <SensorCard
                title="Humidity"
                value={sensorData.HUMIDITY || 53.47}
                unit="%"
                icon="💧"
                sensorType="HUMIDITY"
                cardType="humidity"
              />
            </div>
          </div>

          {/* CO2 Card */}
          <div className="glass-card">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-t-2xl"></div>
            <div className="pt-4 h-full">
              <SensorCard
                title="Carbon Dioxide"
                value={sensorData.CO2 || 656.53}
                unit="ppm"
                icon="🫁"
                sensorType="CO2"
                cardType="standard"
              />
            </div>
          </div>

          {/* PM2.5 Card */}
          <div className="glass-card">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-emerald-600 rounded-t-2xl"></div>
            <div className="pt-4 h-full">
              <SensorCard
                title="Particulate Matter"
                value={sensorData.PM25 || 16.60}
                unit="μg/m³"
                icon="🌫️"
                sensorType="PM25"
                cardType="standard"
              />
            </div>
          </div>

          {/* Weather Widget */}
          <div className="glass-card">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-t-2xl"></div>
            <div className="pt-4 h-full">
              <WeatherWidget
                location="Pathumwan, Bangkok"
                temperature={31.39}
                humidity={64.31}
                condition="Sunny"
              />
            </div>
          </div>

          {/* TVOC Card */}
          <div className="glass-card">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-600 rounded-t-2xl"></div>
            <div className="pt-4 h-full">
              <SensorCard
                title="Volatile Compounds"
                value={sensorData.TVOC || 328.01}
                unit="mg/m³"
                icon="🧪"
                sensorType="TVOC"
                cardType="standard"
              />
            </div>
          </div>

          {/* Differential Pressure */}
          <div className="glass-card">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-pink-600 rounded-t-2xl"></div>
            <div className="pt-4 h-full">
              <PressureGauge value={sensorData.DIFFERENTIAL_PRESSURE || 4.03} unit="Pa" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;