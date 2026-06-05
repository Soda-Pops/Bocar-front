import { useRef, useState } from 'react';
import { useController, useFormContext } from 'react-hook-form';

export type FileInfo = { name: string; size: number; type: string; file?: File };

type FileUploadFieldProps = {
  name: string;
  accept?: string;
  maxSizeMb?: number;
};

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

function validateAccept(file: File, accept?: string): boolean {
  if (!accept) return true;
  const accepted = accept.split(',').map((t) => t.trim().toLowerCase());
  const ext = `.${file.name.split('.').pop()?.toLowerCase() ?? ''}`;
  const mime = file.type.toLowerCase();
  return accepted.some((a) => (a.startsWith('.') ? a === ext : mime.startsWith(a.replace('/*', '/'))));
}

export function FileUploadField({ accept, maxSizeMb = 10, name }: FileUploadFieldProps) {
  const { control } = useFormContext();
  const { field } = useController({ control, name });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const fileInfo = field.value as FileInfo | null;

  function handleFile(file: File) {
    if (!validateAccept(file, accept)) {
      setValidationError('Format not allowed. Use .png, .jpg, .jpeg, .pdf or .dwg.');
      return;
    }
    if (file.size > maxSizeMb * 1024 * 1024) {
      setValidationError(`The file exceeds the maximum size of ${maxSizeMb} MB.`);
      return;
    }
    setValidationError(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const nextUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : null;
    setPreviewUrl(nextUrl);
    field.onChange({ name: file.name, size: file.size, type: file.type, file });
  }

  function handleRemove() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setValidationError(null);
    field.onChange(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function openPicker() {
    inputRef.current?.click();
  }

  const hiddenInput = (
    <input
      ref={inputRef}
      accept={accept}
      className="sr-only"
      type="file"
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
      }}
    />
  );

  if (fileInfo) {
    return (
      <div className="flex flex-col gap-4 rounded-[14px] border border-[rgba(217,222,229,0.92)] bg-white p-6">
        {previewUrl ? (
          <div className="overflow-hidden rounded-[10px] border border-[rgba(217,222,229,0.92)]">
            <img
              alt={fileInfo.name}
              className="max-h-[320px] w-full object-contain"
              src={previewUrl}
            />
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-[10px] border border-[rgba(217,222,229,0.92)] bg-[#f5f7fa] px-4 py-3">
            <svg className="h-8 w-8 shrink-0 text-[var(--bocar-blue-50)]" fill="none" viewBox="0 0 32 32">
              <path
                d="M6 4h14l6 6v18a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2z"
                stroke="currentColor"
                strokeLinejoin="round"
                strokeWidth="1.6"
              />
              <path d="M20 4v6h6" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.6" />
            </svg>
            <div className="min-w-0 flex-1">
              <p className="m-0 truncate text-[13px] font-semibold text-[var(--bocar-text)]">{fileInfo.name}</p>
              <p className="m-0 mt-0.5 text-[12px] text-[var(--bocar-blue-50)]">{formatSize(fileInfo.size)}</p>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            className="inline-flex h-9 items-center justify-center rounded-[8px] border border-[#d9dee5] bg-white px-4 text-[12px] font-semibold text-[var(--bocar-blue-100)] transition hover:border-[var(--bocar-blue-70)]"
            type="button"
            onClick={openPicker}
          >
            Replace
          </button>
          <button
            className="inline-flex h-9 items-center justify-center rounded-[8px] border border-[rgba(170,0,15,0.22)] bg-white px-4 text-[12px] font-semibold text-[var(--bocar-error)] transition hover:bg-[rgba(170,0,15,0.04)]"
            type="button"
            onClick={handleRemove}
          >
            Remove
          </button>
        </div>
        {hiddenInput}
      </div>
    );
  }

  return (
    <div
      className={[
        'flex min-h-[220px] flex-col items-center justify-center gap-4 rounded-[14px] border-2 border-dashed bg-white px-6 py-10 text-center transition',
        isDragging ? 'border-[var(--bocar-blue-70)] bg-[rgba(31,58,97,0.03)]' : 'border-[#d9dee5]',
      ].join(' ')}
      onDragLeave={() => setIsDragging(false)}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDrop={handleDrop}
    >
      <svg className="h-10 w-10 text-[var(--bocar-blue-30)]" fill="none" viewBox="0 0 40 40">
        <path
          d="M20 26V14M14 20l6-6 6 6"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
        <path
          d="M10 30a6 6 0 01-2-11.5A8 8 0 0126 13a6 6 0 014 11"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.8"
        />
      </svg>

      <div>
        <p className="m-0 text-[14px] font-medium text-[var(--bocar-blue-70)]">
          Drag a file here or select one from your device
        </p>
        {accept ? (
          <p className="m-0 mt-1 text-[12px] text-[var(--bocar-blue-30)]">
            Formats: {accept} · Max. {maxSizeMb} MB
          </p>
        ) : null}
      </div>

      <button
        className="inline-flex h-10 items-center justify-center rounded-[10px] border border-[#d9dee5] bg-white px-5 text-[13px] font-semibold text-[var(--bocar-blue-100)] transition hover:border-[var(--bocar-blue-70)]"
        type="button"
        onClick={openPicker}
      >
        Upload file
      </button>

      {validationError ? (
        <p className="m-0 text-[12px] text-[var(--bocar-error)]" role="alert">
          {validationError}
        </p>
      ) : null}

      {hiddenInput}
    </div>
  );
}
