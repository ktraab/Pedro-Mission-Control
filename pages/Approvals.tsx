import React, { useState, useEffect } from 'react';
import { ApprovalItem } from '../types';
import { Check, X, Edit3, Send, Terminal, Shield, GitBranch, FileEdit, Mail, Clock, Loader2 } from 'lucide-react';

const Approvals: React.FC = () => {
  const [items, setItems] = useState<ApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const abortController = new AbortController();
    let isMounted = true;

    const fetchApprovals = async () => {
      try {
        const res = await fetch('/api/approvals?status=pending', { signal: abortController.signal });
        if (res.ok) {
          const data = await res.json();
          if (isMounted) setItems(data);
        }
      } catch (e) {
        if (e instanceof Error && e.name === 'AbortError') return;
        if (isMounted) console.error("Failed to load approvals", e);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchApprovals();
    const interval = setInterval(fetchApprovals, 10000);

    return () => {
      isMounted = false;
      abortController.abort();
      clearInterval(interval);
    };
  }, []);

  const handleAction = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await fetch('/api/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', id, status })
      });
      // Refresh after action
      const res = await fetch('/api/approvals?status=pending');
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (e) {
      console.error("Failed to update approval", e);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'shell': return <Terminal size={16} />;
      case 'git-push': return <GitBranch size={16} />;
      case 'file-write': return <FileEdit size={16} />;
      case 'message-send': return <Mail size={16} />;
      case 'cron-create': return <Clock size={16} />;
      default: return <Shield size={16} />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'shell': return 'Shell Command';
      case 'git-push': return 'Git Push';
      case 'file-write': return 'File Write';
      case 'message-send': return 'Message Send';
      case 'cron-create': return 'Cron Job';
      case 'webhook': return 'Webhook';
      default: return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'shell': return 'bg-red-500/10 text-red-500 border-red-500/30';
      case 'git-push': return 'bg-purple-500/10 text-purple-500 border-purple-500/30';
      case 'file-write': return 'bg-blue-500/10 text-blue-500 border-blue-500/30';
      case 'message-send': return 'bg-green-500/10 text-green-500 border-green-500/30';
      case 'cron-create': return 'bg-amber-500/10 text-amber-500 border-amber-500/30';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/30';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <Loader2 size={32} className="animate-spin mb-4" />
        <p>Loading approvals...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 animate-in fade-in">
        <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mb-4">
          <Check size={32} className="text-gray-700" />
        </div>
        <p>All cleared. No pending approvals.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h2 className="text-2xl font-bold text-white">Approval Queue</h2>
          <p className="text-gray-400">Review and authorize agent actions.</p>
        </div>
        <div className="text-sm text-gray-500">{items.length} pending</div>
      </div>
      
      <div className="space-y-6 mt-8">
        {items.map(item => (
          <div key={item.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-sm hover:border-gray-700 transition-colors">
            <div className="px-6 py-4 bg-gray-950/50 border-b border-gray-800 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider flex items-center gap-1.5 border ${getTypeColor(item.type)}`}>
                  {getTypeIcon(item.type)}
                  {getTypeLabel(item.type)}
                </span>
                <span className="text-xs text-gray-500">Requested by <span className="text-gray-300 font-medium">{item.requestedBy}</span></span>
              </div>
              <span className="text-xs text-gray-600 font-mono">ID: {item.id.slice(-6)}</span>
            </div>
            <div className="p-6">
              {item.type === 'shell' ? (
                <div className="bg-black rounded-md p-4 font-mono text-xs text-gray-300 border-l-2 border-red-500">
                  <div className="flex items-center gap-2 mb-2 text-gray-500">
                    <Terminal size={12} />
                    <span>Command</span>
                  </div>
                  {item.content}
                </div>
              ) : (
                <p className="text-gray-200 text-sm whitespace-pre-wrap leading-relaxed">{item.content}</p>
              )}
            </div>
            <div className="px-6 py-4 bg-gray-950/30 border-t border-gray-800 flex justify-end gap-3">
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 text-gray-300 text-xs font-medium hover:bg-gray-700 hover:text-white transition-colors">
                <Edit3 size={14} />
                Edit
              </button>
              <button 
                onClick={() => handleAction(item.id, 'rejected')} 
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-900/50 text-red-500 text-xs font-medium hover:bg-red-950 transition-colors"
              >
                <X size={14} />
                Reject
              </button>
              <button 
                onClick={() => handleAction(item.id, 'approved')} 
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500 text-black text-xs font-bold hover:bg-green-400 shadow-[0_0_15px_rgba(16,185,129,0.2)] transition-colors"
              >
                <Send size={14} />
                Approve & Execute
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Approvals;
