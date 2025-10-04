const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const DATABASE_URL = 'mongodb://localhost:27017/atlas_ai';

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  email: String,
  role: String,
  firstName: String,
  lastName: String,
  isActive: Boolean,
  passkeyCredentials: Array,
  currentChallenge: String,
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

async function resetAdminPassword() {
  try {
    await mongoose.connect(DATABASE_URL);
    console.log('Connected to database');

    const passwordHash = await bcrypt.hash('password', 10);
    console.log('Password hash generated');

    let admin = await User.findOne({ role: 'Admin' });

    if (!admin) {
      console.log('No admin user found. Creating one...');
      admin = await User.create({
        username: 'admin',
        email: 'admin@atlas.leipnar.com',
        password: passwordHash,
        role: 'Admin',
        firstName: 'Admin',
        lastName: 'User',
        isActive: true,
        passkeyCredentials: [],
        currentChallenge: null,
      });
      console.log('Admin user created');
    } else {
      console.log('Admin user found:', admin.username);
      admin.password = passwordHash;
      await admin.save();
      console.log('Password updated');
    }

    console.log('========================================');
    console.log('Admin credentials:');
    console.log('Username: admin');
    console.log('Password: password');
    console.log('========================================');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

resetAdminPassword();
