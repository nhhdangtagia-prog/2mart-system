/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      comment: 'Cấm import vòng (circular dependencies) để tránh lỗi runtime không đáng có.',
      from: {},
      to: {
        circular: true
      }
    },
    {
      name: 'domain-cannot-import-outside',
      severity: 'error',
      comment: 'Tầng Domain là trái tim của hệ thống. Tuyệt đối không được import framework (NestJS, Express, Supabase) hay tầng khác (Application, Infrastructure, Presentation).',
      from: { path: "^packages/domain/" },
      to: {
        pathNot: "^(packages/domain/|node_modules/(zod|date-fns))"
      }
    },
    {
      name: 'application-cannot-import-infrastructure',
      severity: 'error',
      comment: 'Tầng Application chứa Usecase. Không được import trực tiếp Implementation từ Infrastructure. Hãy dùng Interface.',
      from: { path: "^services/backend/src/application/" },
      to: {
        path: "^services/backend/src/(infrastructure|presentation)/"
      }
    },
    {
      name: 'presentation-cannot-import-infrastructure',
      severity: 'error',
      comment: 'Tầng Presentation (Controller) chỉ được giao tiếp với Application, không được gọi thẳng DB qua Infrastructure.',
      from: { path: "^services/backend/src/presentation/" },
      to: {
        path: "^services/backend/src/infrastructure/"
      }
    }
  ],
  options: {
    doNotFollow: {
      path: 'node_modules'
    },
    tsPreCompilationDeps: true,
    tsConfig: {
      fileName: 'tsconfig.json'
    }
  }
};
