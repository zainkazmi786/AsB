import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User.js';
import { config } from '../src/config/config.js';

dotenv.config();

const defaultUsers = [
  {
    username: 'admin',
    password: 'admin123',
    name: 'منتظم',
    role: 'admin',
    isActive: true,
  },
  {
    username: 'accountant',
    password: 'accountant123',
    name: 'اکاؤنٹنٹ',
    role: 'accountant',
    isActive: true,
  },
  {
    username: 'viewer',
    password: 'viewer123',
    name: 'ناظر',
    role: 'viewer',
    isActive: true,
  },
];

const seedUsers = async () => {
  try {
    // Connect to database
    await mongoose.connect(config.mongodb.uri);
    console.log('✅ Connected to MongoDB');

    // Clear existing users (optional - comment out if you want to keep existing users)
    // await User.deleteMany({});
    // console.log('🗑️  Cleared existing users');

    // Create or update users
    for (const userData of defaultUsers) {
      const existingUser = await User.findOne({ username: userData.username });

      if (existingUser) {
        // Update existing user
        // Delete and recreate to ensure password is hashed properly
        await User.deleteOne({ _id: existingUser._id });
        const user = new User(userData);
        await user.save();
        console.log(`✅ Updated user: ${userData.username} (${userData.role})`);
      } else {
        // Create new user
        const user = new User(userData);
        await user.save();
        console.log(`✅ Created user: ${userData.username} (${userData.role})`);
      }
    }

    console.log('\n📋 Default users seeded successfully!');
    console.log('\n📝 Login credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    defaultUsers.forEach((user) => {
      console.log(`Username: ${user.username} | Password: ${user.password} | Role: ${user.role}`);
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding users:', error);
    process.exit(1);
  }
};

seedUsers();
