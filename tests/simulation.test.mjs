import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import {
  createState, advanceSimulation, activeOrders,
  isBusinessHour, npcActivity, npcPopulation, SIMULATION_VERSION,
  MENU, INGREDIENT_KEYS, countStaffByRole, hireStaffMember,
  restockIngredients, calculateProfit, updateCitizens,
  serializeSave, deserializeSave, saveGameState, loadGameState, SAVE_KEYS,
} from '../src/simulation.mjs';
import {
  BLENDER_ASSET_MANIFEST, validateAssetSpec, computeNpcLodTier,
} from '../src/world/asset-loader.mjs';
import {
  RESTAURANT_ZONES, resolvePlayerCollision,
  computeStaffTargetPosition, computeGuestTargetPosition,
} from '../src/world/hanoi-scene.mjs';

const rng = () => 0;

function createMockStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: k => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: k => map.delete(k),
    dump: () => Object.fromEntries(map.entries()),
  };
}

test('version and V0.1/V0.2 save migration are backwards compatible', () => {
  assert.equal(SIMULATION_VERSION, '0.3.0');
  const s = createState({ cash: 4000000, served: 10, day: 3, staff: 2, stock: 25 });
  assert.equal(s.cash, 4000000);
  assert.equal(s.day, 3);
  assert.equal(s.served, 10);
  assert.equal(s.orders.length, 0);
  assert.ok(s.nextVisitor >= 1);
  assert.equal(s.staffRoster.length, 2);
  assert.equal(s.stock, 25);
});

test('bad saves cannot create infinite time or negative table counts', () => {
  const s = createState({
    cash: 'oops',
    staff: -4,
    tables: -2,
    minute: Infinity,
    reputation: 400,
    orders: [{ id: 1, table: 999, status: 'queued' }],
  });
  assert.equal(s.tables, 1);
  assert.equal(s.staff, 1);
  assert.equal(s.reputation, 100);
  assert.equal(s.cash, 80000000);
  assert.equal(s.orders.length, 0);
});

test('citizens follow Hanoi daily routines and maintain individual life needs', () => {
  assert.equal(npcActivity('student', 480), 'work');
  assert.equal(npcActivity('worker', 8 * 60), 'commute');
  assert.equal(npcActivity('worker', 18 * 60), 'commute');
  assert.equal(npcActivity('student', 2 * 60), 'sleep');
  assert.equal(npcActivity('student', 19 * 60, { rain: true }), 'home');
  assert.ok(npcPopulation(18 * 60) > npcPopulation(2 * 60));

  const s = createState({ minute: 8 * 60 });
  assert.equal(s.citizens.length, 35);
  assert.ok(s.citizens[0].budget >= 100000);
  assert.ok(s.citizens[0].home && s.citizens[0].workplace);
  updateCitizens(s);
  assert.ok(s.citizens.some(c => c.activity === 'commute' || c.activity === 'work'));
});

test('restaurant only welcomes guests during business hours', () => {
  assert.equal(isBusinessHour(10 * 60), false);
  assert.equal(isBusinessHour(12 * 60), true);
  assert.equal(isBusinessHour(23 * 60), false);
  const s = createState({ minute: 23 * 60, nextVisitor: 1 });
  advanceSimulation(s, 1, rng);
  assert.equal(s.orders.length, 0);
});

test('customers seat, order dish from menu, cook, get served, eat, and pay at cashier', () => {
  const s = createState({ cash: 100000, stock: 8, minute: 12 * 60, nextVisitor: 1, tables: 1, staff: 3 });
  // Minute 1: Guest arrives, selects table & menu dish -> queued
  advanceSimulation(s, 1, rng);
  assert.equal(s.orders.length, 1);
  assert.equal(s.orders[0].status, 'queued');
  assert.ok(s.orders[0].dishName, 'order includes selected Vietnamese dish name');
  assert.equal(s.cash, 100000, 'no money collected on seating');

  // Minute 2: Chef starts cooking -> consumes 1 ingredient unit
  advanceSimulation(s, 1, rng);
  assert.equal(s.orders[0].status, 'cooking');
  assert.equal(s.stock, 7, 'one cooking order consumed one ingredient unit');
  assert.equal(s.cash, 100000, 'no money collected while cooking');

  // Advance through cooking (9m) -> serving begins
  advanceSimulation(s, 9, rng);
  assert.equal(s.orders[0].status, 'serving');
  assert.equal(s.cash, 100000, 'no money collected while waiter is serving');

  // Advance through serving (4m) -> eating begins
  advanceSimulation(s, 4, rng);
  assert.equal(s.orders[0].status, 'eating');
  assert.equal(s.cash, 100000, 'money is NOT earned before eating & paying');
  assert.ok(s.log.some(x => x.includes('nhận món')));

  // Advance through eating (8m) -> paying at cashier begins
  advanceSimulation(s, 8, rng);
  assert.equal(s.orders[0].status, 'paying');
  assert.equal(s.cash, 100000, 'money still not credited until cashier completes checkout');

  // Advance remaining 7 steps (total 9+4+8+7 = 28m) -> checkout completes -> cash & revenue recorded in VND
  advanceSimulation(s, 7, rng);
  assert.equal(s.orders[0].status, 'finished');
  assert.ok(s.orders[0].paid);
  assert.ok(s.served >= 1, 'at least one meal served');
  assert.ok(s.cash > 100000, 'money earned after paying at cashier');
  assert.equal(s.stock, 7, 'still 7 ingredient units');
  assert.ok(s.todayRevenue > 0);
  assert.ok(s.log.some(x => x.includes('thanh toán')));
});

test('multiple chefs can cook multiple queued orders in parallel', () => {
  const s = createState({
    cash: 5000000,
    stock: 20,
    minute: 12 * 60,
    tables: 4,
    staff: 4, // 2 chefs, 1 waiter, 1 cashier
    orders: [
      { id: 1, customer: 'Minh', table: 0, dishId: 'nem_ran', dishName: 'Nem rán Hà Nội', status: 'queued', remaining: 0, wait: 0, total: 115000 },
      { id: 2, customer: 'Lan', table: 1, dishId: 'bo_luc_lac', dishName: 'Bò lúc lắc khoai tây', status: 'queued', remaining: 0, wait: 0, total: 175000 },
    ],
  });
  advanceSimulation(s, 1, rng);
  const cookingOrders = s.orders.filter(o => o.status === 'cooking');
  assert.equal(cookingOrders.length, 2, '2 chefs cook 2 orders simultaneously');
  assert.equal(s.stock, 18, '2 ingredient units consumed');
});

test('queued order waiting over 70 minutes leaves and reduces reputation', () => {
  const s = createState({
    minute: 12 * 60,
    tables: 2,
    staff: 3,
    stock: 0, // no stock so chef cannot start cooking the queued order
    reputation: 50,
    nextVisitor: 500,
    orders: [
      { id: 1, customer: 'Hùng', table: 0, status: 'queued', remaining: 0, wait: 70, total: 100000 },
    ],
  });
  advanceSimulation(s, 1, rng);
  assert.equal(s.orders[0].status, 'finished');
  assert.equal(s.rejected, 1);
  assert.ok(s.reputation < 50);
  assert.ok(s.log.some(x => x.includes('rời quán do chờ lâu')));
});

test('independent chef, waiter, and cashier staff roles operate and can be hired', () => {
  const s = createState({ cash: 10000000, staff: 3, minute: 12 * 60, nextVisitor: 1, tables: 2 });
  const initialCounts = countStaffByRole(s);
  assert.equal(initialCounts.chef, 1);
  assert.equal(initialCounts.waiter, 1);
  assert.equal(initialCounts.cashier, 1);

  // Trigger an order and start cooking -> chef becomes busy
  advanceSimulation(s, 2, rng);
  const chef = s.staffRoster.find(m => m.role === 'chef');
  assert.equal(chef.status, 'busy');
  assert.equal(chef.orderId, s.orders[0].id);

  // Hire a new staff member
  const hired = hireStaffMember(s, 'waiter', 2000000);
  assert.ok(hired);
  assert.equal(hired.role, 'waiter');
  assert.equal(s.staff, 4);
  assert.equal(countStaffByRole(s).waiter, 2);
});

test('Vietnamese menu, ingredients inventory, revenue and net profit in VND', () => {
  assert.ok(MENU.length >= 5, 'menu has at least 5 Vietnamese dishes');
  for (const dish of MENU) {
    assert.ok(dish.price > dish.cost, `${dish.name} has positive gross margin in VND`);
    assert.ok(INGREDIENT_KEYS.includes(dish.ingredient));
  }

  const s = createState({ cash: 5000000, stock: 10, minute: 12 * 60, nextVisitor: 1, tables: 1, staff: 3 });
  advanceSimulation(s, 30, rng);
  assert.ok(s.todayRevenue > 0);
  assert.ok(s.todayIngredientCost > 0);
  assert.equal(s.todayProfit, s.todayRevenue - s.todayCosts - s.todayIngredientCost);
  assert.equal(calculateProfit(s), s.todayProfit);

  const prevStock = s.stock;
  const ok = restockIngredients(s, 50, 400000);
  assert.equal(ok, true);
  assert.equal(s.stock, prevStock + 50);
});

test('closing the restaurant prevents new guests', () => {
  const s = createState({ minute: 12 * 60, nextVisitor: 1, open: false });
  advanceSimulation(s, 55, rng);
  assert.equal(s.orders.length, 0);
  assert.equal(s.served, 0);
});

test('full tables reject extra arrivals', () => {
  const s = createState({
    minute: 12 * 60,
    nextVisitor: 1,
    tables: 1,
    orders: [{ id: 4, customer: 'Minh', table: 0, status: 'eating', remaining: 200, wait: 0, total: 100000 }],
  });
  advanceSimulation(s, 1, rng);
  assert.equal(activeOrders(s).length, 1);
  assert.equal(s.rejected, 1);
});

test('lack of ingredients rejects incoming customers and does not mint revenue', () => {
  const s = createState({ cash: 300000, stock: 0, minute: 12 * 60, nextVisitor: 1 });
  advanceSimulation(s, 1, rng);
  assert.equal(s.served, 0);
  assert.equal(s.cash, 300000);
  assert.equal(s.rejected, 1);
});

test('daily wages charged exactly on midnight rollover and daily report archived', () => {
  const s = createState({ cash: 2000000, minute: 1439, day: 4, staff: 4, nextVisitor: 100 });
  advanceSimulation(s, 1, rng);
  assert.equal(s.day, 5);
  assert.equal(s.minute, 0);
  assert.equal(s.todayCosts, 250000 + 4 * 160000);
  assert.equal(s.cash, 2000000 - (250000 + 4 * 160000));
  assert.equal(s.dailyReports.length, 1);
  assert.equal(s.dailyReports[0].day, 4);
});

test('save protection validates checksum and recovers from backup when primary save is corrupted', () => {
  const storage = createMockStorage();
  const s1 = createState({ cash: 91000000, day: 2, served: 14 });
  assert.equal(saveGameState(storage, s1), true);

  const s2 = createState({ cash: 95000000, day: 3, served: 25 });
  assert.equal(saveGameState(storage, s2), true);

  // Corrupt primary save with tampered JSON
  storage.setItem(SAVE_KEYS.primary, '{"format":"vietnam-life-3d-save","checksum":"deadbeef","state":{"cash":999999999}}');
  const recovered = loadGameState(storage);
  assert.equal(recovered.recovered, true);
  assert.equal(recovered.source, 'backup');
  assert.equal(recovered.state.cash, 91000000);
  assert.equal(recovered.state.day, 2);

  // Valid serialize/deserialize roundtrip
  const raw = serializeSave(s2);
  const parsed = deserializeSave(raw);
  assert.equal(parsed.ok, true);
  assert.equal(parsed.state.cash, 95000000);
});

test('Hanoi 3D scene zones, collision protection, Blender GLB manifest, and NPC LOD work properly', () => {
  // Blender GLB manifest validation
  assert.equal(Object.keys(BLENDER_ASSET_MANIFEST).length, 8);
  assert.equal(validateAssetSpec('plastic_stool', { triangles: 320, textureSize: 512 }).valid, true);
  assert.equal(validateAssetSpec('plastic_stool', { triangles: 9000 }).valid, false);

  // NPC LOD tier calculation
  assert.equal(computeNpcLodTier(15).tier, 'near');
  assert.equal(computeNpcLodTier(75).tier, 'medium');
  assert.equal(computeNpcLodTier(140).tier, 'far');

  // Player collision prevents walking into building footprint at (-162, -55)
  const blocked = resolvePlayerCollision({ x: -162, z: -45 }, { x: -162, z: -52 }, 1.0);
  assert.equal(blocked.collided, true);
  assert.equal(blocked.z, -45);

  // Staff & Guest 3D spatial routing
  const tables = [[-81, 15], [-74.7, 15]];
  const waiterTarget = computeStaffTargetPosition(
    { id: 2, role: 'waiter', status: 'busy', orderId: 1 },
    [{ id: 1, table: 1, status: 'serving' }],
    tables
  );
  assert.ok(Math.abs(waiterTarget.x - (tables[1][0] - 1.2)) < 0.01);

  const payingGuestTarget = computeGuestTargetPosition({ id: 1, table: 0, status: 'paying' }, tables);
  assert.ok(Math.abs(payingGuestTarget.x - (RESTAURANT_ZONES.cashier.x - 1.6)) < 0.01);
});

test('citizen dining at restaurant updates their hunger, mood, and personal VND budget upon payment', () => {
  const s = createState({ cash: 1000000, stock: 10, minute: 12 * 60, nextVisitor: 1, tables: 2, staff: 3 });
  s.citizens[0].hunger = 80;
  s.citizens[0].mood = 60;
  s.citizens[0].budget = 500000;
  s.citizens[0].activity = 'lunch';

  advanceSimulation(s, 1, rng);
  assert.equal(s.orders[0].citizenId, s.citizens[0].id);
  assert.equal(s.citizens[0].activity, 'dining_out');

  advanceSimulation(s, 30, rng);
  assert.equal(s.orders[0].status, 'finished');
  assert.ok(s.citizens[0].hunger < 80, 'citizen hunger decreased after dining');
  assert.ok(s.citizens[0].mood > 60, 'citizen mood improved after dining');
  assert.equal(s.citizens[0].budget, 500000 - s.orders[0].total, 'citizen budget deducted by VND bill');
});

test('waiter and cashier staff transition to busy during serving and paying phases', () => {
  const s = createState({ cash: 1000000, stock: 10, minute: 12 * 60, nextVisitor: 1, tables: 1, staff: 3 });
  // Advance 1m (queued) + 1m (cooking starts) + 9m (cooking ends -> serving starts)
  advanceSimulation(s, 11, rng);
  assert.equal(s.orders[0].status, 'serving');
  const waiter = s.staffRoster.find(m => m.role === 'waiter');
  assert.equal(waiter.status, 'busy');
  assert.equal(waiter.orderId, s.orders[0].id);

  // Advance 4m (serving ends -> eating starts) + 8m (eating ends -> paying starts)
  advanceSimulation(s, 12, rng);
  assert.equal(s.orders[0].status, 'paying');
  const cashier = s.staffRoster.find(m => m.role === 'cashier');
  assert.equal(cashier.status, 'busy');
  assert.equal(cashier.orderId, s.orders[0].id);
});

test('loadGameState automatically migrates legacy V0.1/V0.2 localStorage key', () => {
  const storage = createMockStorage({
    [SAVE_KEYS.legacy]: JSON.stringify({ cash: 12345678, day: 6, served: 42, staff: 5, tables: 8 }),
  });
  const loaded = loadGameState(storage);
  assert.equal(loaded.source, 'legacy');
  assert.equal(loaded.recovered, false);
  assert.equal(loaded.state.cash, 12345678);
  assert.equal(loaded.state.day, 6);
  assert.equal(loaded.state.staffRoster.length, 5);
  assert.equal(loaded.state.tables, 8);
});

test('long multi-day simulation keeps orders, logs, and dailyReports strictly bounded', () => {
  const s = createState({ cash: 50000000, stock: 500, minute: 11 * 60, tables: 8, staff: 6 });
  for (let d = 0; d < 3; d++) {
    advanceSimulation(s, 1440, rng);
  }
  assert.equal(s.day, 4);
  assert.ok(s.orders.length <= 80, 'orders array remains bounded');
  assert.ok(s.log.length <= 10, 'log array remains bounded');
  assert.equal(s.dailyReports.length, 3, '3 daily financial reports recorded');
});

test('HTML loads simulation module and exposes important UI elements', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  for (const id of [
    'orders', 'logs', 'queue', 'dayRevenue', 'dayProfit', 'dayCosts',
    'staffBreakdown', 'menuList', 'npcSummary', 'citizens', 'toggleShop',
  ]) {
    assert.ok(html.includes('id="' + id + '"'), id);
  }
  assert.ok(html.includes("from './src/simulation.mjs'"));
  assert.ok(html.includes("from './src/world/hanoi-scene.mjs'"));
  assert.ok(html.includes('advanceSimulation(state,whole)'));
});

test('inline 3D module JavaScript parses cleanly as an ES module', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const match = html.match(/<script type="module">([\s\S]*?)<\/script>/);
  assert.ok(match, '3D inline module script exists');
  const check = spawnSync(process.execPath, ['--check', '--input-type=module'], {
    input: match[1],
    encoding: 'utf8',
  });
  assert.equal(check.status, 0, check.stderr || 'invalid JS syntax');
});
