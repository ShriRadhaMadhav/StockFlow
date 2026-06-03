const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

async function run() {
  console.log('Connecting to database...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected.');

  const db = mongoose.connection.db;
  const users = await db.collection('users').find({}).toArray();
  
  console.log('\n--- REGISTERED USERS ---');
  if (users.length === 0) {
    console.log('No users found in the database. Please go to "/register" in the browser to sign up!');
  } else {
    users.forEach(u => {
      console.log(`Name: ${u.name} | Email: ${u.email} | Role: ${u.role}`);
    });
  }

  await mongoose.disconnect();
}

run().catch(console.error);
