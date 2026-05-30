const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const mongoose = require('mongoose');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// 1. Establish Permanent Connection to MongoDB Atlas via Render Environment Variables
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("CRITICAL ERROR: MONGODB_URI environment variable is missing on Render!");
  process.exit(1);
}

mongoose.connect(MONGODB_URI)
  .then(() => console.log('🚀 Successfully connected to permanent MongoDB Atlas cluster.'))
  .catch(err => console.error('❌ Database connection error:', err));

// 2. Define the Permanent Data Schema for Maintenance Tickets
const requestSchema = new mongoose.Schema({
  guest_name: { type: String, required: true },
  room_number: { type: String, required: true },
  issue_category: { type: String, required: true },
  notes: { type: String, default: "" },
  status: { type: String, default: 'pending' }, // pending or completed
  timestamp: { type: Date, default: Date.now }, // Creation date
  completedAt: { type: Date }                     // Completion date
});

const Request = mongoose.model('Request', requestSchema);

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 3. API Endpoints for Front-End Operations

// Fetch Today's Live Requests (Last 24 Hours)
app.get('/api/requests/today', async (req, res) => {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    // Find requests from the last 24 hours OR any older ticket that is still pending
    const requests = await Request.find({
      $or: [
        { timestamp: { $gte: twentyFourHoursAgo } },
        { status: 'pending' }
      ]
    }).sort({ timestamp: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load current tracking queue.' });
  }
});

// File New Request
app.post('/api/requests', async (req, res) => {
  try {
    const { guest_name, room_number, issue_category, notes } = req.body;
    
    const newRequest = new Request({
      guest_name,
      room_number,
      issue_category,
      notes
    });

    await newRequest.save();

    // Broadcast immediately to all connected browsers via WebSockets
    io.emit('new_request', newRequest);
    res.status(201).json(newRequest);
  } catch (err) {
    res.status(400).json({ error: 'Failed to create request. Verify entry parameters.' });
  }
});

// Complete an Active Request
app.patch('/api/requests/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    
    const updatedRequest = await Request.findByIdAndUpdate(
      id,
      { status: 'completed', completedAt: new Date() },
      { new: true }
    );

    if (!updatedRequest) {
      return res.status(404).json({ error: 'Ticket item not found in data clusters.' });
    }

    // Broadcast update across WebSocket sync pipes
    io.emit('request_completed', updatedRequest);
    res.json(updatedRequest);
  } catch (err) {
    res.status(500).json({ error: 'Failed to modify database record state.' });
  }
});

// 4. API Endpoint to Generate Historical Reports
app.get('/api/reports', async (req, res) => {
  try {
    const { date } = req.query; // Expects format: YYYY-MM-DD
    if (!date) {
      return res.status(400).json({ error: 'Target query calendar date required.' });
    }

    // Create localized date boundaries to catch all records within that specific day
    const startOfDay = new Date(`${date}T00:00:00.000Z`);
    const endOfDay = new Date(`${date}T23:59:59.999Z`);

    const dayRequests = await Request.find({
      timestamp: { $gte: startOfDay, $lte: endOfDay }
    }).sort({ timestamp: -1 });

    const fixed = dayRequests.filter(r => r.status === 'completed').length;
    const pending = dayRequests.filter(r => r.status === 'pending').length;

    res.json({
      date,
      metrics: { total: dayRequests.length, fixed, pending },
      requests: dayRequests
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to isolate historical data matrices.' });
  }
});

// Fallback to route direct queries safely to index
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Real-Time WebSockets Engine Pipelines
let connectedClients = 0;
io.on('connection', (socket) => {
  connectedClients++;
  io.emit('clients_count', connectedClients);

  socket.on('register_role', (role) => {
    console.log(`Session attached to tracking pipe: ${role}`);
  });

  socket.on('disconnect', () => {
    connectedClients--;
    io.emit('clients_count', connectedClients);
  });
});

server.listen(PORT, () => {
  console.log(`WH Hotel Core Engine active on port ${PORT}`);
});
