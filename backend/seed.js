/**
 * Seed Script — creates tables + demo users + sample reimbursements
 * Run: node seed.js
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool } = require('./config/db');

async function ensureAssignedManagerColumn(conn) {
  try {
    await conn.query(`
      ALTER TABLE reimbursements
      ADD COLUMN assigned_manager_id INT UNSIGNED NULL DEFAULT NULL AFTER user_id
    `);
    console.log('Added column assigned_manager_id');
  } catch (e) {
    if (e.code !== 'ER_DUP_FIELDNAME') throw e;
  }
  try {
    await conn.query(`
      ALTER TABLE reimbursements
      ADD CONSTRAINT fk_reimbursements_assigned_manager
      FOREIGN KEY (assigned_manager_id) REFERENCES users(id) ON DELETE RESTRICT
    `);
    console.log('Added FK fk_reimbursements_assigned_manager');
  } catch (e) {
    if (e.code !== 'ER_DUP_KEYNAME' && e.errno !== 1826) throw e;
  }
}

const seed = async () => {
  const conn = await pool.getConnection();
  try {
    console.log('Starting seed...');

    await conn.beginTransaction();

    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id         INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
        name       VARCHAR(100)    NOT NULL,
        email      VARCHAR(150)    NOT NULL UNIQUE,
        password   VARCHAR(255)    NOT NULL,
        role       ENUM('employee','manager') NOT NULL DEFAULT 'employee',
        created_at TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS reimbursements (
        id               INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
        user_id          INT UNSIGNED    NOT NULL,
        amount           DECIMAL(10,2)   NOT NULL,
        category         ENUM('travel','food','accommodation','training','medical','office_supplies','other') NOT NULL,
        description      TEXT            NOT NULL,
        date             DATE            NOT NULL,
        status           ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
        receipt_url      VARCHAR(1000)   DEFAULT NULL,
        receipt_key      VARCHAR(500)    DEFAULT NULL,
        manager_comments TEXT            DEFAULT NULL,
        reviewed_by      INT UNSIGNED    DEFAULT NULL,
        reviewed_at      DATETIME        DEFAULT NULL,
        created_at       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_user     FOREIGN KEY (user_id)     REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    await conn.commit();
    await ensureAssignedManagerColumn(conn);
    await conn.beginTransaction();

    console.log('Tables ready');

    await conn.query('DELETE FROM reimbursements');
    await conn.query('DELETE FROM users');
    console.log('Cleared existing data');

    const hash = await bcrypt.hash('password123', 10);

    const [r1] = await conn.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      ['Alice Employee', 'employee@demo.com', hash, 'employee']
    );
    const [r2] = await conn.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      ['Bob Manager', 'manager@demo.com', hash, 'manager']
    );
    const [r3] = await conn.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      ['Carol Smith', 'carol@demo.com', hash, 'employee']
    );
    const [r4] = await conn.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      ['Dave Manager', 'dave@demo.com', hash, 'manager']
    );

    const empId = r1.insertId;
    const bobMgrId = r2.insertId;
    const carolId = r3.insertId;
    const daveMgrId = r4.insertId;
    console.log('Created users');

    const reimbursements = [
      [empId, bobMgrId, 4500, 'travel', 'Flight to Mumbai for Q4 client meeting — return trip', '2024-12-01', 'approved', 'Approved as per travel policy.', bobMgrId, '2024-12-03', null, null],
      [empId, bobMgrId, 850, 'food', 'Team lunch at client office in Pune — 5 people', '2024-12-05', 'rejected', 'Receipt not provided. Please resubmit.', bobMgrId, '2024-12-06', null, null],
      [empId, daveMgrId, 2200, 'accommodation', 'Hotel stay in Bangalore — 2 nights', '2024-12-10', 'pending', null, null, null, null, null],
      [empId, bobMgrId, 3500, 'training', 'AWS Cloud Practitioner online course', '2024-12-12', 'pending', null, null, null, null, null],
      [carolId, daveMgrId, 1200, 'medical', 'Doctor consultation and medicines for viral fever', '2024-12-08', 'approved', 'Approved.', daveMgrId, '2024-12-09', null, null],
      [carolId, bobMgrId, 650, 'office_supplies', 'Ergonomic mouse and keyboard for home office', '2024-12-14', 'pending', null, null, null, null, null],
      [carolId, daveMgrId, 9800, 'travel', 'Singapore Tech Summit — flights and visa fees', '2024-12-15', 'pending', null, null, null, null, null],
    ];

    for (const r of reimbursements) {
      await conn.query(
        `
        INSERT INTO reimbursements
          (user_id, assigned_manager_id, amount, category, description, date, status, manager_comments, reviewed_by, reviewed_at, receipt_url, receipt_key)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        r
      );
    }
    console.log('Created reimbursements');

    await conn.commit();

    console.log('\nSeed complete!\n');
    console.log('Demo Credentials:');
    console.log('  Employee : employee@demo.com / password123');
    console.log('  Manager  : manager@demo.com  / password123 (Bob)');
    console.log('  Manager  : dave@demo.com    / password123 (Dave)');
    console.log('  Employee : carol@demo.com    / password123\n');
  } catch (err) {
    await conn.rollback();
    console.error('Seed failed:', err.message);
  } finally {
    conn.release();
    process.exit(0);
  }
};

seed();
