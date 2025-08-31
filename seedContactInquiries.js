// Script to seed contact inquiries for testing
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, serverTimestamp } = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCDzgQpYFP4_dmAibUvEX8fwafWiFgnNPI",
  authDomain: "incredible-india-89c8e.firebaseapp.com",
  projectId: "incredible-india-89c8e",
  storageBucket: "incredible-india-89c8e.firebasestorage.app",
  messagingSenderId: "684013360789",
  appId: "1:684013360789:web:bddf682db958e3f97f6d9c",
  measurementId: "G-2PYEVE42G0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Sample contact inquiries
const sampleInquiries = [
  {
    name: "John Smith",
    email: "john.smith@example.com",
    subject: "Tour Information Request",
    message: "I would like to know more about the VR tours available for the Taj Mahal.",
    status: "new"
  },
  {
    name: "Maria Garcia",
    email: "maria.g@example.com",
    subject: "Booking Inquiry",
    message: "How can I book a virtual tour for my family of 4?",
    status: "in-progress"
  },
  {
    name: "Robert Johnson",
    email: "rob.johnson@example.com",
    subject: "Technical Issue",
    message: "I'm having trouble accessing the VR experience on my mobile device.",
    status: "resolved"
  },
  {
    name: "Sarah Williams",
    email: "sarah.w@example.com",
    subject: "Feedback",
    message: "The VR tour of Kerala was amazing! Do you have more destinations planned?",
    status: "new"
  }
];

// Seed contact inquiries
async function seedContactInquiries() {
  console.log('Seeding contact inquiries...');
  
  try {
    for (const inquiry of sampleInquiries) {
      const docRef = await addDoc(collection(db, 'contactInquiries'), {
        ...inquiry,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      console.log('Added inquiry with ID:', docRef.id);
    }
    
    // Add sample contact details
    const contactDetailsRef = await addDoc(collection(db, 'config'), {
      id: 'contactDetails',
      email: 'contact@incredibleindia.com',
      phone: '+91 1234567890',
      address: 'Incredible India Tourism Office\nTourism Building, New Delhi\nIndia 110001',
      updatedAt: serverTimestamp(),
      updatedBy: 'admin'
    });
    console.log('Added contact details with ID:', contactDetailsRef.id);
    
    console.log('Seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding data:', error);
  }
}

// Run the seeding function
seedContactInquiries();