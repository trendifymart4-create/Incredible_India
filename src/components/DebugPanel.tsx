import React, { useState } from 'react';
import { Settings, Database, Wifi } from 'lucide-react';
import { seedSampleDestinations } from '../utils/destinationSeeder';
import { getDestinations } from '../api/destinations';

interface DebugPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const DebugPanel: React.FC<DebugPanelProps> = ({ isOpen, onClose }) => {
  const [isSeeding, setIsSeeding] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const addDebugInfo = (message: string) => {
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const clearDebugInfo = () => {
    setDebugInfo([]);
  };

  const handleSeedDestinations = async () => {
    setIsSeeding(true);
    addDebugInfo('Starting to seed sample destinations...');
    
    try {
      await seedSampleDestinations();
      addDebugInfo('✅ Successfully seeded sample destinations!');
    } catch (error) {
      addDebugInfo(`❌ Error seeding destinations: ${error}`);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleTestFirebase = async () => {
    setIsTesting(true);
    addDebugInfo('Testing Firebase connection...');
    
    try {
      const destinations = await getDestinations();
      addDebugInfo(`✅ Firebase connection successful! Found ${destinations.length} destinations.`);
      
      if (destinations.length === 0) {
        addDebugInfo('ℹ️ No destinations found. You may need to seed sample data.');
      } else {
        destinations.forEach((dest, index) => {
          addDebugInfo(`  ${index + 1}. ${dest.name} (${dest.location})`);
        });
      }
    } catch (error) {
      addDebugInfo(`❌ Firebase connection failed: ${error}`);
      addDebugInfo('💡 This might be due to Firebase security rules or network issues.');
    } finally {
      setIsTesting(false);
    }
  };

  const handleClearCache = () => {
    addDebugInfo('Clearing browser cache and reloading...');
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
            <Settings className="w-6 h-6 text-orange-500" />
            <span>Debug Panel</span>
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Actions */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center space-x-2">
              <Database className="w-5 h-5 text-blue-500" />
              <span>Database Actions</span>
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={handleTestFirebase}
                disabled={isTesting}
                className="flex items-center justify-center space-x-2 p-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors disabled:opacity-50"
              >
                <Wifi className="w-4 h-4" />
                <span>{isTesting ? 'Testing...' : 'Test Firebase'}</span>
              </button>
              
              <button
                onClick={handleSeedDestinations}
                disabled={isSeeding}
                className="flex items-center justify-center space-x-2 p-3 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition-colors disabled:opacity-50"
              >
                <Database className="w-4 h-4" />
                <span>{isSeeding ? 'Seeding...' : 'Seed Data'}</span>
              </button>
              
              <button
                onClick={handleClearCache}
                className="flex items-center justify-center space-x-2 p-3 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span>Clear Cache</span>
              </button>
              
              <button
                onClick={clearDebugInfo}
                className="flex items-center justify-center space-x-2 p-3 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg transition-colors"
              >
                <span>Clear Logs</span>
              </button>
            </div>
          </div>

          {/* Debug Info */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Debug Logs</h3>
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg h-64 overflow-y-auto font-mono text-sm">
              {debugInfo.length === 0 ? (
                <div className="text-gray-500">No debug information yet. Click "Test Firebase" to start.</div>
              ) : (
                debugInfo.map((info, index) => (
                  <div key={index} className="mb-1">
                    {info}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">Troubleshooting Steps:</h4>
            <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
              <li>First, click "Test Firebase" to check connectivity</li>
              <li>If no destinations found, click "Seed Data" to add sample destinations</li>
              <li>If still having issues, try "Clear Cache" and refresh</li>
              <li>Check browser console for additional error messages</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugPanel;