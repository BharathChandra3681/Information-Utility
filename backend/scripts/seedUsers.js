/**
 * Seed Demo Users
 * Creates demo users in MongoDB for testing
 */

const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config({ path: '../.env' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/iu-network';

const demoUsers = [
  {
    userId: 'CRED-HDFC-001',
    email: 'creditor@hdfc.com',
    password: 'demo123', // In production, this should be hashed
    role: 'Creditor',
    organization: 'HDFC Bank',
    firstName: 'Rajesh',
    lastName: 'Kumar',
    phone: '+91-9876543210',
    address: 'HDFC House, Senapati Bapat Marg, Mumbai'
  },
  {
    userId: 'CRED-ICICI-001',
    email: 'creditor@icici.com',
    password: 'demo123',
    role: 'Creditor',
    organization: 'ICICI Bank',
    firstName: 'Priya',
    lastName: 'Sharma',
    phone: '+91-9876543211',
    address: 'ICICI Bank Towers, Bandra Kurla Complex, Mumbai'
  },
  {
    userId: 'DEBT-RELIANCE-001',
    email: 'corporatedebtor@reliance.com',
    password: 'demo123',
    role: 'Corporate Debtor',
    organization: 'Reliance Industries Ltd',
    firstName: 'Mukesh',
    lastName: 'Patel',
    phone: '+91-9876543212',
    address: 'Maker Chambers IV, Nariman Point, Mumbai'
  },
  {
    userId: 'DEBT-TATA-001',
    email: 'debtor@tata.com',
    password: 'demo123',
    role: 'Corporate Debtor',
    organization: 'Tata Motors Ltd',
    firstName: 'Anand',
    lastName: 'Iyer',
    phone: '+91-9876543213',
    address: 'Bombay House, Homi Mody Street, Mumbai'
  },
  {
    userId: 'DEBT-INFOSYS-001',
    email: 'debtor@infosys.com',
    password: 'demo123',
    role: 'Corporate Debtor',
    organization: 'Infosys Ltd',
    firstName: 'Suresh',
    lastName: 'Narayanan',
    phone: '+91-9876543214',
    address: 'Electronics City, Bangalore'
  },
  {
    userId: 'ADMIN-IU-001',
    email: 'admin@iu.gov.in',
    password: 'demo123',
    role: 'Admin',
    organization: 'Information Utility Authority',
    firstName: 'Vijay',
    lastName: 'Singh',
    phone: '+91-9876543215',
    address: 'IU Authority Building, New Delhi'
  }
];

async function seedUsers() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing users
    console.log('Clearing existing demo users...');
    await User.deleteMany({ email: { $in: demoUsers.map(u => u.email) } });

    // Insert demo users
    console.log('Inserting demo users...');
    const result = await User.insertMany(demoUsers);

    console.log(`\n✅ Successfully seeded ${result.length} demo users:\n`);
    result.forEach(user => {
      console.log(`  - ${user.role}: ${user.email} (ID: ${user.userId})`);
    });

    console.log('\n📋 Demo Credentials:');
    console.log('  Creditor (HDFC): creditor@hdfc.com / demo123');
    console.log('  Creditor (ICICI): creditor@icici.com / demo123');
    console.log('  Corporate Debtor (Reliance): corporatedebtor@reliance.com / demo123');
    console.log('  Corporate Debtor (Tata): debtor@tata.com / demo123');
    console.log('  Corporate Debtor (Infosys): debtor@infosys.com / demo123');
    console.log('  Admin: admin@iu.gov.in / demo123\n');

  } catch (error) {
    console.error('Error seeding users:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the seeder
seedUsers();
