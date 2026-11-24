const fs = require('fs');
const path = require('path');
const baseData = require('./data');

const stateFilePath = path.join(__dirname, 'data', 'projects-state.json');

// Ensure state file exists or load it
function loadStateData() {
  try {
    if (fs.existsSync(stateFilePath)) {
      const raw = fs.readFileSync(stateFilePath, 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed.states || parsed.customProjects) {
        return {
          states: parsed.states || {},
          customProjects: parsed.customProjects || []
        };
      } else {
        // Migration from simple object
        return {
          states: parsed || {},
          customProjects: []
        };
      }
    }
  } catch (err) {
    console.error('Error loading projects state:', err);
  }
  return { states: {}, customProjects: [] };
}

function saveStateData(data) {
  try {
    const dir = path.dirname(stateFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(stateFilePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving projects state:', err);
  }
}

// Initial state cache
let stateCache = loadStateData();

// Initialize any missing base models in state
baseData.models.forEach(m => {
  if (!stateCache.states[m.id]) {
    stateCache.states[m.id] = {
      assignedStudent: '',
      studentRoll: '',
      status: 'Available',
      boothNumber: `Table ${m.id < 10 ? '0' + m.id : m.id}`,
      submissionDate: '',
      notes: ''
    };
  }
});
saveStateData(stateCache);

function getAllModels() {
  // 1. Process base 20 models
  const baseModels = baseData.models.map(m => {
    const s = stateCache.states[m.id] || {
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
      notes: s.notes || '',
      isCustom: false
    };
  });

  // 2. Process custom projects added by admin
  const customModels = (stateCache.customProjects || []).map(m => {
    const s = stateCache.states[m.id] || {};
    return {
      ...m,
      assignedStudent: s.assignedStudent !== undefined ? s.assignedStudent : (m.assignedStudent || ''),
      studentRoll: s.studentRoll !== undefined ? s.studentRoll : (m.studentRoll || ''),
      status: s.status !== undefined ? s.status : (m.status || 'Available'),
      boothNumber: s.boothNumber !== undefined ? s.boothNumber : (m.boothNumber || `Table ${m.id}`),
      submissionDate: s.submissionDate !== undefined ? s.submissionDate : (m.submissionDate || ''),
      notes: s.notes !== undefined ? s.notes : (m.notes || ''),
      isCustom: true
    };
  });

  return [...baseModels, ...customModels].sort((a, b) => a.id - b.id);
}

function getModel(id) {
  const models = getAllModels();
  return models.find(m => m.id === parseInt(id));
}

function addModel(data) {
  const all = getAllModels();
  const maxId = all.reduce((max, m) => Math.max(max, m.id), 0);
  const newId = maxId + 1;

  // Format materials list
  let materialsArray = [];
  if (Array.isArray(data.materials)) {
    materialsArray = data.materials.map(s => s.trim()).filter(Boolean);
  } else if (typeof data.materials === 'string') {
    materialsArray = data.materials.split(/[;\n]+/).map(s => s.trim().replace(/\.$/, '')).filter(Boolean);
  }
  if (materialsArray.length === 0) {
    materialsArray = ['Standard craft cardboard or foam base', 'Fasteners, tape and joining glue', 'Connecting leads and indicators'];
  }

  const rawMaterials = materialsArray.join('; ') + '.';
  const concept = data.concept ? data.concept.trim() : 'Applied scientific mechanism and observable principles.';

  const newProject = {
    id: newId,
    title: data.title ? data.title.trim() : `Science Project #${newId}`,
    category: data.category ? data.category.trim() : 'Physics',
    concept: concept,
    difficulty: data.difficulty || 'Beginner',
    buildTime: data.buildTime ? data.buildTime.trim() : '2 hours',
    realWorldApp: data.realWorldApp ? data.realWorldApp.trim() : 'Practical application in modern STEM engineering and industry.',
    howItWorks: data.howItWorks ? data.howItWorks.trim() : concept,
    image: data.image && data.image.trim() !== '' ? data.image.trim() : '/images/default-project.svg',
    materials: materialsArray,
    rawMaterials: rawMaterials,
    speech: data.speech ? data.speech.trim() : `Good morning. This working model demonstrates ${concept}. When activated, the mechanism converts input energy to produce an observable scientific result. This principle is utilized across modern science and technology.`,
    isCustom: true
  };

  // Add to customProjects array
  if (!stateCache.customProjects) {
    stateCache.customProjects = [];
  }
  stateCache.customProjects.push(newProject);

  // Initialize state
  stateCache.states[newId] = {
    assignedStudent: data.assignedStudent ? data.assignedStudent.trim() : '',
    studentRoll: data.studentRoll ? data.studentRoll.trim() : '',
    status: data.status ? data.status.trim() : 'Available',
    boothNumber: data.boothNumber ? data.boothNumber.trim() : `Table ${newId < 10 ? '0' + newId : newId}`,
    submissionDate: data.submissionDate ? data.submissionDate.trim() : '',
    notes: data.notes ? data.notes.trim() : ''
  };

  saveStateData(stateCache);
  return getModel(newId);
}

function updateModel(id, updates) {
  const numId = parseInt(id);
  if (!stateCache.states[numId]) {
    stateCache.states[numId] = {};
  }

  if (updates.assignedStudent !== undefined) stateCache.states[numId].assignedStudent = updates.assignedStudent.trim();
  if (updates.studentRoll !== undefined) stateCache.states[numId].studentRoll = updates.studentRoll.trim();
  if (updates.status !== undefined) stateCache.states[numId].status = updates.status.trim();
  if (updates.boothNumber !== undefined) stateCache.states[numId].boothNumber = updates.boothNumber.trim();
  if (updates.submissionDate !== undefined) stateCache.states[numId].submissionDate = updates.submissionDate.trim();
  if (updates.notes !== undefined) stateCache.states[numId].notes = updates.notes.trim();

  // If custom project, allow updating metadata as well
  const customIdx = (stateCache.customProjects || []).findIndex(m => m.id === numId);
  if (customIdx !== -1) {
    const cp = stateCache.customProjects[customIdx];
    if (updates.title) cp.title = updates.title.trim();
    if (updates.category) cp.category = updates.category.trim();
    if (updates.concept) cp.concept = updates.concept.trim();
    if (updates.difficulty) cp.difficulty = updates.difficulty.trim();
    if (updates.buildTime) cp.buildTime = updates.buildTime.trim();
    if (updates.realWorldApp) cp.realWorldApp = updates.realWorldApp.trim();
    if (updates.howItWorks) cp.howItWorks = updates.howItWorks.trim();
    if (updates.image) cp.image = updates.image.trim();
    if (updates.speech) cp.speech = updates.speech.trim();
    if (updates.materials) {
      if (Array.isArray(updates.materials)) {
        cp.materials = updates.materials.map(s => s.trim()).filter(Boolean);
      } else if (typeof updates.materials === 'string') {
        cp.materials = updates.materials.split(/[;\n]+/).map(s => s.trim().replace(/\.$/, '')).filter(Boolean);
      }
      cp.rawMaterials = cp.materials.join('; ') + '.';
    }
  }

  saveStateData(stateCache);
  return getModel(numId);
}

function deleteModel(id) {
  const numId = parseInt(id);
  if (stateCache.customProjects) {
    stateCache.customProjects = stateCache.customProjects.filter(m => m.id !== numId);
  }
  if (stateCache.states[numId]) {
    delete stateCache.states[numId];
  }
  saveStateData(stateCache);
  return { success: true };
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
  addModel,
  updateModel,
  deleteModel,
  getStats,
  generateCSV,
  baseData
};
