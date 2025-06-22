class ModbusService {
  constructor() {
    this.isConnected = false;
    this.backendUrl = 'http://localhost:3001';
    this.useSimulation = false;
  }

  async connect() {
    try {
      // Check if backend is running
      const response = await fetch(`${this.backendUrl}/api/status`);
      const status = await response.json();
      
      if (status.connected) {
        this.isConnected = true;
        this.useSimulation = false;
        console.log('✅ Connected to real Modbus device');
        return true;
      } else {
        // Try to connect
        const connectResponse = await fetch(`${this.backendUrl}/api/connect`, {
          method: 'POST'
        });
        const result = await connectResponse.json();
        
        if (result.success) {
          this.isConnected = true;
          this.useSimulation = false;
          console.log('✅ Connected to Modbus device');
          return true;
        } else {
          throw new Error('Connection failed');
        }
      }
    } catch (error) {
      console.log('⚠️ Backend not available, using simulation');
      this.useSimulation = true;
      this.isConnected = true;
      return true;
    }
  }

  async readSensorData() {
    if (this.useSimulation) {
      return this.simulateSensorData();
    }

    try {
      const response = await fetch(`${this.backendUrl}/api/sensors`);
      const result = await response.json();
      
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.log('📡 Error reading from backend, using simulation');
      this.useSimulation = true;
      return this.simulateSensorData();
    }
  }

  simulateSensorData() {
    return {
      PM25: 16.60 + (Math.random() - 0.5) * 10,
      CO2: 656.53 + (Math.random() - 0.5) * 200,
      TEMPERATURE: 22.9 + (Math.random() - 0.5) * 4,
      HUMIDITY: 53.47 + (Math.random() - 0.5) * 10,
      TVOC: 328.01 + (Math.random() - 0.5) * 100,
      timestamp: new Date().toISOString()
    };
  }

  generateDifferentialPressure() {
    return Math.random() * 6 + 2; // 2-8 Pa
  }

  getConnectionStatus() {
    return {
      connected: this.isConnected,
      simulation: this.useSimulation
    };
  }

  async disconnect() {
    this.isConnected = false;
  }
}

export default new ModbusService();