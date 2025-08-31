// Test file for AdminPanel component
import React from 'react';
import { render, screen } from '@testing-library/react';
import AdminPanel from './AdminPanel';

// Mock the Firebase services
jest.mock('../firebase', () => ({
  db: {},
  auth: {
    useDeviceLanguage: jest.fn()
  }
}));

// Mock the context
jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    currentUser: { uid: 'test-user' }
  })
}));

// Mock the lucide-react icons
jest.mock('lucide-react', () => ({
  Plus: () => <div>Plus</div>,
  Edit: () => <div>Edit</div>,
  Trash2: () => <div>Trash2</div>,
  Eye: () => <div>Eye</div>,
  EyeOff: () => <div>EyeOff</div>,
  X: () => <div>X</div>,
  Video: () => <div>Video</div>,
  Bell: () => <div>Bell</div>,
  Send: () => <div>Send</div>,
  Mail: () => <div>Mail</div>,
  MapPin: () => <div>MapPin</div>,
  Phone: () => <div>Phone</div>
}));

// Mock the child components
jest.mock('./SkeletonLoader', () => ({
  SkeletonCard: () => <div>SkeletonCard</div>,
  SkeletonText: () => <div>SkeletonText</div>
}));

describe('AdminPanel', () => {
  const mockProps = {
    isOpen: true,
    onClose: jest.fn()
  };

  it('renders without crashing', () => {
    render(<AdminPanel {...mockProps} />);
    expect(screen.getByText('Admin Panel')).toBeInTheDocument();
  });

  it('displays all tab navigation options', () => {
    render(<AdminPanel {...mockProps} />);
    
    expect(screen.getByText('Destinations')).toBeInTheDocument();
    expect(screen.getByText('Videos')).toBeInTheDocument();
    expect(screen.getByText('Featured Video')).toBeInTheDocument();
    expect(screen.getByText('Users')).toBeInTheDocument();
    expect(screen.getByText('Revenue')).toBeInTheDocument();
    expect(screen.getByText('Payment Gateways')).toBeInTheDocument();
    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(screen.getByText('Contact')).toBeInTheDocument();
    expect(screen.getByText('VR Tours')).toBeInTheDocument();
  });

  it('shows contact and VR tours tabs', () => {
    render(<AdminPanel {...mockProps} />);
    
    // Check that the contact tab is available
    const contactTab = screen.getByText('Contact');
    expect(contactTab).toBeInTheDocument();
    
    // Check that the VR tours tab is available
    const vrToursTab = screen.getByText('VR Tours');
    expect(vrToursTab).toBeInTheDocument();
  });
});