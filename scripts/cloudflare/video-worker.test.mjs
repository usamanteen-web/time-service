import {test} from 'node:test';
import assert from 'node:assert/strict';
import worker from './video-worker.mjs';
const data = new TextEncoder().encode('0123456789');
const metadata = {size: 10, httpEtag: '"video-v1"', uploaded: new Date('2026-09-29T00:00:00Z'), writeHttpMetadata() {}};
const env = {ASSETS: {fetch: async () => new Response('static')}, MEDIA: {
  head: async () => metadata,
  get: async (_, options) => ({...metadata, body: options?.range ? data.slice(options.range.offset, options.range.offset + options.range.length) : data}),
}};
const url = 'https://example.com/videos/jiuli/hero-scroll-540.mp4';
for (const [range, status, expected] of [['bytes=0-0',206,'0'],['bytes=3-6',206,'3456'],['bytes=7-',206,'789'],['bytes=-3',206,'789'],['bytes=8-99',206,'89'],['bytes=10-',416,''],['bytes=5-2',416,''],['bytes=-0',416,'']]) {
  test(range, async () => {
    const response = await worker.fetch(new Request(url,{headers:{Range:range}}),env);
    assert.equal(response.status,status);
    assert.equal(await response.text(),expected);
    if(status===206) assert.equal(response.headers.get('Content-Length'), String(expected.length));
  });
}
test('HEAD reports complete length without body',async()=>{const r=await worker.fetch(new Request(url,{method:'HEAD'}),env);assert.equal(r.headers.get('Content-Length'),'10');assert.equal(await r.text(),'');});
test('stale If-Range returns complete representation',async()=>{const r=await worker.fetch(new Request(url,{headers:{Range:'bytes=0-0','If-Range':'"old"'}}),env);assert.equal(r.status,200);assert.equal(await r.text(),'0123456789');});
test('etag revalidation',async()=>{assert.equal((await worker.fetch(new Request(url,{headers:{'If-None-Match':'"video-v1"'}}),env)).status,304);});
test('other routes remain static',async()=>{assert.equal(await (await worker.fetch(new Request('https://example.com/about/'),env)).text(),'static');});
test('R2 unavailable falls back to bundled video',async()=>{assert.equal(await (await worker.fetch(new Request(url),{...env,MEDIA:{head:async()=>{throw Error('unavailable');}}})).text(),'static');});
test('uploads forbidden',async()=>{assert.equal((await worker.fetch(new Request(url,{method:'PUT'}),env)).status,405);});
