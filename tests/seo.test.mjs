import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pages,renderPage,buildSeo,pagePath,origin} from '../scripts/build-seo.mjs';
test('three unique server-readable landing pages, canonical URLs and truthful calls to action',()=>{
  assert.equal(new Set(pages.map(p=>p.title)).size,3);
  for(const p of pages){const html=renderPage(p);assert.equal((html.match(/<h1>/g)||[]).length,1);assert.ok(html.includes(`rel="canonical" href="${origin+pagePath(p)}"`));assert.ok(html.includes('href="/?tab=compte"'));assert.ok(html.includes('sans garantir'));assert.ok(html.includes('soumission à la modération'));assert.ok(!html.includes('noindex'));assert.ok(html.includes('type="button" data-sokile-cookies'));for(const q of pages)assert.ok(html.includes(`href="${pagePath(q)}"`));}
});
test('build emits static pages and a sitemap containing only intended public URLs',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'sokile-seo-'));
 try{await buildSeo(dir);const map=await readFile(join(dir,'sitemap.xml'),'utf8');assert.equal((map.match(/<url>/g)||[]).length,5);for(const p of pages){assert.ok(map.includes(origin+pagePath(p)));assert.equal(await readFile(join(dir,'professionnels',p.slug+'.html'),'utf8'),renderPage(p));}assert.ok(!map.includes('compte'));assert.ok(!map.includes('admin'));}finally{await rm(dir,{recursive:true});}
});
