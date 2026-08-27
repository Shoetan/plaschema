import type {
  CursorListQuery,
  CursorPage,
} from '../../../platform/http/cursor-pagination';
import type { HealthFacility } from '../domain/health-facility';

export const HEALTH_FACILITY_REPOSITORY = Symbol('HEALTH_FACILITY_REPOSITORY');

export type CreateHealthFacilityInput = {
  id: string;
  name: string;
  lga: string;
  wardId: string;
};

export type UpdateHealthFacilityInput = {
  name?: string;
  lga?: string;
  wardId?: string;
};

export type ListHealthFacilitiesQuery = CursorListQuery & {
  wardId?: string;
  lga?: string;
};

export type PaginatedHealthFacilities = CursorPage<HealthFacility>;

export type StreamHealthFacilitiesQuery = {
  batchSize: number;
  updatedSince?: Date;
  wardId?: string;
};

export interface HealthFacilityRepository {
  create(input: CreateHealthFacilityInput): Promise<HealthFacility>;
  createMany(inputs: CreateHealthFacilityInput[]): Promise<number>;
  findById(id: string): Promise<HealthFacility | null>;
  findByNameAndWard(
    name: string,
    wardId: string,
  ): Promise<HealthFacility | null>;
  list(query: ListHealthFacilitiesQuery): Promise<PaginatedHealthFacilities>;
  stream(
    query: StreamHealthFacilitiesQuery,
  ): AsyncGenerator<HealthFacility[], void, unknown>;
  update(id: string, input: UpdateHealthFacilityInput): Promise<HealthFacility>;
  delete(id: string): Promise<void>;
}
