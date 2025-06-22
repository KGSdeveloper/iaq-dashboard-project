import modbusService from './modbusService.js';
import iaqCalculator from './iaqCalculator.js';
import { getRandomInRange, getCurrentTimestamp } from '../utils/helpers.js';

class SensorService {
  constructor() {
    this.isRunning = false;
    this.updateInterval = null;
    this.subscribers = [];
    this.currentData = {};
  }

  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  notifySubscribers(data) {
    this.subscribers.forEach(callback => callback(data));
  }

  async startMonitoring(intervalMs = 5000) {
    if (this.isRunning) return;

    this.isRunning = true;
    
    // Try to connect to Modbus device
    const connected = await modbusService.connect();
    
    this.updateInterval = setInterval(async () => {
      try {
        let sensorData;
        
        if (connected) {
          // Try to read real sensor data
          try {
            sensorData = await modbusService.readSensorData();
          } catch (error) {
            console.warn('Failed to read from Modbus, using simulated data:', error);
            sensorData = modbusService.simulateSensorData();
          }
        } else {
          // Use simulated data
          sensorData = modbusService.simulateSensorData();
        }

        // Add differential pressure (simulated)
        sensorData.DIFFERENTIAL_PRESSURE = getRandomInRange(2, 8);

        // Calculate IAQ Index
        const iaqResult = iaqCalculator.calculateIAQIndex(sensorData);

        // Prepare complete data object
        const completeData = {
          ...sensorData,
          IAQ_INDEX: iaqResult.index,
          IAQ_LEVEL: iaqResult.level,
          IAQ_COMPONENTS: iaqResult.components,
          timestamp: getCurrentTimestamp(),
          location: 'Pathumwan, Bangkok' // You can make this configurable
        };

        this.currentData = completeData;
        this.notifySubscribers(completeData);

      } catch (error) {
        console.error('Error in sensor monitoring:', error);
      }
    }, intervalMs);

    console.log(`Sensor monitoring started with ${intervalMs}ms interval`);
  }

  async stopMonitoring() {
    if (!this.isRunning) return;

    this.isRunning = false;
    
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    await modbusService.disconnect();
    console.log('Sensor monitoring stopped');
  }

  getCurrentData() {
    return this.currentData;
  }
}

export default new SensorService();