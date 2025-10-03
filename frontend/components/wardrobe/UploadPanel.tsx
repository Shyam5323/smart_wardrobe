'use client';

import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';

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
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
  }, [previewUrl]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null;
    setFile(selected);
    setSuccessMessage(null);
  setFormError(null);
    if (error) onErrorClear();

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl(selected ? URL.createObjectURL(selected) : null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!file) {
      setSuccessMessage(null);
      setFormError('Please choose an image to upload.');
      return;
    }

    try {
      await onUpload({ file, notes });
      setSuccessMessage('Item uploaded to your wardrobe!');
      setFormError(null);
      setFile(null);
      setNotes('');
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
    } catch {
      setSuccessMessage(null);
      setFormError(null);
      // Error state handled by hook
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl shadow-black/40 backdrop-blur"
    >
      <div>
        <label className="block text-sm font-medium text-slate-300">Upload an image</label>
        <div className="mt-2 flex flex-col gap-3">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="block w-full text-sm text-slate-200 file:mr-4 file:rounded-md file:border-0 file:bg-indigo-500 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-indigo-400"
          />
          {previewUrl && (
            <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950/60">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl} alt="Preview" className="h-64 w-full object-cover" />
            </div>
          )}
        </div>
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
          className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
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
