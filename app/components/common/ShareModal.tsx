import { useEffect } from 'react';

export default function ShareModal({ open, onClose, title, url }: { open: boolean; onClose: () => void; title: string; url: string; }) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    if (open) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-4 w-96">
        <div className="font-semibold mb-2">Share "{title}"</div>
        <input value={url} readOnly className="w-full border rounded px-2 py-1 mb-3" />
        <div className="flex gap-2">
          <button onClick={() => navigator.clipboard.writeText(url)} className="px-3 py-1 border rounded">Copy Link</button>
          <button onClick={onClose} className="px-3 py-1 border rounded">Close</button>
        </div>
      </div>
    </div>
  );
}

