import type { Prisma } from '../../../generated/prisma/client';
import type { ListEnrollmentsQuery } from '../application/enrollment.repository';
import { dateOfBirthRangeForAge } from '../domain/enrollment-age';

export function buildEnrollmentListWhere(
  query: Omit<ListEnrollmentsQuery, 'cursor' | 'limit'>,
): Prisma.EnrollmentWhereInput {
  const createdAtFilter =
    query.createdFrom || query.createdTo
      ? {
          createdAt: {
            ...(query.createdFrom ? { gte: query.createdFrom } : {}),
            ...(query.createdTo ? { lte: query.createdTo } : {}),
          },
        }
      : {};

  const printedFilter =
    query.printedStatus === 'printed'
      ? { OR: [{ printedAt: { not: null } }, { printCount: { gt: 0 } }] }
      : query.printedStatus === 'not_printed'
        ? { printedAt: null, printCount: 0 }
        : {};

  const dateOfBirthFilter = dateOfBirthRangeForAge(query.ageMin, query.ageMax);

  return {
    ...(query.wardId ? { wardId: query.wardId } : {}),
    ...(query.wardIds ? { wardId: { in: query.wardIds } } : {}),
    ...(query.healthFacilityId
      ? { healthFacilityId: query.healthFacilityId }
      : {}),
    ...(query.enrolledByUserId
      ? { enrolledByUserId: query.enrolledByUserId }
      : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.category ? { category: query.category } : {}),
    ...(query.lga
      ? { ward: { lga: { equals: query.lga, mode: 'insensitive' as const } } }
      : {}),
    ...(query.enrollmentId
      ? {
          enrollmentId: {
            contains: query.enrollmentId,
            mode: 'insensitive' as const,
          },
        }
      : {}),
    ...(query.beneficiaryName
      ? {
          OR: [
            {
              firstName: {
                contains: query.beneficiaryName,
                mode: 'insensitive' as const,
              },
            },
            {
              lastName: {
                contains: query.beneficiaryName,
                mode: 'insensitive' as const,
              },
            },
            {
              middleName: {
                contains: query.beneficiaryName,
                mode: 'insensitive' as const,
              },
            },
          ],
        }
      : {}),
    ...(dateOfBirthFilter ? { dateOfBirth: dateOfBirthFilter } : {}),
    ...createdAtFilter,
    ...printedFilter,
    ...(query.search
      ? {
          AND: [
            {
              OR: [
                {
                  enrollmentId: {
                    contains: query.search,
                    mode: 'insensitive' as const,
                  },
                },
                {
                  firstName: {
                    contains: query.search,
                    mode: 'insensitive' as const,
                  },
                },
                {
                  lastName: {
                    contains: query.search,
                    mode: 'insensitive' as const,
                  },
                },
                {
                  phone: {
                    contains: query.search,
                    mode: 'insensitive' as const,
                  },
                },
                {
                  nin: {
                    contains: query.search,
                    mode: 'insensitive' as const,
                  },
                },
                {
                  category: {
                    contains: query.search,
                    mode: 'insensitive' as const,
                  },
                },
              ],
            },
          ],
        }
      : {}),
  };
}
