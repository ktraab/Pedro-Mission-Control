import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BrainCircuit, 
  KanbanSquare, 
  Users, 
  CheckCircle, 
  Settings, 
  Terminal,
  MessageSquareCode
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/console', label: 'Console', icon: MessageSquareCode },
    { path: '/kanban', label: 'Tasks', icon: KanbanSquare },
    { path: '/memory', label: 'Memory', icon: BrainCircuit },
    { path: '/fleet', label: 'Agent Fleet', icon: Users },
    { path: '/approvals', label: 'Approvals', icon: CheckCircle },
  ];

  return (
    <aside className="w-64 bg-gray-950 border-r border-gray-800 flex flex-col h-screen fixed left-0 top-0 z-50">
      <div className="p-6 flex items-center gap-3 border-b border-gray-800">
        <div className="w-8 h-8 bg-neon-green rounded-md flex items-center justify-center shadow-[0_0_10px_rgba(16,185,129,0.3)]">
           <Terminal size={18} className="text-gray-950" />
        </div>
        <div>
          <h1 className="text-white font-bold tracking-tight text-sm">OpenCLAW</h1>
          <p className="text-xs text-gray-500 font-mono">Mission Control</p>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-gray-900 text-neon-green border border-gray-800 shadow-inner'
                  : 'text-gray-400 hover:text-white hover:bg-gray-900/50'
              }`
            }
          >
            <item.icon size={18} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <NavLink 
          to="/settings"
          className={({ isActive }) => 
            `flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
              isActive ? 'text-white bg-gray-900' : 'text-gray-500 hover:text-white'
            }`
          }
        >
          <Settings size={18} />
          <span className="text-sm">Configuration</span>
        </NavLink>
        <div className="mt-4 px-3">
            <div className="text-[10px] uppercase text-gray-600 font-bold mb-2">Status</div>
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse"></div>
                <span className="text-xs text-gray-300 font-mono">SYSTEM ONLINE</span>
            </div>
        </div>
      </div>
    </aside>
  );
};