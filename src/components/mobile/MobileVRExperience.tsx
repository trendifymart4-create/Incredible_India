import React from 'react';
import type { Destination } from '../Destinations';
import EnhancedMobileVideoModal from './EnhancedMobileVideoModal';

interface MobileVRExperienceProps {
  destination: Destination | null;
  isOpen: boolean;
  onClose: () => void;
}

const MobileVRExperience: React.FC<MobileVRExperienceProps> = ({ destination, isOpen, onClose }) => {
  // Use the enhanced mobile video modal component
  return (
    <EnhancedMobileVideoModal
      destination={destination}
      isOpen={isOpen}
      onClose={onClose}
    />
  );
};

export default MobileVRExperience;