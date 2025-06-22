import { SENSOR_RANGES } from './constants';

export const formatValue = (value, decimals = 2) => {
  return parseFloat(value).toFixed(decimals);
};

export const getRandomInRange = (min, max) => {
  return Math.random() * (max - min) + min;
};

export const getCurrentTimestamp = () => {
  return new Date().toISOString();
};

export const getSensorStatus = (sensorType, value) => {
  const ranges = SENSOR_RANGES[sensorType];
  if (!ranges) return 'unknown';
  
  switch (sensorType) {
    case 'PM25':
      return value <= ranges.good ? 'excellent' : 
             value <= ranges.good * 2 ? 'good' : 
             value <= ranges.good * 3 ? 'moderate' : 'poor';
    case 'CO2':
      return value <= ranges.good ? 'excellent' : 
             value <= ranges.good * 1.5 ? 'good' : 
             value <= ranges.good * 2 ? 'moderate' : 'poor';
    case 'TEMPERATURE':
      return (value >= ranges.good.min && value <= ranges.good.max) ? 'excellent' : 'moderate';
    case 'HUMIDITY':
      return (value >= ranges.good.min && value <= ranges.good.max) ? 'excellent' : 'moderate';
    case 'TVOC':
      return value <= ranges.good ? 'excellent' : 
             value <= ranges.good * 2 ? 'good' : 
             value <= ranges.good * 3 ? 'moderate' : 'poor';
    default:
      return 'unknown';
  }
};