'use client';

import { useState, DragEvent, ChangeEvent, FormEvent, useEffect } from 'react';
import { UploadCloud } from 'lucide-react';

// Re-using the props from your friend's original code
export type UploadPanelProps = {
  onUpload: (input: { file: File; notes?: string }) => Promise<void>;
  isUploading: boolean;
  error: string | null;
  onErrorClear: () => void;
};

export const UploadPanel = ({ onUpload, isUploading, error, onErrorClear }: UploadPanelProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Clean up the object URL to prevent memory leaks
  useEffect(() => () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
  }, [previewUrl]);

  const handleFileSelect = (selectedFile: File | null) => {
    setFile(selectedFile);
    setSuccessMessage(null);
    setFormError(null);
    if (error) onErrorClear();

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(selectedFile ? URL.createObjectURL(selectedFile) : null);
  };

  const handleDragEvents = (e: DragEvent<HTMLDivElement>, dragging: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(dragging);
  };
  
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    handleDragEvents(e, false);
    const droppedFile = e.dataTransfer.files?.[0] ?? null;
    if (droppedFile && droppedFile.type.startsWith('image/')) {
      handleFileSelect(droppedFile);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) {
      setFormError('Please choose an image to upload.');
      return;
    }
    // ... (This is your friend's original handleSubmit logic)
    try {
      await onUpload({ file, notes });
      setSuccessMessage('Item uploaded! AI is analyzing it now.');
      setFormError(null);
      setFile(null);
      setNotes('');
      setPreviewUrl(null);
    } catch {
      // Error is handled by the parent hook
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl shadow-black/40 backdrop-blur"
    >
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Upload an image</label>
        <div 
          onDragEnter={(e) => handleDragEvents(e, true)}
          onDragLeave={(e) => handleDragEvents(e, false)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className={`relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${isDragging ? 'border-indigo-500 bg-slate-800' : 'border-slate-700 bg-slate-900 hover:bg-slate-800'}`}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <UploadCloud className={`w-8 h-8 mb-4 ${isDragging ? 'text-indigo-400' : 'text-slate-500'}`} />
            <p className={`mb-2 text-sm ${isDragging ? 'text-indigo-300' : 'text-slate-400'}`}>
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-slate-500">PNG, JPG, or GIF</p>
          </div>
          <input id="file-upload" type="file" accept="image/*" className="absolute h-full w-full opacity-0" onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)} />
        </div>
        
        {/* This is the corrected preview logic */}
        {previewUrl && (
          <div className="mt-4 overflow-hidden rounded-xl border border-slate-800">
            <img src={previewUrl} alt="Preview" className="h-48 w-full object-cover" />
          </div>
        )}
      </div>
      
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-slate-300">
          Notes (optional)
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="e.g. Vintage denim jacket"
          rows={3}
          className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
        />
      </div>

      {formError && <p className="text-sm text-rose-400">{formError}</p>}
      {error && !formError && <p className="text-sm text-rose-400">{error}</p>}
      {successMessage && <p className="text-sm text-emerald-400">{successMessage}</p>}

      <button
        type="submit"
        disabled={isUploading || !file}
        className="w-full rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isUploading ? 'Uploading…' : 'Add to Wardrobe'}
      </button>
    </form>
  );
};