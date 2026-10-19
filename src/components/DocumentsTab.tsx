import { FileText, Eye, Download, Upload } from 'lucide-react';
import { documents } from '../data/deal';
import { Chip, actorStyle } from './ui';
import { Button } from '@/components/ui/button';
import { Card, CardIcon } from '@/components/ui/card';

export function DocumentsTab() {
  return (
    <div className="flex h-full flex-col bg-surface">
      <div className="flex items-center justify-between border-b border-line px-5 py-3">
        <div>
          <h2 className="text-[16px] font-semibold text-ink">Documents</h2>
          <p className="text-[12px] text-faint">{documents.length} files on this deal</p>
        </div>
        <Button variant="secondary">
          <Upload size={14} />
          Upload
        </Button>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto px-5 py-4">
        {documents.map((doc) => (
          <Card key={doc.id} className="group flex items-center gap-3 px-4 py-3 transition-colors hover:border-line-strong">
            <CardIcon>
              <FileText size={16} />
            </CardIcon>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-[14px] font-semibold text-ink">{doc.name}</span>
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
              <Button variant="ghost" size="icon-sm" aria-label="Preview">
                <Eye size={16} />
              </Button>
              <Button variant="ghost" size="icon-sm" aria-label="Download">
                <Download size={16} />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
