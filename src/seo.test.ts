import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const productionOrigin = 'https://bead-grid-studio.pages.dev';

function projectFile(path: string) {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

function attributes(tag: string): Record<string, string> {
  const result: Record<string, string> = {};

  for (const match of tag.matchAll(/([:\w-]+)\s*=\s*(["'])(.*?)\2/g)) {
    const name = match[1];
    const value = match[3];
    if (name !== undefined && value !== undefined) {
      result[name.toLowerCase()] = value;
    }
  }

  return result;
}

function tags(contents: string, name: string) {
  return [...contents.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'gi'))].map((match) => ({
    source: match[0],
    attributes: attributes(match[0]),
  }));
}

function canonicalUrls(contents: string) {
  return tags(contents, 'link')
    .filter((tag) => tag.attributes.rel?.toLowerCase().split(/\s+/).includes('canonical'))
    .map((tag) => tag.attributes.href);
}

function openGraphUrls(contents: string, property: string) {
  return tags(contents, 'meta')
    .filter((tag) => tag.attributes.property?.toLowerCase() === property)
    .map((tag) => tag.attributes.content);
}

describe('production SEO origin', () => {
  it('uses only the live Pages origin for public SEO URLs', () => {
    const home = projectFile('index.html');
    const privacy = projectFile('privacy/index.html');
    const terms = projectFile('terms/index.html');

    expect(openGraphUrls(home, 'og:url')).toEqual([`${productionOrigin}/`]);
    expect(openGraphUrls(home, 'og:image')).toEqual([`${productionOrigin}/og-image.png`]);
    expect(canonicalUrls(home)).toEqual([`${productionOrigin}/`]);
    expect(canonicalUrls(privacy)).toEqual([`${productionOrigin}/privacy/`]);
    expect(canonicalUrls(terms)).toEqual([`${productionOrigin}/terms/`]);

    const appUrls = [...home.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)]
      .flatMap((match) => {
        const openingAttributes = match[1];
        const body = match[2];
        return openingAttributes !== undefined && body !== undefined
          ? [{ openingAttributes, body }]
          : [];
      })
      .filter(
        ({ openingAttributes }) =>
          attributes(openingAttributes).type?.toLowerCase() === 'application/ld+json',
      )
      .map(({ body }) => JSON.parse(body) as unknown)
      .filter(
        (entry): entry is Record<string, unknown> =>
          typeof entry === 'object' &&
          entry !== null &&
          (entry as Record<string, unknown>)['@type'] === 'WebApplication',
      )
      .map((entry) => entry.url);
    expect(appUrls).toEqual([`${productionOrigin}/`]);

    const sitemapUrls = [
      ...projectFile('public/sitemap.xml').matchAll(/<loc\b[^>]*>\s*([^<]*?)\s*<\/loc\s*>/gi),
    ].map((match) => match[1]);
    expect(sitemapUrls).toEqual([
      `${productionOrigin}/`,
      `${productionOrigin}/privacy/`,
      `${productionOrigin}/terms/`,
    ]);

    const sitemapDirectives = [
      ...projectFile('public/robots.txt').matchAll(/^\s*sitemap\s*:\s*(\S+)\s*$/gim),
    ].map((match) => match[1]);
    expect(sitemapDirectives).toEqual([`${productionOrigin}/sitemap.xml`]);
  });

  it('publishes the social preview image referenced by Open Graph metadata', () => {
    expect(existsSync(resolve(process.cwd(), 'public/og-image.png'))).toBe(true);
  });
});
