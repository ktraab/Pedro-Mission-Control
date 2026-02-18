import React, { useState, useEffect } from 'react';
import { Task } from '../types';
import { Plus, MoreHorizontal, GripVertical } from 'lucide-react';
import { fileSystem } from '../lib/fileSystem';

const Kanban: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  useEffect(() => {
    const data = fileSystem.readFile('kanban_tasks.json');
    if (data) {
      try {
        setTasks(JSON.parse(data));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const saveTasks = (newTasks: Task[]) => {
    setTasks(newTasks);
    fileSystem.writeFile('kanban_tasks.json', JSON.stringify(newTasks));
  };

  const columns = [
    { id: 'backlog', title: 'Backlog', color: 'border-gray-700' },
    { id: 'in-progress', title: 'In Progress', color: 'border-neon-blue' },
    { id: 'review', title: 'In Review', color: 'border-neon-purple' },
    { id: 'done', title: 'Done', color: 'border-neon-green' },
  ];

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = 'move';
    // Transparent drag image or default
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necessary to allow dropping
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, status: Task['status']) => {
    e.preventDefault();
    if (!draggedTaskId) return;

    const updatedTasks = tasks.map(t => 
      t.id === draggedTaskId ? { ...t, status } : t
    );
    
    saveTasks(updatedTasks);
    setDraggedTaskId(null);
  };

  const addNewTask = () => {
    const newTask: Task = {
      id: `t${Date.now()}`,
      title: 'New Task',
      status: 'backlog',
      assignedTo: 'Unassigned',
      priority: 'medium',
      tags: []
    };
    saveTasks([...tasks, newTask]);
  };

  return (
    <div className="p-6 h-screen overflow-hidden flex flex-col">
      <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Project Board</h2>
          <button 
            onClick={addNewTask}
            className="bg-neon-blue/10 text-neon-blue border border-neon-blue/50 hover:bg-neon-blue/20 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
          >
              <Plus size={16} /> New Task
          </button>
      </div>

      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-6 h-full min-w-[1000px]">
            {columns.map(col => (
                <div 
                    key={col.id} 
                    className="flex-1 flex flex-col min-w-[280px]"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, col.id as Task['status'])}
                >
                    <div className={`flex items-center justify-between mb-4 pb-2 border-b-2 ${col.color}`}>
                        <span className="font-semibold text-gray-300 text-sm uppercase tracking-wider">
                            {col.title} <span className="text-gray-600 ml-2 text-xs">({tasks.filter(t => t.status === col.id).length})</span>
                        </span>
                        <MoreHorizontal size={16} className="text-gray-600 cursor-pointer hover:text-white" />
                    </div>
                    
                    <div className={`flex-1 space-y-3 overflow-y-auto pr-2 pb-10 transition-colors rounded-lg ${
                         draggedTaskId ? 'bg-gray-900/30 border-2 border-dashed border-gray-800/50' : ''
                    }`}>
                        {tasks.filter(t => t.status === col.id).map(task => (
                            <div 
                                key={task.id} 
                                draggable
                                onDragStart={(e) => handleDragStart(e, task.id)}
                                className="bg-gray-900 border border-gray-800 p-4 rounded-lg group hover:border-gray-600 transition-all cursor-grab active:cursor-grabbing relative shadow-sm hover:shadow-md hover:translate-y-[-2px]"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
                                        task.priority === 'high' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                        task.priority === 'medium' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                        'bg-gray-700/50 text-gray-400 border-gray-700'
                                    }`}>
                                        {task.priority}
                                    </span>
                                    <GripVertical size={14} className="text-gray-700 group-hover:text-gray-500" />
                                </div>
                                <h4 className="text-gray-200 font-medium text-sm mb-3">{task.title}</h4>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center text-[10px] font-bold text-gray-400 border border-gray-700">
                                            {task.assignedTo.substring(0,2).toUpperCase()}
                                        </div>
                                        <span className="text-xs text-gray-500">{task.assignedTo}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {/* Drop zone indicator when empty or dragging */}
                        {tasks.filter(t => t.status === col.id).length === 0 && (
                            <div className="h-24 border-2 border-dashed border-gray-800 rounded-lg flex items-center justify-center text-gray-700 text-xs font-mono opacity-50">
                                Drop task here
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default Kanban;