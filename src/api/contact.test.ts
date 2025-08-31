// Test file for contact API functions
import { 
  createContactInquiry, 
  updateContactInquiry, 
  getAllContactInquiries,
  getContactDetails,
  updateContactDetails
} from './contact';

// Test the contact API functions
async function testContactAPI() {
  console.log('Testing contact API functions...');
  
  try {
    // Test creating a contact inquiry
    const inquiryId = await createContactInquiry({
      name: 'John Doe',
      email: 'john@example.com',
      subject: 'Test Subject',
      message: 'Test message',
      status: 'new'
    });
    console.log('Created contact inquiry with ID:', inquiryId);
    
    // Test updating a contact inquiry
    await updateContactInquiry(inquiryId, {
      status: 'in-progress',
      updatedAt: new Date()
    });
    console.log('Updated contact inquiry status');
    
    // Test getting all contact inquiries
    const inquiries = await getAllContactInquiries();
    console.log('Retrieved', inquiries.length, 'contact inquiries');
    
    // Test getting contact details
    const details = await getContactDetails();
    console.log('Retrieved contact details:', details);
    
    // Test updating contact details
    await updateContactDetails({
      email: 'contact@example.com',
      phone: '+1234567890',
      address: '123 Test Street, Test City, TC 12345',
      updatedBy: 'test-user'
    });
    console.log('Updated contact details');
    
    console.log('All tests passed!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testContactAPI();