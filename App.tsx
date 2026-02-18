import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Kanban from './pages/Kanban';
import Memory from './pages/Memory';
import OrgChart from './pages/OrgChart';
import Approvals from './pages/Approvals';
import Settings from './pages/Settings';
import Console from './pages/Console';

const App: React.FC = () => {
  return (
    <HashRouter>
      <div className="flex min-h-screen bg-gray-950 text-gray-100 font-sans selection:bg-neon-green selection:text-black">
        <Sidebar />
        
        {/* Main Content Area */}
        <main className="flex-1 ml-64 p-0 relative overflow-y-auto h-screen">
            {/* Background Grid Pattern */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-10" 
                 style={{ 
                     backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', 
                     backgroundSize: '40px 40px' 
                 }}>
            </div>

            <div className="relative z-10 h-full">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/console" element={<Console />} />
                <Route path="/kanban" element={<Kanban />} />
                <Route path="/memory" element={<Memory />} />
                <Route path="/fleet" element={<OrgChart />} />
                <Route path="/approvals" element={<Approvals />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
        </main>
      </div>
    </HashRouter>
  );
};

export default App;