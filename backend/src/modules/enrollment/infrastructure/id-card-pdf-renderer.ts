import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import type { Browser } from 'puppeteer';
import puppeteer from 'puppeteer';
import {
  buildIdCardSheetHtml,
  type IdCardRenderInput,
} from './id-card-html';

/**
 * Renders ID-card PDFs via a long-lived headless Chromium.
 * Browser is warmed once and reused so jobs avoid launch cost.
 * Runs only inside the BullMQ worker (concurrency=1), never on HTTP threads.
 */
@Injectable()
export class IdCardPdfRenderer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(IdCardPdfRenderer.name);
  private browser: Browser | null = null;
  private launchPromise: Promise<Browser> | null = null;

  onModuleInit() {
    // Warm Chromium in the background so the first print job is faster.
    void this.ensureBrowser().catch((error) => {
      this.logger.warn(
        `ID card Chromium warm-up failed (will retry on first job): ${
          error instanceof Error ? error.message : 'unknown'
        }`,
      );
    });
  }

  async onModuleDestroy() {
    const browser = this.browser;
    this.browser = null;
    this.launchPromise = null;
    if (browser) {
      await browser.close().catch(() => undefined);
    }
  }

  async renderSheet(cards: IdCardRenderInput[]): Promise<Buffer> {
    const html = buildIdCardSheetHtml(cards);
    const browser = await this.ensureBrowser();
    const page = await browser.newPage();

    try {
      await page.setContent(html, {
        waitUntil: 'domcontentloaded',
        timeout: 30_000,
      });
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: true,
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
      });
      return Buffer.from(pdf);
    } finally {
      await page.close().catch(() => undefined);
    }
  }

  private async ensureBrowser(): Promise<Browser> {
    if (this.browser?.connected) {
      return this.browser;
    }

    if (!this.launchPromise) {
      const executablePath =
        process.env.PUPPETEER_EXECUTABLE_PATH?.trim() || undefined;

      this.launchPromise = puppeteer
        .launch({
          headless: true,
          ...(executablePath ? { executablePath } : {}),
          args: [
            // Required in containerized hosts (Railway/Docker) without a sandbox user.
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--font-render-hinting=none',
          ],
        })
        .then((browser) => {
          this.browser = browser;
          this.logger.log(
            executablePath
              ? `ID card Chromium ready (executablePath=${executablePath})`
              : 'ID card Chromium ready (Puppeteer-managed Chrome)',
          );
          browser.on('disconnected', () => {
            this.browser = null;
            this.launchPromise = null;
          });
          return browser;
        })
        .catch((error) => {
          this.launchPromise = null;
          throw error;
        });
    }

    return this.launchPromise;
  }
}
