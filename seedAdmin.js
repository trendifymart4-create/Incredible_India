import { readFileSync } from 'fs';
import { createInterface } from 'readline';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Import firebase-admin
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Get the directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Firebase Admin SDK
const serviceAccount = JSON.parse(readFileSync(resolve(__dirname, './serviceAccountKey.json'), 'utf8'));

initializeApp({
  credential: cert(serviceAccount)
});

const auth = getAuth();
const db = getFirestore();

// Create readline interface for user input
const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to ask questions
const question = (query) => new Promise(resolve => rl.question(query, resolve));

// Function to create or update admin user
async function createOrUpdateAdminUser() {
  try {
    console.log('=== Admin User Setup ===\n');
    
    // Get user input
    const email = await question('Enter admin email: ');
    const password = await question('Enter admin password (min 6 characters): ');
    const firstName = await question('Enter admin first name: ');
    const lastName = await question('Enter admin last name: ');
    
    let userRecord;
    
    try {
      // Try to get existing user
      userRecord = await auth.getUserByEmail(email);
      console.log(`\nUser with email ${email} already exists. Updating...`);
    } catch (error) {
      // User doesn't exist, create new user
      console.log(`\nCreating new user with email ${email}...`);
      userRecord = await auth.createUser({
        email: email,
        password: password,
        displayName: `${firstName} ${lastName}`
      });
    }
    
    // Set custom claims to make user admin
    await auth.setCustomUserClaims(userRecord.uid, { admin: true });
    console.log('Admin role assigned successfully!');
    
    // Create/update user profile in Firestore
    const userRef = db.collection('users').doc(userRecord.uid);
    const userData = {
      uid: userRecord.uid,
      email: userRecord.email,
      firstName: firstName,
      lastName: lastName,
      country: 'IN', // Default to India
      joinDate: new Date().toISOString(),
      subscription: 'premium',
      isAdmin: true,
      purchasedContent: []
    };
    
    await userRef.set(userData, { merge: true });
    console.log('User profile created/updated in Firestore!');
    
    console.log('\n=== Admin User Setup Complete ===');
    console.log(`Admin Email: ${email}`);
    console.log(`User ID: ${userRecord.uid}`);
    console.log('This user now has admin privileges.');
    
    rl.close();
  } catch (error) {
    console.error('Error setting up admin user:', error);
    rl.close();
  }
}

// Run the script
createOrUpdateAdminUser();