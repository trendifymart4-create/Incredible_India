import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Custom hook to scroll to top when route changes
 */
export const useScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll to top when the pathname changes
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });
  }, [pathname]);
};

/**
 * Component that automatically scrolls to top on route change
 */
const ScrollToTop: React.FC = () => {
  useScrollToTop();
  return null;
};

export default ScrollToTop;