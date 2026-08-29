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
  type WardRepository,
} from '../../ward/application/ward.repository';
import {
  DEFAULT_HEALTH_FACILITY_LEVEL,
  DEFAULT_HEALTH_FACILITY_TYPE,
} from '../domain/health-facility';
import {
  HEALTH_FACILITY_REPOSITORY,
  type CreateHealthFacilityInput,
  type HealthFacilityRepository,
} from './health-facility.repository';

type PendingFacility = CreateHealthFacilityInput & { row: number };

@Injectable()
export class BatchCreateHealthFacilitiesUseCase {
  constructor(
    @Inject(HEALTH_FACILITY_REPOSITORY)
    private readonly facilities: HealthFacilityRepository,
    @Inject(WARD_REPOSITORY) private readonly wards: WardRepository,
  ) {}

  async execute(
    fileBuffer: Buffer,
    filename?: string,
  ): Promise<BatchUploadResult> {
    const rawRows = parseTabularBuffer(fileBuffer, { filename });
    requireCsvColumns(rawRows, ['name', 'ward']);

    const errors: BatchUploadResult['errors'] = [];
    const pending = new Map<string, PendingFacility>();

    const wardNames = [
      ...new Set(
        rawRows
          .map((raw) => normalizePlaceName(normalizeCsvRow(raw).ward ?? ''))
          .filter((name) => Boolean(name)),
      ),
    ];
    const wards = await this.wards.findByNames(wardNames);
    const wardsByName = new Map(
      wards.map((ward) => [ward.name.toLowerCase(), ward]),
    );

    rawRows.forEach((raw, index) => {
      const rowNumber = index + 2;
      const row = normalizeCsvRow(raw);
      const name = normalizePlaceName(row.name ?? '');
      const wardName = normalizePlaceName(row.ward ?? '');

      if (!name || !wardName) {
        errors.push({
          row: rowNumber,
          message: 'name and ward are required',
        });
        return;
      }

      const ward = wardsByName.get(wardName.toLowerCase());
      if (!ward) {
        errors.push({
          row: rowNumber,
          message: `Ward not found: ${wardName}`,
        });
        return;
      }

      const key = `${name.toLowerCase()}::${ward.id}`;
      if (pending.has(key)) {
        errors.push({
          row: rowNumber,
          message: `Duplicate facility in file for ward: ${name}`,
        });
        return;
      }

      pending.set(key, {
        id: createUuidV7(),
        name,
        lga: ward.lga,
        type: DEFAULT_HEALTH_FACILITY_TYPE,
        level: DEFAULT_HEALTH_FACILITY_LEVEL,
        status: 'active',
        wardId: ward.id,
        row: rowNumber,
      });
    });

    const toCreate: CreateHealthFacilityInput[] = [];
    for (const candidate of pending.values()) {
      const existing = await this.facilities.findByNameAndWard(
        candidate.name,
        candidate.wardId,
      );
      if (existing) {
        errors.push({
          row: candidate.row,
          message: `Health facility already exists in ward: ${candidate.name}`,
        });
        continue;
      }
      toCreate.push({
        id: candidate.id,
        name: candidate.name,
        lga: candidate.lga,
        type: candidate.type,
        level: candidate.level,
        status: candidate.status,
        wardId: candidate.wardId,
      });
    }

    const created = await this.facilities.createMany(toCreate);

    return {
      created,
      failed: errors.length,
      errors,
    };
  }
}
