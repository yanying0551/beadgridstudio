import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const productionOrigin = 'https://beadgridstudio.pages.dev';

function projectFile(path: string) {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('production SEO origin', () => {
  it('uses the live Pages origin for every public absolute URL', () => {
    const files = [
      'index.html',
      'privacy/index.html',
      'terms/index.html',
      'public/sitemap.xml',
      'public/robots.txt',
    ];

    for (const file of files) {
      const contents = projectFile(file);
      expect(contents, file).not.toContain('https://beadgrid.studio');
    }

    expect(projectFile('index.html')).toContain(`${productionOrigin}/`);
    expect(projectFile('privacy/index.html')).toContain(`${productionOrigin}/privacy/`);
    expect(projectFile('terms/index.html')).toContain(`${productionOrigin}/terms/`);
    expect(projectFile('public/sitemap.xml')).toContain(`${productionOrigin}/privacy/`);
    expect(projectFile('public/sitemap.xml')).toContain(`${productionOrigin}/terms/`);
    expect(projectFile('public/robots.txt')).toContain(`${productionOrigin}/sitemap.xml`);
  });

  it('publishes the social preview image referenced by Open Graph metadata', () => {
    expect(existsSync(resolve(process.cwd(), 'public/og-image.png'))).toBe(true);
  });
});
