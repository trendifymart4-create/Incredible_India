import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MobileApp from '../../MobileApp';

const MobileRouter: React.FC = () => {
  return (
    <Routes>
      <Route path="*" element={<MobileApp />} />
    </Routes>
  );
};

export default MobileRouter;