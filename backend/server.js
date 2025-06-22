const express = require('express');
const ModbusRTU = require('modbus-serial');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const client = new ModbusRTU();
let isConnected = false;

// TODO: UPDATE THESE SETTINGS FOR YOUR DEVICE
const MODBUS_CONFIG = {
  PORT: 'COM3',        // ← CHANGE THIS to your COM port
  BAUD_RATE: 9600,     // ← CHANGE THIS to your device baud rate
  DEVICE_ID: 1,        // ← CHANGE THIS to your device address
  REGISTERS: {
    PM25: 61,
    CO2: 62,
    TEMPERATURE: 63,
    HUMIDITY: 64,
    TVOC: 65
  }
};

async function connectModbus() {
  try {
    await client.connectRTUBuffered(MODBUS_CONFIG.PORT, {
      baudRate: MODBUS_CONFIG.BAUD_RATE
    });
    
    client.setID(MODBUS_CONFIG.DEVICE_ID);
    client.setTimeout(5000);
    
    isConnected = true;
    console.log(`✅ Connected to Modbus RS485 on ${MODBUS_CONFIG.PORT}`);
    return true;
  } catch (error) {
    console.error('❌ Modbus connection failed:', error.message);
    isConnected = false;
    return false;
  }
}

async function readSensorData() {
  try {
    const response = await client.readHoldingRegisters(61, 5); // Read registers 61-65
    const raw = response.data;
    
    return {
      PM25: raw[0] / 100,           // Adjust scaling as needed
      CO2: raw[1],
      TEMPERATURE: raw[2] / 100,
      HUMIDITY: raw[3] / 100,
      TVOC: raw[4],
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error reading sensors:', error.message);
    throw error;
  }
}

// API Routes
app.get('/api/status', (req, res) => {
  res.json({ 
    connected: isConnected,
    port: MODBUS_CONFIG.PORT,
    deviceId: MODBUS_CONFIG.DEVICE_ID
  });
});

app.get('/api/sensors', async (req, res) => {
  try {
    if (!isConnected) {
      return res.status(503).json({ error: 'Modbus not connected' });
    }
    
    const data = await readSensorData();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/connect', async (req, res) => {
  const success = await connectModbus();
  res.json({ success, connected: isConnected });
});

// Try to connect on startup
connectModbus();

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📡 Modbus Port: ${MODBUS_CONFIG.PORT}`);
  console.log(`⚙️  Device ID: ${MODBUS_CONFIG.DEVICE_ID}`);
  console.log(`📊 Baud Rate: ${MODBUS_CONFIG.BAUD_RATE}`);
});