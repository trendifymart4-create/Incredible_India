// Contact API functions
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';

export interface ContactInquiry {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'new' | 'in-progress' | 'resolved' | 'archived';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  assignedTo?: string;
}

export interface ContactDetails {
  id: string;
  email: string;
  phone: string;
  address: string;
  updatedAt: Timestamp;
  updatedBy: string;
}

export interface CreateContactInquiryData {
  name: string;
  email: string;
  subject: string;
  message: string;
  status?: 'new' | 'in-progress' | 'resolved' | 'archived';
}

export interface UpdateContactInquiryData {
  status?: 'new' | 'in-progress' | 'resolved' | 'archived';
  assignedTo?: string;
  updatedAt: Timestamp;
}

export interface UpdateContactDetailsData {
  email?: string;
  phone?: string;
  address?: string;
  updatedBy: string;
}

// Create new contact inquiry
export const createContactInquiry = async (data: CreateContactInquiryData): Promise<string> => {
  try {
    const inquiryData = {
      ...data,
      status: data.status || 'new',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'contactInquiries'), inquiryData);
    return docRef.id;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to create contact inquiry');
  }
};

// Update contact inquiry
export const updateContactInquiry = async (
  id: string,
  data: UpdateContactInquiryData
): Promise<void> => {
  try {
    const updateData = {
      ...data,
      updatedAt: serverTimestamp()
    };

    await updateDoc(doc(db, 'contactInquiries', id), updateData);
  } catch (error: any) {
    throw new Error(error.message || 'Failed to update contact inquiry');
  }
};

// Delete contact inquiry
export const deleteContactInquiry = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'contactInquiries', id));
  } catch (error: any) {
    throw new Error(error.message || 'Failed to delete contact inquiry');
  }
};

// Get all contact inquiries
export const getAllContactInquiries = async (): Promise<ContactInquiry[]> => {
  try {
    const q = query(
      collection(db, 'contactInquiries'),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const inquiries: ContactInquiry[] = [];

    querySnapshot.forEach((doc) => {
      const inquiryData = doc.data();
      inquiries.push({
        id: doc.id,
        ...inquiryData
      } as ContactInquiry);
    });

    return inquiries;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch contact inquiries');
  }
};

// Real-time listener for contact inquiries
export const subscribeToContactInquiries = (
  callback: (inquiries: ContactInquiry[]) => void,
  onError?: (error: Error) => void
) => {
  const q = query(
    collection(db, 'contactInquiries'),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(
    q,
    (querySnapshot) => {
      const inquiries: ContactInquiry[] = [];

      querySnapshot.forEach((doc) => {
        inquiries.push({
          id: doc.id,
          ...doc.data()
        } as ContactInquiry);
      });

      callback(inquiries);
    },
    (error) => {
      console.error('Error in contact inquiries subscription:', error);
      if (onError) {
        onError(new Error(error.message || 'Failed to subscribe to contact inquiries'));
      }
    }
  );
};

// Get contact details
export const getContactDetails = async (): Promise<ContactDetails | null> => {
  try {
    const docSnap = await getDoc(doc(db, 'config', 'contactDetails'));

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as ContactDetails;
    }

    return null;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch contact details');
  }
};

// Update contact details
export const updateContactDetails = async (
  data: UpdateContactDetailsData
): Promise<void> => {
  try {
    const updateData = {
      ...data,
      updatedAt: serverTimestamp()
    };

    await updateDoc(doc(db, 'config', 'contactDetails'), updateData);
  } catch (error: any) {
    throw new Error(error.message || 'Failed to update contact details');
  }
};

// Real-time listener for contact details
export const subscribeToContactDetails = (
  callback: (details: ContactDetails | null) => void,
  onError?: (error: Error) => void
) => {
  return onSnapshot(
    doc(db, 'config', 'contactDetails'),
    (doc) => {
      if (doc.exists()) {
        callback({
          id: doc.id,
          ...doc.data()
        } as ContactDetails);
      } else {
        callback(null);
      }
    },
    (error) => {
      console.error('Error in contact details subscription:', error);
      if (onError) {
        onError(new Error(error.message || 'Failed to subscribe to contact details'));
      }
    }
  );
};