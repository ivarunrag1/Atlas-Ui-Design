import { FileText, Eye, Download, Upload } from 'lucide-react';
import { documents } from '../data/deal';
import { Chip, actorStyle } from './ui';

export function DocumentsTab() {
  return (
    <div className="flex h-full flex-col bg-canvas">
      <div className="flex items-center justify-between border-b border-line bg-surface px-5 py-3">
        <div>
          <h2 className="text-[16px] font-semibold text-ink">Documents</h2>
          <p className="text-[12px] text-faint">{documents.length} files on this deal</p>
        </div>
        <button className="flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-[14px] font-medium text-ink hover:bg-subtle">
          <Upload size={14} />
          Upload
        </button>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto px-5 py-4">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="group flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 hover:border-line-strong"
          >
            <div className="grid size-10 shrink-0 place-items-center rounded-lg border border-line text-muted">
              <FileText size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-semibold text-ink">{doc.name}</span>
                <Chip tone="neutral">{doc.kind}</Chip>
                {doc.receipt && <Chip tone="success">{doc.receipt}</Chip>}
              </div>
              <div className="mt-0.5 flex items-center gap-1.5 text-[12px] text-faint">
                <span>{doc.meta}</span>
                <span>·</span>
                <span className={`font-medium ${actorStyle[doc.by].fg}`}>
                  {actorStyle[doc.by].label}
                </span>
                <span>·</span>
                <span>{doc.timestamp}</span>
              </div>
            </div>
            <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                aria-label="Preview"
                className="grid size-8 place-items-center rounded-lg text-muted hover:bg-subtle"
              >
                <Eye size={16} />
              </button>
              <button
                aria-label="Download"
                className="grid size-8 place-items-center rounded-lg text-muted hover:bg-subtle"
              >
                <Download size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
