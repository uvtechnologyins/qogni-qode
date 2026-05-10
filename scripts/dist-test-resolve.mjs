/**
 * Minimal Node.js import hook for running tests from dist-test/.
 *
 * esbuild with bundle:false preserves import specifiers verbatim, so compiled
 * .js files still import '../foo.ts'. This hook redirects those to '.js' so
 * Node can find the compiled output.
 *
 * Also redirects @gsd bare imports to their compiled counterparts in dist-test.
 */

import { fileURLToPath, pathToFileURL } from 'node:url';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

// Compiled legacy state tests exercise markdown derivation through deriveState().
// Production/runtime keeps this fallback disabled unless explicitly requested.
process.env.GSD_ALLOW_MARKDOWN_DERIVE_FALLBACK ??= '1';

// dist-test root — everything compiled lands here
const DIST_TEST = new URL('../dist-test/', import.meta.url).href;

// Absolute paths to compiled @gsd/* entry points
const GSD_ALIASES = {
  '@gsd/pi-coding-agent': new URL('../dist-test/packages/pi-coding-agent/src/index.js', import.meta.url).href,
  '@gsd/pi-ai/oauth':     new URL('../dist-test/packages/pi-ai/src/utils/oauth/index.js', import.meta.url).href,
  '@gsd/pi-ai':           new URL('../dist-test/packages/pi-ai/src/index.js', import.meta.url).href,
  '@gsd/pi-agent-core':   new URL('../dist-test/packages/pi-agent-core/src/index.js', import.meta.url).href,
  '@gsd/pi-tui':          new URL('../dist-test/packages/pi-tui/src/index.js', import.meta.url).href,
  '@gsd/native':          new URL('../dist-test/packages/native/src/index.js', import.meta.url).href,
};

function splitSpecifierSuffix(specifier) {
  const queryIndex = specifier.indexOf('?');
  const hashIndex = specifier.indexOf('#');
  const cutIndex = queryIndex === -1
    ? hashIndex
    : hashIndex === -1
      ? queryIndex
      : Math.min(queryIndex, hashIndex);
  if (cutIndex === -1) return { base: specifier, suffix: '' };
  return { base: specifier.slice(0, cutIndex), suffix: specifier.slice(cutIndex) };
}

function isAbsolutePathSpecifier(specifier) {
  return (
    specifier.startsWith('/') ||
    /^[A-Za-z]:[\\/]/.test(specifier) // Windows drive letter
  );
}

function isWithinDistTestUrl(urlString) {
  return typeof urlString === 'string' && urlString.startsWith(DIST_TEST);
}

function isWithinDistTestPath(pathString) {
  if (typeof pathString !== 'string') return false;
  const distTestPath = fileURLToPath(DIST_TEST);
  return pathString.startsWith(distTestPath);
}

export function resolve(specifier, context, nextResolve) {
  // 1. @gsd/* bare imports → compiled dist-test counterpart
  if (specifier in GSD_ALIASES) {
    return nextResolve(GSD_ALIASES[specifier], context);
  }

  // 2. .ts imports inside dist-test → .js
  //    Handles:
  //    - relative specifiers (./foo.ts, ../foo.ts)
  //    - cache-busting query strings (../foo.ts?ts=123)
  //    - file URLs (file:///.../foo.ts)
  //    - absolute paths (/.../foo.ts)
  const { base, suffix } = splitSpecifierSuffix(specifier);
  if (base.endsWith('.ts')) {
    const parentInDistTest = isWithinDistTestUrl(context.parentURL);
    const baseIsRel = base.startsWith('./') || base.startsWith('../');
    const baseIsFileUrl = base.startsWith('file:');
    const baseIsAbsPath = isAbsolutePathSpecifier(base);

    let baseInDistTest = false;
    if (baseIsFileUrl) {
      baseInDistTest = isWithinDistTestPath(fileURLToPath(base));
    } else if (baseIsAbsPath) {
      baseInDistTest = isWithinDistTestPath(base);
    }

    if ((parentInDistTest && baseIsRel) || baseInDistTest) {
      const jsBase = base.slice(0, -3) + '.js';
      return nextResolve(jsBase + suffix, context);
    }
  }

  return nextResolve(specifier, context);
}
