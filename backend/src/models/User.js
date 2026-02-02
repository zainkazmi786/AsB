import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'صارف نام ضروری ہے'],
    unique: true,
    trim: true,
    lowercase: true,
    minlength: [3, 'صارف نام کم از کم 3 حروف کا ہونا چاہیے'],
  },
  password: {
    type: String,
    required: [true, 'پاس ورڈ ضروری ہے'],
    minlength: [6, 'پاس ورڈ کم از کم 6 حروف کا ہونا چاہیے'],
  },
  name: {
    type: String,
    required: [true, 'نام ضروری ہے'],
    trim: true,
  },
  role: {
    type: String,
    enum: ['admin', 'accountant', 'viewer'],
    default: 'viewer',
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  lastLogin: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

const User = mongoose.model('User', userSchema);

export default User;
