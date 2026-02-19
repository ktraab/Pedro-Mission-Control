import React, { useState, useEffect } from 'react';
import { FileText, Search, Save, Folder, Eye, Edit2, AlertCircle } from 'lucide-react';

interface MemoryFile {
  name: string;
  path: string;
  preview: string;
  size: number;
  modified: string;
  folder: string;
}

const Memory: React.FC = () => {
  const [files, setFiles] = useState<MemoryFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<MemoryFile | null>(null);
  const [content, setContent] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [viewMode, setViewMode] = useState<'read' | 'edit'>('read');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/files');
      if (!res.ok) throw new Error('Failed to fetch files');
      const data = await res.json();
      setFiles(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load files');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const selectFile = (file: MemoryFile) => {
    setSelectedFile(file);
    setContent(file.preview || '');
    setIsDirty(false);
    setViewMode('read');
  };

  const fetchFileContent = async (path: string) => {
    try {
      const res = await fetch(`/api/files/content?path=${encodeURIComponent(path)}`);
      if (!res.ok) throw new Error('Failed to fetch content');
      const data = await res.json();
      setContent(data.content);
    } catch (e) {
      console.error('Failed to fetch file content:', e);
    }
  };

  const handleSave = async () => {
    if (!selectedFile) return;
    try {
      await fetch(`/api/files/content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: selectedFile.path, content })
      });
      setIsDirty(false);
      // Refresh file list
      fetchFiles();
    } catch (e) {
      console.error('Failed to save:', e);
    }
  };

  const filteredFiles = files.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  return (
    <div className="flex h-screen max-h-[calc(100vh-2rem)] overflow-hidden rounded-xl border border-gray-800 bg-gray-900 mx-6 my-4">
      {/* Sidebar */}
      <div className="w-64 bg-gray-950 border-r border-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-800">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-gray-500" />
            <input 
              type="text" 
              placeholder="Search files..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-900 border border-gray-800 text-gray-300 text-xs rounded-md pl-9 pr-3 py-2 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <div className="text-xs font-bold text-gray-600 uppercase px-3 py-2">Workspace</div>
          {loading ? (
            <div className="text-gray-500 text-xs px-3 py-2">Loading...</div>
          ) : filteredFiles.length === 0 ? (
            <div className="text-gray-500 text-xs px-3 py-2">No files found</div>
          ) : (
            filteredFiles.map(file => (
              <button 
                key={file.name} 
                onClick={() => selectFile(file)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                  selectedFile?.name === file.name 
                    ? 'bg-gray-900 text-blue-400 border border-gray-800' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-900/50'
                }`}
              >
                <FileText size={14} />
                <span className="truncate">{file.name}</span>
              </button>
            ))
          )}
          {error && (
            <div className="px-3 py-2 text-red-400 text-xs flex items-center gap-1">
              <AlertCircle size={12} />
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col bg-gray-900">
        {selectedFile ? (
          <>
            <div className="h-12 border-b border-gray-800 flex items-center justify-between px-6 bg-gray-950/50">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Folder size={14} />
                <span>/</span>
                <span className="text-white">{selectedFile.name}</span>
                {isDirty && <span className="text-amber-400 text-xs ml-2">• Unsaved</span>}
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-0.5 flex">
                  <button onClick={() => setViewMode('read')} className={`px-3 py-1 text-xs font-medium rounded-md flex items-center gap-2 transition-colors ${viewMode === 'read' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                    <Eye size={12} /> Read
                  </button>
                  <button onClick={() => setViewMode('edit')} className={`px-3 py-1 text-xs font-medium rounded-md flex items-center gap-2 transition-colors ${viewMode === 'edit' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                    <Edit2 size={12} /> Edit
                  </button>
                </div>
                <div className="h-4 w-px bg-gray-800 mx-2" />
                <button onClick={handleSave} disabled={!isDirty} className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-colors ${isDirty ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}>
                  <Save size={14} /> Save
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden relative">
              {viewMode === 'edit' ? (
                <textarea 
                  value={content} 
                  onChange={(e) => { setContent(e.target.value); setIsDirty(true); }} 
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
            Select a file to view content.
          </div>
        )}
      </div>
    </div>
  );
};

const SimpleMarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
  return (
    <div className="space-y-4">
      {content.split('\n').map((line, i) => {
        if (line.startsWith('# ')) return <h1 key={i} className="text-3xl font-bold text-white mb-4 pb-2 border-b border-gray-800">{line.replace('# ', '')}</h1>;
        if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-bold text-blue-400 mt-6 mb-3">{line.replace('## ', '')}</h2>;
        if (line.startsWith('### ')) return <h3 key={i} className="text-lg font-semibold text-gray-200 mt-4 mb-2">{line.replace('### ', '')}</h3>;
        if (line.startsWith('- ')) return <li key={i} className="ml-4 list-disc text-gray-400 pl-1">{formatInline(line.replace('- ', ''))}</li>;
        if (line.match(/^\d+\. /)) return <div key={i} className="ml-4 text-gray-400 pl-1">{formatInline(line)}</div>;
        if (line.trim() === '') return <div key={i} className="h-2" />;
        return <p key={i} className="text-gray-300 leading-relaxed">{formatInline(line)}</p>;
      })}
    </div>
  );
};

const formatInline = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index} className="text-green-400 font-bold">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
};

export default Memory;
