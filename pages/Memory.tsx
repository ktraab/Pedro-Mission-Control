import React, { useState, useEffect } from 'react';
import { FileText, Search, Save, Folder, Eye, Edit2 } from 'lucide-react';
import { fileSystem } from '../lib/fileSystem';
import { MemoryFile } from '../types';

const Memory: React.FC = () => {
  const [files, setFiles] = useState<MemoryFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<MemoryFile | null>(null);
  const [content, setContent] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [viewMode, setViewMode] = useState<'read' | 'edit'>('read');

  useEffect(() => {
    const loadedFiles = fileSystem.listFiles();
    setFiles(loadedFiles);
    if (loadedFiles.length > 0) {
        selectFile(loadedFiles[0]);
    }
  }, []);

  const selectFile = (file: MemoryFile) => {
      setSelectedFile(file);
      setContent(file.content);
      setIsDirty(false);
      // Default to read mode for better UX
      setViewMode('read');
  };

  const handleSave = () => {
      if (selectedFile) {
          fileSystem.writeFile(selectedFile.name, content);
          setIsDirty(false);
          // Refresh list to update modified time
          setFiles(fileSystem.listFiles());
      }
  };

  return (
    <div className="flex h-screen max-h-[calc(100vh-2rem)] overflow-hidden rounded-xl border border-gray-800 bg-gray-900 mx-6 my-4">
      
      {/* Sidebar File List */}
      <div className="w-64 bg-gray-950 border-r border-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-800">
            <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-gray-500" />
                <input 
                    type="text" 
                    placeholder="Search memory..." 
                    className="w-full bg-gray-900 border border-gray-800 text-gray-300 text-xs rounded-md pl-9 pr-3 py-2 focus:outline-none focus:border-neon-blue"
                />
            </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
            <div className="text-xs font-bold text-gray-600 uppercase px-3 py-2">Local Drive</div>
            {files.map(file => (
                <button 
                    key={file.name}
                    onClick={() => selectFile(file)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                        selectedFile?.name === file.name 
                        ? 'bg-gray-900 text-neon-blue border border-gray-800' 
                        : 'text-gray-400 hover:text-white hover:bg-gray-900/50'
                    }`}
                >
                    <FileText size={14} />
                    <span className="truncate">{file.name}</span>
                </button>
            ))}
        </div>
      </div>

      {/* Editor / Viewer */}
      <div className="flex-1 flex flex-col bg-gray-900">
        {selectedFile ? (
            <>
                <div className="h-12 border-b border-gray-800 flex items-center justify-between px-6 bg-gray-950/50">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Folder size={14} />
                        <span>/</span>
                        <span className="text-white">{selectedFile.name}</span>
                        {isDirty && <span className="text-neon-amber text-xs ml-2">• Unsaved changes</span>}
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <div className="bg-gray-900 border border-gray-800 rounded-lg p-0.5 flex">
                            <button 
                                onClick={() => setViewMode('read')}
                                className={`px-3 py-1 text-xs font-medium rounded-md flex items-center gap-2 transition-colors ${
                                    viewMode === 'read' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-300'
                                }`}
                            >
                                <Eye size={12} /> Read
                            </button>
                            <button 
                                onClick={() => setViewMode('edit')}
                                className={`px-3 py-1 text-xs font-medium rounded-md flex items-center gap-2 transition-colors ${
                                    viewMode === 'edit' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-300'
                                }`}
                            >
                                <Edit2 size={12} /> Edit
                            </button>
                        </div>

                        <div className="h-4 w-px bg-gray-800 mx-2" />

                        <button 
                            onClick={handleSave}
                            disabled={!isDirty}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                                isDirty 
                                ? 'bg-neon-blue text-white hover:bg-blue-600' 
                                : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                            }`}
                        >
                            <Save size={14} />
                            Save
                        </button>
                    </div>
                </div>
                
                <div className="flex-1 overflow-hidden relative">
                    {viewMode === 'edit' ? (
                        <textarea 
                            value={content}
                            onChange={(e) => {
                                setContent(e.target.value);
                                setIsDirty(true);
                            }}
                            className="w-full h-full bg-gray-900 text-gray-300 p-6 font-mono text-sm focus:outline-none resize-none leading-relaxed"
                            spellCheck={false}
                        />
                    ) : (
                        <div className="w-full h-full bg-gray-900 overflow-y-auto p-8">
                            <div className="prose prose-invert prose-sm max-w-none font-sans">
                                <SimpleMarkdownRenderer content={content} />
                            </div>
                        </div>
                    )}
                </div>
            </>
        ) : (
            <div className="flex-1 flex items-center justify-center text-gray-600 text-sm">
                Select a memory file to view content.
            </div>
        )}
      </div>
    </div>
  );
};

// Lightweight markdown renderer to avoid heavy dependencies in a portable setup
const SimpleMarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
    return (
        <div className="space-y-4">
            {content.split('\n').map((line, i) => {
                if (line.startsWith('# ')) return <h1 key={i} className="text-3xl font-bold text-white mb-4 pb-2 border-b border-gray-800">{line.replace('# ', '')}</h1>;
                if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-bold text-neon-blue mt-6 mb-3">{line.replace('## ', '')}</h2>;
                if (line.startsWith('### ')) return <h3 key={i} className="text-lg font-semibold text-gray-200 mt-4 mb-2">{line.replace('### ', '')}</h3>;
                if (line.startsWith('- ')) return <li key={i} className="ml-4 list-disc text-gray-400 pl-1">{formatInline(line.replace('- ', ''))}</li>;
                if (line.match(/^\d+\. /)) return <div key={i} className="ml-4 text-gray-400 pl-1">{formatInline(line)}</div>;
                if (line.trim() === '') return <div key={i} className="h-2" />;
                return <p key={i} className="text-gray-300 leading-relaxed">{formatInline(line)}</p>;
            })}
        </div>
    );
};

// Helper for bold text
const formatInline = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={index} className="text-neon-green font-bold">{part.slice(2, -2)}</strong>;
        }
        return part;
    });
};

export default Memory;