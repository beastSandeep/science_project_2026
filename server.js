const express = require('express');
const path = require('path');
const os = require('os');
const data = require('./data');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

const isDev = process.env.NODE_ENV === 'development' || 
              process.argv.includes('--dev') || 
              process.execArgv.includes('--watch');

// Unlock Private Network Access (PNA) and CORS in development mode
if (isDev) {
  app.use((req, res, next) => {
    // Standard CORS and Private Network Access specification headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Private-Network', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    // Immediate response for OPTIONS preflight requests
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

// Root route - passes hardcoded data in-memory (no runtime file reads)
app.get('/', (req, res) => {
  res.render('index', {
    models: data.models,
    presentationFormula: data.presentationFormula,
    evaluationCriteria: data.evaluationCriteria,
    projectChecklist: data.projectChecklist,
    totalCount: data.models.length
  });
});

// JSON API endpoint
app.get('/api/models', (req, res) => {
  res.json(data);
});

// Start server
app.listen(PORT, HOST, () => {
  console.log('===========================================================');
  console.log(` [SCIENCE FAIR SERVER] Mode: ${isDev ? 'DEVELOPMENT (PNA UNLOCKED)' : 'PRODUCTION'}`);
  console.log('===========================================================');
  console.log(` > Localhost:       http://localhost:${PORT}`);
  
  // Find and log local network IPv4 addresses
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        console.log(` > Private Network: http://${iface.address}:${PORT} (Mobile & LAN)`);
      }
    }
  }

  if (isDev) {
    console.log(` > Private Network Access (PNA): UNLOCKED (CORS + PNA headers enabled)`);
    console.log(` > Auto-Reload Watcher: ACTIVE`);
  }
  console.log('===========================================================\n');
});
