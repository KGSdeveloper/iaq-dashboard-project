// Server with immediate simulation mode for testing
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const ModbusRTU = require('modbus-serial');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

const client = new ModbusRTU();
let isConnected = false;
let connectionAttempts = 0;
const maxRetries = 3;

// Configuration for when you have a sensor (currently disabled)
const MODBUS_CONFIG = {
  name: "Default Config",
  PORT: '/dev/ttyACM0',
  BAUD_RATE: 9600,
  DEVICE_ID: 1,
  PARITY: 'none',
  STOP_BITS: 1
};

const REGISTERS = {
  PM25: 61,
  CO2: 62,
  TEMPERATURE: 63,
  HUMIDITY: 64,
  TVOC: 65
};

// Connection status tracking
let connectedClients = 0;
let lastSensorData = null;
let dataPollingInterval = null;

// Force simulation mode flag - set to true when no sensor available
const FORCE_SIMULATION = true; // Set this to false when you have a real sensor

// Smooth continuous simulation with state persistence
let simulationState = {
  PM25: 6.5,           // Start in middle of range
  CO2: 725,            // Start in middle of range
  TEMPERATURE: 25.0,   // Start in middle of range
  HUMIDITY: 53.5,      // Start in middle of range
  TVOC: 0.225,         // Start in middle of range
  DIFFERENTIAL_PRESSURE: 1.75,  // Start in middle of range
  
  // Trend directions for more realistic behavior
  trends: {
    PM25: 0,
    CO2: 0,
    TEMPERATURE: 0,
    HUMIDITY: 0,
    TVOC: 0,
    DIFFERENTIAL_PRESSURE: 0
  },
  
  // Trend change counters
  trendChanges: {
    PM25: 0,
    CO2: 0,
    TEMPERATURE: 0,
    HUMIDITY: 0,
    TVOC: 0,
    DIFFERENTIAL_PRESSURE: 0
  }
};

function generateSimulatedData() {
  // Define sensor ranges and maximum change per interval
  const sensorConfig = {
    PM25: { min: 4, max: 9, maxChange: 0.15 },
    CO2: { min: 600, max: 850, maxChange: 8 },
    TEMPERATURE: { min: 24, max: 26, maxChange: 0.08 },
    HUMIDITY: { min: 47, max: 60, maxChange: 0.3 },
    TVOC: { min: 0.15, max: 0.3, maxChange: 0.008 },
    DIFFERENTIAL_PRESSURE: { min: 1, max: 2.5, maxChange: 0.05 }
  };

  // Update each sensor value with smooth transitions
  Object.keys(sensorConfig).forEach(sensor => {
    const config = sensorConfig[sensor];
    const currentValue = simulationState[sensor];
    
    // Change trend occasionally for more realistic behavior
    simulationState.trendChanges[sensor]++;
    if (simulationState.trendChanges[sensor] > Math.random() * 20 + 10) {
      simulationState.trends[sensor] = (Math.random() - 0.5) * 2; // -1 to 1
      simulationState.trendChanges[sensor] = 0;
    }
    
    // Calculate smooth change
    const trendInfluence = simulationState.trends[sensor] * 0.3;
    const randomChange = (Math.random() - 0.5) * 2 * config.maxChange;
    const totalChange = (trendInfluence + randomChange) * config.maxChange;
    
    let newValue = currentValue + totalChange;
    
    // Bounce off boundaries smoothly
    if (newValue < config.min) {
      newValue = config.min + (config.min - newValue) * 0.5;
      simulationState.trends[sensor] = Math.abs(simulationState.trends[sensor]); // Reverse trend
    } else if (newValue > config.max) {
      newValue = config.max - (newValue - config.max) * 0.5;
      simulationState.trends[sensor] = -Math.abs(simulationState.trends[sensor]); // Reverse trend
    }
    
    // Ensure we stay within bounds
    newValue = Math.max(config.min, Math.min(config.max, newValue));
    
    simulationState[sensor] = newValue;
  });

  const data = {
    PM25: simulationState.PM25,
    CO2: simulationState.CO2,
    TEMPERATURE: simulationState.TEMPERATURE,
    HUMIDITY: simulationState.HUMIDITY,
    TVOC: simulationState.TVOC,
    DIFFERENTIAL_PRESSURE: simulationState.DIFFERENTIAL_PRESSURE,
    timestamp: new Date().toISOString(),
    connectionStatus: {
      connected: false,
      simulation: true,
      device: 'simulation',
      note: 'Continuous smooth simulation (no sensor connected)'
    }
  };

  // Log the generated data for debugging
  console.log('📊 Continuous simulation data:', {
    PM25: data.PM25.toFixed(2) + ' µg/m³',
    CO2: data.CO2.toFixed(0) + ' ppm',
    TEMP: data.TEMPERATURE.toFixed(1) + ' °C',
    HUM: data.HUMIDITY.toFixed(1) + ' %',
    TVOC: data.TVOC.toFixed(3) + ' mg/m³',
    PRESS: data.DIFFERENTIAL_PRESSURE.toFixed(2) + ' Pa'
  });

  return data;
}

async function connectModbus() {
  // Skip connection attempt if simulation is forced
  if (FORCE_SIMULATION) {
    console.log('🎭 Simulation mode forced - skipping Modbus connection');
    isConnected = false;
    startSimulationMode();
    return false;
  }

  try {
    console.log(`\n🔌 Attempting to connect to Modbus on ${MODBUS_CONFIG.PORT}...`);
    
    await client.connectRTUBuffered(MODBUS_CONFIG.PORT, {
      baudRate: MODBUS_CONFIG.BAUD_RATE,
      dataBits: 8,
      parity: MODBUS_CONFIG.PARITY,
      stopBits: MODBUS_CONFIG.STOP_BITS
    });
    
    client.setID(MODBUS_CONFIG.DEVICE_ID);
    client.setTimeout(5000);
    
    // Test reading a register
    const testResponse = await client.readHoldingRegisters(REGISTERS.PM25, 1);
    
    isConnected = true;
    connectionAttempts = 0;
    console.log(`✅ Connected to Modbus RS485 on ${MODBUS_CONFIG.PORT}`);
    console.log(`📊 Device ID: ${MODBUS_CONFIG.DEVICE_ID}, Baud Rate: ${MODBUS_CONFIG.BAUD_RATE}`);
    
    startDataPolling();
    return true;
    
  } catch (error) {
    connectionAttempts++;
    console.error(`❌ Modbus connection failed (attempt ${connectionAttempts}/${maxRetries}):`, error.message);
    isConnected = false;
    
    if (connectionAttempts < maxRetries) {
      console.log(`🔄 Retrying in ${Math.pow(2, connectionAttempts)} seconds...`);
      setTimeout(() => connectModbus(), Math.pow(2, connectionAttempts) * 1000);
    } else {
      console.log('🔄 Max retries reached. Starting simulation mode.');
      startSimulationMode();
    }
    
    return false;
  }
}

async function readSensorData() {
  if (!isConnected) {
    throw new Error('Modbus not connected');
  }

  try {
    const response = await client.readHoldingRegisters(REGISTERS.PM25, 5);
    const raw = response.data;
    
    return {
      PM25: raw[0] / 100,
      CO2: raw[1],
      TEMPERATURE: raw[2] / 100,
      HUMIDITY: raw[3] / 100,
      TVOC: raw[4],
      DIFFERENTIAL_PRESSURE: generateSimulatedPressure(),
      timestamp: new Date().toISOString(),
      connectionStatus: {
        connected: true,
        simulation: false,
        device: `${MODBUS_CONFIG.PORT}:${MODBUS_CONFIG.DEVICE_ID}`,
        note: 'Real Modbus data + simulated pressure'
      }
    };
    
  } catch (error) {
    console.error('❌ Error reading sensors:', error.message);
    
    if (error.message.includes('Timed out') || error.message.includes('ECONNRESET')) {
      console.log('🔄 Connection lost, attempting to reconnect...');
      isConnected = false;
      setTimeout(() => connectModbus(), 2000);
    }
    
    throw error;
  }
}

function startDataPolling() {
  if (dataPollingInterval) {
    clearInterval(dataPollingInterval);
  }
  
  console.log('🔄 Starting continuous data polling (5-second intervals)...');
  
  dataPollingInterval = setInterval(async () => {
    try {
      let data;
      
      if (isConnected) {
        data = await readSensorData();
      } else {
        data = generateSimulatedData();
      }
      
      lastSensorData = data;
      
      // Always broadcast to all connected clients
      if (connectedClients > 0) {
        io.emit('sensorData', data);
        console.log(`📡 Broadcasted data to ${connectedClients} client(s)`);
      }
      
    } catch (error) {
      console.error('❌ Error in data polling:', error.message);
      
      if (connectedClients > 0) {
        io.emit('sensorError', {
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }
  }, 5000);
}

function startSimulationMode() {
  console.log('🎭 Starting simulation mode...');
  console.log('📊 All sensor data will be simulated with custom ranges:');
  console.log('   - TVOC: 0.15-0.3 mg/m³');
  console.log('   - CO2: 600-850 ppm');
  console.log('   - PM2.5: 4-9 µg/m³');
  console.log('   - Differential Pressure: 1-2.5 Pa');
  console.log('   - Temperature: 24-26°C');
  console.log('   - Humidity: 47-60%');
  
  isConnected = false;
  startDataPolling();
}

// Socket.IO connection handling
io.on('connection', (socket) => {
  connectedClients++;
  console.log(`👤 Client connected. Total clients: ${connectedClients}`);
  
  // Send current status to new client
  socket.emit('connectionStatus', {
    connected: isConnected,
    simulation: !isConnected,
    clients: connectedClients,
    forceSimulation: FORCE_SIMULATION
  });
  
  // Send last sensor data immediately if available
  if (lastSensorData) {
    console.log('📤 Sending last sensor data to new client');
    socket.emit('sensorData', lastSensorData);
  } else {
    // Generate and send immediate data if no cached data
    console.log('📤 Generating immediate data for new client');
    const immediateData = generateSimulatedData();
    socket.emit('sensorData', immediateData);
    lastSensorData = immediateData;
  }
  
  // Handle client data requests
  socket.on('requestData', async () => {
    console.log('📥 Client requested fresh data');
    try {
      const data = isConnected ? await readSensorData() : generateSimulatedData();
      socket.emit('sensorData', data);
    } catch (error) {
      socket.emit('sensorError', { error: error.message });
    }
  });
  
  socket.on('disconnect', () => {
    connectedClients--;
    console.log(`👤 Client disconnected. Total clients: ${connectedClients}`);
    
    // Note: We no longer stop polling when clients disconnect
    // This ensures continuous data generation for when clients reconnect
  });
});

// REST API Routes
app.get('/api/status', (req, res) => {
  res.json({ 
    connected: isConnected,
    simulation: !isConnected,
    forceSimulation: FORCE_SIMULATION,
    port: MODBUS_CONFIG.PORT,
    deviceId: MODBUS_CONFIG.DEVICE_ID,
    config: MODBUS_CONFIG.name,
    clients: connectedClients,
    lastUpdate: lastSensorData?.timestamp || null,
    uptime: process.uptime()
  });
});

app.get('/api/sensors', async (req, res) => {
  try {
    const data = isConnected ? await readSensorData() : generateSimulatedData();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message,
      simulation: true,
      data: generateSimulatedData()
    });
  }
});

app.post('/api/connect', async (req, res) => {
  if (FORCE_SIMULATION) {
    res.json({ 
      success: false, 
      connected: false,
      message: 'Simulation mode forced - sensor connection disabled'
    });
    return;
  }
  
  console.log('🔌 Manual connection request received');
  const success = await connectModbus();
  res.json({ 
    success, 
    connected: isConnected,
    config: MODBUS_CONFIG.name,
    message: success ? 'Connected successfully' : 'Connection failed'
  });
});

app.post('/api/test-config', async (req, res) => {
  if (FORCE_SIMULATION) {
    res.json({
      success: false,
      message: 'Simulation mode forced - configuration test disabled'
    });
    return;
  }
  
  console.log('🧪 Configuration test requested');
  const success = await connectModbus();
  res.json({
    success,
    config: success ? MODBUS_CONFIG.name : null,
    message: success ? 'Configuration test successful' : 'Configuration test failed'
  });
});

// Toggle simulation mode endpoint
app.post('/api/toggle-simulation', (req, res) => {
  const { enabled } = req.body;
  
  if (enabled) {
    console.log('🎭 Switching to simulation mode');
    if (isConnected) {
      client.close().catch(console.error);
      isConnected = false;
    }
    startSimulationMode();
  } else {
    console.log('🔌 Attempting to connect to real sensor');
    connectModbus();
  }
  
  res.json({ 
    success: true, 
    simulation: enabled,
    message: enabled ? 'Switched to simulation mode' : 'Attempting sensor connection'
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  
  if (dataPollingInterval) {
    clearInterval(dataPollingInterval);
    console.log('⏸️ Data polling stopped');
  }
  
  if (isConnected) {
    try {
      await client.close();
      console.log('✅ Modbus connection closed');
    } catch (error) {
      console.error('❌ Error closing Modbus:', error.message);
    }
  }
  
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log('\n🚀 IAQ Backend Server Started (Simulation Mode)');
  console.log(`📡 Server running on http://localhost:${PORT}`);
  console.log(`🎭 Simulation Mode: ${FORCE_SIMULATION ? 'ENABLED' : 'DISABLED'}`);
  
  if (FORCE_SIMULATION) {
    console.log('📊 Will generate simulated data with custom ranges');
    console.log('🔧 To enable real sensor: Set FORCE_SIMULATION = false');
  } else {
    console.log(`🔌 Target Device: ${MODBUS_CONFIG.PORT}`);
    console.log('🧪 Will attempt auto-detection if connection fails');
  }
  
  console.log('\n📝 API endpoints:');
  console.log('   - GET /api/status (server status)');
  console.log('   - GET /api/sensors (current sensor data)');
  console.log('   - POST /api/connect (manual connection)');
  console.log('   - POST /api/toggle-simulation (switch modes)');
  console.log('\n🔄 Starting initial connection/simulation...\n');
  
  // Start immediately
  connectModbus();
});