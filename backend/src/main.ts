import 'reflect-metadata';
import { createApplication } from './bootstrap/create-application';
import { configureApplication } from './bootstrap/configure-application';
import { startApplication } from './bootstrap/start-application';

async function bootstrap(): Promise<void> {
  const app = await createApplication();
  await configureApplication(app);
  await startApplication(app);
}

void bootstrap();
