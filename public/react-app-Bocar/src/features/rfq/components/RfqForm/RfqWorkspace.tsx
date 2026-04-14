import { zodResolver } from '@hookform/resolvers/zod';
import type { DragEvent, InputHTMLAttributes } from 'react';
import { useEffect, useId, useRef, useState } from 'react';
import type { FieldError, SubmitErrorHandler, UseFormRegisterReturn } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/shared/components/ui/Button';

type RfqWorkspaceMode = 'create' | 'edit';
type UploadKind = 'stp' | 'ppt';
type FeedbackTone = 'neutral' | 'success' | 'error';

type UploadedAsset = {
  kind: UploadKind;
  name: string;
  sizeLabel: string;
  uploadedAt: string;
};

type RfqAttachments = Record<UploadKind, UploadedAsset | null>;

type RfqFormValues = {
  rfqName: string;
  material: string;
  hardware: string;
  description: string;
  partNumber: string;
  machineType: string;
  estimatedVolume: string;
  region: string;
  plant: string;
  requiredDate: string;
};

type RfqWorkspaceProps = {
  mode: RfqWorkspaceMode;
  onBack: () => void;
  rfqId?: string;
};

type SectionField = {
  field: keyof RfqFormValues;
  helper: string;
  inputMode?: InputHTMLAttributes<HTMLInputElement>['inputMode'];
  label: string;
  placeholder: string;
  type?: 'date' | 'number' | 'text';
};

type FormFieldProps = {
  error?: FieldError;
  helper: string;
  id: string;
  inputMode?: InputHTMLAttributes<HTMLInputElement>['inputMode'];
  label: string;
  placeholder: string;
  registration: UseFormRegisterReturn;
  type?: 'date' | 'number' | 'text';
};

type UploadStatusCardProps = {
  asset: UploadedAsset | null;
  invalid: boolean;
  kind: UploadKind;
};

const BASE_FIELDS: readonly SectionField[] = [
  {
    field: 'rfqName',
    helper: 'Usa al menos 3 caracteres para identificar el proyecto.',
    label: 'Nombre del RFQ',
    placeholder: 'Ingresa el nombre del RFQ',
  },
  {
    field: 'material',
    helper: 'Material principal solicitado.',
    label: 'Material',
    placeholder: 'Ingresa el material',
  },
  {
    field: 'hardware',
    helper: 'Herramental o hardware esperado.',
    label: 'Hardware',
    placeholder: 'Ingresa el hardware',
  },
  {
    field: 'description',
    helper: 'Incluye alcance tecnico con al menos 10 caracteres.',
    label: 'Descripcion',
    placeholder: 'Ingresa una descripcion adicional',
  },
] as const;

const SPECIFICATION_FIELDS: readonly SectionField[] = [
  {
    field: 'partNumber',
    helper: 'Solo letras, numeros, puntos, guiones o guion bajo.',
    label: 'Numero de parte',
    placeholder: 'Ingresa el numero de parte',
  },
  {
    field: 'machineType',
    helper: 'Proceso o celda de manufactura.',
    label: 'Tipo de maquina',
    placeholder: 'Ingresa el tipo de maquina',
  },
  {
    field: 'estimatedVolume',
    helper: 'Numero entero mayor a cero.',
    inputMode: 'numeric',
    label: 'Volumen estimado',
    placeholder: 'Ingresa el volumen estimado',
    type: 'number',
  },
  {
    field: 'region',
    helper: 'Region principal del proyecto.',
    label: 'Region',
    placeholder: 'Ingresa la region',
  },
] as const;

const LOCATION_FIELDS: readonly SectionField[] = [
  {
    field: 'plant',
    helper: 'Planta o localizacion objetivo.',
    label: 'Planta o pais',
    placeholder: 'Ingresa la planta o el pais',
  },
  {
    field: 'requiredDate',
    helper: 'Debe ser una fecha futura.',
    label: 'Fecha requerida',
    placeholder: '',
    type: 'date',
  },
] as const;

const MONTH_LABELS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function isFutureDate(value: string) {
  if (!value) {
    return false;
  }

  const today = new Date();
  const todayAtMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const selectedDate = new Date(`${value}T00:00:00`).getTime();

  return selectedDate > todayAtMidnight;
}

const rfqFormSchema = z.object({
  rfqName: z
    .string()
    .trim()
    .min(3, 'Ingresa un nombre de RFQ de al menos 3 caracteres.')
    .max(80, 'El nombre del RFQ no debe exceder 80 caracteres.'),
  material: z
    .string()
    .trim()
    .min(2, 'Ingresa el material principal.')
    .max(80, 'El material no debe exceder 80 caracteres.'),
  hardware: z
    .string()
    .trim()
    .min(2, 'Ingresa el hardware o herramental esperado.')
    .max(80, 'El hardware no debe exceder 80 caracteres.'),
  description: z
    .string()
    .trim()
    .min(10, 'Agrega una descripcion de al menos 10 caracteres.')
    .max(320, 'La descripcion no debe exceder 320 caracteres.'),
  partNumber: z
    .string()
    .trim()
    .min(3, 'Ingresa un numero de parte de al menos 3 caracteres.')
    .max(60, 'El numero de parte no debe exceder 60 caracteres.')
    .regex(/^[A-Za-z0-9._-]+$/, 'Usa solo letras, numeros, puntos, guiones o guion bajo.'),
  machineType: z
    .string()
    .trim()
    .min(2, 'Ingresa el tipo de maquina o proceso.')
    .max(80, 'El tipo de maquina no debe exceder 80 caracteres.'),
  estimatedVolume: z
    .string()
    .trim()
    .min(1, 'Ingresa el volumen estimado.')
    .regex(/^\d+$/, 'El volumen debe ser un numero entero sin letras ni simbolos.')
    .refine((value) => Number(value) > 0, 'El volumen debe ser mayor a cero.')
    .refine((value) => Number(value) <= 10000000, 'El volumen no puede exceder 10,000,000.'),
  region: z
    .string()
    .trim()
    .min(2, 'Ingresa la region principal.')
    .max(80, 'La region no debe exceder 80 caracteres.'),
  plant: z
    .string()
    .trim()
    .min(2, 'Ingresa la planta o pais destino.')
    .max(80, 'La planta o pais no debe exceder 80 caracteres.'),
  requiredDate: z
    .string()
    .min(1, 'Selecciona la fecha requerida.')
    .refine(isFutureDate, 'Selecciona una fecha posterior al dia de hoy.'),
});

function createEmptyValues(): RfqFormValues {
  return {
    rfqName: '',
    material: '',
    hardware: '',
    description: '',
    partNumber: '',
    machineType: '',
    estimatedVolume: '',
    region: '',
    plant: '',
    requiredDate: '',
  };
}

function createEditValues(rfqId: string): RfqFormValues {
  return {
    rfqName: 'Soporte lateral de puerta',
    material: 'PA66 con fibra',
    hardware: 'Molde 2 cavidades',
    description: 'Correccion de volumen y localizacion para borrador tecnico en revision interna.',
    partNumber: `${rfqId}-MAT`,
    machineType: 'Inyeccion vertical',
    estimatedVolume: '240000',
    region: 'Norteamerica',
    plant: 'Saltillo, MX',
    requiredDate: '2026-05-28',
  };
}

function createEmptyAttachments(): RfqAttachments {
  return {
    ppt: null,
    stp: null,
  };
}

function createEditAttachments(): RfqAttachments {
  return {
    ppt: {
      kind: 'ppt',
      name: 'presentacion-tecnica-rfq.pptx',
      sizeLabel: '18.4 MB',
      uploadedAt: '07 Abr 2026 | 16:30',
    },
    stp: {
      kind: 'stp',
      name: 'modelo-molde-rfq.step',
      sizeLabel: '82.6 MB',
      uploadedAt: '07 Abr 2026 | 16:28',
    },
  };
}

function getInitialValues(mode: RfqWorkspaceMode, rfqId?: string) {
  if (mode === 'edit') {
    return createEditValues((rfqId ?? 'RFQ-021').toUpperCase());
  }

  return createEmptyValues();
}

function getInitialAttachments(mode: RfqWorkspaceMode) {
  if (mode === 'edit') {
    return createEditAttachments();
  }

  return createEmptyAttachments();
}

function getModeFeedback(mode: RfqWorkspaceMode, rfqId?: string) {
  if (mode === 'edit') {
    return {
      text: `Estas corrigiendo ${rfqId?.toUpperCase() ?? 'RFQ-021'} antes de reenviarla.`,
      tone: 'neutral' as const,
    };
  }

  return {
    text: 'Completa los campos obligatorios y adjunta STP y PPT antes de enviar.',
    tone: 'neutral' as const,
  };
}

function formatDateLabel(date: Date) {
  const day = `${date.getDate()}`.padStart(2, '0');
  const month = MONTH_LABELS[date.getMonth()];
  const year = date.getFullYear();
  const hours = `${date.getHours()}`.padStart(2, '0');
  const minutes = `${date.getMinutes()}`.padStart(2, '0');

  return `${day} ${month} ${year} | ${hours}:${minutes}`;
}

function formatFileSize(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getUploadKind(fileName: string): UploadKind | null {
  const normalizedName = fileName.toLowerCase();

  if (normalizedName.endsWith('.stp') || normalizedName.endsWith('.step')) {
    return 'stp';
  }

  if (normalizedName.endsWith('.ppt') || normalizedName.endsWith('.pptx')) {
    return 'ppt';
  }

  return null;
}

function getUploadLimit(kind: UploadKind) {
  return kind === 'stp' ? 100 : 25;
}

function getFeedbackToneStyles(tone: FeedbackTone) {
  if (tone === 'success') {
    return 'border-[rgba(141,198,63,0.32)] bg-[rgba(141,198,63,0.12)] text-[var(--bocar-blue-100)]';
  }

  if (tone === 'error') {
    return 'border-[rgba(170,0,15,0.22)] bg-[rgba(170,0,15,0.08)] text-[var(--bocar-error)]';
  }

  return 'border-[rgba(31,58,97,0.14)] bg-[rgba(31,58,97,0.05)] text-[var(--bocar-blue-90)]';
}

function getInputStateClasses(error?: FieldError) {
  if (error) {
    return 'border-[rgba(170,0,15,0.44)] bg-[#fff8f8] text-[var(--bocar-text)] focus:border-[var(--bocar-error)] focus:shadow-[0_0_0_3px_rgba(170,0,15,0.1)]';
  }

  return 'border-[rgba(217,222,229,0.9)] bg-white text-[var(--bocar-text)] focus:border-[var(--bocar-blue-70)] focus:shadow-[0_0_0_3px_rgba(31,58,97,0.08)]';
}

function FormField({
  error,
  helper,
  id,
  inputMode,
  label,
  placeholder,
  registration,
  type = 'text',
}: FormFieldProps) {
  const helpId = `${id}-help`;
  const errorId = `${id}-error`;

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-3">
        <label
          className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--bocar-blue-70)]"
          htmlFor={id}
        >
          {label}
        </label>
        <span className="shrink-0 text-[11px] font-medium text-[var(--bocar-blue-30)]">Obligatorio</span>
      </div>

      <input
        aria-describedby={error ? errorId : helpId}
        aria-invalid={Boolean(error)}
        className={[
          'h-12 rounded-[8px] border px-4 text-[14px] outline-none transition placeholder:text-[var(--bocar-blue-30)]',
          getInputStateClasses(error),
        ].join(' ')}
        id={id}
        inputMode={inputMode}
        placeholder={placeholder}
        type={type}
        {...registration}
      />

      {error ? (
        <p
          className="m-0 rounded-[8px] border border-[rgba(170,0,15,0.18)] bg-[rgba(170,0,15,0.06)] px-3 py-2 text-[12px] leading-[1.45] text-[var(--bocar-error)]"
          id={errorId}
          role="alert"
        >
          {error.message}
        </p>
      ) : (
        <p className="m-0 text-[12px] leading-[1.45] text-[var(--bocar-blue-50)]" id={helpId}>
          {helper}
        </p>
      )}
    </div>
  );
}

function UploadStatusCard({ asset, invalid, kind }: UploadStatusCardProps) {
  const label = kind === 'stp' ? 'Archivo STP' : 'Presentacion PPT';
  const limit = kind === 'stp' ? 'Max. 100 MB' : 'Max. 25 MB';

  return (
    <div
      aria-invalid={invalid}
      className={[
        'rounded-[12px] border px-4 py-4 transition',
        asset
          ? 'border-[rgba(31,58,97,0.14)] bg-[rgba(31,58,97,0.03)]'
          : invalid
            ? 'border-[rgba(170,0,15,0.28)] bg-[rgba(170,0,15,0.07)]'
            : 'border-[rgba(217,222,229,0.9)] bg-white',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="m-0 text-[13px] font-semibold text-[var(--bocar-text)]">{label}</p>
          <p className="mt-1 text-[12px] text-[var(--bocar-blue-50)]">{limit}</p>
        </div>

        <span
          className={[
            'inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]',
            asset
              ? 'bg-[rgba(141,198,63,0.18)] text-[var(--bocar-blue-100)]'
              : invalid
                ? 'bg-[rgba(170,0,15,0.12)] text-[var(--bocar-error)]'
                : 'bg-[rgba(167,177,194,0.18)] text-[var(--bocar-blue-70)]',
          ].join(' ')}
        >
          {asset ? 'Cargado' : 'Pendiente'}
        </span>
      </div>

      {asset ? (
        <div className="mt-4 rounded-[10px] border border-[rgba(217,222,229,0.86)] bg-white px-3 py-3">
          <p className="m-0 truncate text-[13px] font-medium text-[var(--bocar-blue-100)]">{asset.name}</p>
          <p className="mt-1 text-[12px] text-[var(--bocar-blue-50)]">
            {asset.sizeLabel} | {asset.uploadedAt}
          </p>
        </div>
      ) : (
        <p
          className={[
            'mt-4 text-[12px] leading-[1.5]',
            invalid ? 'font-medium text-[var(--bocar-error)]' : 'text-[var(--bocar-blue-50)]',
          ].join(' ')}
          role={invalid ? 'alert' : undefined}
        >
          {invalid
            ? `Adjunta un archivo ${kind === 'stp' ? 'STP o STEP' : 'PPT o PPTX'} antes de enviar.`
            : `Aun no hay un archivo ${kind === 'stp' ? 'STP' : 'PPT'} adjunto.`}
        </p>
      )}
    </div>
  );
}

function UploadArrowIcon() {
  return (
    <svg aria-hidden="true" className="h-[42px] w-[42px] text-[var(--bocar-blue-100)]" viewBox="0 0 42 42" fill="none">
      <path
        d="M21 28.875V8.75M21 8.75L29.75 17.5M21 8.75L12.25 17.5M8.75 28.875V31.5C8.75 33.433 10.317 35 12.25 35H29.75C31.683 35 33.25 33.433 33.25 31.5V28.875"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.1"
      />
    </svg>
  );
}

function BackArrowIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 16 16" fill="none">
      <path d="M10.5 3.5L6 8L10.5 12.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
      <path d="M6.5 8H13.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
    </svg>
  );
}

function SectionHeader({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--bocar-blue-30)]">
        {eyebrow}
      </p>
      <h2 className="m-0 text-[26px] font-semibold tracking-[-0.03em] text-[var(--bocar-text)] sm:text-[30px]">
        {title}
      </h2>
    </div>
  );
}

export function RfqWorkspace({ mode, onBack, rfqId }: RfqWorkspaceProps) {
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachments, setAttachments] = useState<RfqAttachments>(() => getInitialAttachments(mode));
  const [feedback, setFeedback] = useState<{ text: string; tone: FeedbackTone }>(() => getModeFeedback(mode, rfqId));
  const [shouldValidateAttachments, setShouldValidateAttachments] = useState(false);

  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
    setFocus,
  } = useForm<RfqFormValues>({
    defaultValues: getInitialValues(mode, rfqId),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    resolver: zodResolver(rfqFormSchema),
  });

  useEffect(() => {
    reset(getInitialValues(mode, rfqId));
    setAttachments(getInitialAttachments(mode));
    setFeedback(getModeFeedback(mode, rfqId));
    setShouldValidateAttachments(false);
  }, [mode, reset, rfqId]);

  function handleFileSelection(files: FileList | null) {
    if (!files || files.length === 0) {
      return;
    }

    const nextAttachments = { ...attachments };
    const acceptedFiles: string[] = [];
    const rejectedFiles: string[] = [];

    Array.from(files).forEach((file) => {
      const kind = getUploadKind(file.name);

      if (!kind) {
        rejectedFiles.push(`${file.name} no es un formato valido`);
        return;
      }

      const fileSizeInMb = file.size / (1024 * 1024);
      const limitInMb = getUploadLimit(kind);

      if (fileSizeInMb > limitInMb) {
        rejectedFiles.push(`${file.name} supera ${limitInMb} MB`);
        return;
      }

      nextAttachments[kind] = {
        kind,
        name: file.name,
        sizeLabel: formatFileSize(file.size),
        uploadedAt: formatDateLabel(new Date()),
      };
      acceptedFiles.push(file.name);
    });

    setAttachments(nextAttachments);

    if (nextAttachments.stp && nextAttachments.ppt) {
      setShouldValidateAttachments(false);
    }

    if (acceptedFiles.length > 0 && rejectedFiles.length === 0) {
      setFeedback({
        text: `${acceptedFiles.length} archivo(s) cargado(s) correctamente.`,
        tone: 'success',
      });
      return;
    }

    if (acceptedFiles.length > 0 && rejectedFiles.length > 0) {
      setFeedback({
        text: `Se cargaron ${acceptedFiles.length} archivo(s), pero ${rejectedFiles.join(', ')}.`,
        tone: 'error',
      });
      return;
    }

    setFeedback({
      text: rejectedFiles.join(', '),
      tone: 'error',
    });
  }

  function handleDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    handleFileSelection(event.dataTransfer.files);
  }

  function handleSaveDraft() {
    setShouldValidateAttachments(false);
    setFeedback({
      text:
        mode === 'edit'
          ? `${rfqId?.toUpperCase() ?? 'RFQ-021'} quedo actualizada como borrador editable.`
          : 'Borrador guardado. Puedes retomarlo cuando quieras antes de enviarlo.',
      tone: 'success',
    });
  }

  async function handleValidSubmit() {
    setShouldValidateAttachments(true);

    if (!attachments.stp || !attachments.ppt) {
      setFeedback({
        text: 'Adjunta los archivos obligatorios STP y PPT antes de enviar la RFQ.',
        tone: 'error',
      });
      return;
    }

    setFeedback({
      text:
        mode === 'edit'
          ? `${rfqId?.toUpperCase() ?? 'RFQ-021'} esta lista para reenviarse al siguiente paso del flujo.`
          : 'La RFQ quedo lista para enviarse a aprobacion interna.',
      tone: 'success',
    });
  }

  const handleInvalidSubmit: SubmitErrorHandler<RfqFormValues> = (fieldErrors) => {
    setShouldValidateAttachments(true);
    setFeedback({
      text: 'Revisa los campos marcados. Cada error indica exactamente que dato debes corregir.',
      tone: 'error',
    });

    const firstInvalidField = Object.keys(fieldErrors)[0] as keyof RfqFormValues | undefined;

    if (firstInvalidField) {
      setFocus(firstInvalidField);
    }
  };

  const isEditMode = mode === 'edit';
  const pageTitle = isEditMode ? 'EDITAR RFQ' : 'CREAR RFQ';
  const sectionTitle = isEditMode ? 'Correccion tecnica del RFQ' : 'Informacion del RFQ';
  const sectionEyebrow = isEditMode ? 'Workspace de correccion' : 'Workspace de captura';

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col px-6 pb-12 pt-10 sm:px-8 lg:px-12 xl:px-14">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <SectionHeader eyebrow={sectionEyebrow} title={pageTitle} />

        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 self-start rounded-full border border-transparent px-0 py-2 text-[14px] font-semibold text-[var(--bocar-blue-100)] transition hover:text-[var(--bocar-blue-90)]"
        >
          <BackArrowIcon />
          Regresar
        </button>
      </div>

      <section className="mt-8 overflow-hidden rounded-[12px] border border-[rgba(217,222,229,0.96)] bg-white shadow-[0_18px_40px_rgba(0,46,93,0.05)]">
        <div className="flex flex-col gap-4 border-b border-[rgba(217,222,229,0.92)] px-7 py-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <h3 className="m-0 mt-3 text-[24px] font-semibold tracking-[-0.03em] text-[var(--bocar-text)]">
              {sectionTitle}
            </h3>
          </div>

          <div className="grid gap-1 self-start text-right">
            <p className="m-0 text-[15px] font-semibold text-[var(--bocar-blue-100)]">
              {isEditMode ? `Borrador ${rfqId ?? '1'}` : 'Nueva RFQ'}
            </p>
            <p className="m-0 text-[15px] font-normal text-[var(--bocar-blue-90)]">Responsable: Anairam Rodriguez</p>
            {isEditMode ? (
              <p className="m-0 text-[12px] text-[var(--bocar-blue-50)]">Ultima actualizacion: 07 Abr 2026 | 16:30</p>
            ) : null}
          </div>
        </div>

        <form className="px-7 py-7 lg:px-8 lg:py-8" noValidate onSubmit={handleSubmit(handleValidSubmit, handleInvalidSubmit)}>
          <div
            className={[
              'rounded-[12px] border px-4 py-3 text-[13px] leading-[1.55]',
              getFeedbackToneStyles(feedback.tone),
            ].join(' ')}
            role={feedback.tone === 'error' ? 'alert' : 'status'}
          >
            {feedback.text}
          </div>

          <div className="mt-8 grid gap-8">
            <section>
              <div className="flex flex-col gap-2 border-b border-[rgba(217,222,229,0.78)] pb-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="m-0 text-[18px] font-semibold tracking-[-0.02em] text-[var(--bocar-text)]">
                    Datos base
                  </p>
                  <p className="mt-1 text-[13px] text-[var(--bocar-blue-50)]">
                    Identifica claramente la RFQ y el contexto tecnico principal.
                  </p>
                </div>
                <span className="text-[12px] font-medium text-[var(--bocar-blue-50)]">4 campos obligatorios</span>
              </div>

              <div className="mt-5 grid gap-5 lg:grid-cols-2">
                {BASE_FIELDS.map((field) => (
                  <FormField
                    key={field.field}
                    error={errors[field.field]}
                    helper={field.helper}
                    id={`rfq-${field.field}`}
                    inputMode={field.inputMode}
                    label={field.label}
                    placeholder={field.placeholder}
                    registration={register(field.field)}
                    type={field.type}
                  />
                ))}
              </div>
            </section>

            <section>
              <div className="flex flex-col gap-2 border-b border-[rgba(217,222,229,0.78)] pb-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="m-0 text-[18px] font-semibold tracking-[-0.02em] text-[var(--bocar-text)]">
                    Especificaciones y localizacion
                  </p>
                  <p className="mt-1 text-[13px] text-[var(--bocar-blue-50)]">
                    Completa datos de parte, proceso, volumen y destino de manufactura.
                  </p>
                </div>
                <span className="text-[12px] font-medium text-[var(--bocar-blue-50)]">6 campos obligatorios</span>
              </div>

              <div className="mt-5 grid gap-5 lg:grid-cols-2">
                {[...SPECIFICATION_FIELDS, ...LOCATION_FIELDS].map((field) => (
                  <FormField
                    key={field.field}
                    error={errors[field.field]}
                    helper={field.helper}
                    id={`rfq-${field.field}`}
                    inputMode={field.inputMode}
                    label={field.label}
                    placeholder={field.placeholder}
                    registration={register(field.field)}
                    type={field.type}
                  />
                ))}
              </div>
            </section>

            <section>
              <div className="flex flex-col gap-2 border-b border-[rgba(217,222,229,0.78)] pb-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="m-0 text-[18px] font-semibold tracking-[-0.02em] text-[var(--bocar-text)]">
                    Carga de archivos
                  </p>
                  <p className="mt-1 text-[13px] text-[var(--bocar-blue-50)]">
                    Adjunta ambos archivos antes del envio. El sistema clasifica automaticamente STP y PPT.
                  </p>
                </div>
                <span className="text-[12px] font-medium text-[var(--bocar-blue-50)]">STP y PPT obligatorios</span>
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(event) => event.preventDefault()}
                onDrop={handleDrop}
                className={[
                  'mt-5 flex w-full flex-col items-center justify-center rounded-[16px] border border-dashed px-6 py-10 text-center transition',
                  shouldValidateAttachments && (!attachments.stp || !attachments.ppt)
                    ? 'border-[rgba(170,0,15,0.34)] bg-[rgba(170,0,15,0.05)] hover:border-[var(--bocar-error)]'
                    : 'border-[rgba(167,177,194,0.8)] bg-[rgba(245,247,250,0.7)] hover:border-[var(--bocar-blue-70)] hover:bg-[rgba(245,247,250,0.96)]',
                ].join(' ')}
              >
                <UploadArrowIcon />
                <p className="mt-5 text-[28px] font-semibold tracking-[-0.03em] text-[var(--bocar-blue-100)] sm:text-[31px]">
                  Arrastra y suelta aqui tus archivos
                </p>
                <p className="mt-3 max-w-[680px] text-[14px] leading-[1.6] text-[var(--bocar-blue-70)]">
                  Archivos requeridos: STP y PPT.
                </p>
                <p className="mt-3 text-[13px] font-medium text-[var(--bocar-blue-50)]">
                  STP hasta 100 MB | PPT hasta 25 MB | Haz clic para seleccionar archivos
                </p>
              </button>

              <input
                ref={fileInputRef}
                id={inputId}
                accept=".stp,.step,.ppt,.pptx"
                className="sr-only"
                multiple
                type="file"
                onChange={(event) => {
                  handleFileSelection(event.target.files);
                  event.target.value = '';
                }}
              />

              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <UploadStatusCard
                  asset={attachments.stp}
                  invalid={shouldValidateAttachments && !attachments.stp}
                  kind="stp"
                />
                <UploadStatusCard
                  asset={attachments.ppt}
                  invalid={shouldValidateAttachments && !attachments.ppt}
                  kind="ppt"
                />
              </div>
            </section>
          </div>

          <div className="mt-8 flex flex-col items-center gap-3 border-t border-[rgba(217,222,229,0.82)] pt-7">
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:justify-center">
              <Button
                className="h-12 min-w-[210px] rounded-[10px] bg-[rgba(167,177,194,0.92)] px-8 text-[14px] font-semibold text-white shadow-none hover:bg-[rgba(127,143,163,0.96)] disabled:cursor-not-allowed disabled:opacity-70"
                disabled={isSubmitting}
                onClick={handleSaveDraft}
                type="button"
              >
                {isEditMode ? 'Guardar cambios' : 'Guardar borrador'}
              </Button>

              <Button
                className="h-12 min-w-[210px] rounded-[10px] bg-[var(--bocar-blue-100)] px-8 text-[14px] font-semibold text-white shadow-[0_14px_28px_rgba(0,46,93,0.18)] hover:bg-[#0b3b6b] disabled:cursor-not-allowed disabled:opacity-70"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting ? 'Validando...' : isEditMode ? 'Actualizar y enviar' : 'Enviar RFQ'}
              </Button>
            </div>

            <p className="m-0 text-center text-[12px] leading-[1.55] text-[var(--bocar-blue-50)]">
              No se permite el envio sin campos obligatorios, STP, PPT y una fecha requerida futura.
            </p>
          </div>
        </form>
      </section>
    </div>
  );
}
