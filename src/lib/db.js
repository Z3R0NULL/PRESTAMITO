import { createClient } from "@libsql/client";

export const db = createClient({
  url: import.meta.env.VITE_TURSO_DATABASE_URL,
  authToken: import.meta.env.VITE_TURSO_AUTH_TOKEN,
});

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function initSchema() {
  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      passwordHash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      address TEXT,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS loans (
      id TEXT PRIMARY KEY,
      clientId TEXT NOT NULL,
      amount REAL NOT NULL,
      interestRate REAL NOT NULL,
      installments INTEGER NOT NULL,
      startDate TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      notes TEXT,
      FOREIGN KEY (clientId) REFERENCES clients(id)
    );

    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      loanId TEXT NOT NULL,
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      installmentNumber INTEGER NOT NULL,
      note TEXT,
      FOREIGN KEY (loanId) REFERENCES loans(id)
    );
  `);

  // Migrate: add 'role' column if missing
  try {
    await db.execute("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user'");
  } catch (_) { /* already exists */ }

  // Migrate: add 'interestType' column if missing
  try {
    await db.execute("ALTER TABLE loans ADD COLUMN interestType TEXT NOT NULL DEFAULT 'monthly'");
  } catch (_) { /* already exists */ }

  // Migrate: add 'userId' column to clients if missing
  try {
    await db.execute("ALTER TABLE clients ADD COLUMN userId TEXT NOT NULL DEFAULT ''");
  } catch (_) { /* already exists */ }

  // Migrate: add 'dni' column to clients if missing
  try {
    await db.execute("ALTER TABLE clients ADD COLUMN dni TEXT NOT NULL DEFAULT ''");
  } catch (_) { /* already exists */ }

  // Seed admin if not exists
  const existing = await db.execute({
    sql: "SELECT id FROM users WHERE username = ? COLLATE NOCASE",
    args: ["z3r0null"],
  });
  if (existing.rows.length === 0) {
    const passwordHash = await hashPassword("#P@ssZ3R0#");
    await db.execute({
      sql: "INSERT INTO users (id, username, passwordHash, role, createdAt) VALUES (?, ?, ?, ?, ?)",
      args: [generateId(), "z3r0null", passwordHash, "admin", new Date().toISOString()],
    });
  }
}

// ── helpers ──────────────────────────────────────────────────────────────────

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// ── clients ──────────────────────────────────────────────────────────────────

export async function fetchClients(userId) {
  const res = await db.execute({
    sql: "SELECT * FROM clients WHERE userId = ? ORDER BY createdAt DESC",
    args: [userId],
  });
  return res.rows.map(rowToObj);
}

export async function insertClient(client, userId) {
  const id = generateId();
  const createdAt = new Date().toISOString().slice(0, 10);
  await db.execute({
    sql: "INSERT INTO clients (id, name, dni, phone, email, address, createdAt, userId) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    args: [id, client.name, client.dni ?? "", client.phone ?? "", client.email ?? "", client.address ?? "", createdAt, userId],
  });
  return { ...client, id, createdAt, userId };
}

const ALLOWED_CLIENT_FIELDS = new Set(["name", "dni", "phone", "email", "address"]);

export async function patchClient(id, updates) {
  const safeKeys = Object.keys(updates).filter((k) => ALLOWED_CLIENT_FIELDS.has(k));
  if (safeKeys.length === 0) return;
  const fields = safeKeys.map((k) => `${k} = ?`).join(", ");
  const values = [...safeKeys.map((k) => updates[k]), id];
  await db.execute({ sql: `UPDATE clients SET ${fields} WHERE id = ?`, args: values });
}

export async function removeClient(id) {
  // cascade: remove loans and their payments first
  const loans = await db.execute({ sql: "SELECT id FROM loans WHERE clientId = ?", args: [id] });
  for (const row of loans.rows) {
    await db.execute({ sql: "DELETE FROM payments WHERE loanId = ?", args: [row.id] });
  }
  await db.execute({ sql: "DELETE FROM loans WHERE clientId = ?", args: [id] });
  await db.execute({ sql: "DELETE FROM clients WHERE id = ?", args: [id] });
}

// ── loans ─────────────────────────────────────────────────────────────────────

export async function fetchLoans(userId) {
  const res = await db.execute({
    sql: "SELECT loans.* FROM loans INNER JOIN clients ON loans.clientId = clients.id WHERE clients.userId = ? ORDER BY loans.startDate DESC",
    args: [userId],
  });
  return res.rows.map(rowToObj);
}

export async function insertLoan(loan) {
  const id = generateId();
  await db.execute({
    sql: "INSERT INTO loans (id, clientId, amount, interestRate, interestType, installments, startDate, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    args: [id, loan.clientId, loan.amount, loan.interestRate, loan.interestType ?? "monthly", loan.installments, loan.startDate, "active", loan.notes ?? ""],
  });
  return { ...loan, id, status: "active", interestType: loan.interestType ?? "monthly" };
}

const ALLOWED_LOAN_FIELDS = new Set(["clientId", "amount", "interestRate", "interestType", "installments", "startDate", "status", "notes"]);

export async function patchLoan(id, updates) {
  const safeKeys = Object.keys(updates).filter((k) => ALLOWED_LOAN_FIELDS.has(k));
  if (safeKeys.length === 0) return;
  const fields = safeKeys.map((k) => `${k} = ?`).join(", ");
  const values = [...safeKeys.map((k) => updates[k]), id];
  await db.execute({ sql: `UPDATE loans SET ${fields} WHERE id = ?`, args: values });
}

export async function removeLoan(id) {
  await db.execute({ sql: "DELETE FROM payments WHERE loanId = ?", args: [id] });
  await db.execute({ sql: "DELETE FROM loans WHERE id = ?", args: [id] });
}

// ── payments ──────────────────────────────────────────────────────────────────

export async function fetchPayments(userId) {
  const res = await db.execute({
    sql: "SELECT payments.* FROM payments INNER JOIN loans ON payments.loanId = loans.id INNER JOIN clients ON loans.clientId = clients.id WHERE clients.userId = ? ORDER BY payments.date DESC",
    args: [userId],
  });
  return res.rows.map(rowToObj);
}

export async function insertPayment(payment) {
  const id = generateId();
  await db.execute({
    sql: "INSERT INTO payments (id, loanId, amount, date, installmentNumber, note) VALUES (?, ?, ?, ?, ?, ?)",
    args: [id, payment.loanId, payment.amount, payment.date, payment.installmentNumber, payment.note ?? ""],
  });
  return { ...payment, id };
}

export async function removePayment(id) {
  await db.execute({ sql: "DELETE FROM payments WHERE id = ?", args: [id] });
}

// ── users / auth ──────────────────────────────────────────────────────────────

export async function loginUser(username, password) {
  const res = await db.execute({
    sql: "SELECT * FROM users WHERE username = ? COLLATE NOCASE",
    args: [username.trim()],
  });
  if (res.rows.length === 0) throw new Error("Usuario o contraseña incorrectos");
  const user = rowToObj(res.rows[0]);
  const passwordHash = await hashPassword(password);
  if (passwordHash !== user.passwordHash) throw new Error("Usuario o contraseña incorrectos");
  const { passwordHash: _, ...safeUser } = user;
  return safeUser;
}

export async function fetchUsers() {
  const res = await db.execute("SELECT id, username, role, createdAt FROM users ORDER BY createdAt DESC");
  return res.rows.map(rowToObj);
}

export async function createUserByAdmin(username, password) {
  const existing = await db.execute({
    sql: "SELECT id FROM users WHERE username = ?",
    args: [username.trim().toLowerCase()],
  });
  if (existing.rows.length > 0) throw new Error("El usuario ya existe");
  const id = generateId();
  const passwordHash = await hashPassword(password);
  const createdAt = new Date().toISOString();
  await db.execute({
    sql: "INSERT INTO users (id, username, passwordHash, role, createdAt) VALUES (?, ?, ?, ?, ?)",
    args: [id, username.trim().toLowerCase(), passwordHash, "user", createdAt],
  });
  return { id, username: username.trim().toLowerCase(), role: "user", createdAt };
}

export async function deleteUser(id) {
  await db.execute({ sql: "DELETE FROM users WHERE id = ?", args: [id] });
}

export async function updateUser(id, { username, password }) {
  if (username) {
    const clash = await db.execute({
      sql: "SELECT id FROM users WHERE username = ? AND id != ?",
      args: [username.trim().toLowerCase(), id],
    });
    if (clash.rows.length > 0) throw new Error("Ese nombre de usuario ya está en uso");
    await db.execute({
      sql: "UPDATE users SET username = ? WHERE id = ?",
      args: [username.trim().toLowerCase(), id],
    });
  }
  if (password) {
    if (password.length < 4) throw new Error("La contraseña debe tener al menos 4 caracteres");
    const passwordHash = await hashPassword(password);
    await db.execute({
      sql: "UPDATE users SET passwordHash = ? WHERE id = ?",
      args: [passwordHash, id],
    });
  }
}

// ── util ──────────────────────────────────────────────────────────────────────

function rowToObj(row) {
  // libsql rows are array-like with named properties
  const obj = {};
  for (const key of Object.keys(row)) {
    obj[key] = row[key];
  }
  return obj;
}
