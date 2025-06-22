export const SENSOR_TYPES = {
  PM25: 'PM2.5',
  CO2: 'CO2',
  TEMPERATURE: 'Temperature',
  HUMIDITY: 'Humidity',
  TVOC: 'TVOC'
};

export const MODBUS_CONFIG = {
  DEVICE_ADDRESS: 1,
  REGISTERS: {
    PM25: 61,
    CO2: 62,
    TEMPERATURE: 63,
    HUMIDITY: 64,
    TVOC: 65
  }
};

export const IAQ_LEVELS = {
  EXCELLENT: { min: 0, max: 50, color: '#10B981', label: 'Excellent' },
  GOOD: { min: 51, max: 100, color: '#3B82F6', label: 'Good' },
  MODERATE: { min: 101, max: 150, color: '#F59E0B', label: 'Moderate' },
  POOR: { min: 151, max: 200, color: '#EF4444', label: 'Poor' },
  VERY_POOR: { min: 201, max: 300, color: '#7C2D12', label: 'Very Poor' }
};

export const SENSOR_RANGES = {
  PM25: { min: 0, max: 500, unit: 'µg/m³', good: 35 },
  CO2: { min: 300, max: 5000, unit: 'ppm', good: 1000 },
  TEMPERATURE: { min: -10, max: 50, unit: '°C', good: { min: 20, max: 26 } },
  HUMIDITY: { min: 0, max: 100, unit: '%', good: { min: 40, max: 60 } },
  TVOC: { min: 0, max: 2000, unit: 'ppb', good: 300 },
  DIFFERENTIAL_PRESSURE: { min: 0, max: 10, unit: 'Pa' }
};