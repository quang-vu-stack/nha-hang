// VIETNAM LIFE 3D — V0.2 simulation core.
// Pure JavaScript, browser/Node compatible; no paid API required.
export const SIMULATION_VERSION = '0.2.0';
export const OCCUPIED = ['queued', 'cooking', 'serving', 'eating'];
const NAMES = ['Minh', 'Lan', 'Hùng', 'Thảo', 'Hải', 'Linh', 'Tuấn', 'Mai', 'Phúc', 'Trang', 'Long', 'Vy'];
const BASE = {
  cash: 80000000, served: 0, staff: 3, stock: 160, reputation: 35,
  tables: 6, minute: 720, day: 1, rain: false,
  open: true, orders: [], nextOrderId: 1, nextVisitor: 8,
  todayRevenue: 0, todayCosts: 0, rejected: 0, log: [],
};

export function createState(saved = {}) {
  // Migrate compatible V0.1 saves; never trust arbitrary persisted objects.
  const s = { ...BASE };
  for (const field of ['cash','served','staff','stock','reputation','tables','minute','day','nextOrderId','nextVisitor','todayRevenue','todayCosts','rejected']) {
    const n = Number(saved[field]);
    if (saved[field] !== undefined && Number.isFinite(n)) s[field] = n;
  }
  for (const field of ['rain', 'open']) if (typeof saved[field] === 'boolean') s[field] = saved[field];
  s.cash = Math.round(s.cash);
  s.served = Math.max(0, Math.floor(s.served));
  s.staff = Math.max(1, Math.min(30, Math.floor(s.staff)));
  s.stock = Math.max(0, Math.floor(s.stock));
  s.tables = Math.max(1, Math.min(60, Math.floor(s.tables)));
  s.reputation = Math.max(0, Math.min(100, s.reputation));
  s.day = Math.max(1, Math.floor(s.day));
  s.minute = ((Math.floor(s.minute) % 1440) + 1440) % 1440;
  s.nextOrderId = Math.max(1, Math.floor(s.nextOrderId));
  s.nextVisitor = Math.max(1, Math.floor(s.nextVisitor));
  s.orders = Array.isArray(saved.orders) ? saved.orders.filter(o => o && Number.isInteger(o.id) &&
    Number.isInteger(o.table) && o.table >= 0 && o.table < s.tables &&
    [...OCCUPIED, 'finished'].includes(o.status)).slice(-60).map(o => ({...o})) : [];
  s.log = Array.isArray(saved.log) ? saved.log.filter(x => typeof x === 'string').slice(0, 8) : [];
  return s;
}

export function addLog(state, message) {
  state.log.unshift('Ngày ' + state.day + ' • ' + String(Math.floor(state.minute / 60)).padStart(2, '0') + ':' +
    String(state.minute % 60).padStart(2, '0') + ' — ' + message);
  state.log.length = Math.min(state.log.length, 8);
}
export const isBusinessHour = m => (m >= 11 * 60 && m < 23 * 60);
export const activeOrders = s => s.orders.filter(o => OCCUPIED.includes(o.status));
export const activityLabel = {sleep:'Ngủ',home:'Ở nhà',commute:'Đi lại',work:'Làm việc/học',lunch:'Ăn trưa',leisure:'Dạo phố',shop:'Mua sắm'};
export function npcActivity(role, minute) {
  const h = minute / 60;
  if (h < 5 || h >= 23) return 'sleep';
  if (role === 'delivery') return h >= 7 && h < 22 ? 'commute' : 'home';
  if (role === 'student') {
    if (h < 6.5) return 'home';
    if (h < 7.5 || h >= 16.5 && h < 17.5) return 'commute';
    if (h < 11.5 || h >= 13 && h < 16.5) return 'work';
    if (h < 13) return 'lunch';
    return h < 20 ? 'leisure' : 'home';
  }
  if (role === 'worker') {
    if (h < 7) return 'home';
    if (h < 9 || h >= 17 && h < 18.5) return 'commute';
    if (h < 12 || h >= 13 && h < 17) return 'work';
    if (h < 13) return 'lunch';
    return h < 21 ? 'leisure' : 'home';
  }
  if (role === 'shopkeeper') return h >= 8 && h < 21 ? (h >= 12 && h < 13 ? 'lunch' : 'work') : 'home';
  if (h >= 17 && h < 21) return 'shop';
  if (h >= 11 && h < 13) return 'lunch';
  return 'home';
}

export function npcPopulation(minute) {
  const h = minute / 60;
  return h >= 6 && h < 9 || h >= 16 && h < 21 ? 35 : h >= 9 && h < 16 ? 26 : h >= 21 && h < 23 ? 15 : 5;
}
function occupiedTables(s) {
  return new Set(activeOrders(s).map(o => o.table));
}
function arrivalInterval(s, random) {
  // In-game minutes between guests, accelerated by reputation.
  const variance = Math.floor(Math.max(0, Math.min(0.999999, random())) * 8);
  return Math.max(5, 22 - Math.floor(s.reputation / 12) + variance + (s.rain ? 6 : 0));
}
function completeOrder(s, o) {
  o.status = 'eating';
  o.remaining = 13;
  const amount = 115000 + Math.round(s.reputation * 650);
  s.cash += amount; s.todayRevenue += amount; s.served++; o.total = amount;
  s.reputation = Math.min(100, s.reputation + .06);
  addLog(s, o.customer + ' nhận món tại bàn ' + (o.table + 1) + ' (+' + amount.toLocaleString('vi-VN') + 'đ)');
}
function onNewDay(s) {
  s.day++;
  const expenses = 250000 + s.staff * 160000;
  s.cash -= expenses;
  s.todayCosts = expenses; s.todayRevenue = 0;
  addLog(s, 'Sang ngày mới, đã trừ chi phí và lương ' + expenses.toLocaleString('vi-VN') + 'đ');
}
function stepMinute(s, random) {
  s.minute++;
  if (s.minute >= 1440) { s.minute = 0; onNewDay(s); }
  // Orders progress through queue -> cooking -> serving -> eating -> finished.
  for (const o of s.orders) {
    if (o.status === 'queued') {
      o.wait = (o.wait || 0) + 1;
      if (o.wait > 70) {
        o.status = 'finished'; s.rejected++; s.reputation = Math.max(0, s.reputation - .4);
        addLog(s, o.customer + ' rời quán do chờ lâu');
      }
    } else if (o.status === 'cooking' || o.status === 'serving' || o.status === 'eating') {
      o.remaining--;
      if (o.remaining <= 0) {
        if (o.status === 'cooking') { o.status = 'serving'; o.remaining = Math.max(3, 9 - Math.floor(s.staff / 2)); }
        else if (o.status === 'serving') completeOrder(s, o);
        else o.status = 'finished';
      }
    }
  }
  const chefs = Math.max(1, s.staff - 1);
  let cooking = s.orders.filter(o => o.status === 'cooking').length;
  for (const o of s.orders) {
    if (o.status !== 'queued' || cooking >= chefs || s.stock <= 0) continue;
    s.stock--; o.status = 'cooking'; o.remaining = Math.max(6, 17 - Math.floor(s.staff / 2)); cooking++;
    addLog(s, 'Bếp bắt đầu làm món cho ' + o.customer + ', bàn ' + (o.table + 1));
  }
  s.nextVisitor--;
  if (s.nextVisitor <= 0) {
    s.nextVisitor = arrivalInterval(s, random);
    if (s.open && isBusinessHour(s.minute)) {
      const used = occupiedTables(s);
      const free = Array.from({length:s.tables}, (_,i)=>i).find(i=>!used.has(i));
      if (free === undefined) {
        s.rejected++;
        addLog(s, 'Khách ghé qua nhưng đã hết bàn');
      } else if (s.stock <= 0) {
        s.rejected++;
        addLog(s, 'Khách không thể gọi món vì hết nguyên liệu');
      } else {
        const customer = NAMES[(s.nextOrderId - 1) % NAMES.length];
        s.orders.push({ id:s.nextOrderId++, customer, table:free, status:'queued', remaining:0, wait:0, total:0 });
        addLog(s, customer + ' vừa vào quán, ngồi bàn ' + (free + 1));
      }
    }
  }
  // Keep save files bounded.
  if (s.orders.length > 80) s.orders = s.orders.filter(o=>o.status!=='finished').slice(-60);
}
export function advanceSimulation(state, gameMinutes = 1, random = Math.random) {
  const steps = Math.max(0, Math.min(1440, Math.floor(gameMinutes)));
  for (let i=0;i<steps;i++) stepMinute(state, random);
  return state;
}
