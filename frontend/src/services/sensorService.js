class SensorService {
  constructor() {
    this.subscribers = [];
    this.intervalId = null;
    this.isSimulating = true;
    this.currentData = {
      PM25: 16.60,
      CO2: 656.53,
      TEMPERATURE: 22.9,
      HUMIDITY: 53.47,
      TVOC: 328.01,
      DIFFERENTIAL_PRESSURE: 4.03,
      timestamp: Date.now(),
      connectionStatus: {
        connected: true,
        simulation: true
      }
    };
  }

  // Subscribe to sensor data updates
  subscribe(callback) {
    this.subscribers.push(callback);
    
    // Immediately send current data to new subscriber
    callback(this.currentData);
    
    // Return unsubscribe function
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  // Notify all subscribers
  notifySubscribers(data) {
    this.subscribers.forEach(callback => callback(data));
  }

  // Start monitoring sensors
  startMonitoring(interval = 5000) {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    this.intervalId = setInterval(() => {
      this.fetchSensorData();
    }, interval);

    // Initial fetch
    this.fetchSensorData();
  }

  // Stop monitoring
  stopMonitoring() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  // Fetch sensor data (real or simulated)
  async fetchSensorData() {
    try {
      let data;
      
      if (this.isSimulating) {
        data = this.generateSimulatedData();
      } else {
        data = await this.fetchRealSensorData();
      }

      this.currentData = {
        ...data,
        timestamp: Date.now(),
        connectionStatus: {
          connected: true,
          simulation: this.isSimulating
        }
      };

      this.notifySubscribers(this.currentData);
    } catch (error) {
      console.error('Error fetching sensor data:', error);
      
      this.notifySubscribers({
        ...this.currentData,
        error: 'Failed to fetch sensor data',
        connectionStatus: {
          connected: false,
          simulation: this.isSimulating
        }
      });
    }
  }

  // Generate simulated data with realistic variations
  generateSimulatedData() {
    const baseData = {
      PM25: 16.60,
      CO2: 656.53,
      TEMPERATURE: 22.9,
      HUMIDITY: 53.47,
      TVOC: 328.01,
      DIFFERENTIAL_PRESSURE: 4.03
    };

    // Add small random variations
    return {
      PM25: this.addVariation(baseData.PM25, 0.5),
      CO2: this.addVariation(baseData.CO2, 10),
      TEMPERATURE: this.addVariation(baseData.TEMPERATURE, 0.2),
      HUMIDITY: this.addVariation(baseData.HUMIDITY, 1),
      TVOC: this.addVariation(baseData.TVOC, 5),
      DIFFERENTIAL_PRESSURE: this.addVariation(baseData.DIFFERENTIAL_PRESSURE, 0.1)
    };
  }

  // Add random variation to a value
  addVariation(baseValue, maxVariation) {
    const variation = (Math.random() - 0.5) * 2 * maxVariation;
    return Math.max(0, baseValue + variation);
  }

  // Fetch real sensor data from hardware/API
  async fetchRealSensorData() {
    // This would connect to your actual sensor hardware
    // For now, return simulated data
    
    try {
      // Example API call
      // const response = await fetch('/api/sensors');
      // return await response.json();
      
      // Or Modbus connection
      // const modbusData = await this.readModbusData();
      // return modbusData;
      
      // For now, return simulated data
      return this.generateSimulatedData();
    } catch (error) {
      throw new Error('Failed to connect to sensor hardware');
    }
  }

  // Read data from Modbus devices
  async readModbusData() {
    // This would use modbus-serial library to read from actual devices
    // Implementation depends on your specific hardware setup
    
    /*
    const ModbusRTU = require("modbus-serial");
    const client = new ModbusRTU();
    
    try {
      await client.connectTCP("192.168.1.100", { port: 502 });
      client.setID(1);
      
      const pm25 = await client.readHoldingRegisters(61, 1);
      const co2 = await client.readHoldingRegisters(62, 1);
      const temp = await client.readHoldingRegisters(63, 1);
      const humidity = await client.readHoldingRegisters(64, 1);
      const tvoc = await client.readHoldingRegisters(65, 1);
      
      client.close();
      
      return {
        PM25: pm25.data[0] / 100,
        CO2: co2.data[0],
        TEMPERATURE: temp.data[0] / 100,
        HUMIDITY: humidity.data[0] / 100,
        TVOC: tvoc.data[0],
        DIFFERENTIAL_PRESSURE: 4.03 // From separate sensor
      };
    } catch (error) {
      client.close();
      throw error;
    }
    */
    
    return this.generateSimulatedData();
  }

  // Manual refresh
  async refreshData() {
    await this.fetchSensorData();
  }

  // Toggle between real and simulated data
  setSimulationMode(enabled) {
    this.isSimulating = enabled;
    this.currentData.connectionStatus.simulation = enabled;
  }

  // Get current data
  getCurrentData() {
    return this.currentData;
  }
}

// Export singleton instance
const sensorService = new SensorService();
export default sensorService;