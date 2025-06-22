import io from 'socket.io-client';

class SensorService {
  constructor() {
    this.subscribers = [];
    this.socket = null;
    this.backendUrl = 'http://localhost:3001';
    this.isConnected = false;
    this.isSimulating = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.currentData = {
      PM25: 16.60,
      CO2: 656.53,
      TEMPERATURE: 22.9,
      HUMIDITY: 53.47,
      TVOC: 328.01,
      DIFFERENTIAL_PRESSURE: 4.03,
      timestamp: Date.now(),
      connectionStatus: {
        connected: false,
        simulation: true
      }
    };
  }

  // Initialize WebSocket connection
  async connect() {
    try {
      console.log('🔌 Connecting to backend...');
      
      this.socket = io(this.backendUrl, {
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000
      });

      this.setupSocketListeners();
      
      return new Promise((resolve) => {
        this.socket.on('connect', () => {
          console.log('✅ Connected to backend');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.notifyConnectionStatus();
          resolve(true);
        });

        this.socket.on('connect_error', (error) => {
          console.warn('⚠️ Backend connection failed, using simulation:', error.message);
          this.handleConnectionError();
          resolve(false);
        });
      });
    } catch (error) {
      console.error('❌ Connection error:', error);
      this.handleConnectionError();
      return false;
    }
  }

  setupSocketListeners() {
    // Handle incoming sensor data
    this.socket.on('sensorData', (data) => {
      const dataSource = data.connectionStatus?.simulation ? 
        'Backend simulation (Modbus disconnected)' : 
        'Real Modbus data + simulated pressure';
      
      console.log(`📊 Received sensor data (${dataSource}):`, data);
      
      this.currentData = {
        ...data,
        timestamp: Date.now()
      };
      this.isSimulating = data.connectionStatus?.simulation || false;
      this.notifySubscribers(this.currentData);
    });

    // Handle connection status updates
    this.socket.on('connectionStatus', (status) => {
      console.log('📡 Connection status:', status);
      this.isConnected = status.connected;
      this.isSimulating = status.simulation;
      this.notifyConnectionStatus();
    });

    // Handle sensor errors
    this.socket.on('sensorError', (error) => {
      console.error('❌ Sensor error:', error);
      this.notifySubscribers({
        ...this.currentData,
        error: error.error,
        timestamp: Date.now()
      });
    });

    // Handle disconnection
    this.socket.on('disconnect', (reason) => {
      console.warn('🔌 Disconnected from backend:', reason);
      this.isConnected = false;
      this.handleConnectionError();
    });

    // Handle reconnection
    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`✅ Reconnected to backend (attempt ${attemptNumber})`);
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.notifyConnectionStatus();
    });

    this.socket.on('reconnect_error', (error) => {
      this.reconnectAttempts++;
      console.warn(`⚠️ Reconnection failed (${this.reconnectAttempts}/${this.maxReconnectAttempts}):`, error.message);
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.log('🎭 Max reconnection attempts reached, switching to simulation');
        this.handleConnectionError();
      }
    });
  }

  handleConnectionError() {
    this.isConnected = false;
    this.isSimulating = true;
    this.startSimulationMode();
    this.notifyConnectionStatus();
  }

  startSimulationMode() {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
    }

    console.log('🎭 Starting frontend simulation mode (backend unavailable)');
    console.log('📊 All sensor data simulated locally');
    
    // Generate simulated data every 5 seconds
    this.simulationInterval = setInterval(() => {
      const simulatedData = this.generateSimulatedData();
      this.currentData = simulatedData;
      this.notifySubscribers(simulatedData);
    }, 5000);
  }

  generateSimulatedData() {
    // Base values matching your screenshot - used only when backend is unavailable
    const baseData = {
      PM25: 16.60,
      CO2: 656.53,
      TEMPERATURE: 22.9,
      HUMIDITY: 53.47,
      TVOC: 328.01,
      DIFFERENTIAL_PRESSURE: 4.03
    };

    // Add realistic variations to all values
    return {
      PM25: Math.max(0, baseData.PM25 + (Math.random() - 0.5) * 2),
      CO2: Math.max(300, baseData.CO2 + (Math.random() - 0.5) * 50),
      TEMPERATURE: baseData.TEMPERATURE + (Math.random() - 0.5) * 1,
      HUMIDITY: Math.max(0, Math.min(100, baseData.HUMIDITY + (Math.random() - 0.5) * 3)),
      TVOC: Math.max(0, baseData.TVOC + (Math.random() - 0.5) * 20),
      DIFFERENTIAL_PRESSURE: Math.max(0, baseData.DIFFERENTIAL_PRESSURE + (Math.random() - 0.5) * 0.5),
      timestamp: Date.now(),
      connectionStatus: {
        connected: false,
        simulation: true,
        note: 'Frontend simulation (backend unavailable)'
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

  // Notify all subscribers of data updates
  notifySubscribers(data) {
    this.subscribers.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('❌ Error in subscriber callback:', error);
      }
    });
  }

  // Notify subscribers of connection status changes
  notifyConnectionStatus() {
    const statusUpdate = {
      ...this.currentData,
      connectionStatus: {
        connected: this.isConnected,
        simulation: this.isSimulating
      }
    };
    this.notifySubscribers(statusUpdate);
  }

  // Start monitoring sensors
  async startMonitoring(interval = 5000) {
    console.log('🔄 Starting sensor monitoring...');
    
    // Connect to backend
    await this.connect();
    
    // Request initial data
    if (this.socket && this.isConnected) {
      this.socket.emit('requestData');
    }
    
    console.log(`📊 Monitoring started (${interval}ms intervals)`);
  }

  // Stop monitoring
  stopMonitoring() {
    console.log('⏸️ Stopping sensor monitoring');
    
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
    
    this.isConnected = false;
  }

  // Manual refresh
  async refreshData() {
    if (this.socket && this.isConnected) {
      console.log('🔄 Requesting fresh sensor data...');
      this.socket.emit('requestData');
    } else {
      console.log('🎭 Generating fresh simulation data...');
      const data = this.generateSimulatedData();
      this.currentData = data;
      this.notifySubscribers(data);
    }
  }

  // Get current data
  getCurrentData() {
    return this.currentData;
  }

  // Get connection status
  getConnectionStatus() {
    return {
      connected: this.isConnected,
      simulation: this.isSimulating,
      hasSocket: !!this.socket
    };
  }

  // Force simulation mode
  setSimulationMode(enabled) {
    if (enabled && !this.isSimulating) {
      console.log('🎭 Switching to simulation mode');
      this.isSimulating = true;
      this.startSimulationMode();
    } else if (!enabled && this.isSimulating) {
      console.log('📡 Attempting to connect to real sensors');
      if (this.simulationInterval) {
        clearInterval(this.simulationInterval);
        this.simulationInterval = null;
      }
      this.connect();
    }
  }

  // Check if backend is available
  async checkBackendHealth() {
    try {
      const response = await fetch(`${this.backendUrl}/api/health`);
      const health = await response.json();
      return health;
    } catch (error) {
      console.warn('⚠️ Backend health check failed:', error.message);
      return null;
    }
  }
}

// Export singleton instance
const sensorService = new SensorService();
export default sensorService;