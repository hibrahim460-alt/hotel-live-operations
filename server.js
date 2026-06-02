const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'wh_hotel_ultra_secret_key_2026';

// Database Connectivity
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("CRITICAL ERROR: MONGODB_URI environment variable is missing on Render!");
  process.exit(1);
}

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('🚀 Connected securely to permanent MongoDB Atlas cluster.');
    seedInitialUsers();
  })
  .catch(err => console.error('❌ Database connection error:', err));

// --- EXTENDED DATABASE SCHEMAS ---

// 1. Core Users (Expanded with new departments)
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true }, 
  role: { 
    type: String, 
    required: true, 
    enum: ['admin', 'reception', 'maintenance', 'housekeeping', 'purchasing', 'reservations', 'accounting', 'sales'] 
  }
});
const User = mongoose.model('User', userSchema);

// 2. Operational Requests (Maintained current system specs perfectly)
const requestSchema = new mongoose.Schema({
  guest_name: { type: String, required: true },
  room_number: { type: String, required: true },
  issue_category: { type: String, required: true },
  notes: { type: String, default: "" },
  status: { type: String, default: 'pending' }, 
  timestamp: { type: Date, default: Date.now }, 
  completedAt: { type: Date },
  createdBy: { type: String, required: true },    
  completedBy: { type: String, default: "" }      
});
const Request = mongoose.model('Request', requestSchema);

// 3. Purchasing & Supply Chain Inventory Schema
const inventorySchema = new mongoose.Schema({
  item_name: { type: String, required: true },
  quantity_requested: { type: Number, required: true },
  department: { type: String, required: true }, // e.g., housekeeping, maintenance
  status: { type: String, default: 'requested', enum: ['requested', 'ordered', 'received'] },
  timestamp: { type: Date, default: Date.now },
  createdBy: { type: String, required: true }
});
const InventoryOrder = mongoose.model('InventoryOrder', inventorySchema);

// 4. Reservations & Pre-Arrival VIP Setup Schema
const reservationSchema = new mongoose.Schema({
  guest_name: { type: String, required: true },
  room_number: { type: String, required: true },
  arrival_date: { type: String, required: true },
  vip_tier: { type: String, default: 'Standard', enum: ['Standard', 'VIP', 'VVVIP', 'Celebrity'] },
  special_amenities: { type: String, default: "" }, // e.g., Baby-Crib, Extra Bed
  status: { type: String, default: 'confirmed' }
});
const Reservation = mongoose.model('Reservation', reservationSchema);

// 5. Accounting, Bill Disputes & Refund Audits Schema
const disputeSchema = new mongoose.Schema({
  room_number: { type: String, required: true },
  disputed_amount: { type: Number, required: true },
  reason: { type: String, required: true },
  status: { type: String, default: 'pending_review', enum: ['pending_review', 'approved', 'denied'] },
  loggedBy: { type: String, required: true },
  reviewedBy: { type: String, default: "" },
  timestamp: { type: Date, default: Date.now }
});
const Dispute = mongoose.model('Dispute', disputeSchema);

// 6. Sales, Corporate Leads & Event Space Contracts Schema
const leadSchema = new mongoose.Schema({
  company_name: { type: String, required: true },
  contact_person: { type: String, required: true },
  group_rooms_needed: { type: Number, default: 0 },
  pipeline_stage: { type: String, default: 'Inquiry', enum: ['Inquiry', 'Proposal Sent', 'Contract Signed', 'Closed Lost'] },
  revenue_estimation: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now }
});
const Lead = mongoose.model('Lead', leadSchema);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Security Guard Token Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access Denied: Log in first.' });

  jwt.verify(token, JWT_SECRET, (err, decodedUser) => {
    if (err) return res.status(403).json({ error: 'Session expired or invalid.' });
    req.user = decodedUser; 
    next();
  });
}

// --- EXTENDED RESTful API LOGIC ENDPOINTS ---

// Core Authentication Endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const foundUser = await User.findOne({ username: username.toLowerCase() });
    if (!foundUser || foundUser.password !== password) {
      return res.status(401).json({ error: 'Invalid username or password configuration.' });
    }
    const token = jwt.sign({ username: foundUser.username, role: foundUser.role }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, role: foundUser.role, username: foundUser.username });
  } catch (err) {
    res.status(500).json({ error: 'Authentication routine fault.' });
  }
});

// Admin User Profile Controls
app.post('/api/admin/users', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Requires Admin Clearance Tiers.' });
  try {
    const { username, password, role } = req.body;
    const existing = await User.findOne({ username: username.toLowerCase() });
    if (existing) return res.status(400).json({ error: 'Username string already exists.' });
    const newUser = new User({ username, password, role });
    await newUser.save();
    res.status(201).json({ message: `User account '${username}' created successfully.` });
  } catch (err) { res.status(500).json({ error: 'Could not write profile.' }); }
});

app.get('/api/admin/users', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Restricted access.' });
  try {
    const users = await User.find({}, 'username role password').sort({ username: 1 });
    res.json(users);
  } catch (err) { res.status(500).json({ error: 'Error pulling roster.' }); }
});

app.patch('/api/admin/users/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Restricted access.' });
  try {
    const { id } = req.params;
    const { password, role } = req.body;
    const targetUser = await User.findById(id);
    if (!targetUser) return res.status(404).json({ error: 'User profile not found.' });
    if (targetUser.username === 'admin' && role !== 'admin') return res.status(400).json({ error: 'Root admin role cannot be stripped!' });
    const updatedUser = await User.findByIdAndUpdate(id, { password, role }, { new: true });
    res.json({ message: 'Account updated successfully.', updatedUser });
  } catch (err) { res.status(500).json({ error: 'Failed update.' }); }
});

app.delete('/api/admin/users/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Restricted access.' });
  try {
    const { id } = req.params;
    const targetUser = await User.findById(id);
    if (!targetUser || targetUser.username === 'admin') return res.status(400).json({ error: 'Cannot delete.' });
    await User.findByIdAndDelete(id);
    res.json({ message: 'Purged.' });
  } catch (err) { res.status(500).json({ error: 'Failed.' }); }
});

// Operational Active Request Pipeline
app.get('/api/requests/today', authenticateToken, async (req, res) => {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const requests = await Request.find({
      $or: [{ timestamp: { $gte: twentyFourHoursAgo } }, { status: 'pending' }]
    }).sort({ timestamp: -1 });
    res.json(requests);
  } catch (err) { res.status(500).json({ error: 'Failed pipeline fetch.' }); }
});

app.post('/api/requests', authenticateToken, async (req, res) => {
  const allowedRoles = ['reception', 'admin', 'housekeeping', 'reservations'];
  if (!allowedRoles.includes(req.user.role)) return res.status(403).json({ error: 'Blocked from launching tasks.' });
  try {
    const { guest_name, room_number, issue_category, notes } = req.body;
    const newRequest = new Request({ guest_name, room_number, issue_category, notes, createdBy: req.user.username });
    await newRequest.save();
    io.emit('new_request', newRequest);
    res.status(201).json(newRequest);
  } catch (err) { res.status(400).json({ error: 'Database verification fault.' }); }
});

app.patch('/api/requests/:id/complete', authenticateToken, async (req, res) => {
  if (['reception', 'purchasing', 'sales', 'accounting'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Action restricted for non-floor staff.' });
  }
  try {
    const updatedRequest = await Request.findByIdAndUpdate(req.params.id, { status: 'completed', completedAt: new Date(), completedBy: req.user.username }, { new: true });
    io.emit('request_completed', updatedRequest);
    res.json(updatedRequest);
  } catch (err) { res.status(500).json({ error: 'Failed state update.' }); }
});

// Reports Engine (Exclusively restricted to Admin and Reception as specified)
app.get('/api/reports', authenticateToken, async (req, res) => {
  if (req.user.role !== 'reception' && req.user.role !== 'admin') return res.status(403).json({ error: 'Logs access denied.' });
  try {
    const { date } = req.query;
    const startOfDay = new Date(`${date}T00:00:00.000Z`);
    const endOfDay = new Date(`${date}T23:59:59.999Z`);
    const dayRequests = await Request.find({ timestamp: { $gte: startOfDay, $lte: endOfDay } }).sort({ timestamp: -1 });
    res.json({
      date,
      metrics: {
        total: dayRequests.length,
        fixed: dayRequests.filter(r => r.status === 'completed').length,
        pending: dayRequests.filter(r => r.status === 'pending').length
      },
      requests: dayRequests
    });
  } catch (err) { res.status(500).json({ error: 'Report fault.' }); }
});

// --- NEW DEPARTMENTS ROUTING MODULES ---

// PURCHASING API Modules
app.get('/api/purchasing/orders', authenticateToken, async (req, res) => {
  try { const orders = await InventoryOrder.find().sort({ timestamp: -1 }); res.json(orders); } catch (e) { res.status(500).json(e); }
});
app.post('/api/purchasing/orders', authenticateToken, async (req, res) => {
  try {
    const order = new InventoryOrder({ ...req.body, createdBy: req.user.username });
    await order.save(); io.emit('new_purchasing_order', order); res.status(201).json(order);
  } catch (e) { res.status(400).json(e); }
});
app.patch('/api/purchasing/orders/:id', authenticateToken, async (req, res) => {
  try {
    const order = await InventoryOrder.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    io.emit('purchasing_order_updated', order); res.json(order);
  } catch (e) { res.status(500).json(e); }
});

// RESERVATIONS API Modules
app.get('/api/reservations', authenticateToken, async (req, res) => {
  try { res.json(await Reservation.find()); } catch (e) { res.status(500).json(e); }
});
app.post('/api/reservations', authenticateToken, async (req, res) => {
  try {
    const resv = new Reservation(req.body); await resv.save();
    // Intelligent System Integration: Auto-inject specialized amenity requests directly into active service pipelines!
    if (req.body.special_amenities) {
      const crossTask = new Request({ guest_name: req.body.guest_name, room_number: req.body.room_number, issue_category: req.body.special_amenities, notes: "Pre-Arrival Automated VIP Configuration Request", createdBy: "Reservations Engine" });
      await crossTask.save(); io.emit('new_request', crossTask);
    }
    io.emit('new_reservation', resv); res.status(201).json(resv);
  } catch (e) { res.status(400).json(e); }
});

// ACCOUNTING API Modules
app.get('/api/accounting/disputes', authenticateToken, async (req, res) => {
  try { res.json(await Dispute.find().sort({ timestamp: -1 })); } catch (e) { res.status(500).json(e); }
});
app.post('/api/accounting/disputes', authenticateToken, async (req, res) => {
  try {
    const dispute = new Dispute({ ...req.body, loggedBy: req.user.username });
    await dispute.save(); io.emit('new_dispute', dispute); res.status(201).json(dispute);
  } catch (e) { res.status(400).json(e); }
});
app.patch('/api/accounting/disputes/:id', authenticateToken, async (req, res) => {
  try {
    const dispute = await Dispute.findByIdAndUpdate(req.params.id, { status: req.body.status, reviewedBy: req.user.username }, { new: true });
    io.emit('dispute_updated', dispute); res.json(dispute);
  } catch (e) { res.status(500).json(e); }
});

// SALES API Modules
app.get('/api/sales/leads', authenticateToken, async (req, res) => {
  try { res.json(await Lead.find().sort({ timestamp: -1 })); } catch (e) { res.status(500).json(e); }
});
app.post('/api/sales/leads', authenticateToken, async (req, res) => {
  try {
    const lead = new Lead(req.body); await lead.save();
    io.emit('new_lead', lead); res.status(201).json(lead);
  } catch (e) { res.status(400).json(e); }
});
app.patch('/api/sales/leads/:id', authenticateToken, async (req, res) => {
  try {
    const lead = await Lead.findByIdAndUpdate(req.params.id, { pipeline_stage: req.body.pipeline_stage }, { new: true });
    io.emit('lead_updated', lead); res.json(lead);
  } catch (e) { res.status(500).json(e); }
});

app.get('*', (req, res) => { res.sendFile(path.join(__dirname, 'public', 'index.html')); });

// Database Auto-Seeding System
async function seedInitialUsers() {
  try {
    if (await User.countDocuments() === 0) {
      await User.insertMany([
        { username: 'admin', password: 'admin123', role: 'admin' },
        { username: 'rc_manager', password: 'reception123', role: 'reception' },
        { username: 'eng_staff1', password: 'engineer123', role: 'maintenance' },
        { username: 'hk_supervisor1', password: 'housekeep123', role: 'housekeeping' },
        { username: 'purchasing_mgr', password: 'purchase123', role: 'purchasing' },
        { username: 'reservations_clerk', password: 'resv123', role: 'reservations' },
        { username: 'accountant1', password: 'finance123', role: 'accounting' },
        { username: 'sales_exec', password: 'sales123', role: 'sales' }
      ]);
      console.log('🌱 All-In-One Enterprise User Matrix seeded successfully.');
    }
  } catch (e) { console.error(e); }
}

server.listen(PORT, () => console.log(`WH Enterprise ERP Core Online on port ${PORT}`));
