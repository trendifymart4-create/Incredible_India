import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { isMobileDevice } from '../../utils/deviceDetection';

interface DeviceDetectorProps {
  children: React.ReactNode;
}

const DeviceDetector: React.FC<DeviceDetectorProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    const checkDevice = () => {
      const isMobile = isMobileDevice();
      const currentPath = location.pathname;
      
      // If on mobile device and not on mobile route, redirect to mobile
      if (isMobile && !currentPath.startsWith('/mobile')) {
        const mobilePath = `/mobile${currentPath}`;
        navigate(mobilePath, { replace: true });
      }
      
      // If not on mobile device and on mobile route, redirect to desktop
      if (!isMobile && currentPath.startsWith('/mobile')) {
        const desktopPath = currentPath.replace('/mobile', '') || '/';
        navigate(desktopPath, { replace: true });
      }
    };
    
    checkDevice();
    
    // Also check on window resize
    window.addEventListener('resize', checkDevice);
    
    return () => {
      window.removeEventListener('resize', checkDevice);
    };
  }, [navigate, location.pathname]);
  
  return <>{children}</>;
};

export default DeviceDetector;