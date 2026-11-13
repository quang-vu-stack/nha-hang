import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import {
  installUserStools,
  shouldTriggerReceptionGreeting,
  GREETING_COOLDOWN_MS,
} from '../src/restaurant-media.mjs';
import {
  RESTAURANT_ZONES,
  computeGuestVisualState,
} from '../src/world/hanoi-scene.mjs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const media = readFileSync(new URL('../src/restaurant-media.mjs', import.meta.url), 'utf8');
const gitignore = readFileSync(new URL('../.gitignore', import.meta.url), 'utf8');

test('3D loader has a consistent Three.js import map', () => {
  assert.match(html, /<script type="importmap">/);
  assert.match(html, /"three\/addons\/"/);
  assert.match(html, /import \* as THREE from 'three'/);
});

test('game loads optional Blender stools and keeps fallback seats when GLB is absent', async () => {
  assert.match(html, /installUserStools\(\{scene,THREE,tables,fallbackStools/);
  assert.match(html, /fallbackStools\.push\(/);
  assert.match(media, /ghe-nhua\.glb/);
  assert.match(media, /oldSeat\.visible = false/);
  assert.match(media, /return false/);

  // Test fallback when GLB fails to load
  const fallbackSeats = [{ visible: true }, { visible: true }];
  const fakeScene = { userData: {}, added: [], add(obj) { this.added.push(obj); } };
  const failedResult = await installUserStools({
    scene: fakeScene,
    THREE: {},
    tables: [[-81, 15]],
    fallbackStools: fallbackSeats,
    loader: { loadAsync: async () => { throw new Error('404 Not Found'); } },
  });
  assert.equal(failedResult, false);
  assert.equal(fallbackSeats[0].visible, true, 'procedural stool stays visible on GLB error');

  // Test success when Blender GLB loads
  const mockSeatTemplate = {
    scale: { val: 1, setScalar(v) { this.val = v; } },
    position: { x: 0, y: 0, z: 0, set(x, y, z) { this.x = x; this.y = y; this.z = z; } },
    clone() {
      return {
        scale: { val: 1, setScalar(v) { this.val = v; } },
        position: { x: 0, y: 0, z: 0, set(x, y, z) { this.x = x; this.y = y; this.z = z; } },
      };
    },
  };
  const mockTHREE = {
    Vector3: class { constructor() { this.x = 0.34; this.y = 0.463; this.z = 0.34; } },
    Box3: class {
      setFromObject() { this.min = { y: 0 }; return this; }
      isEmpty() { return false; }
      getSize(v) { v.x = 0.34; v.y = 0.463; v.z = 0.34; return v; }
    },
    Group: class {
      constructor() { this.name = ''; this.children = []; }
      add(c) { this.children.push(c); }
    },
  };
  const okResult = await installUserStools({
    scene: fakeScene,
    THREE: mockTHREE,
    tables: [[-81, 15], [-74.7, 15]],
    fallbackStools: fallbackSeats,
    loader: { loadAsync: async () => ({ scene: mockSeatTemplate }) },
  });
  assert.equal(okResult, true);
  assert.equal(fallbackSeats[0].visible, false, 'procedural stool hidden when Blender GLB succeeds');
  assert.equal(fakeScene.added[0].children.length, 4, '2 Blender stools spawned per table');
});

test('NPC greeting is initiated by a button (not autoplay) and triggers at reception desk with cooldown', () => {
  assert.match(html, /id="greetNpc"/);
  assert.match(html, /installNpcGreeting\(/);
  assert.match(media, /button\.addEventListener\('click'/);
  assert.doesNotMatch(media, /audio\.autoplay\s*=\s*true/);
  assert.match(media, /speechSynthesis/);

  const state = { enabled: false, lastPlayedAt: -Infinity, wasInsideReception: false };
  const reception = RESTAURANT_ZONES.reception;

  // 1. Player walks to reception while sound is NOT enabled -> must NOT play
  assert.equal(
    shouldTriggerReceptionGreeting(state, { x: reception.x, z: reception.z }, reception, 1000),
    false,
    'does not play before user enables sound'
  );

  // 2. User enables sound and walks away, then approaches reception at t = 20000ms -> plays!
  state.enabled = true;
  state.lastPlayedAt = 1000;
  state.wasInsideReception = false;
  assert.equal(
    shouldTriggerReceptionGreeting(state, { x: reception.x + 1, z: reception.z }, reception, 20000),
    true,
    'triggers greeting when player approaches reception after enabling sound'
  );

  // 3. Player stays at or re-approaches reception 3 seconds later (t = 23000ms < 20000 + 15000ms) -> blocked by cooldown!
  state.wasInsideReception = false;
  assert.equal(
    shouldTriggerReceptionGreeting(state, { x: reception.x + 1, z: reception.z }, reception, 23000),
    false,
    'cooldown prevents repeated greeting within 15 seconds'
  );

  // 4. After cooldown expires (t = 20000 + GREETING_COOLDOWN_MS + 100), approaching reception triggers again
  state.wasInsideReception = false;
  assert.equal(
    shouldTriggerReceptionGreeting(
      state,
      { x: reception.x, z: reception.z },
      reception,
      20000 + GREETING_COOLDOWN_MS + 100
    ),
    true,
    'greeting allowed again after cooldown expires'
  );
});

test('3D customer visual state synchronizes with ordering, eating, and cashier payment', () => {
  const tables = [[-81, 15], [-74.7, 15]];
  const queuedVis = computeGuestVisualState({ id: 1, table: 0, status: 'queued', dishName: 'Nem rán Hà Nội' }, tables);
  assert.equal(queuedVis.showFoodOnTable, false);
  assert.equal(queuedVis.atCashier, false);

  const eatingVis = computeGuestVisualState({ id: 1, table: 0, status: 'eating', dishName: 'Nem rán Hà Nội' }, tables);
  assert.equal(eatingVis.showFoodOnTable, true, '3D food & beer props visible on table during eating');
  assert.equal(eatingVis.atCashier, false);

  const payingVis = computeGuestVisualState({ id: 1, table: 0, status: 'paying', dishName: 'Nem rán Hà Nội' }, tables);
  assert.equal(payingVis.showFoodOnTable, false, 'table cleared when guest moves to cashier');
  assert.equal(payingVis.atCashier, true, 'guest walks to cashier counter to pay');
});

test('Blender GLB stool binary header and .gitignore audio protection are valid', () => {
  const glb = readFileSync(new URL('../assets/models/ghe-nhua.glb', import.meta.url));
  assert.equal(glb.toString('utf8', 0, 4), 'glTF');
  assert.equal(glb.readUInt32LE(4), 2, 'glTF 2.0 format');
  assert.ok(glb.length > 1000 && glb.length < 50000, 'lightweight low-poly GLB');
  assert.match(gitignore, /npc-greeting-vien\.mp3/);
});

test('media integration JavaScript parses without runtime imports', () => {
  const result = spawnSync(process.execPath, ['--check', 'src/restaurant-media.mjs'], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
});
