import { Inject, Injectable } from '@nestjs/common';
import {
  normalizeCsvRow,
  parseTabularBuffer,
  requireCsvColumns,
  type BatchUploadResult,
} from '../../../platform/http/csv';
import { createUuidV7 } from '../../../platform/ids/uuid-v7';
import { normalizePlaceName } from '../../../shared/text';
import {
  WARD_REPOSITORY,
  type CreateWardInput,
  type WardRepository,
} from './ward.repository';

type PendingWard = CreateWardInput & { row: number };

@Injectable()
export class BatchCreateWardsUseCase {
  constructor(
    @Inject(WARD_REPOSITORY) private readonly wards: WardRepository,
  ) {}

  async execute(
    fileBuffer: Buffer,
    filename?: string,
  ): Promise<BatchUploadResult> {
    const rawRows = parseTabularBuffer(fileBuffer, { filename });
    requireCsvColumns(rawRows, ['name', 'lga']);

    const errors: BatchUploadResult['errors'] = [];
    const pending = new Map<string, PendingWard>();

    rawRows.forEach((raw, index) => {
      const rowNumber = index + 2;
      const row = normalizeCsvRow(raw);
      const name = normalizePlaceName(row.name ?? '');
      const lga = normalizePlaceName(row.lga ?? '');

      if (!name || !lga) {
        errors.push({ row: rowNumber, message: 'name and lga are required' });
        return;
      }

      if (name.length < 2 || lga.length < 2) {
        errors.push({
          row: rowNumber,
          message: 'name and lga must be at least 2 characters',
        });
        return;
      }

      const key = name.toLowerCase();
      if (pending.has(key)) {
        errors.push({
          row: rowNumber,
          message: `Duplicate ward name in file: ${name}`,
        });
        return;
      }

      pending.set(key, {
        id: createUuidV7(),
        name,
        lga,
        status: 'active',
        row: rowNumber,
      });
    });

    const candidates = [...pending.values()];
    const existing = await this.wards.findByNames(
      candidates.map((ward) => ward.name),
    );
    const existingNames = new Set(
      existing.map((ward) => ward.name.toLowerCase()),
    );

    const toCreate: CreateWardInput[] = [];
    for (const candidate of candidates) {
      if (existingNames.has(candidate.name.toLowerCase())) {
        errors.push({
          row: candidate.row,
          message: `Ward already exists: ${candidate.name}`,
        });
        continue;
      }
      toCreate.push({
        id: candidate.id,
        name: candidate.name,
        lga: candidate.lga,
        status: candidate.status,
      });
    }

    const created = await this.wards.createMany(toCreate);

    return {
      created,
      failed: errors.length,
      errors,
    };
  }
}
