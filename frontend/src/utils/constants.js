// Enhanced Constants for IAQ Dashboard
// /frontend/src/utils/constants.js

export const SENSOR_TYPES = {
  PM25: 'PM2.5',
  CO2: 'CO2',
  TEMPERATURE: 'Temperature',
  HUMIDITY: 'Humidity',
  TVOC: 'TVOC',
  DIFFERENTIAL_PRESSURE: 'Differential Pressure'
};


// Enhanced sensor ranges with status thresholds
export const SENSOR_RANGES = {
  PM25: { 
    min: 0, 
    max: 50, 
    unit: 'µg/m³', 
    good: { min: 0, max: 15 },
    warning: { min: 15, max: 30 },
    danger: { min: 30, max: 50 },
    decimals: 1
  },
  CO2: { 
    min: 0, 
    max: 5000, 
    unit: 'ppm', 
    good: { min: 0, max: 1200 },
    warning: { min: 1200, max: 2000 },
    danger: { min: 2000, max: 5000 },
    decimals: 0
  },
  TEMPERATURE: { 
    min: -10, 
    max: 50, 
    unit: '°C', 
    good: { min: 20, max: 28 },
    warning: { min: 15, max: 32 },
    danger: { min: -10, max: 50 },
    decimals: 1
  },
  HUMIDITY: { 
    min: 0, 
    max: 100, 
    unit: '%', 
    good: { min: 40, max: 60 },
    warning: { min: 30, max: 70 },
    danger: { min: 0, max: 100 },
    decimals: 1
  },
  TVOC: { 
    min: 0, 
    max: 5, 
    unit: 'mg/m³', 
    good: { min: 0, max: 0.3 },
    warning: { min: 0.3, max: 3 },
    danger: { min: 3, max: 10 },
    decimals: 2
  },
  DIFFERENTIAL_PRESSURE: { 
    min: -3, 
    max: 5, 
    unit: 'Pa',
    good: { min: 0.1, max: 5 },
    warning: { min: -1, max: 0 },
    danger: { min: -3, max: -1 },
    decimals: 2
  }
};

// IAQ Index calculation ranges
export const IAQ_LEVELS = {
  EXCELLENT: { 
    min: 80, 
    max: 100, 
    color: '#10B981', 
    bgColor: 'from-green-500 to-green-600',
    textColor: 'text-green-400',
    label: 'Excellent',
    icon: '😊',
    description: 'Outstanding air quality'
  },
  GOOD: { 
    min: 60, 
    max: 79, 
    color: '#3B82F6', 
    bgColor: 'from-blue-500 to-blue-600',
    textColor: 'text-blue-400',
    label: 'Good',
    icon: '🙂',
    description: 'Good air quality'
  },
  MODERATE: { 
    min: 40, 
    max: 59, 
    color: '#F59E0B', 
    bgColor: 'from-yellow-500 to-yellow-600',
    textColor: 'text-yellow-400',
    label: 'Moderate',
    icon: '😐',
    description: 'Acceptable air quality'
  },
  POOR: { 
    min: 20, 
    max: 39, 
    color: '#F97316', 
    bgColor: 'from-orange-500 to-orange-600',
    textColor: 'text-orange-400',
    label: 'Poor',
    icon: '😷',
    description: 'Poor air quality'
  },
  CRITICAL: { 
    min: 0, 
    max: 19, 
    color: '#EF4444', 
    bgColor: 'from-red-500 to-red-600',
    textColor: 'text-red-400',
    label: 'Critical',
    icon: '🚨',
    description: 'Critical air quality'
  }
};

// Status colors for indicators
export const STATUS_COLORS = {
  GOOD: {
    color: '#10B981',
    bgColor: 'bg-green-500',
    textColor: 'text-green-400',
    shadowColor: '0 0 15px rgba(16, 185, 129, 0.5)'
  },
  WARNING: {
    color: '#F59E0B',
    bgColor: 'bg-yellow-500',
    textColor: 'text-yellow-400',
    shadowColor: '0 0 15px rgba(245, 158, 11, 0.5)'
  },
  DANGER: {
    color: '#EF4444',
    bgColor: 'bg-red-500',
    textColor: 'text-red-400',
    shadowColor: '0 0 15px rgba(239, 68, 68, 0.5)'
  }
};

// Weather configuration
export const WEATHER_CONFIG = {
  location: 'Pathumwan, Bangkok',
  defaultTemperature: 31.39,
  defaultHumidity: 64.31,
  defaultCondition: 'Sunny'
};

// IAQ calculation weights for different sensors
export const IAQ_WEIGHTS = {
  PM25: 0.25,
  CO2: 0.25,
  TVOC: 0.20,
  HUMIDITY: 0.15,
  TEMPERATURE: 0.15
};

// Helper function to get status based on sensor value
export const getSensorStatus = (sensorType, value) => {
  const range = SENSOR_RANGES[sensorType];
  if (!range) return STATUS_COLORS.GOOD;
  
  if (value >= range.good.min && value <= range.good.max) {
    return STATUS_COLORS.GOOD;
  } else if (
    (value >= (range.warning?.min || range.good.min - 10) && value <= (range.warning?.max || range.good.max + 10)) ||
    (value < range.good.min && value >= (range.warning?.min || range.good.min - 10)) ||
    (value > range.good.max && value <= (range.warning?.max || range.good.max + 10))
  ) {
    return STATUS_COLORS.WARNING;
  } else {
    return STATUS_COLORS.DANGER;
  }
};

// Helper function to calculate IAQ index
export const calculateIAQ = (sensorData) => {
  if (!sensorData) return 86; // Default value
  
  let totalScore = 0;
  let totalWeight = 0;

  Object.entries(IAQ_WEIGHTS).forEach(([sensor, weight]) => {
    const value = sensorData[sensor];
    const range = SENSOR_RANGES[sensor];
    
    if (value !== undefined && range) {
      // Normalize value to 0-100 score
      let score;
      const goodRange = range.good;
      
      if (value >= goodRange.min && value <= goodRange.max) {
        score = 100; // Perfect score in good range
      } else {
        // Calculate distance from good range
        const distanceFromGood = Math.min(
          Math.abs(value - goodRange.min),
          Math.abs(value - goodRange.max)
        );
        const maxDistance = Math.max(
          goodRange.min - range.min,
          range.max - goodRange.max
        );
        score = Math.max(0, 100 - (distanceFromGood / maxDistance) * 100);
      }
      
      totalScore += score * weight;
      totalWeight += weight;
    }
  });

  return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 86;
};

// Helper function to get IAQ status
export const getIAQStatus = (iaqValue) => {
  for (const [key, level] of Object.entries(IAQ_LEVELS)) {
    if (iaqValue >= level.min && iaqValue <= level.max) {
      return level;
    }
  }
  return IAQ_LEVELS.MODERATE; // Default fallback
};
