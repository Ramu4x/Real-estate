require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

(async () => {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/realestate_db';
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    const user = await User.findOne({ email: 'verify.fix@example.com' }).lean();
    console.log('MONGO_USER_FOUND', !!user, user ? JSON.stringify({ id: user._id, email: user.email, role: user.role }) : null);
    await mongoose.disconnect();
  } catch (err) {
    console.error('MONGO_QUERY_ERROR', err.message);
    process.exitCode = 1;
  }
})();
