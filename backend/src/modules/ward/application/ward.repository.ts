import type { CursorListQuery, CursorPage } from '../../../platform/http/cursor-pagination';
import type { Ward } from '../domain/ward';

export const WARD_REPOSITORY = Symbol('WARD_REPOSITORY');

export type CreateWardInput = {
  id: string;
  name: string;
  lga: string;
};

export type UpdateWardInput = {
  name?: string;
  lga?: string;
};

export type ListWardsQuery = CursorListQuery;

export type PaginatedWards = CursorPage<Ward>;

export type StreamWardsQuery = {
  batchSize: number;
  updatedSince?: Date;
};

export interface WardRepository {
  create(input: CreateWardInput): Promise<Ward>;
  createMany(inputs: CreateWardInput[]): Promise<number>;
  findById(id: string): Promise<Ward | null>;
  findByName(name: string): Promise<Ward | null>;
  findByNames(names: string[]): Promise<Ward[]>;
  list(query: ListWardsQuery): Promise<PaginatedWards>;
  stream(query: StreamWardsQuery): AsyncGenerator<Ward[], void, unknown>;
  update(id: string, input: UpdateWardInput): Promise<Ward>;
  delete(id: string): Promise<void>;
  countAssignments(wardId: string): Promise<number>;
  countHealthFacilities(wardId: string): Promise<number>;
}
