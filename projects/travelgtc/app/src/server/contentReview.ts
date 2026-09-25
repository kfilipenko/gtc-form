import { constants } from 'node:fs';
import { open } from 'node:fs/promises';
import { join } from 'node:path';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

const base = '/api/travelgtc/v1/crm/content-review/pilot-20260922';
const files: Record<string, string> = {
  'need-a.png': 'image/png',
  'need-b.png': 'image/png',
  'need-c.png': 'image/png',
  'travelgtc-pilot-video.mp4': 'video/mp4',
  'travelgtc-pilot-voice.mp3': 'audio/mpeg',
  'travelgtc-pilot.srt': 'application/x-subrip',
  'travelgtc-pilot.vtt': 'text/vtt; charset=utf-8',
  'travelgtc-pilot-transcript.json': 'application/json; charset=utf-8',
  'PILOT-REPORT.md': 'text/plain; charset=utf-8',
  'calendar-14-days.md': 'text/plain; charset=utf-8',
};

const testTypes: Record<string, string> = {
  mp4: 'video/mp4', mp3: 'audio/mpeg', wav: 'audio/wav',
  png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp',
  srt: 'application/x-subrip', vtt: 'text/vtt; charset=utf-8',
  md: 'text/plain; charset=utf-8', txt: 'text/plain; charset=utf-8',
  json: 'application/json; charset=utf-8',
};
const testFilename = /^test-[a-z0-9-]{1,64}--[a-zA-Z0-9][a-zA-Z0-9_.-]{0,120}\.(mp4|mp3|wav|png|jpg|webp|srt|vtt|md|txt|json)$/;

async function readTestResults(directory: string): Promise<any[]> {
  let file;
  try { file = await open(join(directory, 'test-results.json'), constants.O_RDONLY | constants.O_NOFOLLOW); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw error;
  }
  try {
    const stat = await file.stat();
    if (!stat.isFile() || stat.size > 1048576) throw new Error('Invalid test catalog');
    const data = JSON.parse(await file.readFile('utf8'));
    if (data.schema_version !== 1 || !Array.isArray(data.tests)) throw new Error('Invalid test catalog');
    return data.tests;
  } finally { await file.close(); }
}

function byteRange(value: string, size: number): [number, number] | null {
  const match = /^bytes=(\d*)-(\d*)$/.exec(value);
  if (!match || (!match[1] && !match[2]) || !size) return null;
  const first = match[1] ? Number(match[1]) : null;
  const last = match[2] ? Number(match[2]) : null;
  if ([first, last].some((v) => v !== null && !Number.isSafeInteger(v))) return null;
  if (first === null) return last && last > 0 ? [Math.max(0, size - last), size - 1] : null;
  if (first >= size || (last !== null && last < first)) return null;
  return [first, Math.min(last ?? size - 1, size - 1)];
}

export function registerContentReview(app: FastifyInstance, options: {
  directory: string;
  authorize: (request: FastifyRequest) => Promise<unknown>;
  onAuthError: (error: unknown, request: FastifyRequest, reply: FastifyReply) => unknown;
  allowedOrigins: string[];
}) {
  async function protect(request: FastifyRequest, reply: FastifyReply) {
    reply.headers({
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
      'X-Robots-Tag': 'noindex, nofollow, noarchive',
      'Cross-Origin-Resource-Policy': 'same-origin',
      'Vary': 'Origin, Cookie',
    });
    if ((request.headers.origin && !options.allowedOrigins.includes(request.headers.origin)) ||
        request.headers['sec-fetch-site'] === 'cross-site') {
      return reply.code(403).send({ ok: false, error: { code: 'review_origin_denied' } });
    }
    try { await options.authorize(request); }
    catch (error) { return options.onAuthError(error, request, reply); }
  }

  app.get(base, { preHandler: protect }, async (_request, reply) => {
    try {
      const file = await open(join(options.directory, 'review.json'), constants.O_RDONLY | constants.O_NOFOLLOW);
      try {
        if (!(await file.stat()).isFile()) throw new Error('Not a file');
        const review = JSON.parse(await file.readFile('utf8'));
        return reply.send({ ok: true, review: { ...review, test_results: await readTestResults(options.directory) } });
      } finally { await file.close(); }
    } catch {
      return reply.code(503).send({ ok: false, error: { code: 'review_unavailable', message: 'Материалы временно недоступны.' } });
    }
  });

  app.get<{ Params: { filename: string } }>(`${base}/files/:filename`, { preHandler: protect }, async (request, reply) => {
    const name = request.params.filename;
    let contentType = Object.hasOwn(files, name) ? files[name] : undefined;
    if (!contentType && testFilename.test(name)) {
      try {
        const tests = await readTestResults(options.directory);
        const listed = tests.some((test) => test && Array.isArray(test.files) &&
          test.files.some((asset: { file?: string } | null) => asset?.file === name));
        if (listed) contentType = testTypes[name.split('.').pop()!];
      } catch { return reply.code(503).send({ ok: false }); }
    }
    if (!contentType) return reply.code(404).send({ ok: false });
    let file;
    try { file = await open(join(options.directory, name), constants.O_RDONLY | constants.O_NOFOLLOW); }
    catch { return reply.code(404).send({ ok: false }); }
    try {
      const stat = await file.stat();
      if (!stat.isFile()) { await file.close(); return reply.code(404).send({ ok: false }); }
      const range = request.headers.range && !request.headers['if-range']
        ? byteRange(request.headers.range, stat.size) : undefined;
      if (range === null) {
        await file.close();
        return reply.code(416).header('Content-Range', `bytes */${stat.size}`).send();
      }
      reply.type(contentType).header('Accept-Ranges', 'bytes');
      if (name.endsWith('.md') || name.endsWith('.srt') || name.endsWith('.json')) {
        reply.header('Content-Disposition', `attachment; filename="${name}"`);
      }
      if (range) {
        reply.code(206).header('Content-Range', `bytes ${range[0]}-${range[1]}/${stat.size}`)
          .header('Content-Length', range[1] - range[0] + 1);
      } else reply.header('Content-Length', stat.size);
      return reply.send(file.createReadStream(range ? { start: range[0], end: range[1] } : {}));
    } catch {
      await file.close().catch(() => {});
      return reply.code(404).send({ ok: false });
    }
  });
}
