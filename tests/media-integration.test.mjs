import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const media=readFileSync(new URL('../src/restaurant-media.mjs',import.meta.url),'utf8');

test('3D loader has a consistent Three.js import map', () => {
  assert.match(html, /<script type="importmap">/);
  assert.match(html, /"three\/addons\/"/);
  assert.match(html, /import \* as THREE from 'three'/);
});
test('game loads optional Blender stools and keeps V0.2 fallback seats', () => {
  assert.match(html, /installUserStools\(\{scene,THREE,tables,fallbackStools/);
  assert.match(html, /fallbackStools\.push\(/);
  assert.match(media, /ghe-nhua\.glb/);
  assert.match(media, /oldSeat\.visible = false/);
  assert.match(media, /return false/);
});
test('NPC greeting is initiated by a button, not autoplay', () => {
  assert.match(html, /id="greetNpc"/);
  assert.match(html, /installNpcGreeting\(/);
  assert.match(media, /button\.addEventListener\('click'/);
  assert.doesNotMatch(media, /audio\.autoplay\s*=\s*true/);
  assert.match(media, /speechSynthesis/);
});
test('media integration JavaScript parses without runtime imports', () => {
  const result=spawnSync(process.execPath,['--check','src/restaurant-media.mjs'],{encoding:'utf8'});
  assert.equal(result.status,0,result.stderr);
});
