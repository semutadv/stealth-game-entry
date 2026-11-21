// main.ts — submission entry point for The Lantern Archive.
// Node 22, standard library only, no network at run time.
// Copies game/ and screenshots/ from the repo root into the output
// directory, then writes out/dossier.json from buildDossier.
//
// The grader's /output is a mount point: NEVER delete the output
// directory itself (rmSync(out, {recursive:true}) throws EBUSY and
// fails run_completes). Clear its CONTENTS instead.
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = dirname(fileURLToPath(import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const caps = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

// Pre-flight: the dossier is meaningless without the game and its shots.
for (const needed of ['game', 'screenshots']) {
  if (!existsSync(join(repoRoot, needed))) {
    throw new Error(`missing ${needed}/ in ${repoRoot} — build the game first`);
  }
}

function countFiles(dir) {
  let n = 0;
  for (const child of readdirSync(dir, { withFileTypes: true })) {
    n += child.isDirectory() ? countFiles(join(dir, child.name)) : 1;
  }
  return n;
}

if (!existsSync(out)) mkdirSync(out, { recursive: true });
// Clear the CONTENTS of the output directory, never the directory itself.
for (const child of readdirSync(out)) {
  rmSync(join(out, child), { recursive: true, force: true });
}

cpSync(join(repoRoot, 'game'), join(out, 'game'), { recursive: true });
cpSync(join(repoRoot, 'screenshots'), join(out, 'screenshots'), { recursive: true });

const dossier = buildDossier(out, caps);
writeFileSync(join(out, 'dossier.json'), dossier);
console.log(
  `dossier written: ${join(out, 'dossier.json')} (${dossier.length} bytes, ` +
  `${countFiles(join(out, 'game'))} game files, ` +
  `${readdirSync(join(out, 'screenshots')).length} screenshots)`,
);
