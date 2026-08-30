import { Injectable } from '@nestjs/common';
import { PassThrough } from 'node:stream';
import ExcelJS from 'exceljs';
import type { Enrollment } from '../domain/enrollment';
import {
  computeEnrollmentAge,
  formatExportDateDdMmYyyy,
} from '../domain/enrollment-age';
import { enrollmentBeneficiaryName } from '../domain/enrollment-id';

const HEADER_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF163300' },
};

const HEADER_FONT: Partial<ExcelJS.Font> = {
  bold: true,
  color: { argb: 'FFFFFFFF' },
  size: 11,
};

const HEADER_ALIGNMENT: Partial<ExcelJS.Alignment> = {
  vertical: 'middle',
  horizontal: 'left',
  wrapText: true,
};

const EXPORT_COLUMNS: Array<{
  header: string;
  width: number;
  value: (row: Enrollment) => string | number;
}> = [
  { header: 'Enrollment ID', width: 22, value: (row) => row.enrollmentId },
  { header: 'Status', width: 12, value: (row) => formatLabel(row.status) },
  { header: 'Category', width: 24, value: (row) => row.category },
  { header: 'Title', width: 10, value: (row) => formatLabel(row.title) },
  { header: 'First Name', width: 16, value: (row) => row.firstName },
  { header: 'Middle Name', width: 16, value: (row) => row.middleName ?? '' },
  { header: 'Last Name', width: 16, value: (row) => row.lastName },
  {
    header: 'Beneficiary Name',
    width: 24,
    value: (row) => enrollmentBeneficiaryName(row),
  },
  { header: 'Gender', width: 10, value: (row) => formatLabel(row.gender) },
  {
    header: 'Date of Birth',
    width: 14,
    value: (row) => formatExportDateDdMmYyyy(row.dateOfBirth),
  },
  {
    header: 'Age',
    width: 8,
    value: (row) => computeEnrollmentAge(row.dateOfBirth),
  },
  { header: 'Phone', width: 18, value: (row) => row.phone },
  { header: 'Email', width: 24, value: (row) => row.email ?? '' },
  { header: 'NIN', width: 16, value: (row) => row.nin ?? '' },
  {
    header: 'Marital Status',
    width: 14,
    value: (row) => formatLabel(row.maritalStatus),
  },
  {
    header: 'Blood Group',
    width: 12,
    value: (row) => (row.bloodGroup ? formatLabel(row.bloodGroup) : ''),
  },
  {
    header: 'Genotype',
    width: 10,
    value: (row) => (row.genotype ? formatLabel(row.genotype) : ''),
  },
  { header: 'ID Type', width: 18, value: (row) => formatLabel(row.idType) },
  {
    header: 'Next of Kin Full Name',
    width: 22,
    value: (row) => row.nextOfKinFullName,
  },
  { header: 'Emergency Phone', width: 18, value: (row) => row.emergencyPhone },
  {
    header: 'Next of Kin Relationship',
    width: 20,
    value: (row) =>
      row.nextOfKinRelationship
        ? formatLabel(row.nextOfKinRelationship)
        : '',
  },
  {
    header: 'State of Residence',
    width: 16,
    value: (row) => row.stateOfResidence,
  },
  {
    header: 'LGA of Residence',
    width: 16,
    value: (row) => row.lgaOfResidence,
  },
  {
    header: 'Residential Address',
    width: 32,
    value: (row) => row.residentialAddress,
  },
  { header: 'Ward', width: 18, value: (row) => row.ward.name },
  { header: 'Ward LGA', width: 16, value: (row) => row.ward.lga },
  {
    header: 'Health Facility',
    width: 24,
    value: (row) => row.healthFacility.name,
  },
  {
    header: 'Facility Ward',
    width: 18,
    value: (row) => row.healthFacility.ward.name,
  },
  {
    header: 'Facility Ward LGA',
    width: 16,
    value: (row) => row.healthFacility.ward.lga,
  },
  {
    header: 'Field Worker',
    width: 20,
    value: (row) => row.enrolledBy.name,
  },
  {
    header: 'Captured At',
    width: 14,
    value: (row) => formatExportDateDdMmYyyy(row.capturedAt),
  },
  {
    header: 'Created At',
    width: 14,
    value: (row) => formatExportDateDdMmYyyy(row.createdAt),
  },
  {
    header: 'Updated At',
    width: 14,
    value: (row) => formatExportDateDdMmYyyy(row.updatedAt),
  },
  {
    header: 'Printed At',
    width: 14,
    value: (row) => formatExportDateDdMmYyyy(row.printedAt),
  },
  { header: 'Print Count', width: 12, value: (row) => row.printCount },
  {
    header: 'Has Printed',
    width: 12,
    value: (row) =>
      row.printedAt != null || row.printCount > 0 ? 'Yes' : 'No',
  },
];

function formatLabel(value: string): string {
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

@Injectable()
export class EnrollmentReportXlsxRenderer {
  async render(
    rows: AsyncIterable<Enrollment[]>,
  ): Promise<{ buffer: Buffer; rowCount: number }> {
    const stream = new PassThrough();
    const chunks: Buffer[] = [];
    stream.on('data', (chunk: Buffer) => chunks.push(chunk));

    const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
      stream,
      useSharedStrings: true,
      useStyles: true,
    });

    const worksheet = workbook.addWorksheet('Enrollments', {
      views: [{ state: 'frozen', ySplit: 1 }],
    });

    worksheet.columns = EXPORT_COLUMNS.map((column) => ({
      header: column.header,
      key: column.header,
      width: column.width,
    }));

    const headerRow = worksheet.getRow(1);
    headerRow.height = 24;
    EXPORT_COLUMNS.forEach((column, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.value = column.header;
      cell.fill = HEADER_FILL;
      cell.font = HEADER_FONT;
      cell.alignment = HEADER_ALIGNMENT;
    });
    headerRow.commit();

    let rowCount = 0;

    for await (const batch of rows) {
      for (const enrollment of batch) {
        const values = EXPORT_COLUMNS.map((column) =>
          column.value(enrollment),
        );
        worksheet.addRow(values).commit();
        rowCount += 1;
      }
    }

    await worksheet.commit();
    await workbook.commit();

    return {
      buffer: Buffer.concat(chunks),
      rowCount,
    };
  }
}
