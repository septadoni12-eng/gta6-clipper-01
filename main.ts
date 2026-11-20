// gta6-clipper-01 — entrypoint (Node 22+, standard library only).
//
// The entry is the video itself: this program's only job is to hand the house
// the video's address. It copies VIDEO.json from the repository root into the
// output directory, byte for byte, so the gate can read it there.
//
// Grader-style run:
//   mkdir -p out && MAKEFUN_BOT_DIR=. MAKEFUN_OUTPUT_DIR=out node main.ts
//
// No network, no wall clock, no files outside the repository; two runs write
// the same bytes.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const botDir = process.env.MAKEFUN_BOT_DIR ?? '/bot';
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const sourcePath = join(botDir, 'VIDEO.json');
const targetPath = join(outputDir, 'VIDEO.json');

let payload: Buffer;
try {
  payload = readFileSync(sourcePath);
} catch (err) {
  console.error(`cannot read ${sourcePath}: ${(err as Error).message}`);
  process.exit(1);
}

// Fail loudly on a malformed address file instead of shipping bad bytes.
function assertVideoAddress(text: string): void {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    throw new Error(`not valid JSON: ${(err as Error).message}`);
  }
  if (typeof parsed !== 'object' || parsed === null || typeof (parsed as { url?: unknown }).url !== 'string') {
    throw new Error('VIDEO.json must be a JSON object with a string "url"');
  }
  // The gate only accepts a YouTube video address; refuse anything else here
  // so a typo never reaches the house as a silent invalid entry.
  const url = (parsed as { url: string }).url;
  if (!/^https:\/\/(www\.|m\.)?(youtube\.com\/(shorts\/|watch\?v=)|youtu\.be\/)[A-Za-z0-9_-]{11}/.test(url)) {
    throw new Error(`"url" is not a YouTube video address: ${url}`);
  }
}

try {
  assertVideoAddress(payload.toString('utf8'));
} catch (err) {
  console.error(`VIDEO.json is not valid: ${(err as Error).message}`);
  process.exit(1);
}

mkdirSync(outputDir, { recursive: true });
writeFileSync(targetPath, payload);
