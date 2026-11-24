const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const baseData = require('./data');

const stateFilePath = path.join(__dirname, 'data', 'projects-state.json');

// Ensure state file exists or load it
function loadStateData() {
  try {
    if (fs.existsSync(stateFilePath)) {
      const raw = fs.readFileSync(stateFilePath, 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed.states || parsed.customProjects || parsed.ratings || parsed.deletedProjectIds || parsed.adminSecurity !== undefined) {
        return {
          states: parsed.states || {},
          customProjects: parsed.customProjects || [],
          ratings: parsed.ratings || {},
          deletedProjectIds: parsed.deletedProjectIds || [],
          adminSecurity: parsed.adminSecurity || null
        };
      } else {
        return {
          states: parsed || {},
          customProjects: [],
          ratings: {},
          deletedProjectIds: [],
          adminSecurity: null
        };
      }
    }
  } catch (err) {
    console.error('Error loading projects state:', err);
  }
  return { states: {}, customProjects: [], ratings: {}, deletedProjectIds: [], adminSecurity: null };
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

// Safely delete a superseded uploaded image from public/uploads/
function safelyDeleteUploadFile(imageUrl) {
  if (!imageUrl || typeof imageUrl !== 'string' || !imageUrl.startsWith('/uploads/')) return;
  try {
    const filename = path.basename(imageUrl);
    if (!filename || filename.includes('..') || filename === '.gitkeep') return;
    const fullPath = path.join(__dirname, 'public', 'uploads', filename);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      console.log(`[Storage] Deleted superseded project image: ${filename}`);
    }
  } catch (err) {
    console.error('Error deleting upload file:', err);
  }
}

// Initial state cache
let stateCache = loadStateData();

// Helper to normalize students list
function parseStudents(val) {
  if (Array.isArray(val)) {
    return val.map(s => String(s).trim()).filter(Boolean);
  }
  if (typeof val === 'string' && val.trim() !== '') {
    return val.split(/[,\n;]+/).map(s => s.trim()).filter(Boolean);
  }
  return [];
}

// Initialize any missing base models in state
baseData.models.forEach(m => {
  if (!stateCache.states[m.id]) {
    stateCache.states[m.id] = {
      assignedStudents: [],
      assignedStudent: '',
      studentRoll: '',
      status: 'Available',
      boothNumber: `Table ${m.id < 10 ? '0' + m.id : m.id}`,
      submissionDate: '',
      notes: '',
      award: 'None' // None, 1st Place, 2nd Place, 3rd Place, Innovation Award, Best Mechanism
    };
  } else {
    // Migration: ensure assignedStudents array exists
    if (!stateCache.states[m.id].assignedStudents) {
      stateCache.states[m.id].assignedStudents = parseStudents(stateCache.states[m.id].assignedStudent);
    }
    if (!stateCache.states[m.id].award) {
      stateCache.states[m.id].award = 'None';
    }
  }
});
saveStateData(stateCache);

function attachRatings(m) {
  const ratings = (stateCache.ratings && stateCache.ratings[m.id]) || [];
  const ratingCount = ratings.length;
  const averageRating = ratingCount > 0
    ? parseFloat((ratings.reduce((acc, r) => acc + Number(r.rating || 0), 0) / ratingCount).toFixed(1))
    : 0;
  return {
    ...m,
    ratingCount,
    averageRating,
    ratings
  };
}

function getAllModels() {
  const deletedIds = new Set((stateCache.deletedProjectIds || []).map(Number));

  // 1. Process base models
  const baseModels = baseData.models.map(m => {
    const s = stateCache.states[m.id] || {};
    const students = parseStudents(s.assignedStudents || s.assignedStudent || '');
    const award = s.award || 'None';
    return {
      ...m,
      assignedStudents: students,
      assignedStudent: students.join(', '),
      studentRoll: s.studentRoll || '',
      status: s.status || 'Available',
      boothNumber: s.boothNumber || `Table ${m.id < 10 ? '0' + m.id : m.id}`,
      submissionDate: s.submissionDate || '',
      notes: s.notes || '',
      award: award,
      isWinner: award !== 'None',
      image: s.image || m.image,
      videoUrl: s.videoUrl !== undefined ? s.videoUrl : (m.videoUrl || ''),
      isCustom: false
    };
  });

  // 2. Process custom models added by admin
  const customModels = (stateCache.customProjects || []).map(m => {
    const s = stateCache.states[m.id] || {};
    const students = parseStudents(s.assignedStudents || s.assignedStudent || m.assignedStudents || m.assignedStudent || '');
    const award = s.award || m.award || 'None';
    return {
      ...m,
      assignedStudents: students,
      assignedStudent: students.join(', '),
      studentRoll: s.studentRoll !== undefined ? s.studentRoll : (m.studentRoll || ''),
      status: s.status !== undefined ? s.status : (m.status || 'Available'),
      boothNumber: s.boothNumber !== undefined ? s.boothNumber : (m.boothNumber || `Table ${m.id}`),
      submissionDate: s.submissionDate !== undefined ? s.submissionDate : (m.submissionDate || ''),
      notes: s.notes !== undefined ? s.notes : (m.notes || ''),
      award: award,
      isWinner: award !== 'None',
      image: s.image || m.image || '/images/default-project.svg',
      videoUrl: s.videoUrl !== undefined ? s.videoUrl : (m.videoUrl || ''),
      isCustom: true
    };
  });

  return [...baseModels, ...customModels]
    .filter(m => !deletedIds.has(m.id))
    .map(attachRatings)
    .sort((a, b) => a.id - b.id);
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
  const students = parseStudents(data.assignedStudents || data.assignedStudent || '');
  const award = data.award && data.award.trim() !== '' ? data.award.trim() : 'None';

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
    videoUrl: data.videoUrl ? data.videoUrl.trim() : '',
    materials: materialsArray,
    rawMaterials: rawMaterials,
    speech: data.speech ? data.speech.trim() : `Good morning. This working model demonstrates ${concept}. When activated, the mechanism converts input energy to produce an observable scientific result. This principle is utilized across modern science and technology.`,
    assignedStudents: students,
    assignedStudent: students.join(', '),
    award: award,
    isCustom: true
  };

  if (!stateCache.customProjects) {
    stateCache.customProjects = [];
  }
  stateCache.customProjects.push(newProject);

  stateCache.states[newId] = {
    assignedStudents: students,
    assignedStudent: students.join(', '),
    studentRoll: data.studentRoll ? data.studentRoll.trim() : '',
    status: data.status ? data.status.trim() : 'Available',
    boothNumber: data.boothNumber ? data.boothNumber.trim() : `Table ${newId < 10 ? '0' + newId : newId}`,
    submissionDate: data.submissionDate ? data.submissionDate.trim() : '',
    notes: data.notes ? data.notes.trim() : '',
    award: award,
    image: newProject.image,
    videoUrl: newProject.videoUrl
  };

  saveStateData(stateCache);
  return getModel(newId);
}

function updateModel(id, updates) {
  const numId = parseInt(id);
  if (!stateCache.states[numId]) {
    stateCache.states[numId] = {};
  }

  // Handle multi-students
  if (updates.assignedStudents !== undefined || updates.assignedStudent !== undefined) {
    const students = parseStudents(updates.assignedStudents !== undefined ? updates.assignedStudents : updates.assignedStudent);
    stateCache.states[numId].assignedStudents = students;
    stateCache.states[numId].assignedStudent = students.join(', ');
  }

  if (updates.studentRoll !== undefined) stateCache.states[numId].studentRoll = String(updates.studentRoll).trim();
  if (updates.status !== undefined) stateCache.states[numId].status = String(updates.status).trim();
  if (updates.boothNumber !== undefined) stateCache.states[numId].boothNumber = String(updates.boothNumber).trim();
  if (updates.submissionDate !== undefined) stateCache.states[numId].submissionDate = String(updates.submissionDate).trim();
  if (updates.notes !== undefined) stateCache.states[numId].notes = String(updates.notes).trim();
  if (updates.award !== undefined) stateCache.states[numId].award = String(updates.award).trim();
  // Track previous image for deletion if changed
  let oldImage = null;
  if (updates.image !== undefined) {
    const cur = getModel(numId);
    oldImage = cur ? cur.image : (stateCache.states[numId] ? stateCache.states[numId].image : null);
    stateCache.states[numId].image = String(updates.image).trim();
  }
  if (updates.videoUrl !== undefined) stateCache.states[numId].videoUrl = String(updates.videoUrl).trim();

  // If custom project, allow updating metadata
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
    if (updates.image !== undefined) cp.image = String(updates.image).trim();
    if (updates.videoUrl !== undefined) cp.videoUrl = updates.videoUrl.trim();
    if (updates.speech) cp.speech = updates.speech.trim();
    if (updates.award !== undefined) cp.award = updates.award.trim();
    if (updates.assignedStudents !== undefined || updates.assignedStudent !== undefined) {
      cp.assignedStudents = stateCache.states[numId].assignedStudents;
      cp.assignedStudent = stateCache.states[numId].assignedStudent;
    }
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

  // If image was changed and old image was an upload, delete old file only on successful update
  if (updates.image !== undefined && oldImage && oldImage !== String(updates.image).trim() && oldImage.startsWith('/uploads/')) {
    safelyDeleteUploadFile(oldImage);
  }

  return getModel(numId);
}

function updateProjectImage(id, imageUrl) {
  const numId = parseInt(id);
  if (!stateCache.states[numId]) {
    stateCache.states[numId] = {};
  }
  const cur = getModel(numId);
  const oldImage = cur ? cur.image : (stateCache.states[numId].image || '');

  stateCache.states[numId].image = imageUrl;

  const customIdx = (stateCache.customProjects || []).findIndex(m => m.id === numId);
  if (customIdx !== -1) {
    stateCache.customProjects[customIdx].image = imageUrl;
  }

  saveStateData(stateCache);

  // Only delete old file after state is successfully updated and saved
  if (oldImage && oldImage !== imageUrl && oldImage.startsWith('/uploads/')) {
    safelyDeleteUploadFile(oldImage);
  }

  return getModel(numId);
}

function deleteModel(id) {
  const numId = parseInt(id);
  const cur = getModel(numId);
  const oldImage = cur ? cur.image : (stateCache.states[numId] ? stateCache.states[numId].image : null);

  stateCache.deletedProjectIds = stateCache.deletedProjectIds || [];
  if (!stateCache.deletedProjectIds.includes(numId)) {
    stateCache.deletedProjectIds.push(numId);
  }

  if (stateCache.customProjects) {
    stateCache.customProjects = stateCache.customProjects.filter(m => m.id !== numId);
  }
  if (stateCache.states[numId]) {
    delete stateCache.states[numId];
  }
  if (stateCache.ratings && stateCache.ratings[numId]) {
    delete stateCache.ratings[numId];
  }

  saveStateData(stateCache);

  // Clean up uploaded image file if present
  if (oldImage && oldImage.startsWith('/uploads/')) {
    safelyDeleteUploadFile(oldImage);
  }

  return { success: true };
}

function submitVote({ projectId, voterId, voterName, rating, comment }) {
  const pid = parseInt(projectId);
  if (isNaN(pid)) {
    return { success: false, error: 'Invalid project ID.' };
  }
  if (!voterName || typeof voterName !== 'string' || voterName.trim() === '') {
    return { success: false, error: 'Voter name is mandatory.' };
  }
  const numericRating = parseInt(rating);
  if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
    return { success: false, error: 'Rating must be between 1 and 5 stars.' };
  }

  stateCache.ratings = stateCache.ratings || {};
  stateCache.ratings[pid] = stateCache.ratings[pid] || [];

  const trimmedName = voterName.trim();
  const vId = voterId && String(voterId).trim() !== '' ? String(voterId).trim() : `v_${trimmedName.toLowerCase().replace(/\s+/g, '_')}`;

  // Check if voter already rated this project (by voterId or by name)
  const existingIdx = stateCache.ratings[pid].findIndex(r =>
    (r.voterId && r.voterId === vId) || (r.voterName && r.voterName.toLowerCase() === trimmedName.toLowerCase())
  );

  const voteEntry = {
    voterId: vId,
    voterName: trimmedName,
    rating: numericRating,
    comment: comment ? String(comment).trim() : '',
    updatedAt: new Date().toISOString()
  };

  let wasUpdated = false;
  if (existingIdx !== -1) {
    stateCache.ratings[pid][existingIdx] = voteEntry;
    wasUpdated = true;
  } else {
    stateCache.ratings[pid].push(voteEntry);
  }

  saveStateData(stateCache);

  const updatedModel = getModel(pid);
  return {
    success: true,
    wasUpdated,
    projectId: pid,
    vote: voteEntry,
    ratingCount: updatedModel ? updatedModel.ratingCount : stateCache.ratings[pid].length,
    averageRating: updatedModel ? updatedModel.averageRating : numericRating
  };
}

function getProjectRatings(projectId) {
  const pid = parseInt(projectId);
  return (stateCache.ratings && stateCache.ratings[pid]) || [];
}

function getStats() {
  const models = getAllModels();
  const total = models.length;
  let assigned = 0;
  let available = 0;
  let inProgress = 0;
  let completed = 0;
  let exhibited = 0;
  let winners = 0;

  models.forEach(m => {
    if (m.assignedStudents && m.assignedStudents.length > 0) {
      assigned++;
    }
    if (m.status === 'Available') available++;
    else if (m.status === 'In Progress') inProgress++;
    else if (m.status === 'Completed') completed++;
    else if (m.status === 'Exhibited') exhibited++;

    if (m.award && m.award !== 'None') {
      winners++;
    }
  });

  let totalVotes = 0;
  if (stateCache.ratings) {
    Object.values(stateCache.ratings).forEach(arr => {
      if (Array.isArray(arr)) totalVotes += arr.length;
    });
  }

  return { total, assigned, available, inProgress, completed, exhibited, winners, totalVotes };
}

function generateCSV() {
  const models = getAllModels();
  const header = ['ID', 'Title', 'Category', 'Difficulty', 'Status', 'Award / Winner', 'Team Members', 'Roll / Class Info', 'Booth Number', 'Submission Date', 'Notes'];
  const rows = models.map(m => [
    m.id,
    `"${m.title.replace(/"/g, '""')}"`,
    `"${m.category}"`,
    `"${m.difficulty}"`,
    `"${m.status}"`,
    `"${m.award || 'None'}"`,
    `"${(m.assignedStudents ? m.assignedStudents.join('; ') : '').replace(/"/g, '""')}"`,
    `"${(m.studentRoll || '').replace(/"/g, '""')}"`,
    `"${(m.boothNumber || '').replace(/"/g, '""')}"`,
    `"${(m.submissionDate || '').replace(/"/g, '""')}"`,
    `"${(m.notes || '').replace(/"/g, '""')}"`
  ]);

  return [header.join(','), ...rows.map(r => r.join(','))].join('\n');
}

// -------------------------------------------------------------
// DYNAMIC ADMIN CREDENTIALS & SECURITY
// -------------------------------------------------------------

const AUTH_SECRET = 'science-fair-2026-sandeep-auth-token-salt';

function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function isAdminConfigured() {
  return Boolean(
    stateCache.adminSecurity &&
    stateCache.adminSecurity.configured === true &&
    stateCache.adminSecurity.passwordHash &&
    stateCache.adminSecurity.salt
  );
}

function getAdminUsername() {
  return (stateCache.adminSecurity && stateCache.adminSecurity.username) || 'admin';
}

function verifyAdminPassword(password) {
  if (!isAdminConfigured()) return false;
  if (!password || typeof password !== 'string') return false;
  try {
    const salt = stateCache.adminSecurity.salt;
    const computedHash = hashPassword(password, salt);
    const storedBuf = Buffer.from(stateCache.adminSecurity.passwordHash, 'hex');
    const computedBuf = Buffer.from(computedHash, 'hex');
    if (storedBuf.length !== computedBuf.length) return false;
    return crypto.timingSafeEqual(storedBuf, computedBuf);
  } catch (e) {
    console.error('Password verification error:', e);
    return false;
  }
}

function setAdminPassword(newPassword, username = 'admin') {
  if (!newPassword || typeof newPassword !== 'string' || newPassword.trim().length < 6) {
    return { success: false, error: 'Password must be at least 6 characters long.' };
  }
  const cleanUsername = username && typeof username === 'string' && username.trim() !== '' ? username.trim() : 'admin';
  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword(newPassword.trim(), salt);

  stateCache.adminSecurity = {
    configured: true,
    username: cleanUsername,
    salt: salt,
    passwordHash: passwordHash,
    updatedAt: new Date().toISOString()
  };

  saveStateData(stateCache);
  console.log(`[Security] Master admin password configured for user: ${cleanUsername}`);
  return { success: true };
}

function changeAdminPassword(currentPassword, newPassword) {
  if (!isAdminConfigured()) {
    return { success: false, error: 'Admin is not configured yet. Complete initial setup first.' };
  }
  if (!verifyAdminPassword(currentPassword)) {
    return { success: false, error: 'Current password is incorrect.' };
  }
  if (!newPassword || typeof newPassword !== 'string' || newPassword.trim().length < 6) {
    return { success: false, error: 'New password must be at least 6 characters long.' };
  }
  if (currentPassword === newPassword.trim()) {
    return { success: false, error: 'New password must be different from current password.' };
  }

  const currentUsername = getAdminUsername();
  return setAdminPassword(newPassword.trim(), currentUsername);
}

function getAdminSessionToken() {
  if (!isAdminConfigured()) return '';
  const payload = `${stateCache.adminSecurity.username}:${stateCache.adminSecurity.passwordHash}:${stateCache.adminSecurity.salt}`;
  return crypto.createHmac('sha256', AUTH_SECRET).update(payload).digest('hex');
}

module.exports = {
  getAllModels,
  getModel,
  addModel,
  updateModel,
  updateProjectImage,
  deleteModel,
  submitVote,
  getProjectRatings,
  getStats,
  generateCSV,
  baseData,
  isAdminConfigured,
  getAdminUsername,
  verifyAdminPassword,
  setAdminPassword,
  changeAdminPassword,
  getAdminSessionToken
};
