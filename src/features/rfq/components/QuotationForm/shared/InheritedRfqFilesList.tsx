import type { FileInfo } from '@/shared/components/ui/MultiFileUploadField';

function DownloadIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="14" viewBox="0 0 14 14" width="14">
      <path d="M7 1.5v7" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
      <path d="M4.25 6.25 7 9l2.75-2.75" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      <path d="M2 11.5h10" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
    </svg>
  );
}

function fileDate(value?: string) {
  if (!value) return 'Uploaded';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : `Uploaded ${date.toLocaleDateString()}`;
}

export function InheritedRfqFilesList({ files }: { files: FileInfo[] }) {
  return (
    <div className="mb-6 rounded-[12px] border border-[#d9dee5] bg-white p-4">
      <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bocar-blue-50)]">
        RFQ files from Industrialization
      </p>
      {files.length === 0 ? (
        <p className="m-0 mt-3 rounded-[8px] border border-dashed border-[#d9dee5] px-4 py-3 text-[12px] text-[var(--bocar-blue-50)]">
          No RFQ files uploaded.
        </p>
      ) : (
        <div className="mt-3 grid gap-2">
          {files.map((file) => (
            <div
              key={file.id ?? file.url ?? file.name}
              className="flex items-center justify-between gap-3 rounded-[8px] border border-[rgba(217,222,229,0.7)] bg-[#f5f7fa] px-3 py-2.5"
            >
              <div className="min-w-0">
                <p className="m-0 truncate text-[12px] font-semibold leading-[1.4] text-[var(--bocar-text)]">
                  {file.name}
                </p>
                <p className="m-0 text-[11px] leading-[1.4] text-[var(--bocar-blue-50)]">
                  {fileDate(file.uploadedAt)}
                </p>
              </div>
              {file.url ? (
                <a
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-[6px] border border-[var(--bocar-blue-30)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.04em] text-[var(--bocar-blue-100)] transition hover:border-[var(--bocar-blue-70)] hover:bg-white"
                  download={file.name}
                  href={file.url}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <DownloadIcon />
                  Download
                </a>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
