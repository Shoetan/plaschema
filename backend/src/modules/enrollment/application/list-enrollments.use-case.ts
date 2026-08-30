import { Inject, Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../../../platform/auth/current-user.decorator';
import {
  ENROLLMENT_REPOSITORY,
  type EnrollmentRepository,
  type ListEnrollmentsQuery,
} from './enrollment.repository';
import { ResolveEnrollmentListFiltersUseCase } from './resolve-enrollment-list-filters';

@Injectable()
export class ListEnrollmentsUseCase {
  constructor(
    @Inject(ENROLLMENT_REPOSITORY)
    private readonly enrollments: EnrollmentRepository,
    private readonly resolveFilters: ResolveEnrollmentListFiltersUseCase,
  ) {}

  async execute(
    actor: AuthenticatedUser,
    query: Parameters<ResolveEnrollmentListFiltersUseCase['execute']>[1] &
      Pick<ListEnrollmentsQuery, 'cursor' | 'limit'>,
  ) {
    const filters = await this.resolveFilters.execute(actor, query);

    return this.enrollments.list({
      cursor: query.cursor,
      limit: query.limit,
      ...filters,
    });
  }
}
