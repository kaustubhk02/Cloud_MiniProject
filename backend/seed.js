/**
 * Seed Script — creates demo users and sample reimbursements
 * Run: node seed.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Reimbursement = require('./models/Reimbursement');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/reimbursementDB';

const users = [
  {
    name: 'Alice Employee',
    email: 'employee@demo.com',
    password: 'password123',
    role: 'employee',
  },
  {
    name: 'Bob Manager',
    email: 'manager@demo.com',
    password: 'password123',
    role: 'manager',
  },
  {
    name: 'Carol Smith',
    email: 'carol@demo.com',
    password: 'password123',
    role: 'employee',
  },
];

const reimbursements = (employeeId, managerId, carol) => [
  {
    userId: employeeId,
    amount: 4500,
    category: 'travel',
    description: 'Flight tickets to Mumbai for Q4 client meeting — return trip',
    date: new Date('2024-12-01'),
    status: 'approved',
    managerComments: 'Approved as per travel policy.',
    reviewedBy: managerId,
    reviewedAt: new Date('2024-12-03'),
  },
  {
    userId: employeeId,
    amount: 850,
    category: 'food',
    description: 'Team lunch at client office in Pune — 5 people attended',
    date: new Date('2024-12-05'),
    status: 'rejected',
    managerComments: 'Receipt not provided. Please resubmit with receipt.',
    reviewedBy: managerId,
    reviewedAt: new Date('2024-12-06'),
  },
  {
    userId: employeeId,
    amount: 2200,
    category: 'accommodation',
    description: 'Hotel stay in Bangalore for 2 nights — Leela Palace',
    date: new Date('2024-12-10'),
    status: 'pending',
  },
  {
    userId: employeeId,
    amount: 3500,
    category: 'training',
    description: 'Online AWS certification course — Cloud Practitioner Essentials',
    date: new Date('2024-12-12'),
    status: 'pending',
  },
  {
    userId: carol,
    amount: 1200,
    category: 'medical',
    description: 'Doctor consultation and prescribed medicines for viral fever',
    date: new Date('2024-12-08'),
    status: 'approved',
    managerComments: 'Approved.',
    reviewedBy: managerId,
    reviewedAt: new Date('2024-12-09'),
  },
  {
    userId: carol,
    amount: 650,
    category: 'office_supplies',
    description: 'Purchased ergonomic mouse and keyboard for home office setup',
    date: new Date('2024-12-14'),
    status: 'pending',
  },
  {
    userId: carol,
    amount: 9800,
    category: 'travel',
    description: 'International conference travel — flights and visa fees for Singapore Tech Summit',
    date: new Date('2024-12-15'),
    status: 'pending',
  },
];

const seed = async () => {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  // Clear existing data
  await User.deleteMany({});
  await Reimbursement.deleteMany({});
  console.log('Cleared existing data');

  // Create users (password hashing handled by model middleware)
  const createdUsers = await User.create(users);
  const employee = createdUsers.find((u) => u.email === 'employee@demo.com');
  const manager = createdUsers.find((u) => u.email === 'manager@demo.com');
  const carol = createdUsers.find((u) => u.email === 'carol@demo.com');
  console.log('Created users');

  // Create reimbursements
  await Reimbursement.insertMany(reimbursements(employee._id, manager._id, carol._id));
  console.log('Created reimbursements');

  console.log('\nSeed complete!\n');
  console.log('Demo Credentials:');
  console.log('  Employee: employee@demo.com / password123');
  console.log('  Manager:  manager@demo.com / password123');
  console.log('  Employee: carol@demo.com   / password123\n');

  process.exit(0);
};

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
