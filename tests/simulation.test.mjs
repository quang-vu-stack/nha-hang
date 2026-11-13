import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import {
  createState, advanceSimulation, activeOrders,
  isBusinessHour, npcActivity, npcPopulation, SIMULATION_VERSION
} from '../src/simulation.mjs';

const rng = () => 0;

test('version and V0.1 save migration are backwards compatible', () => {
  assert.equal(SIMULATION_VERSION, '0.2.0');
  const s = createState({cash: 4000000, served: 10, day: 3, staff: 2, stock: 25});
  assert.equal(s.cash, 4000000);
  assert.equal(s.day, 3);
  assert.equal(s.served, 10);
  assert.equal(s.orders.length, 0);
  assert.ok(s.nextVisitor >= 1);
});
test('bad saves cannot create infinite time or negative table counts', () => {
  const s = createState({cash: 'oops', staff:-4, tables:-2, minute:Infinity, reputation: 400, orders:[{id: 1, table:999, status:'queued'}]});
  assert.equal(s.tables, 1);
  assert.equal(s.staff, 1);
  assert.equal(s.reputation, 100);
  assert.equal(s.cash, 80000000);
  assert.equal(s.orders.length, 0);
});
test('citizens follow basic Hanoi daily routines', () => {
  assert.equal(npcActivity('student', 480), 'work');
  assert.equal(npcActivity('worker', 8*60), 'commute');
  assert.equal(npcActivity('worker', 18*60), 'commute');
  assert.equal(npcActivity('student', 2*60), 'sleep');
  assert.ok(npcPopulation(18*60)>npcPopulation(2*60));
});
test('restaurant only welcomes guests during business hours', () => {
  assert.equal(isBusinessHour(10*60), false);
  assert.equal(isBusinessHour(12*60), true);
  assert.equal(isBusinessHour(23*60), false);
  const s = createState({minute:23*60,nextVisitor:1});
  advanceSimulation(s,1,rng);
  assert.equal(s.orders.length,0);
});
test('customers seat, order, cook, get served, and pay', () => {
  const s = createState({cash: 100000,stock:8,minute:12*60,nextVisitor:1,tables:1,staff:3});
  advanceSimulation(s,1,rng);
  assert.equal(s.orders.length,1);
  assert.equal(s.orders[0].status,'queued');
  advanceSimulation(s,1,rng);
  assert.equal(s.orders[0].status,'cooking');
  advanceSimulation(s,28,rng);
  assert.ok(s.served>=1,'at least one meal served');
  assert.ok(s.cash>100000,'money only earned after serving');
  assert.equal(s.stock,7,'one cooking order consumed one ingredient unit');
  assert.ok(s.todayRevenue>0);
  assert.ok(s.log.some(x=>x.includes('nhận món')));
});
test('closing the restaurant prevents new guests', () => {
  const s=createState({minute:12*60,nextVisitor:1,open:false});
  advanceSimulation(s,55,rng);
  assert.equal(s.orders.length,0);
  assert.equal(s.served,0);
});
test('full tables reject extra arrivals', () => {
  const s = createState({minute:12*60,nextVisitor:1,tables:1,
    orders:[{id:4,customer:'Minh',table:0,status:'eating',remaining:200,wait:0,total:100000}]});
  advanceSimulation(s,1,rng);
  assert.equal(activeOrders(s).length,1);
  assert.equal(s.rejected,1);
});
test('lack of ingredients rejects incoming customers and does not mint revenue', () => {
  const s=createState({cash:300000,stock:0,minute:12*60,nextVisitor:1});
  advanceSimulation(s,1,rng);
  assert.equal(s.served,0);
  assert.equal(s.cash,300000);
  assert.equal(s.rejected,1);
});
test('daily wages charged exactly on midnight rollover', () => {
  const s=createState({cash:2000000,minute:1439,day:4,staff:4,nextVisitor:100});
  advanceSimulation(s,1,rng);
  assert.equal(s.day,5);
  assert.equal(s.minute,0);
  assert.equal(s.todayCosts,250000+4*160000);
  assert.equal(s.cash,2000000-(250000+4*160000));
});
test('HTML loads simulation module and exposes important UI elements', () => {
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  for(const id of ['orders','logs','queue','dayRevenue','citizens','toggleShop'])assert.ok(html.includes('id="'+id+'"'),id);
  assert.ok(html.includes("from './src/simulation.mjs'"));
  assert.ok(html.includes('advanceSimulation(state,whole)'));
});

test('inline 3D module JavaScript parses cleanly as an ES module', () => {
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const match=html.match(/<script type="module">([\s\S]*?)<\/script>/);
  assert.ok(match,'3D inline module script exists');
  const check=spawnSync(process.execPath,['--check','--input-type=module'],{input:match[1],encoding:'utf8'});
  assert.equal(check.status,0,check.stderr || 'invalid JS syntax');
});

test('optional external assets are wired with valid relative paths and import map', () => {
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  for(const path of ['assets/models/ghe-nhua.glb','assets/audio/chao-khach-vien.mp3'])assert.ok(html.includes(path),path);
  assert.ok(html.includes('id="voiceGreeting"'));
  assert.ok(html.includes('GLTFLoader'));
  assert.ok(html.includes('"three/addons/"'));
  assert.ok(html.includes('greetingEnabled'));
});
