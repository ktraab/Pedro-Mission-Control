import React, { useState, useEffect } from 'react';
import { ApprovalItem } from '../types';
import { Check, X, Edit3, Send, Terminal } from 'lucide-react';
import { fileSystem } from '../lib/fileSystem';

const Approvals: React.FC = () => {
    const [items, setItems] = useState<ApprovalItem[]>([]);

    useEffect(() => {
        const data = fileSystem.readFile('approvals.json');
        if (data) {
            try {
                setItems(JSON.parse(data));
            } catch (e) {
                console.error("Failed to load approvals", e);
            }
        }
    }, []);

    const saveItems = (newItems: ApprovalItem[]) => {
        setItems(newItems);
        fileSystem.writeFile('approvals.json', JSON.stringify(newItems));
    };

    const handleAction = (id: string, action: 'approved' | 'rejected') => {
        const newItems = items.filter(item => item.id !== id);
        saveItems(newItems);
        // In a real app, this would trigger the agent to proceed via API
    };

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
            <h2 className="text-2xl font-bold text-white mb-2">Approval Queue</h2>
            <p className="text-gray-400 mb-8">Review and authorize agent actions.</p>

            <div className="space-y-6">
                {items.map(item => (
                    <div key={item.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-sm hover:border-gray-700 transition-colors">
                        <div className="px-6 py-4 bg-gray-950/50 border-b border-gray-800 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider ${
                                    item.type === 'tweet' ? 'bg-blue-500/10 text-blue-500' :
                                    item.type === 'deploy' ? 'bg-purple-500/10 text-purple-500' :
                                    'bg-green-500/10 text-green-500'
                                }`}>
                                    {item.type}
                                </span>
                                <span className="text-xs text-gray-500">Drafted by <span className="text-gray-300 font-medium">{item.requestedBy}</span></span>
                            </div>
                            <span className="text-xs text-gray-600 font-mono">ID: {item.id}</span>
                        </div>

                        <div className="p-6">
                             {item.type === 'deploy' ? (
                                 <div className="bg-black rounded-md p-4 font-mono text-xs text-gray-300 border-l-2 border-neon-purple">
                                     {item.content}
                                 </div>
                             ) : (
                                <p className="text-gray-200 text-sm whitespace-pre-wrap leading-relaxed">{item.content}</p>
                             )}
                        </div>

                        <div className="px-6 py-4 bg-gray-950/30 border-t border-gray-800 flex justify-end gap-3">
                             <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 text-gray-300 text-xs font-medium hover:bg-gray-700 hover:text-white transition-colors">
                                 <Edit3 size={14} /> Edit
                             </button>
                             <button 
                                onClick={() => handleAction(item.id, 'rejected')}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-900/50 text-red-500 text-xs font-medium hover:bg-red-950 transition-colors"
                             >
                                 <X size={14} /> Reject
                             </button>
                             <button 
                                onClick={() => handleAction(item.id, 'approved')}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neon-green text-black text-xs font-bold hover:bg-green-400 shadow-[0_0_15px_rgba(16,185,129,0.2)] transition-colors"
                             >
                                 <Send size={14} /> Approve & Send
                             </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Approvals;