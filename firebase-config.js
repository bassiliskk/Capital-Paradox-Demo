// ==========================================
// FIREBASE CONFIGURATION (PUBLIC DEMO MODE)
// ==========================================
// This version is safe to share publicly. It uses a local mock
// database stored in localStorage so the UI still works.

const DEMO_MODE = true;

const firebaseConfig = {
  apiKey: "REDACTED",
  authDomain: "REDACTED",
  databaseURL: "REDACTED",
  projectId: "REDACTED",
  storageBucket: "REDACTED",
  messagingSenderId: "REDACTED",
  appId: "REDACTED",
  measurementId: "REDACTED"
};

// ==========================================
// DEMO DATABASE (localStorage-backed)
// ==========================================

const DEMO_STORAGE_KEY = "capital_paradox_demo_db";
const DEMO_LISTENERS = new Map();

function readDemoDb() {
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.warn("Failed to read demo DB", e);
    return {};
  }
}

function writeDemoDb(db) {
  try {
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(db));
  } catch (e) {
    console.warn("Failed to write demo DB", e);
  }
}

function deepGet(obj, path) {
  if (!path) return obj;
  const parts = path.split("/").filter(Boolean);
  let cur = obj;
  for (const p of parts) {
    if (!cur || typeof cur !== "object") return null;
    cur = cur[p];
  }
  return cur === undefined ? null : cur;
}

function deepSet(obj, path, value) {
  const parts = path.split("/").filter(Boolean);
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    if (!cur[p] || typeof cur[p] !== "object") cur[p] = {};
    cur = cur[p];
  }
  if (parts.length === 0) return;
  cur[parts[parts.length - 1]] = value;
}

function deepRemove(obj, path) {
  const parts = path.split("/").filter(Boolean);
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    if (!cur[p] || typeof cur[p] !== "object") return;
    cur = cur[p];
  }
  if (parts.length === 0) return;
  delete cur[parts[parts.length - 1]];
}

function notifyListeners(path) {
  const pathsToNotify = new Set();
  const parts = path.split("/").filter(Boolean);
  let cur = "";
  pathsToNotify.add("");
  for (const p of parts) {
    cur = cur ? `${cur}/${p}` : p;
    pathsToNotify.add(cur);
  }

  const db = readDemoDb();
  for (const p of pathsToNotify) {
    const listeners = DEMO_LISTENERS.get(p);
    if (!listeners) continue;
    const snap = { val: () => deepGet(db, p) };
    listeners.forEach((cb) => {
      try { cb(snap); } catch (e) { console.warn("Listener error", e); }
    });
  }
}

function makeRef(path = "") {
  return {
    toString() {
      return "https://demo.local";
    },
    set(value) {
      const db = readDemoDb();
      if (path === "") {
        if (value && typeof value === "object") {
          writeDemoDb(value);
        }
      } else {
        deepSet(db, path, value);
        writeDemoDb(db);
      }
      notifyListeners(path);
      return Promise.resolve();
    },
    update(updates) {
      const db = readDemoDb();
      if (path === "") {
        Object.entries(updates || {}).forEach(([k, v]) => {
          if (v === null) deepRemove(db, k); else deepSet(db, k, v);
        });
      } else {
        const target = deepGet(db, path) || {};
        Object.entries(updates || {}).forEach(([k, v]) => {
          if (v === null) delete target[k]; else target[k] = v;
        });
        deepSet(db, path, target);
      }
      writeDemoDb(db);
      notifyListeners(path);
      return Promise.resolve();
    },
    remove() {
      const db = readDemoDb();
      deepRemove(db, path);
      writeDemoDb(db);
      notifyListeners(path);
      return Promise.resolve();
    },
    once(event, cb) {
      const snap = { val: () => deepGet(readDemoDb(), path) };
      if (typeof cb === "function") cb(snap);
      return Promise.resolve(snap);
    },
    on(event, cb) {
      if (!DEMO_LISTENERS.has(path)) DEMO_LISTENERS.set(path, []);
      DEMO_LISTENERS.get(path).push(cb);
      const snap = { val: () => deepGet(readDemoDb(), path) };
      cb(snap);
      return cb;
    },
    off(event, cb) {
      const list = DEMO_LISTENERS.get(path);
      if (!list) return;
      if (!cb) {
        DEMO_LISTENERS.delete(path);
        return;
      }
      DEMO_LISTENERS.set(path, list.filter((fn) => fn !== cb));
    }
  };
}

const database = {
  ref(path = "") {
    return makeRef(path);
  }
};

// ==========================================
// DEMO DATA SEED
// ==========================================

(function seedDemoData() {
  const existing = readDemoDb();
  if (existing && Object.keys(existing).length > 0) return;

  const demo = {
    teamList: ["ALPHA", "BETA", "GAMMA", "DELTA"],
    teamStates: {
      1: { ALPHA: "access", BETA: "access", GAMMA: "revoked", DELTA: "revoked" },
      2: { ALPHA: "access", BETA: "revoked", GAMMA: "revoked", DELTA: "revoked" },
      3: { ALPHA: "revoked", BETA: "revoked", GAMMA: "revoked", DELTA: "revoked" },
      4: { ALPHA: "revoked", BETA: "revoked", GAMMA: "revoked", DELTA: "revoked" },
      round1: { ALPHA: "access", BETA: "access", GAMMA: "revoked", DELTA: "revoked" },
      round2: { ALPHA: "access", BETA: "revoked", GAMMA: "revoked", DELTA: "revoked" },
      round3: { ALPHA: "revoked", BETA: "revoked", GAMMA: "revoked", DELTA: "revoked" },
      round4: { ALPHA: "revoked", BETA: "revoked", GAMMA: "revoked", DELTA: "revoked" }
    },
    cardCategoryLocks: {
      crisis: false,
      development: false,
      resource: false,
      war_special: false
    },
    auctionStatus: "open",
    auctionConfig: {
      totalCapital: 100000
    },
    auctionItems: {
      item1: { number: 1, name: "Vintage Camera", category: "Antiques", actualValue: 12000, displayed: true, reveal: true, revealedAt: Date.now() - 60000 },
      item2: { number: 2, name: "Blue Chip Stock", category: "Stocks", actualValue: 18000, displayed: true, reveal: false },
      item3: { number: 3, name: "Industrial Printer", category: "Goods", actualValue: 9000, displayed: false, reveal: false }
    },
    auctionBids: {
      ALPHA: {
        item1: { bid: 10000, status: "revealed", updatedAt: Date.now() - 120000 }
      },
      BETA: {
        item2: { bid: 15000, status: "locked", updatedAt: Date.now() - 30000 }
      }
    },
    clientConfig: {
      graceSeconds: 30
    }
  };

  writeDemoDb(demo);
})();

// ==========================================
// EVENT DETAILS (GENERIC PLACEHOLDERS)
// ==========================================

const EVENT_DETAILS = {
  date: "Demo Date",
  time: "Demo Time",
  venue: {
    name: "Demo Venue",
    address: "Demo Address",
    landmark: "Demo Landmark"
  },
  registration: {
    deadline: "Demo Deadline",
    fee: "Free Entry",
    maxTeams: 50
  },
  prizes: {
    first: "Demo Prize",
    second: "Demo Prize",
    third: "Demo Prize"
  },
  contact: {
    email: "demo@example.com",
    phone: "+00 00000 00000",
    whatsapp: "#"
  },
  social: {
    instagram: "#",
    twitter: "#",
    linkedin: "#"
  }
};

// ==========================================
// SESSION MANAGEMENT UTILITIES
// ==========================================

function generateSessionId() {
  return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

const HEARTBEAT_INTERVAL = 30000;
const SESSION_TIMEOUT = 120000;
let heartbeatTimer = null;

function startHeartbeat(teamCode, sessionId) {
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  heartbeatTimer = setInterval(() => {
    database.ref(`activeSessions/${teamCode}`).update({
      lastHeartbeat: Date.now()
    });
  }, HEARTBEAT_INTERVAL);
}

function stopHeartbeat() {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
}

async function createActiveSession(teamCode, sessionId) {
  await database.ref(`activeSessions/${teamCode}`).set({
    sessionId: sessionId,
    timestamp: Date.now(),
    lastHeartbeat: Date.now()
  });
  return true;
}

async function checkActiveSession(teamCode) {
  const snapshot = await database.ref(`activeSessions/${teamCode}`).once('value');
  const session = snapshot.val();
  if (!session) return null;

  const lastActivity = session.lastHeartbeat || session.lastSeen || 0;
  const timeSinceHeartbeat = Date.now() - lastActivity;
  if (timeSinceHeartbeat > SESSION_TIMEOUT) {
    await database.ref(`activeSessions/${teamCode}`).remove();
    return null;
  }
  return session;
}

async function removeActiveSession(teamCode) {
  stopHeartbeat();
  await database.ref(`activeSessions/${teamCode}`).remove();
}

async function validateCurrentSession(teamCode, sessionId) {
  const snapshot = await database.ref(`activeSessions/${teamCode}`).once('value');
  const session = snapshot.val();
  if (!session) return false;
  return session.sessionId === sessionId;
}

async function isValidTeamCode(teamCode) {
  const teamListSnapshot = await database.ref('teamList').once('value');
  const teamList = teamListSnapshot.val();
  if (Array.isArray(teamList)) return teamList.includes(teamCode);
  if (teamList && typeof teamList === "object") return teamList[teamCode] === true;
  return true;
}

// ==========================================
// ADMIN AUTHENTICATION (DEMO)
// ==========================================

async function hashPassword(password) {
  return "DEMO";
}

async function validateAdminAccess(enteredPassword) {
  return true;
}

// ==========================================
// HELPER FUNCTIONS FOR EVENT DETAILS
// ==========================================

function getWhatsAppLink() { return EVENT_DETAILS.contact.whatsapp; }
function getEventDateTime() { return { date: EVENT_DETAILS.date, time: EVENT_DETAILS.time }; }
function getVenueInfo() { return EVENT_DETAILS.venue; }
function getContactInfo() { return EVENT_DETAILS.contact; }
function getPrizeInfo() { return EVENT_DETAILS.prizes; }
