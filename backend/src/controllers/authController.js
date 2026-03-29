const User = require('../models/User');
const { generateToken } = require('../middleware/auth');

// @desc    Register a new user
// @route   POST /auth/signup
// @access  Public
const signup = async (req, res, next) => {
  try {
    const { name, email, password, monthlyIncome } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered.' });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      monthlyIncome: monthlyIncome || 0,
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        monthlyIncome: user.monthlyIncome,
        bankBalance: user.bankBalance,
        currency: user.currency,
        gmailConnected: user.gmailConnected,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        monthlyIncome: user.monthlyIncome,
        bankBalance: user.bankBalance,
        liabilities: user.liabilities,
        currency: user.currency,
        gmailConnected: user.gmailConnected,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /auth/me
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const { name, monthlyIncome, bankBalance, liabilities, currency } = req.body;

    const updates = {};
    if (name) updates.name = name;
    if (monthlyIncome !== undefined) updates.monthlyIncome = monthlyIncome;
    if (bankBalance !== undefined) updates.bankBalance = bankBalance;
    if (liabilities !== undefined) updates.liabilities = liabilities;
    if (currency) updates.currency = currency;

    const user = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
      runValidators: true,
    });

    res.json({ success: true, message: 'Profile updated.', user });
  } catch (error) {
    next(error);
  }
};

module.exports = { signup, login, getMe, updateProfile };
