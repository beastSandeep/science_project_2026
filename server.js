const express = require('express');
const path = require('path');
const os = require('os');
const fs = require('fs');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const multer = require('multer');
const dataManager = require('./dataManager');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

// Admin credentials as requested
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'Sandeep80055';
const AUTH_SECRET = 'science-fair-2026-sandeep-secret-key';
const EXPECTED_TOKEN = crypto.createHmac('sha256', AUTH_SECRET).update(`${ADMIN_USER}:${ADMIN_PASS}`).digest('hex');

const isDev = process.env.NODE_ENV === 'development' || 
              process.argv.includes('--dev') || 
              process.execArgv.includes('--watch');

// Parse request bodies and cookies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Multer storage for project photos when ready
const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const cleanId = String(req.params.id || 'project').replace(/[^a-zA-Z0-9_-]/g, '');
    cb(null, `model-${cleanId}-${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
  fileFilter: (req, file, cb) => {
    if (/image\/(jpeg|jpg|png|webp|gif)/i.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Please upload an image file (JPG, PNG, WEBP, GIF).'));
    }
  }
});

// Unlock Private Network Access (PNA) and CORS in development mode
if (isDev) {
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Private-Network', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
    next();
  });
}

// Template engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// Static images and assets
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(express.static(path.join(__dirname, 'public')));

// Favicon fallback
app.get('/favicon.ico', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'favicon.svg'));
});

// Admin authentication middleware
function requireAdminAuth(req, res, next) {
  const token = req.cookies.admin_session;
  if (token && token === EXPECTED_TOKEN) {
    return next();
  }
  // Also support Basic Auth (convenient for API calls and automated tools)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Basic ')) {
    const creds = Buffer.from(authHeader.split(' ')[1], 'base64').toString('utf8').split(':');
    if (creds[0] === ADMIN_USER && creds[1] === ADMIN_PASS) {
      return next();
    }
  }
  if (req.path.startsWith('/admin/api/')) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Admin session or credentials required.' });
  }
  return res.redirect('/admin/login');
}

// -------------------------------------------------------------
// PUBLIC ROUTES
// -------------------------------------------------------------

// Home page
app.get('/', (req, res) => {
  const models = dataManager.getAllModels();
  res.render('index', {
    models: models,
    presentationFormula: dataManager.baseData.presentationFormula,
    evaluationCriteria: dataManager.baseData.evaluationCriteria,
    projectChecklist: dataManager.baseData.projectChecklist,
    totalCount: models.length
  });
});

// JSON API endpoint
app.get('/api/models', (req, res) => {
  res.json({
    models: dataManager.getAllModels(),
    stats: dataManager.getStats(),
    presentationFormula: dataManager.baseData.presentationFormula,
    evaluationCriteria: dataManager.baseData.evaluationCriteria,
    projectChecklist: dataManager.baseData.projectChecklist
  });
});

// -------------------------------------------------------------
// ADMIN ROUTES (/admin)
// -------------------------------------------------------------

// Admin login page
app.get('/admin/login', (req, res) => {
  if (req.cookies.admin_session === EXPECTED_TOKEN) {
    return res.redirect('/admin');
  }
  res.render('admin/login', { error: null });
});

// Process admin login
app.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    res.cookie('admin_session', EXPECTED_TOKEN, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'lax'
    });
    return res.redirect('/admin');
  }
  res.render('admin/login', { error: 'Invalid username or password. Please try again.' });
});

// Admin logout
app.get('/admin/logout', (req, res) => {
  res.clearCookie('admin_session');
  res.redirect('/admin/login');
});

// Admin dashboard (Protected)
app.get('/admin', requireAdminAuth, (req, res) => {
  const models = dataManager.getAllModels();
  const stats = dataManager.getStats();
  res.render('admin/dashboard', {
    models,
    stats,
    adminUser: ADMIN_USER
  });
});

// Add new project API (Protected)
app.post('/admin/api/projects/add', requireAdminAuth, (req, res) => {
  const newProject = dataManager.addModel(req.body);
  const updatedStats = dataManager.getStats();
  res.json({
    success: true,
    project: newProject,
    stats: updatedStats
  });
});

// Upload project image photo when ready (Protected)
app.post('/admin/api/projects/:id/upload-image', requireAdminAuth, upload.single('photo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No image file uploaded' });
  }

  const imageUrl = `/uploads/${req.file.filename}`;
  const updatedProject = dataManager.updateProjectImage(req.params.id, imageUrl);
  const updatedStats = dataManager.getStats();

  res.json({
    success: true,
    imageUrl: imageUrl,
    project: updatedProject,
    stats: updatedStats
  });
});

// Update project assignment & status API (Protected)
app.post('/admin/api/projects/:id', requireAdminAuth, (req, res) => {
  const { id } = req.params;
  const updatedProject = dataManager.updateModel(id, req.body);
  const updatedStats = dataManager.getStats();
  res.json({
    success: true,
    project: updatedProject,
    stats: updatedStats
  });
});

// Delete custom project API (Protected)
app.delete('/admin/api/projects/:id', requireAdminAuth, (req, res) => {
  const { id } = req.params;
  const result = dataManager.deleteModel(id);
  const updatedStats = dataManager.getStats();
  res.json({
    success: result.success,
    stats: updatedStats
  });
});

// Export CSV Roster (Protected)
app.get('/admin/api/export-csv', requireAdminAuth, (req, res) => {
  const csv = dataManager.generateCSV();
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="science_fair_2026_assignments.csv"');
  res.send(csv);
});

// -------------------------------------------------------------
// SERVER START
// -------------------------------------------------------------

app.listen(PORT, HOST, () => {
  console.log('===========================================================');
  console.log(` [SCIENCE FAIR SERVER] Mode: ${isDev ? 'DEVELOPMENT (PNA UNLOCKED)' : 'PRODUCTION'}`);
  console.log('===========================================================');
  console.log(` > Public Portal:  http://localhost:${PORT}`);
  console.log(` > Admin Console:  http://localhost:${PORT}/admin`);
  console.log(` > Admin User:     ${ADMIN_USER}`);
  
  // Find and log local network IPv4 addresses
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        console.log(` > Local Network:  http://${iface.address}:${PORT} (Mobile & LAN)`);
        console.log(` > Admin Network:  http://${iface.address}:${PORT}/admin`);
      }
    }
  }

  if (isDev) {
    console.log(` > Private Network Access (PNA): UNLOCKED (CORS + PNA headers enabled)`);
    console.log(` > Auto-Reload Watcher: ACTIVE`);
  }
  console.log('===========================================================\n');
});
