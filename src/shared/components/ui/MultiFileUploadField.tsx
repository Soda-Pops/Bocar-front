import { useRef, useState } from 'react';
import { useController, useFormContext } from 'react-hook-form';

// ─── Types ────────────────────────────────────────────────────────────────────

export type FileInfo = { name: string; size: number; type: string; file?: File };

type MultiFileUploadFieldProps = {
  name: string;
  accept?: string;
  acceptLabel?: string;
  maxSizeMb?: number;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EXT_COLORS: Record<string, string> = {
  pdf:  '#AA000F',
  stp:  '#1F3A61',
  step: '#1F3A61',
  ppt:  '#C55A11',
  pptx: '#C55A11',
};

function getExtColor(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  return EXT_COLORS[ext] ?? '#7F8FA3';
}

function getExtLabel(fileName: string): string {
  return (fileName.split('.').pop()?.toUpperCase() ?? 'FILE').slice(0, 4);
}

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

function validateFile(file: File, accept?: string, maxSizeMb?: number): string | null {
  if (accept) {
    const accepted = accept.split(',').map((t) => t.trim().toLowerCase());
    const ext = `.${file.name.split('.').pop()?.toLowerCase() ?? ''}`;
    const mime = file.type.toLowerCase();
    const ok = accepted.some((a) =>
      a.startsWith('.') ? a === ext : mime.startsWith(a.replace('/*', '/'))
    );
    if (!ok) {
      const friendly = accepted.map((a) => a.replace('.', '').toUpperCase()).join(', ');
      return `"${file.name}" — format not allowed. Accepted: ${friendly}.`;
    }
  }
  if (maxSizeMb && file.size > maxSizeMb * 1024 * 1024) {
    return `"${file.name}" exceeds the ${maxSizeMb} MB limit.`;
  }
  return null;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function UploadIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-10 w-10 text-[var(--bocar-blue-30)]"
      fill="none"
      viewBox="0 0 40 40"
    >
      {/* tray */}
      <path
        d="M8 30v2a2 2 0 002 2h20a2 2 0 002-2v-2"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
      {/* arrow shaft */}
      <path
        d="M20 26V12"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
      {/* arrow head */}
      <path
        d="M13 19l7-7 7 7"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function FileRow({
  file,
  onRemove,
}: {
  file: FileInfo;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-[8px] border border-[rgba(217,222,229,0.7)] bg-[#f5f7fa] px-3 py-2.5">
      {/* ext badge */}
      <span
        className="flex h-7 w-10 shrink-0 items-center justify-center rounded-[5px] text-[9px] font-bold uppercase tracking-[0.04em] text-white"
        style={{ backgroundColor: getExtColor(file.name) }}
      >
        {getExtLabel(file.name)}
      </span>

      {/* info */}
      <div className="min-w-0 flex-1">
        <p className="m-0 truncate text-[12px] font-semibold leading-[1.4] text-[var(--bocar-text)]">
          {file.name}
        </p>
        <p className="m-0 text-[11px] leading-[1.4] text-[var(--bocar-blue-50)]">
          {formatSize(file.size)}
        </p>
      </div>

      {/* remove */}
      <button
        aria-label={`Remove ${file.name}`}
        className="shrink-0 rounded p-0.5 text-[var(--bocar-blue-30)] transition hover:text-[var(--bocar-error)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--bocar-error)]"
        type="button"
        onClick={onRemove}
      >
        <svg fill="none" height="14" viewBox="0 0 14 14" width="14">
          <path
            d="M1 1l12 12M13 1L1 13"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.6"
          />
        </svg>
      </button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function MultiFileUploadField({
  name,
  accept,
  acceptLabel,
  maxSizeMb = 25,
}: MultiFileUploadFieldProps) {
  const { control } = useFormContext();
  const { field } = useController({ control, name, defaultValue: [] });
  const [isDragging, setIsDragging] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const files = (field.value as FileInfo[]) ?? [];

  function processFiles(incoming: FileList | File[]) {
    const list = Array.from(incoming);
    const errs: string[] = [];
    const toAdd: FileInfo[] = [];

    for (const file of list) {
      const err = validateFile(file, accept, maxSizeMb);
      if (err) { errs.push(err); continue; }
      const dup = files.some((f) => f.name === file.name && f.size === file.size);
      if (!dup) toAdd.push({ name: file.name, size: file.size, type: file.type, file });
    }

    setFieldErrors(errs);
    if (toAdd.length > 0) field.onChange([...files, ...toAdd]);
  }

  function handleRemove(index: number) {
    setFieldErrors([]);
    field.onChange(files.filter((_, i) => i !== index));
  }

  const formatsLine = acceptLabel
    ?? accept?.split(',').map((s) => s.trim().replace('.', '').toUpperCase()).join(', ')
    ?? 'PPT, STP, PDF';

  return (
    <div className="flex flex-col gap-4">
      {/* Two-panel layout */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(220px,1fr)_minmax(0,2fr)]">

        {/* ── Left: file list ── */}
        <div className="min-h-[200px] rounded-[12px] border border-[#d9dee5] bg-white p-4">
          {files.length === 0 ? (
            <div className="flex h-full min-h-[160px] flex-col items-center justify-center gap-2">
              <svg
                aria-hidden="true"
                className="h-8 w-8 text-[var(--bocar-blue-30)]"
                fill="none"
                viewBox="0 0 32 32"
              >
                <path
                  d="M6 4h14l6 6v18a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2z"
                  stroke="currentColor"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                />
                <path
                  d="M20 4v6h6"
                  stroke="currentColor"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                />
              </svg>
              <p className="m-0 text-center text-[12px] leading-[1.5] text-[var(--bocar-blue-30)]">
                No files attached yet
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="m-0 mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bocar-blue-50)]">
                {files.length} file{files.length !== 1 ? 's' : ''} attached
              </p>
              {files.map((file, i) => (
                <FileRow
                  key={`${file.name}-${file.size}`}
                  file={file}
                  onRemove={() => handleRemove(i)}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Right: drop zone ── */}
        <div
          className={[
            'flex min-h-[200px] cursor-pointer select-none flex-col items-center justify-center gap-4 rounded-[12px] border-2 border-dashed bg-white px-6 py-10 text-center transition',
            isDragging
              ? 'border-[var(--bocar-blue-70)] bg-[rgba(31,58,97,0.03)]'
              : 'border-[#d9dee5] hover:border-[var(--bocar-blue-30)]',
          ].join(' ')}
          role="button"
          tabIndex={0}
          onDragLeave={() => setIsDragging(false)}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDrop={(e) => { e.preventDefault(); setIsDragging(false); processFiles(e.dataTransfer.files); }}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click(); }}
          onClick={() => inputRef.current?.click()}
        >
          <UploadIcon />

          <div>
            <p className="m-0 text-[14px] font-semibold text-[var(--bocar-blue-70)]">
              Drag and drop your files here
            </p>
            <p className="m-0 mt-1 text-[12px] text-[var(--bocar-blue-30)]">
              Maximum size: {maxSizeMb} MB.{' '}
              Supported formats: {formatsLine}
            </p>
          </div>

          <input
            ref={inputRef}
            accept={accept}
            className="sr-only"
            multiple
            type="file"
            onChange={(e) => {
              if (e.target.files) processFiles(e.target.files);
              e.target.value = '';
            }}
          />
        </div>
      </div>

      {/* Validation errors */}
      {fieldErrors.length > 0 && (
        <div className="flex flex-col gap-1" role="alert">
          {fieldErrors.map((err, i) => (
            <p
              key={i}
              className="m-0 text-[12px] leading-[1.5] text-[var(--bocar-error)]"
            >
              {err}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
