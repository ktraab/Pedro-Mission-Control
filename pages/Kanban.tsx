import React, { useState, useEffect, memo } from 'react';
import { Plus, GripVertical, Loader2 } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  status: 'backlog' | 'in-progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high';
}

// PERFORMANCE: Memoized task card to prevent unnecessary re-renders
const TaskCard = memo(({ task, onDragStart }: { task: Task; onDragStart: (e: React.DragEvent, taskId: string) => void }) => (
  <div
    draggable
    onDragStart={(e) => onDragStart(e, task.id)}
    className="bg-gray-900 border border-gray-800 p-4 rounded-lg cursor-grab hover:border-gray-600 transition-colors"
  >
    <div className="flex justify-between items-start mb-2">
      <span className={`text-[10px] uppercase px-2 py-0.5 rounded ${task.priority === 'high' ? 'bg-red-500/10 text-red-500' : 'bg-gray-700/50 text-gray-400'}`}>
        {task.priority}
      </span>
      <GripVertical size={14} className="text-gray-700" />
    </div>
    <h4 className="text-gray-200 text-sm">{task.title}</h4>
  </div>
));

TaskCard.displayName = 'TaskCard';

const Kanban: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    const abortController = new AbortController();
    let isMounted = true;

    const fetchTasks = async () => {
      try {
        const res = await fetch('/api/tasks', { signal: abortController.signal });
        const data = await res.json();
        if (isMounted) {
          setTasks(data.map((t: any) => ({ id: t.id, title: t.title, status: t.status || 'backlog', priority: t.priority || 'medium' })));
        }
      } catch (e) {
        if (e instanceof Error && e.name === 'AbortError') return;
        if (isMounted) console.error('Failed to fetch tasks:', e);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchTasks();
    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, []);

  const columns = [
    { id: 'backlog', title: 'Backlog', color: 'text-gray-500' },
    { id: 'in-progress', title: 'In Progress', color: 'text-blue-400' },
    { id: 'review', title: 'Review', color: 'text-purple-400' },
    { id: 'done', title: 'Done', color: 'text-green-400' },
  ];

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, status: Task['status']) => {
    e.preventDefault();
    if (!draggedTaskId) return;
    setTasks(prev => prev.map(t => t.id === draggedTaskId ? { ...t, status } : t));
    setDraggedTaskId(null);
    try {
      await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', id: draggedTaskId, status })
      });
    } catch (e) {
      console.error(e);
    }
  };

  const addNewTask = async () => {
    if (!newTaskTitle.trim()) return;
    try {
      await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', title: newTaskTitle, status: 'backlog' })
      });
      setNewTaskTitle('');
      setIsAdding(false);
      const res = await fetch('/api/tasks');
      const data = await res.json();
      setTasks(data.map((t: any) => ({ id: t.id, title: t.title, status: t.status || 'backlog', priority: t.priority || 'medium' })));
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="p-6 flex justify-center"><Loader2 className="animate-spin text-gray-500" /></div>;

  return (
    <div className="p-6 h-screen flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Project Board</h2>
          <p className="text-gray-400 text-sm">{tasks.length} tasks</p>
        </div>
        <button onClick={() => setIsAdding(!isAdding)} className="bg-blue-500/10 text-blue-400 border border-blue-500/50 px-4 py-2 rounded-lg text-sm flex items-center gap-2">
          <Plus size={16} /> New Task
        </button>
      </div>

      {isAdding && (
        <div className="mb-4 flex gap-2">
          <input
            value={newTaskTitle}
            onChange={e => setNewTaskTitle(e.target.value)}
            placeholder="Task title..."
            onKeyDown={e => e.key === 'Enter' && addNewTask()}
            className="flex-1 bg-gray-900 border border-gray-700 text-white px-3 py-2 rounded text-sm"
            autoFocus
          />
          <button onClick={addNewTask} className="px-4 py-2 bg-blue-500 text-white rounded text-sm">Add</button>
          <button onClick={() => setIsAdding(false)} className="px-4 py-2 text-gray-400">Cancel</button>
        </div>
      )}

      <div className="flex gap-6 flex-1 overflow-x-auto">
        {columns.map(col => (
          <div key={col.id} className="w-72 flex flex-col" onDragOver={handleDragOver} onDrop={e => handleDrop(e, col.id as Task['status'])}>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-800">
              <span className={`font-semibold text-sm ${col.color}`}>{col.title}</span>
              <span className="text-xs text-gray-600">{tasks.filter(t => t.status === col.id).length}</span>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto">
              {tasks.filter(t => t.status === col.id).map(task => (
                <TaskCard key={task.id} task={task} onDragStart={handleDragStart} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Kanban;
