// Simple test script to check authentication components
const { hashPassword, comparePassword, validatePasswordStrength } = require('./lib/auth/password.js');

async function testPassword() {
  console.log('Testing password functions...');
  
  const testPassword = 'TestPassword123!';
  
  // Test password validation
  const validation = validatePasswordStrength(testPassword);
  console.log('Password validation:', validation);
  
  // Test password hashing
  try {
    const hashed = await hashPassword(testPassword);
    console.log('Password hashed successfully:', hashed ? 'Yes' : 'No');
    
    // Test password comparison
    const isValid = await comparePassword(testPassword, hashed);
    console.log('Password comparison:', isValid ? 'Valid' : 'Invalid');
  } catch (error) {
    console.error('Password hashing error:', error);
  }
}

testPassword();