import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {root} from './preview.mjs';

function walk(dir) {
  return fs.readdirSync(dir, {withFileTypes:true}).flatMap(entry => {
    if (entry.name.startsWith('.') || ['node_modules','scripts','docs'].includes(entry.name)) return [];
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(file) : [file];
  });
}
const pages = walk(root).filter(file => file.endsWith('.html'));
const read = file => fs.readFileSync(file, 'utf8');
const documents = new Map(pages.map(file => [file, read(file)]));
let links = 0;
for (const [file, html] of documents) {
  const name = path.relative(root, file);
  assert.equal((html.match(/<h1\b/g) || []).length, 1, `${name}: one h1`);
  assert.equal((html.match(/<main\b/g) || []).length, 1, `${name}: one main`);
  assert.match(html, /<title>[^<]+<\/title>/, `${name}: title`);
  assert.match(html, /name="description"/, `${name}: description`);
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(ids).size, ids.length, `${name}: duplicate ids`);
  for (const match of html.matchAll(/aria-(?:labelledby|describedby|controls)="([^"]+)"/g)) {
    for (const id of match[1].split(/\s+/)) assert(ids.includes(id), `${name}: missing ARIA #${id}`);
  }
  for (const match of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
    const href = match[1].replaceAll('&amp;', '&');
    if (/^(?:[a-z]+:|\/\/)/i.test(href)) continue;
    const url = new URL(href, 'https://saaddigital.co.za/' + name.replaceAll(path.sep, '/'));
    let target = path.join(root, decodeURIComponent(url.pathname));
    if (fs.existsSync(target) && fs.statSync(target).isDirectory()) target = path.join(target, 'index.html');
    assert(fs.existsSync(target), `${name}: missing ${href}`);
    if (url.hash && documents.has(target)) assert(documents.get(target).includes(`id="${decodeURIComponent(url.hash.slice(1))}"`), `${name}: missing anchor ${href}`);
    links++;
  }
  assert(!/family (?:package|plan)|household (?:package|plan)/i.test(html), `${name}: outdated package`);
}
const homepage = read(path.join(root, 'index.html'));
for (const store of ['https://apps.apple.com/us/app/mivaro/id6802352751','https://play.google.com/store/apps/details?id=com.saaddigital.mivaro','https://apps.apple.com/us/app/splitmate-ai/id6781557810','https://play.google.com/store/apps/details?id=com.saaddigital.splitmateai']) assert(homepage.includes(store), 'Store link changed');
const sortbound = homepage.split('id="sortbound"')[1].split('</article>')[0];
assert.match(sortbound, /Coming next/);
assert(!/apps\.apple\.com|play\.google\.com/.test(sortbound), 'Sortbound must have no store buttons');
JSON.parse(read(path.join(root, '.well-known/apple-app-site-association')));
const sitemap = read(path.join(root, 'sitemap.xml'));
for (const file of ['sortbound-privacy.html','sortbound-terms.html','sortbound/delete-account/']) assert(sitemap.includes(`https://saaddigital.co.za/${file}`));
const deletionPath = '/sortbound/delete-account/';
const deletionPage = read(path.join(root, 'sortbound/delete-account/index.html'));
assert(deletionPage.includes(`rel="canonical" href="https://saaddigital.co.za${deletionPath}"`));
assert.match(deletionPage, /<title>Delete Your Sortbound Account \| Saad Digital<\/title>/);
const request = deletionPage.match(/id="request-account-deletion" href="([^"]+)"/);
assert(request, 'Missing prominent email request action');
const requestUrl = new URL(request[1].replaceAll('&amp;', '&'));
assert.equal(requestUrl.protocol, 'mailto:');
assert.equal(requestUrl.pathname, 'saaddigitalapps@gmail.com');
assert.equal(requestUrl.searchParams.get('subject'), 'Sortbound Account Deletion Request');
assert.equal(requestUrl.searchParams.size, 1, 'Request link must not include account information');
assert(!/<(?:form|input|iframe)\b/i.test(deletionPage), 'Deletion page must not collect credentials or submit destructive requests');
assert(deletionPage.includes("connect-src 'none'"), 'Information page must not contact a backend');
for (const file of ['sortbound/delete-account/index.html','sortbound-privacy.html','sortbound-terms.html','support.html']) {
  const html = read(path.join(root, file));
  assert(!/\b(?:90|365)[\s-]*(?:day|days)\b/i.test(html), `${file}: unapproved retention period`);
  for (const link of html.matchAll(/href="([^"]*sortbound\/delete-account[^"#]*)/g)) assert.equal(new URL(link[1], 'https://saaddigital.co.za').href, 'https://saaddigital.co.za/sortbound/delete-account/', `${file}: incorrect deletion route`);
}
assert.deepEqual([...deletionPage.matchAll(/<script\b[^>]*src="([^"]+)"/g)].map(match => match[1]), ['/script.js']);
for (const file of ['index.html','support.html','sortbound-privacy.html','sortbound-terms.html']) assert(read(path.join(root,file)).includes(`href="${deletionPath}"`), `${file}: deletion link missing`);
// Existing technical contracts must remain byte-equivalent (apart from CRLF).
const normalize = text => text.replaceAll('\r\n', '\n').trim();
const baseline = file => execFileSync('git', ['show', `HEAD:${file}`], {cwd:root,encoding:'utf8'});
for (const file of ['r/index.html','r/shared-reminder.js','styles.css','script.js','.well-known/apple-app-site-association','.nojekyll','CNAME','robots.txt','app-ads.txt']) assert.equal(normalize(read(path.join(root,file))), normalize(baseline(file)), `Protected infrastructure changed: ${file}`);
const support = read(path.join(root,'support.html'));
const beforeSortbound = html => html.split('<div class="support-section-heading" id="sortbound">')[0];
assert.equal(normalize(beforeSortbound(support)), normalize(beforeSortbound(baseline('support.html'))), 'Existing Mivaro/SplitMate support changed');
for (const file of ['mivaro-privacy.html','mivaro-terms.html','splitmate-privacy.html','splitmate-terms.html','mivaro/delete-account/index.html']) {
  const main = text => text.match(/<main\b[\s\S]*?<\/main>/)[0];
  assert.equal(normalize(main(read(path.join(root,file)))), normalize(main(baseline(file))), `Existing product legal content changed: ${file}`);
}
const share = read(path.join(root,'r/index.html'));
assert.equal(share.match(/http-equiv="Content-Security-Policy"[\s\S]*?\/>/)[0], baseline('r/index.html').match(/http-equiv="Content-Security-Policy"[\s\S]*?\/>/)[0]);
const recovery = text => text.match(/<script>[\s\S]*?<\/script>/)[0];
assert.equal(recovery(read(path.join(root,'404.html'))), recovery(baseline('404.html')));
console.log(`Passed: ${pages.length} HTML pages, ${links} local links/assets, metadata, headings, ARIA, store links, sitemap and protected infrastructure.`);
