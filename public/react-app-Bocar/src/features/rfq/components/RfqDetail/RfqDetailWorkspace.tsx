type UploadedFile = {
  name: string;
};

type SelectedSupplier = {
  category: string;
  contact: string;
  name: string;
  status: string;
};

type SupplierBenchmark = {
  quality: string;
  score: string;
  scoreTone: 'success' | 'warning' | 'danger';
  supplier: string;
  price: string;
  time: string;
};

type RfqDetailWorkspaceProps = {
  backHref?: string;
  referenceId?: string;
};

const uploadedFiles: UploadedFile[] = [
  { name: 'plano_motor.stp' },
  { name: 'cotizacion.ppt' },
  { name: 'especificaciones.pdf' },
];

const selectedSuppliers: SelectedSupplier[] = [
  {
    category: 'Inyeccion Plastica',
    contact: 'Laura Gomez',
    name: 'PLASTIMEX',
    status: 'Seleccionado',
  },
  {
    category: 'Metalmecanica',
    contact: 'Juan Perez',
    name: 'RAMCO',
    status: 'Seleccionado',
  },
  {
    category: 'Componentes',
    contact: 'Sofia Ruiz',
    name: 'HERTOLAB',
    status: 'Seleccionado',
  },
];

const benchmarkRows: SupplierBenchmark[] = [
  {
    quality: '4.9',
    score: '92',
    scoreTone: 'success',
    supplier: 'PLASTIMEX',
    price: '$1250',
    time: '4 dias',
  },
  {
    quality: '3.8',
    score: '70',
    scoreTone: 'warning',
    supplier: 'RAMCO',
    price: '$1100',
    time: '7 dias',
  },
  {
    quality: '4.0',
    score: '50',
    scoreTone: 'danger',
    supplier: 'HERTOLAB',
    price: '$1350',
    time: '7 dias',
  },
];

function DocumentIcon() {
  return (
    <svg aria-hidden="true" className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none">
      <path
        d="M4.75 2.5h4.1l2.4 2.45v8.55h-6.5v-11Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.25"
      />
      <path d="M8.75 2.75V5.2h2.35" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.25" />
    </svg>
  );
}

function BackArrowIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 16 16" fill="none">
      <path
        d="M10.5 3.5L6 8L10.5 12.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
      <path d="M6.5 8H13.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
    </svg>
  );
}

function getScoreToneClass(tone: SupplierBenchmark['scoreTone']) {
  if (tone === 'success') {
    return 'bg-[var(--bocar-done)]';
  }

  if (tone === 'warning') {
    return 'bg-[var(--bocar-review)]';
  }

  return 'bg-[var(--bocar-error)]';
}

export function RfqDetailWorkspace({
  backHref = '/industrializacion/dashboard',
  referenceId = 'RFQ-001',
}: RfqDetailWorkspaceProps) {
  const normalizedId = referenceId.toUpperCase();

  return (
    <div className="mx-auto flex w-full max-w-[1304px] flex-col px-6 pb-10 pt-6 sm:px-8 lg:px-0 lg:pt-7">
      <div className="flex items-center justify-between gap-4">
        <h1 className="m-0 text-[24px] font-semibold tracking-[0.02em] text-[var(--bocar-text)] lg:text-[22px]">
          DETALLE RFQ
        </h1>

        <a
          className="inline-flex items-center gap-2 self-start rounded-full border border-transparent px-0 py-2 text-[14px] font-semibold text-[var(--bocar-blue-100)] no-underline transition hover:text-[var(--bocar-blue-90)]"
          href={backHref}
        >
          <BackArrowIcon />
          Regresar
        </a>
      </div>

      <section className="mt-6 overflow-hidden rounded-[6px] border border-[var(--bocar-border)] bg-white">
        <div className="border-b border-[rgba(217,222,229,0.88)] px-7 py-4 lg:px-12">
          <h2 className="m-0 text-[15px] font-semibold text-[var(--bocar-text)]">Resumen del RFQ</h2>
        </div>

        <div className="px-7 py-8 lg:px-12">
          <div className="grid min-h-[86px] items-center gap-6 bg-[var(--bocar-bg)] px-8 py-4 md:grid-cols-[1fr_auto_1fr_1.2fr] lg:px-12">
            <div className="grid grid-cols-[94px_minmax(0,1fr)] gap-3 text-[12px] leading-[1.35]">
              <div className="text-right font-semibold uppercase text-[var(--bocar-blue-30)]">
                <p className="m-0">ID</p>
                <p className="m-0">Creado Por</p>
                <p className="m-0">Material</p>
              </div>
              <div className="font-medium text-[var(--bocar-text)]">
                <p className="m-0">{normalizedId}</p>
                <p className="m-0">Ricardo Soto</p>
                <p className="m-0">Acero</p>
              </div>
            </div>

            <span className="hidden h-14 w-px bg-[var(--bocar-blue-70)] md:block" />

            <div className="grid grid-cols-[132px_minmax(0,1fr)] gap-3 text-[12px] leading-[1.35]">
              <div className="text-right font-semibold uppercase text-[var(--bocar-blue-30)]">
                <p className="m-0">Descripcion</p>
                <p className="m-0">Fecha de creacion</p>
                <p className="m-0">Estado</p>
              </div>
              <div className="font-medium text-[var(--bocar-text)]">
                <p className="m-0">RFQ para piezas del motor</p>
                <p className="m-0">20/06/2024</p>
                <span className="mt-1 inline-flex rounded-[4px] bg-[var(--bocar-review)] px-4 py-1 text-[10px] font-semibold text-[var(--bocar-text)]">
                  Review
                </span>
              </div>
            </div>
          </div>

          <div className="mt-7 flex justify-center">
            <button
              className="h-10 min-w-[220px] rounded-[8px] bg-[var(--bocar-blue-100)] px-8 text-[13px] font-semibold text-white transition hover:bg-[#0b3b6b] focus:outline-none focus:shadow-[0_0_0_3px_rgba(0,46,93,0.14)]"
              type="button"
            >
              Editar RFQ
            </button>
          </div>
        </div>

        <div className="border-t border-[rgba(217,222,229,0.58)] px-7 py-6 lg:px-12">
          <h2 className="m-0 text-[16px] font-semibold text-[var(--bocar-text)]">Archivos Subidos</h2>

          <div className="mt-3 grid gap-3">
            {uploadedFiles.map((file) => (
              <div
                key={file.name}
                className="flex min-h-10 items-center justify-between rounded-[8px] bg-[var(--bocar-blue-100)] px-6 text-white"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <DocumentIcon />
                  <span className="truncate text-[13px] font-medium">{file.name}</span>
                </div>
                <button
                  className="rounded-[4px] px-2 py-1 text-[12px] font-semibold uppercase text-white transition hover:bg-white/10 focus:outline-none focus:shadow-[0_0_0_2px_rgba(255,255,255,0.32)]"
                  type="button"
                >
                  Descargar
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-[rgba(217,222,229,0.58)] px-7 py-6 lg:px-12">
          <h2 className="m-0 text-[16px] font-semibold text-[var(--bocar-text)]">Proveedores Seleccionados</h2>

          <div className="mt-4 grid gap-3 sm:hidden">
            {selectedSuppliers.map((supplier) => (
              <article
                key={`${supplier.name}-mobile`}
                className="rounded-[6px] border border-[var(--bocar-border)] bg-white px-4 py-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="m-0 text-[12px] font-semibold text-[var(--bocar-text)]">{supplier.name}</p>
                    <p className="mt-1 text-[12px] text-[var(--bocar-blue-70)]">{supplier.category}</p>
                  </div>
                  <span className="rounded-[4px] bg-[var(--bocar-neutral)] px-2 py-1 text-[10px] font-medium text-[var(--bocar-text)]">
                    {supplier.status}
                  </span>
                </div>
                <p className="mt-3 text-[12px] text-[var(--bocar-text)]">Contacto: {supplier.contact}</p>
              </article>
            ))}
          </div>

          <div className="mt-4 hidden overflow-x-auto sm:block">
            <table className="w-full max-w-[1040px] border-separate border-spacing-0 overflow-hidden rounded-[6px] border border-[var(--bocar-border)] text-left">
              <thead>
                <tr className="bg-[var(--bocar-bg)]">
                  {['Proveedor', 'Categoria', 'Contacto', 'Estado'].map((header) => (
                    <th
                      key={header}
                      className="px-6 py-3 text-[12px] font-semibold text-[var(--bocar-text)]"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {selectedSuppliers.map((supplier) => (
                  <tr key={supplier.name} className="border-t border-[rgba(217,222,229,0.72)]">
                    <td className="px-6 py-3.5 text-[12px] font-medium text-[var(--bocar-text)]">{supplier.name}</td>
                    <td className="px-6 py-3.5 text-[12px] text-[var(--bocar-text)]">{supplier.category}</td>
                    <td className="px-6 py-3.5 text-[12px] text-[var(--bocar-text)]">{supplier.contact}</td>
                    <td className="px-6 py-3.5">
                      <span className="rounded-[4px] bg-[var(--bocar-neutral)] px-2 py-1 text-[10px] font-medium text-[var(--bocar-text)]">
                        {supplier.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="border-t border-[rgba(217,222,229,0.58)] px-7 py-6 lg:px-12">
          <h2 className="m-0 text-[16px] font-semibold text-[var(--bocar-text)]">Benchmark de proveedores</h2>

          <div className="mt-4 grid gap-3 sm:hidden">
            {benchmarkRows.map((row) => (
              <article
                key={`${row.supplier}-mobile`}
                className="rounded-[6px] border border-[var(--bocar-border)] bg-white px-4 py-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="m-0 text-[12px] font-semibold text-[var(--bocar-text)]">{row.supplier}</p>
                    <p className="mt-1 text-[12px] text-[var(--bocar-blue-70)]">
                      {row.price} | {row.time} | Calidad {row.quality}
                    </p>
                  </div>
                  <div className="flex min-w-[82px] items-center justify-end gap-2">
                    <span className={`h-1 w-10 rounded-full ${getScoreToneClass(row.scoreTone)}`} />
                    <span className="text-[12px] font-medium text-[var(--bocar-text)]">{row.score}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-4 hidden overflow-x-auto sm:block">
            <table className="w-full border-separate border-spacing-0 overflow-hidden rounded-[6px] border border-[var(--bocar-border)] text-left">
              <thead>
                <tr className="bg-[var(--bocar-bg)]">
                  {['Proveedor', 'Precio', 'Tiempo', 'Calidad', 'Score'].map((header) => (
                    <th
                      key={header}
                      className="px-6 py-3 text-[12px] font-semibold text-[var(--bocar-text)]"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {benchmarkRows.map((row) => (
                  <tr key={row.supplier} className="border-t border-[rgba(217,222,229,0.72)]">
                    <td className="px-6 py-3.5 text-[12px] font-medium text-[var(--bocar-text)]">{row.supplier}</td>
                    <td className="px-6 py-3.5 text-[12px] text-[var(--bocar-text)]">{row.price}</td>
                    <td className="px-6 py-3.5 text-[12px] text-[var(--bocar-text)]">{row.time}</td>
                    <td className="px-6 py-3.5 text-[12px] text-[var(--bocar-text)]">{row.quality}</td>
                    <td className="px-6 py-3.5">
                      <div className="flex min-w-[110px] items-center gap-5">
                        <span className={`h-1 w-[72px] rounded-full ${getScoreToneClass(row.scoreTone)}`} />
                        <span className="text-[12px] font-medium text-[var(--bocar-text)]">{row.score}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8 flex flex-col items-center justify-center gap-5 sm:flex-row sm:gap-[88px]">
            <button
              className="h-10 min-w-[220px] rounded-[8px] bg-[var(--bocar-blue-30)] px-8 text-[13px] font-semibold text-white transition hover:bg-[var(--bocar-blue-50)] focus:outline-none focus:shadow-[0_0_0_3px_rgba(167,177,194,0.28)]"
              type="button"
            >
              Rechazar RFQ
            </button>
            <button
              className="h-10 min-w-[220px] rounded-[8px] bg-[var(--bocar-blue-100)] px-8 text-[13px] font-semibold text-white transition hover:bg-[#0b3b6b] focus:outline-none focus:shadow-[0_0_0_3px_rgba(0,46,93,0.14)]"
              type="button"
            >
              Aprobar RFQ
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
