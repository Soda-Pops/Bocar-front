import type { RfqSupplier } from '@/features/rfq/services/rfqDetailService';
import type { ProveedorDto } from '@/features/purchasing/services/comercializacionDtos';

export function mapProveedorToSupplier(dto: ProveedorDto): RfqSupplier {
  const rating = dto.rating ?? 0;
  return {
    backendId: dto.id,
    name: dto.company_name,
    category: dto.continent_name ?? dto.country_name ?? 'Supplier',
    contact: dto.contact_email ?? dto.account_email ?? '-',
    score: String(rating),
    scoreTone: rating >= 80 ? 'success' : rating >= 60 ? 'warning' : 'danger',
    status: 'Available',
  };
}

