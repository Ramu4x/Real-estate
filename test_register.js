const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Object = require('crypto');
const connectDb = require('./config/db');

dotenv.config();

const registerTest = async () => {
  try {
    await connectDb();
    
    // Simulate API call to auth
    console.log("sending test registration request...");
    const reqBody = {
            name: "Test User 2",
            email: `test@example.com`,
            password: "password123",
            role: "buyer"
    };

    const res1 = await fetch('http://localhost:5003/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reqBody)
    });
    
    console.log("First request status:", res1.status);
    console.log("First request body:", await res1.json());

    console.log("sending duplicate test registration request...");
    const res2 = await fetch('http://localhost:5003/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reqBody)
    });
    
    console.log("Second request status:", res2.status);
    console.log("Second request body:", await res2.json());

  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
};

registerTest();
