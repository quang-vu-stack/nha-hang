import test from 'node:test';
import assert from 'node:assert/strict';
import { createState, advanceSimulation, serializeSave, deserializeSave } from '../src/simulation.mjs';
import { nearbyOwnerAction, performOwnerAction } from '../src/owner-interaction.mjs';
import { RESTAURANT_ZONES } from '../src/world/hanoi-scene.mjs';

const tables = [[-81, 15]];
function readyOrder() {
  const state = createState();
  state.open = false;
  state.orders = [{ id: 1, table: 0, customer: 'Lan', dishName: 'Nem rán', status: 'serving', remaining: 4, eatMinutes: 8, total: 95000, paid: false }];
  return state;
}

test('owner serves within reach, pays once and survives reload between phases', () => {
  let state = readyOrder();
  assert.equal(performOwnerAction(state, { x: 0, z: 0 }, tables), null);
  const stock = state.stock;
  const cash = state.cash;
  assert.equal(performOwnerAction(state, { x: -81, z: 15 }, tables).action, 'serve');
  assert.equal(performOwnerAction(state, { x: -81, z: 15 }, tables), null);
  assert.equal(state.stock, stock);
  state = deserializeSave(serializeSave(state)).state;
  advanceSimulation(state, 8);
  assert.equal(state.orders[0].status, 'paying');
  assert.equal(performOwnerAction(state, RESTAURANT_ZONES.cashier, tables).action, 'pay');
  assert.equal(performOwnerAction(state, RESTAURANT_ZONES.cashier, tables), null);
  advanceSimulation(state, 20);
  assert.equal(state.cash, cash + 95000);
  assert.equal(state.served, 1);
});

test('automatic completion invalidates a previously offered owner action', () => {
  const state = readyOrder();
  assert.ok(nearbyOwnerAction(state, { x: -81, z: 15 }, tables));
  advanceSimulation(state, 4);
  assert.equal(performOwnerAction(state, { x: -81, z: 15 }, tables), null);
});

test('saved view is restored and old or invalid view data gets safe defaults', () => {
  const state = createState();
  state.playerView = { x: -75, z: 20, yaw: 1.2, zoom: 30 };
  assert.deepEqual(deserializeSave(serializeSave(state)).state.playerView, state.playerView);
  assert.deepEqual(createState({}).playerView, { x: -50, z: 14, yaw: 0.7, zoom: 24 });
  const invalid = createState({ playerView: { x: Infinity, z: 'bad', yaw: null, zoom: -12 } });
  assert.deepEqual(invalid.playerView, { x: -50, z: 14, yaw: 0.7, zoom: 11 });
});
