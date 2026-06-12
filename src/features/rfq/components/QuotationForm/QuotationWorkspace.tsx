import { useEffect, useMemo, useState } from 'react';

import type { RfqTipo } from '@/features/analytics/types';
import type { MoldFormValues } from '@/features/rfq/components/RfqForm/definitions/moldDefinition';
import type { TrimmingFormValues } from '@/features/rfq/components/RfqForm/definitions/trimmingDefinition';
import {
  actualizarCotizacion,
  detalleAsignacionParaCotizar,
  enviarCotizacion,
  responderCotizacion,
  verRespuesta,
} from '@/features/supplier/services/asignacionesService';
import { resolveFileUrl } from '@/features/rfq/services/rfqMappers';
import { quotationDtoToFormValues } from '@/features/supplier/services/quotationDtoToFormValues';
import { useResource } from '@/shared/hooks/useResource';
import type { FileInfo } from '@/shared/components/ui/MultiFileUploadField';
import { extractApiError } from '@/shared/utils/extractApiError';
import { formatId, parseId } from '@/shared/utils/rfqId';

import {
  buildMoldQuotationDefinition,
  type InheritedMoldRfq,
} from './definitions/moldQuotationDefinition';
import {
  buildTrimmingQuotationDefinition,
  type InheritedRfq,
} from './definitions/trimmingQuotationDefinition';
import { QuotationWorkspaceShell } from './shell/QuotationWorkspaceShell';

type QuotationWorkspaceProps = {
  mode: 'create' | 'edit';
  onBack: () => void;
  quotationId?: string;
  rfqId: string;
  tipo: RfqTipo;
};


export function QuotationWorkspace({
  mode,
  onBack,
  quotationId,
  rfqId,
  tipo,
}: QuotationWorkspaceProps) {
  const inheritedResource = useResource(
    (signal) => detalleAsignacionParaCotizar(tipo, parseId(rfqId), signal),
    [tipo, rfqId],
  );
  const resourceData = inheritedResource.state.status === 'success' ? inheritedResource.state.data : null;
  const inheritedValues = resourceData?.formValues ?? null;
  // rfqId es el id de la ASIGNACIÓN (viene de la URL) y se usa para las llamadas
  // API. Para mostrar al proveedor el id real del RFQ usamos rfqDbId del detalle.
  const displayRfqId = resourceData?.rfqDbId ? formatId(resourceData.rfqDbId) : rfqId;

  // hasDraftUser: se activa en esta sesión cuando el proveedor crea un borrador nuevo.
  // tiene_borrador: viene del backend — true si ya existe un borrador guardado previamente.
  // hasDraft = cualquiera de los dos → usar PATCH en lugar de POST.
  const [hasDraftUser, setHasDraftUser] = useState(false);
  const [draftFiles, setDraftFiles] = useState<FileInfo[]>([]);
  // Valores del cost breakdown guardado, mapeados a la forma del formulario.
  // Permiten "continuar" un borrador al volver: rehidratan las celdas capturadas.
  const [draftValues, setDraftValues] = useState<Record<string, unknown> | undefined>(undefined);
  const hasDraft = hasDraftUser || (resourceData?.tiene_borrador ?? false);

  useEffect(() => {
    setHasDraftUser(false);
    setDraftFiles([]);
    setDraftValues(undefined);
  }, [mode, rfqId, tipo]);

  useEffect(() => {
    let cancelled = false;
    setDraftFiles([]);
    setDraftValues(undefined);

    if (!resourceData?.tiene_borrador) return;

    void verRespuesta(tipo, parseId(rfqId)).then((response) => {
      if (cancelled || !response) return;
      setDraftFiles(mapQuotationFiles(response));
      setDraftValues(quotationDtoToFormValues(tipo, response));
    });

    return () => {
      cancelled = true;
    };
  }, [resourceData?.tiene_borrador, rfqId, tipo]);
  // Memoizados: el shell resetea el formulario cuando cambia la definición, y
  // la definición se reconstruye cuando cambia el objeto heredado.
  const trimmingInherited = useMemo(
    () =>
      tipo === 'Trimming' && inheritedValues
        ? trimmingFormToInherited(inheritedValues as TrimmingFormValues)
        : undefined,
    [tipo, inheritedValues],
  );
  const moldInherited = useMemo(
    () =>
      tipo === 'Mold' && inheritedValues
        ? moldFormToInherited(inheritedValues as MoldFormValues)
        : undefined,
    [tipo, inheritedValues],
  );

  const trimmingDef = useMemo(
    () => buildTrimmingQuotationDefinition(rfqId, trimmingInherited, draftFiles, draftValues),
    [rfqId, trimmingInherited, draftFiles, draftValues],
  );
  const moldDef = useMemo(
    () => buildMoldQuotationDefinition(rfqId, moldInherited, draftFiles, draftValues),
    [rfqId, moldInherited, draftFiles, draftValues],
  );


  async function handleSaveDraft(values: unknown) {
    const assignmentId = parseId(rfqId);
    if (hasDraft) {
      await actualizarCotizacion(tipo, assignmentId, values);
      return;
    }
    await responderCotizacion(tipo, assignmentId, values);
    setHasDraftUser(true);
  }

  async function handleSubmit(values: unknown) {
    const assignmentId = parseId(rfqId);
    if (hasDraft) {
      await actualizarCotizacion(tipo, assignmentId, values);
    } else {
      await responderCotizacion(tipo, assignmentId, values);
      setHasDraftUser(true);
    }
    try {
      const result = await enviarCotizacion(tipo, assignmentId);
      return { rfqCompleted: 'rfq_completed' in result ? Boolean(result.rfq_completed) : false };
    } catch (error) {
      throw new Error(
        `Quotation was saved as a draft, but could not be sent to Purchasing. ${extractApiError(error)}`,
      );
    }
  }

  if (inheritedResource.state.status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f7fa] px-6 text-[14px] text-[var(--bocar-blue-70)]">
        Loading RFQ data...
      </div>
    );
  }

  if (inheritedResource.state.status === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f7fa] px-6 text-[14px] text-[var(--bocar-error)]">
        {extractApiError(inheritedResource.state.error)}
      </div>
    );
  }

  if (tipo === 'Mold') {
    return (
      <QuotationWorkspaceShell
        definition={moldDef}
        mode={mode}
        onSaveDraft={handleSaveDraft}
        onSubmit={handleSubmit}
        quotationId={quotationId}
        rfqId={rfqId}
        displayRfqId={displayRfqId}
        tipo={tipo}
        onBack={onBack}
      />
    );
  }

  return (
    <QuotationWorkspaceShell
      definition={trimmingDef}
      mode={mode}
      onSaveDraft={handleSaveDraft}
      onSubmit={handleSubmit}
      quotationId={quotationId}
      rfqId={rfqId}
      displayRfqId={displayRfqId}
      tipo={tipo}
      onBack={onBack}
    />
  );
}

function item(label: string, checked: string | undefined, notes: string) {
  return {
    label,
    checked: checked === 'yes' || checked === 'no' ? checked : '',
    notes,
  } as const;
}

function moldFormToInherited(values: MoldFormValues): InheritedMoldRfq {
  const c = values.considerations;
  return {
    description: values.rfq_name,
    parts_per_year: values.ppy,
    customer: values.cust,
    part_tech: values.part_tech,
    part_number: values.part_number || values.pnum,
    project_life: values.prlf,
    deliver_by: values.dtq,
    // Tool Engineering: mismos campos que captura Industrialización.
    te_pnum: values.pnum,
    te_dtq: values.dtq,
    te_prlf: values.prlf,
    te_elab: values.elab,
    te_tt: values.tt,
    // DCM: las 18 specs con sus labels exactos del formulario de Industrialización.
    dcm_specs: [
      { label: 'Smash', value: c.smach?.notes ?? '' },
      { label: 'No.CAV', value: c.no_cav?.notes ?? '' },
      { label: 'No.ofHS', value: c.no_hs?.notes ?? '' },
      { label: 'No.ofMS', value: c.no_ms?.notes ?? '' },
      { label: '3thPSupp', value: c.third_p_supp?.notes ?? '' },
      { label: 'No.subc', value: c.no_subc?.notes ?? '' },
      { label: 'Jco', value: c.jco?.notes ?? '' },
      { label: 'QcSys', value: c.qc_sys?.notes ?? '' },
      { label: 'Ihtcs', value: c.ihtcs?.notes ?? '' },
      { label: 'Spin', value: c.spin?.notes ?? '' },
      { label: 'HICS', value: c.hics?.notes ?? '' },
      { label: 'CMGOM', value: c.cm_gom?.notes ?? '' },
      { label: 'SPforThermoR', value: c.sp_thermo?.notes ?? '' },
      { label: 'NReturnV', value: c.n_return_v?.notes ?? '' },
      { label: 'VacV', value: c.vac_v?.notes ?? '' },
      { label: 'ChillBl', value: c.chill_bl?.notes ?? '' },
      { label: 'No.Pl.Jco sys', value: c.no_pl_jco?.notes ?? '' },
      { label: 'Oth', value: c.ctbd?.notes ?? '' },
    ],
    industrialization_comments: values.comments,
    // SPECS del DCM capturados por Industrialización (claves ofuscadas en el
    // backend: No_ofHS, Jco, Ihtcs, Spin, VacV, ChillBl, Oth).
    dcm_no_hs: c.no_hs?.notes || values.hydr_slides,
    dcm_jco: c.jco?.notes ?? '',
    dcm_ihtcs: c.ihtcs?.notes ?? '',
    dcm_spin: c.spin?.notes ?? '',
    dcm_vac_v: c.vac_v?.notes ?? '',
    dcm_chill_bl: c.chill_bl?.notes ?? '',
    dcm_oth: c.ctbd?.notes ?? '',
    diritpotd: [
      item('3D', c.d_3d?.checked, c.d_3d?.notes ?? ''),
      item('FiAn', c.flan?.checked, c.flan?.notes ?? ''),
      item('Run des', c.run_des?.checked, c.run_des?.notes ?? ''),
      item('Run and over mod', c.run_over?.checked, c.run_over?.notes ?? ''),
      item('ManProp', c.man_prop?.checked, c.man_prop?.notes ?? ''),
      item('Ldi', c.ldi?.checked, c.ldi?.notes ?? ''),
      item('Add of mach st.', c.add_mach?.checked, c.add_mach?.notes ?? ''),
      item('Sketch d conc, inc s dim', c.sketch?.checked, c.sketch?.notes ?? ''),
      item('2D Dr DesPDF and CNFl', c.drw_2d?.checked, c.drw_2d?.notes ?? ''),
      item('3D D. Mod. solid. (Native Format)', c.drw_3d?.checked, c.drw_3d?.notes ?? ''),
    ],
    other_items: [
      item('Eyeb', c.eyeb?.checked, c.eyeb?.notes ?? ''),
      item('C&W Conn', c.ow_conn?.checked, c.ow_conn?.notes ?? ''),
      item('STM (1&2)', c.stm?.checked, c.stm?.notes ?? ''),
      item('CMM dim rep cal', c.cmm_rep?.checked, c.cmm_rep?.notes ?? ''),
      item('GOM report', c.gom_rep?.checked, c.gom_rep?.notes ?? ''),
      item('H val subc& in', c.h_val?.checked, c.h_val?.notes ?? ''),
      item('Dim con&opt', c.dim_corr?.checked, c.dim_corr?.notes ?? ''),
      item('Sp Pl', c.sp_pt?.checked, c.sp_pt?.notes ?? ''),
    ],
    ot_inf: [
      item('Comp. D.', c.comp_d?.checked, c.comp_d?.notes ?? ''),
      item('Subseq. D.', c.subseq_d?.checked, c.subseq_d?.notes ?? ''),
      item('Set of repl. H-13', c.repl_h13?.checked, c.repl_h13?.notes ?? ''),
      item('Sp. set of E.I.', c.sp_ei?.checked, c.sp_ei?.notes ?? ''),
      item('FICF', c.ficf?.checked, c.ficf?.notes ?? ''),
      item('HCLS', c.hcls?.checked, c.hcls?.notes ?? ''),
      item('Fr Refur.', c.fr_refur?.checked, c.fr_refur?.notes ?? ''),
    ],
    ctbd_items: [item('Other costs to be determined', c.ctbd?.checked, c.ctbd?.notes ?? '')],
    pg_part_name: values.part_name,
    pg_alloy: values.alloy,
    pg_part_number_geom: values.part_number,
    pg_part_dimension: values.part_dim,
    pg_min_wall_thickness: values.wall_min,
    pg_max_wall_thickness: values.wall_max,
    pg_projected_area: values.projected,
    pg_surface: values.surface,
    pg_volume: values.volume,
    pg_gross_weight: values.weight,
    ts_buhler_machine_ton: values.buhler,
    ts_num_cavities_sets: values.num_cav,
    ts_three_plate_mold: values.three_plate,
    ts_num_gates_per_part: values.gates,
    ts_num_mech_slides: values.mech_slides,
    ts_num_hydr_slides: values.hydr_slides,
    ts_num_parts_per_stroke: values.parts_stroke,
    ts_num_tools: values.num_tools,
    rfq_files: values.files,
  };
}

function mapQuotationFiles(response: Record<string, unknown>): FileInfo[] {
  const rawFiles = Array.isArray(response.archivos) ? response.archivos : [];
  return rawFiles.flatMap((raw) => {
    if (!raw || typeof raw !== 'object') return [];
    const file = raw as { id?: unknown; archivo?: unknown; uploaded_at?: unknown };
    if (typeof file.archivo !== 'string') return [];
    const parts = file.archivo.split(/[\\/]/);
    return [{
      id: typeof file.id === 'number' ? file.id : undefined,
      name: parts[parts.length - 1] ?? file.archivo,
      size: 0,
      type: '',
      url: resolveFileUrl(file.archivo),
      uploadedAt: typeof file.uploaded_at === 'string' ? file.uploaded_at : undefined,
    }];
  });
}

function trimmingFormToInherited(values: TrimmingFormValues): InheritedRfq {
  const c = values.considerations;
  return {
    description: values.description,
    parts_per_year: values.parts_per_year,
    customer: values.customer,
    part_number: values.part_number,
    project_life: values.project_life,
    previous_job: values.previous_job,
    deliver_by: values.deliver_by,
    press: values.press,
    num_cavities: values.num_cavities,
    num_hydraulic_slides: values.num_hydraulic_slides,
    fully_automatic: values.fully_automatic === 'yes' || values.fully_automatic === 'no' ? values.fully_automatic : '',
    presence_detectors: values.presence_detectors === 'yes' || values.presence_detectors === 'no' ? values.presence_detectors : '',
    trimming_condition:
      values.trimming_condition === 'cold' || values.trimming_condition === 'hot'
        ? values.trimming_condition
        : '',
    punch_pins_required:
      values.punch_pins_required === 'yes' || values.punch_pins_required === 'no'
        ? values.punch_pins_required
        : '',
    residual_burr_mm: values.residual_burr_mm,
    castings_by_auma:
      values.castings_by_auma === 'yes' || values.castings_by_auma === 'no' ? values.castings_by_auma : '',
    adjustments_toolmaker:
      values.adjustments_toolmaker === 'yes' || values.adjustments_toolmaker === 'no'
        ? values.adjustments_toolmaker
        : '',
    gas_springs: values.gas_springs,
    data_info: [
      item('Design 3D model', c.design_3d?.checked, c.design_3d?.notes ?? ''),
      item('Design 2D data', c.design_2d?.checked, c.design_2d?.notes ?? ''),
      item('Punch pins Data', c.punch_pins?.checked, c.punch_pins?.notes ?? ''),
      item('Manufacturing Proposals', c.manuf_proposals?.checked, c.manuf_proposals?.notes ?? ''),
      item('Latest trim die improvements', c.latest_improvements?.checked, c.latest_improvements?.notes ?? ''),
      item('Sketch of trim die concept including steel dimensions', c.sketch_concept?.checked, c.sketch_concept?.notes ?? ''),
    ],
    other_info: [
      item('Frame Refurbishment', c.frame_refur?.checked, c.frame_refur?.notes ?? ''),
      item('Set of electric wires', c.elec_wires?.checked, c.elec_wires?.notes ?? ''),
      item('Others', c.others?.checked, c.others?.notes ?? ''),
      item('Delivery date', c.delivery_date?.checked, c.delivery_date?.notes ?? ''),
      item('Ejector system in fixed side', c.ejector_fixed?.checked, c.ejector_fixed?.notes ?? ''),
      item('Trim die No. 1', c.trim_die_1?.checked, c.trim_die_1?.notes ?? ''),
      item('Trim die No. 2', c.trim_die_2?.checked, c.trim_die_2?.notes ?? ''),
      item('Set of spare parts', c.spare_parts_set?.checked, c.spare_parts_set?.notes ?? ''),
      item('Hydraulic Cylinders and limit switches', c.hydraulic_cyl?.checked, c.hydraulic_cyl?.notes ?? ''),
    ],
    pg_part_name: values.pg_part_name,
    pg_part_number_geom: values.pg_part_number_geom,
    pg_part_dimension: values.pg_part_dimension,
    pg_min_wall_thickness: values.pg_min_wall_thickness,
    pg_max_wall_thickness: values.pg_max_wall_thickness,
    pg_projected_area: values.pg_projected_area,
    pg_surface: values.pg_surface,
    pg_volume: values.pg_volume,
    pg_gross_weight: values.pg_gross_weight,
    ts_intro_extraction: values.ts_intro_extraction,
    ts_biscuit_position: values.ts_biscuit_position,
    ts_qty_punch_pins: values.ts_qty_punch_pins,
    ts_temp_trimmed: values.ts_temp_trimmed,
    ts_ejector_fixed_side: values.ts_ejector_fixed_side,
    industrialization_comments: values.comments,
    rfq_files: values.files,
  };
}
