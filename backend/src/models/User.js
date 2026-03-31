const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: 50,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
    },
    password: {
      type: String,
      minlength: 6,
      select: false, // Never return password in queries
    },
    authProvider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local',
    },
    monthlyIncome: {
      type: Number,
      default: 0,
    },
    bankBalance: {
      type: Number,
      default: 0,
    },
    liabilities: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    gmailConnected: {
      type: Boolean,
      default: false,
    },
    gmailTokens: {
      access_token: String,
      refresh_token: String,
      expiry_date: Number,
    },
    lastEmailSync: {
      type: Date,
    },
    bankBalanceLastSet: {
      type: Date,
    },
    avatar: {
      type: String,
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Method to verify password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
