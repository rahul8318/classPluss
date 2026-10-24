const mongoose = require('mongoose');
const config = require('../src/config/env');

beforeAll(async () => {
  // Connect to dedicated test database
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(config.mongodbUri);
  }
});

afterAll(async () => {
  // Clear test database collections
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
  await mongoose.connection.close();
});
