import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Import firebase-admin
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Get the directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Firebase Admin SDK
const serviceAccount = JSON.parse(readFileSync(resolve(__dirname, './serviceAccountKey.json'), 'utf8'));

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

// Function to seed destinations
async function seedDestinations() {
  try {
    console.log('=== Seeding Destinations ===\n');
    
    const destinationsData = JSON.parse(readFileSync(resolve(__dirname, './destinations.json'), 'utf8'));
    const destinationsCollection = db.collection('destinations');
    
    console.log(`Found ${destinationsData.length} destinations to seed.`);

    for (const destination of destinationsData) {
        const destinationWithTimestamp = {
            ...destination,
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: 'system-seed'
        };
      await destinationsCollection.add(destinationWithTimestamp);
      console.log(`Added destination: ${destination.name}`);
    }
    
    console.log('\n=== Seeding Complete ===');
    
  } catch (error) {
    console.error('Error seeding destinations:', error);
  } finally {
      process.exit(0);
  }
}

// Run the script
seedDestinations();