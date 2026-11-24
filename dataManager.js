const fs = require('fs');
const path = require('path');
const baseData = require('./data');

const stateFilePath = path.join(__dirname, 'data', 'projects-state.json');

// Ensure state file exists or load it
function loadState() {
  try {
    if (fs.existsSync(stateFilePath)) {
      const raw = fs.readFileSync(stateFilePath, 'utf8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error loading projects state:', err);
  }
  return {};
}

function saveState(state) {
  try {
    const dir = path.dirname(stateFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(stateFilePath, JSON.stringify(state, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving projects state:', err);
  }
}

// Initial state cache
let stateCache = loadState();

// Initialize any missing models in state
baseData.models.forEach(m => {
  if (!stateCache[m.id]) {
    stateCache[m.id] = {
      assignedStudent: '',
      studentRoll: '',
      status: 'Available', // Available, In Progress, Completed, Exhibited
      boothNumber: `Table ${m.id < 10 ? '0' + m.id : m.id}`,
      submissionDate: '',
      notes: ''
    };
  }
});
saveState(stateCache);

function getAllModels() {
  return baseData.models.map(m => {
    const s = stateCache[m.id] || {
      assignedStudent: '',
      studentRoll: '',
      status: 'Available',
      boothNumber: `Table ${m.id < 10 ? '0' + m.id : m.id}`,
      submissionDate: '',
      notes: ''
    };
    return {
      ...m,
      assignedStudent: s.assignedStudent || '',
      studentRoll: s.studentRoll || '',
      status: s.status || 'Available',
      boothNumber: s.boothNumber || `Table ${m.id < 10 ? '0' + m.id : m.id}`,
      submissionDate: s.submissionDate || '',
      notes: s.notes || ''
    };
  });
}

function getModel(id) {
  const models = getAllModels();
  return models.find(m => m.id === parseInt(id));
}

function updateModel(id, updates) {
  const numId = parseInt(id);
  if (!stateCache[numId]) {
    stateCache[numId] = {};
  }

  if (updates.assignedStudent !== undefined) stateCache[numId].assignedStudent = updates.assignedStudent.trim();
  if (updates.studentRoll !== undefined) stateCache[numId].studentRoll = updates.studentRoll.trim();
  if (updates.status !== undefined) stateCache[numId].status = updates.status.trim();
  if (updates.boothNumber !== undefined) stateCache[numId].boothNumber = updates.boothNumber.trim();
  if (updates.submissionDate !== undefined) stateCache[numId].submissionDate = updates.submissionDate.trim();
  if (updates.notes !== undefined) stateCache[numId].notes = updates.notes.trim();

  saveState(stateCache);
  return getModel(numId);
}

function getStats() {
  const models = getAllModels();
  const total = models.length;
  let assigned = 0;
  let available = 0;
  let inProgress = 0;
  let completed = 0;
  let exhibited = 0;

  models.forEach(m => {
    if (m.assignedStudent && m.assignedStudent.trim() !== '') {
      assigned++;
    }
    if (m.status === 'Available') available++;
    else if (m.status === 'In Progress') inProgress++;
    else if (m.status === 'Completed') completed++;
    else if (m.status === 'Exhibited') exhibited++;
  });

  return { total, assigned, available, inProgress, completed, exhibited };
}

function generateCSV() {
  const models = getAllModels();
  const header = ['ID', 'Title', 'Category', 'Difficulty', 'Status', 'Assigned Student', 'Roll / Class Info', 'Booth Number', 'Submission Date', 'Notes'];
  const rows = models.map(m => [
    m.id,
    `"${m.title.replace(/"/g, '""')}"`,
    `"${m.category}"`,
    `"${m.difficulty}"`,
    `"${m.status}"`,
    `"${(m.assignedStudent || '').replace(/"/g, '""')}"`,
    `"${(m.studentRoll || '').replace(/"/g, '""')}"`,
    `"${(m.boothNumber || '').replace(/"/g, '""')}"`,
    `"${(m.submissionDate || '').replace(/"/g, '""')}"`,
    `"${(m.notes || '').replace(/"/g, '""')}"`
  ]);

  return [header.join(','), ...rows.map(r => r.join(','))].join('\n');
}

module.exports = {
  getAllModels,
  getModel,
  updateModel,
  getStats,
  generateCSV,
  baseData
};
