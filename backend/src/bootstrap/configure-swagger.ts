import { type INestApplication } from '@nestjs/common';
import {
  DocumentBuilder,
  SwaggerModule,
  type OpenAPIObject,
  type SwaggerCustomOptions,
} from '@nestjs/swagger';
import { AppConfigService } from '../platform/config/app-config.service';

export const SWAGGER_DOCS_PATH = 'api/docs';

const SWAGGER_CUSTOM_CSS = `
  :root {
    color-scheme: dark;
  }

  html,
  body {
    background: #101820 !important;
  }

  #swagger-ui,
  .swagger-ui {
    background: #101820 !important;
    color: #e8eef5 !important;
  }

  .swagger-ui {
    font-family:
      Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }

  .swagger-ui .topbar {
    background: #162331 !important;
    border-bottom: 1px solid #334155 !important;
    padding: 12px 24px;
  }

  .swagger-ui .topbar-wrapper img,
  .swagger-ui .topbar-wrapper svg {
    display: none;
  }

  .swagger-ui .topbar-wrapper::before {
    color: #f8fafc !important;
    content: "CBHI API Docs";
    font-size: 18px;
    font-weight: 700;
    letter-spacing: 0;
  }

  .swagger-ui .wrapper {
    max-width: 1200px;
    padding: 32px 28px;
  }

  .swagger-ui .info {
    background: #162331 !important;
    border: 1px solid #334155 !important;
    border-radius: 8px;
    box-shadow: 0 10px 28px rgb(0 0 0 / 24%);
    margin: 0 0 24px;
    padding: 24px;
  }

  .swagger-ui .info .title {
    color: #f8fafc !important;
    font-size: 28px;
    letter-spacing: 0;
  }

  .swagger-ui .info .title small,
  .swagger-ui .info .title small pre {
    color: #f8fafc !important;
  }

  .swagger-ui .info .description,
  .swagger-ui .info p,
  .swagger-ui .info li,
  .swagger-ui .info .base-url {
    color: #cbd5e1 !important;
  }

  .swagger-ui .scheme-container,
  .swagger-ui .opblock,
  .swagger-ui .models {
    background: #162331 !important;
    border: 1px solid #334155 !important;
    border-radius: 8px;
    box-shadow: 0 6px 18px rgb(0 0 0 / 18%);
  }

  .swagger-ui .scheme-container {
    margin: 0 0 24px;
    padding: 16px 20px;
  }

  .swagger-ui .scheme-container label,
  .swagger-ui .schemes-title,
  .swagger-ui .auth-container h4,
  .swagger-ui .auth-container label,
  .swagger-ui .auth-container p {
    color: #e8eef5 !important;
  }

  .swagger-ui .auth-wrapper,
  .swagger-ui .auth-container,
  .swagger-ui .modal-ux,
  .swagger-ui .modal-ux-content,
  .swagger-ui .modal-ux-header {
    background: #162331 !important;
    color: #e8eef5 !important;
  }

  .swagger-ui .modal-ux {
    border: 1px solid #475569 !important;
    box-shadow: 0 24px 64px rgb(0 0 0 / 45%) !important;
  }

  .swagger-ui .filter .operation-filter-input,
  .swagger-ui input,
  .swagger-ui textarea,
  .swagger-ui select {
    background: #0f172a !important;
    border: 1px solid #64748b !important;
    border-radius: 6px;
    box-shadow: none;
    color: #f8fafc !important;
  }

  .swagger-ui input::placeholder,
  .swagger-ui textarea::placeholder {
    color: #94a3b8 !important;
  }

  .swagger-ui .filter .operation-filter-input:focus,
  .swagger-ui input:focus,
  .swagger-ui textarea:focus,
  .swagger-ui select:focus {
    border-color: #7dd3fc !important;
    box-shadow: 0 0 0 3px rgb(125 211 252 / 18%) !important;
    outline: none;
  }

  .swagger-ui .btn,
  .swagger-ui .authorization__btn,
  .swagger-ui .opblock-summary-control {
    border-radius: 6px;
  }

  .swagger-ui .btn {
    background: #162331 !important;
    border-color: #64748b !important;
    color: #e8eef5 !important;
  }

  .swagger-ui .btn.authorize,
  .swagger-ui .auth-btn-wrapper .btn {
    border-color: #5ec49f !important;
    color: #86efac !important;
  }

  .swagger-ui .btn.cancel {
    color: #fca5a5 !important;
  }

  .swagger-ui .opblock-tag,
  .swagger-ui .opblock-tag small,
  .swagger-ui .model-title,
  .swagger-ui .models h4,
  .swagger-ui .opblock-summary-path,
  .swagger-ui .opblock-summary-description,
  .swagger-ui .opblock-section-header h4,
  .swagger-ui .responses-inner h4,
  .swagger-ui .responses-inner h5,
  .swagger-ui .parameters-container h4,
  .swagger-ui .execute-wrapper h4 {
    color: #f8fafc !important;
  }

  .swagger-ui .opblock-tag {
    border-bottom-color: #334155 !important;
  }

  .swagger-ui .opblock-body,
  .swagger-ui .opblock-section-header,
  .swagger-ui .responses-wrapper,
  .swagger-ui .model-box,
  .swagger-ui .model-container,
  .swagger-ui .models .model-container {
    background: #111c29 !important;
    color: #e8eef5 !important;
  }

  .swagger-ui .opblock .opblock-summary {
    border-radius: 8px 8px 0 0;
  }

  .swagger-ui .opblock.opblock-post {
    border-color: #38bdf8 !important;
    background: #112233 !important;
  }

  .swagger-ui .opblock.opblock-get {
    border-color: #4ade80 !important;
    background: #10251d !important;
  }

  .swagger-ui .opblock.opblock-put,
  .swagger-ui .opblock.opblock-patch {
    border-color: #facc15 !important;
    background: #2a2312 !important;
  }

  .swagger-ui .opblock.opblock-delete {
    border-color: #f87171 !important;
    background: #2a1717 !important;
  }

  .swagger-ui table thead tr td,
  .swagger-ui table thead tr th {
    border-bottom: 1px solid #334155 !important;
    color: #cbd5e1 !important;
  }

  .swagger-ui table tbody tr td,
  .swagger-ui .parameters-col_description,
  .swagger-ui .parameter__name,
  .swagger-ui .parameter__type,
  .swagger-ui .response-col_status,
  .swagger-ui .response-col_description,
  .swagger-ui .prop-format,
  .swagger-ui .prop-type,
  .swagger-ui .prop-name,
  .swagger-ui .markdown p,
  .swagger-ui .markdown pre,
  .swagger-ui .markdown code,
  .swagger-ui .tab li,
  .swagger-ui .renderedMarkdown,
  .swagger-ui .renderedMarkdown p {
    color: #e8eef5 !important;
  }

  .swagger-ui .model,
  .swagger-ui .model span,
  .swagger-ui .model-toggle::after {
    color: #e8eef5 !important;
  }

  .swagger-ui .model .property {
    color: #93c5fd !important;
  }

  .swagger-ui .model .prop-type,
  .swagger-ui .model .prop-format {
    color: #fbbf24 !important;
  }

  .swagger-ui .highlight-code,
  .swagger-ui pre,
  .swagger-ui code {
    background: #0b1220 !important;
    color: #e8eef5 !important;
  }
`;

export function configureSwagger(app: INestApplication): void {
  const config = app.get(AppConfigService);

  if (!config.swaggerEnabled) {
    return;
  }

  setupSwaggerDocs(app);
}

export function setupSwaggerDocs(app: INestApplication): void {
  SwaggerModule.setup(
    SWAGGER_DOCS_PATH,
    app,
    () => createOpenApiDocument(app),
    {
      customCss: SWAGGER_CUSTOM_CSS,
      customSiteTitle: 'CBHI API Docs',
      jsonDocumentUrl: `${SWAGGER_DOCS_PATH}/openapi.json`,
      raw: ['json', 'yaml'],
      swaggerOptions: {
        docExpansion: 'none',
        displayRequestDuration: true,
        filter: true,
        operationsSorter: 'alpha',
        persistAuthorization: true,
        tagsSorter: 'alpha',
        tryItOutEnabled: true,
        // Avoid Swagger UI freezing on large JSON responses.
        syntaxHighlight: false,
      },
      useGlobalPrefix: false,
      yamlDocumentUrl: `${SWAGGER_DOCS_PATH}/openapi.yaml`,
    } satisfies SwaggerCustomOptions,
  );
}

export function createOpenApiDocument(app: INestApplication): OpenAPIObject {
  return SwaggerModule.createDocument(app, openApiConfig());
}

function openApiConfig() {
  return new DocumentBuilder()
    .setTitle('CBHI Backend API')
    .setDescription(
      'Community-Based Health Insurance (CBHI) backend API contracts.',
    )
    .setVersion('0.1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT access token from POST /api/auth/login',
      },
      'bearer',
    )
    .build();
}
