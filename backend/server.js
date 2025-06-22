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

// Modbus Configuration - Update these for your devices
const MODBUS_CONFIG = {
  PORT: 'COM3',        // Update to your COM port
  BAUD_RATE: 9600,     // Update to your device baud rate
  DEVICE_ID: 1,        // Update to your device address
  REGISTERS: {
    PM25: 61,          // PM2.5 sensor register
    CO2: 62,           // CO2 sensor register  
    TEMPERATURE: 63,   // Temperature sensor register
    HUMIDITY: 64,      // Humidity sensor register
    TVOC: 65           // TVOC sensor register
    // NOTE: Differential pressure is always simulated (no hardware sensor)
  }
};

// Connection status tracking
let connectedClients = 0;
let lastSensorData = null;
let dataPollingInterval = null;

async function connectModbus() {
  try {
    console.log(`🔌 Attempting to connect to Modbus on ${MODBUS_CONFIG.PORT}...`);
    
    await client.connectRTUBuffered(MODBUS_CONFIG.PORT, {
      baudRate: MODBUS_CONFIG.BAUD_RATE,
      dataBits: 8,
      parity: 'none',
      stopBits: 1
    });
    
    client.setID(MODBUS_CONFIG.DEVICE_ID);
    client.setTimeout(5000);
    
    isConnected = true;
    connectionAttempts = 0;
    console.log(`✅ Connected to Modbus RS485 on ${MODBUS_CONFIG.PORT}`);
    console.log(`📊 Device ID: ${MODBUS_CONFIG.DEVICE_ID}, Baud Rate: ${MODBUS_CONFIG.BAUD_RATE}`);
    
    // Start data polling when connected
    startDataPolling();
    
    return true;
  } catch (error) {
    connectionAttempts++;
    console.error(`❌ Modbus connection failed (attempt ${connectionAttempts}/${maxRetries}):`, error.message);
    isConnected = false;
    
    // Retry connection with exponential backoff
    if (connectionAttempts < maxRetries) {
      setTimeout(() => connectModbus(), Math.pow(2, connectionAttempts) * 1000);
    } else {
      console.log('🔄 Max retries reached. Starting with simulation mode.');
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
    // Read 5 sensor registers from Modbus device
    const response = await client.readHoldingRegisters(
      MODBUS_CONFIG.REGISTERS.PM25, 
      5 // Read 5 consecutive registers (PM25, CO2, TEMP, HUM, TVOC)
    );
    
    const raw = response.data;
    
    // Real data from Modbus + simulated differential pressure
    const sensorData = {
      // Real Modbus data with scaling factors
      PM25: raw[0] / 100,                    // Scale factor for PM2.5
      CO2: raw[1],                           // CO2 usually no scaling
      TEMPERATURE: raw[2] / 100,             // Temperature scale factor
      HUMIDITY: raw[3] / 100,                // Humidity scale factor  
      TVOC: raw[4],                          // TVOC usually no scaling
      
      // Always simulated (no hardware sensor)
      DIFFERENTIAL_PRESSURE: generateSimulatedPressure(),
      
      timestamp: new Date().toISOString(),
      connectionStatus: {
        connected: true,
        simulation: false,
        device: `${MODBUS_CONFIG.PORT}:${MODBUS_CONFIG.DEVICE_ID}`,
        note: 'Real Modbus data + simulated pressure'
      }
    };
    
    console.log('📊 Sensor data read:', {
      PM25: sensorData.PM25.toFixed(2) + ' (real)',
      CO2: sensorData.CO2.toFixed(0) + ' (real)',
      TEMP: sensorData.TEMPERATURE.toFixed(1) + ' (real)',
      HUM: sensorData.HUMIDITY.toFixed(1) + ' (real)',
      TVOC: sensorData.TVOC.toFixed(0) + ' (real)',
      PRESS: sensorData.DIFFERENTIAL_PRESSURE.toFixed(2) + ' (simulated)'
    });
    
    return sensorData;
    
  } catch (error) {
    console.error('❌ Error reading sensors:', error.message);
    
    // If read fails, try to reconnect
    if (error.message.includes('Timed out') || error.message.includes('ECONNRESET')) {
      console.log('🔄 Connection lost, attempting to reconnect...');
      isConnected = false;
      setTimeout(() => connectModbus(), 2000);
    }
    
    throw error;
  }
}

// Generate simulated differential pressure (always used)
function generateSimulatedPressure() {
  // Base value with realistic variation
  const baseValue = 4.03;
  return Math.max(0, baseValue + (Math.random() - 0.5) * 0.5);
}

function generateSimulatedData() {
  // Base values matching your screenshot - ALL SIMULATED when device not connected
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
    timestamp: new Date().toISOString(),
    connectionStatus: {
      connected: false,
      simulation: true,
      device: 'simulation',
      note: 'All data simulated (Modbus device not connected)'
    }
  };
}

function startDataPolling() {
  if (dataPollingInterval) {
    clearInterval(dataPollingInterval);
  }
  
  // Poll sensor data every 5 seconds
  dataPollingInterval = setInterval(async () => {
    try {
      let data;
      
      if (isConnected) {
        data = await readSensorData();
      } else {
        data = generateSimulatedData();
      }
      
      lastSensorData = data;
      
      // Broadcast to all connected clients
      io.emit('sensorData', data);
      
    } catch (error) {
      console.error('❌ Error in data polling:', error.message);
      
      // Send error to clients
      io.emit('sensorError', {
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }, 5000);
  
  console.log('🔄 Data polling started (5-second intervals)');
}

function startSimulationMode() {
  console.log('🎭 Starting full simulation mode (Modbus device not available)...');
  console.log('📊 All sensor data will be simulated');
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
    clients: connectedClients
  });
  
  // Send last sensor data if available
  if (lastSensorData) {
    socket.emit('sensorData', lastSensorData);
  }
  
  // Handle client requests
  socket.on('requestData', async () => {
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
    
    // Stop polling if no clients connected
    if (connectedClients === 0 && dataPollingInterval) {
      clearInterval(dataPollingInterval);
      dataPollingInterval = null;
      console.log('⏸️ Data polling stopped (no clients)');
    }
  });
});

// REST API Routes for manual requests
app.get('/api/status', (req, res) => {
  res.json({ 
    connected: isConnected,
    simulation: !isConnected,
    port: MODBUS_CONFIG.PORT,
    deviceId: MODBUS_CONFIG.DEVICE_ID,
    clients: connectedClients,
    lastUpdate: lastSensorData?.timestamp || null
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
  console.log('🔌 Manual connection request received');
  const success = await connectModbus();
  res.json({ 
    success, 
    connected: isConnected,
    message: success ? 'Connected successfully' : 'Connection failed'
  });
});

app.post('/api/disconnect', async (req, res) => {
  try {
    if (isConnected) {
      await client.close();
      isConnected = false;
      console.log('🔌 Modbus connection closed');
    }
    
    if (dataPollingInterval) {
      clearInterval(dataPollingInterval);
      dataPollingInterval = null;
    }
    
    res.json({ success: true, message: 'Disconnected successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'running',
    uptime: process.uptime(),
    modbus: isConnected ? 'connected' : 'disconnected',
    clients: connectedClients
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  
  if (dataPollingInterval) {
    clearInterval(dataPollingInterval);
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
  console.log('\n🚀 IAQ Backend Server Started');
  console.log(`📡 Server running on http://localhost:${PORT}`);
  console.log(`🔌 Modbus Port: ${MODBUS_CONFIG.PORT}`);
  console.log(`⚙️  Device ID: ${MODBUS_CONFIG.DEVICE_ID}`);
  console.log(`📊 Baud Rate: ${MODBUS_CONFIG.BAUD_RATE}`);
  console.log('📝 Data Sources:');
  console.log('   - PM2.5, CO2, Temp, Humidity, TVOC: Modbus (when connected)');
  console.log('   - Differential Pressure: Always simulated');
  console.log('   - All data: Simulated when Modbus disconnected');
  console.log('🔄 Attempting initial Modbus connection...\n');
  
  // Attempt initial connection
  connectModbus();
});