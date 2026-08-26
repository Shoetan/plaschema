/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'domain-no-framework-or-infra',
      comment:
        'Domain must not depend on NestJS, Prisma, Redis, Express, or HTTP clients.',
      severity: 'error',
      from: { path: '^src/modules/[^/]+/domain' },
      to: {
        path: 'node_modules/(@nestjs|@prisma|ioredis|express|prisma|axios)',
      },
    },
    {
      name: 'application-no-concrete-infra',
      comment:
        'Application must not import Prisma, Redis, or generated persistence clients.',
      severity: 'error',
      from: { path: '^src/modules/[^/]+/application' },
      to: {
        path: '(node_modules/(@prisma|ioredis|prisma)|src/(platform/persistence|generated))',
      },
    },
    {
      name: 'presentation-no-persistence',
      comment:
        'Presentation must call application use cases, not Prisma or generated clients.',
      severity: 'error',
      from: { path: '^src/modules/[^/]+/presentation' },
      to: {
        path: '(src/(platform/persistence|generated)|node_modules/(@prisma|prisma))',
      },
    },
    {
      name: 'domain-and-application-no-persistence-platform',
      comment:
        'Domain/application layers must not reach into platform persistence.',
      severity: 'error',
      from: { path: '^src/modules/[^/]+/(domain|application)' },
      to: { path: '^src/platform/(persistence|cache)' },
    },
  ],
  options: {
    doNotFollow: {
      path: 'node_modules',
    },
    tsPreCompilationDeps: true,
    tsConfig: {
      fileName: 'tsconfig.json',
    },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default'],
    },
  },
};
