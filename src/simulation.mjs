// VIETNAM LIFE 3D — V0.3 simulation core.
// Pure JavaScript, browser/Node compatible; no paid API required.

export const SIMULATION_VERSION = '0.3.0';
export const SAVE_KEYS = {
  primary: 'vietnam-life-3d-github-v03',
  backup: 'vietnam-life-3d-github-v03-backup',
  legacy: 'vietnam-life-3d-github-v01',
};

// An order occupies its table from seating ('queued') until checkout completes ('paying').
export const OCCUPIED = ['queued', 'cooking', 'serving', 'eating', 'paying'];

export const NAMES = [
  'Minh', 'Lan', 'Hùng', 'Thảo', 'Hải', 'Linh',
  'Tuấn', 'Mai', 'Phúc', 'Trang', 'Long', 'Vy',
  'Đức', 'Hương', 'Khoa', 'Ngọc', 'Tùng', 'Hà',
];

export const STAFF_ROLES = ['chef', 'waiter', 'cashier'];
export const STAFF_ROLE_LABELS = {
  chef: 'Đầu bếp',
  waiter: 'Phục vụ',
  cashier: 'Thu ngân',
};

export const INGREDIENT_KEYS = ['meat', 'seafood', 'veggies', 'drinks', 'spices'];
export const INGREDIENT_LABELS = {
  meat: 'Thịt tươi',
  seafood: 'Hải sản',
  veggies: 'Rau thơm & củ',
  drinks: 'Bia hơi & đồ uống',
  spices: 'Gia vị đặc trưng',
};

// Vietnamese nhậu menu with prices and ingredient costs in VND.
export const MENU = [
  {
    id: 'nem_ran',
    name: 'Nem rán Hà Nội',
    price: 95000,
    cost: 28000,
    prepMinutes: 9,
    eatMinutes: 8,
    ingredient: 'meat',
    stockUnits: 1,
  },
  {
    id: 'bia_lac',
    name: 'Combo Bia hơi & Lạc rang',
    price: 85000,
    cost: 22000,
    prepMinutes: 7,
    eatMinutes: 8,
    ingredient: 'drinks',
    stockUnits: 1,
  },
  {
    id: 'bo_luc_lac',
    name: 'Bò lúc lắc khoai tây',
    price: 155000,
    cost: 52000,
    prepMinutes: 10,
    eatMinutes: 8,
    ingredient: 'meat',
    stockUnits: 1,
  },
  {
    id: 'ga_nuong',
    name: 'Gà nướng mật ong',
    price: 185000,
    cost: 64000,
    prepMinutes: 10,
    eatMinutes: 8,
    ingredient: 'spices',
    stockUnits: 1,
  },
  {
    id: 'lau_thai',
    name: 'Lẩu Thái hải sản',
    price: 245000,
    cost: 86000,
    prepMinutes: 11,
    eatMinutes: 9,
    ingredient: 'seafood',
    stockUnits: 1,
  },
];

export const activityLabel = {
  sleep: 'Ngủ nghỉ',
  home: 'Ở nhà',
  commute: 'Đi học / Đi làm',
  work: 'Học tập / Làm việc',
  lunch: 'Ăn trưa',
  dinner: 'Ăn tối / Nhậu',
  leisure: 'Dạo phố',
  shop: 'Mua sắm',
  dining_out: 'Ăn tại quán',
};

const HANOI_PLACES = {
  homes: [
    { label: 'Khu tập thể Thành Công', x: -145, z: -43 },
    { label: 'Ngõ Hàng Bún', x: -95, z: 43 },
    { label: 'Phố Đội Cấn', x: -35, z: -43 },
    { label: 'Ngõ Văn Chương', x: 30, z: 43 },
    { label: 'Phố Nguyễn Thái Học', x: 105, z: -43 },
  ],
  workplaces: [
    { label: 'Trường THPT Chu Văn An', x: -120, z: -26 },
    { label: 'Văn phòng Ba Đình', x: -45, z: 26 },
    { label: 'Chợ Châu Long', x: 25, z: -26 },
    { label: 'Cửa hàng Phố Cổ', x: 85, z: 26 },
    { label: 'Bưu cục Giao vận Hà Nội', x: 130, z: -24 },
  ],
  restaurant: { label: 'Nhậu Phố Việt', x: -68, z: 30 },
};

const BASE = {
  cash: 80000000,
  served: 0,
  staff: 3,
  stock: 160,
  reputation: 35,
  tables: 6,
  minute: 720,
  day: 1,
  rain: false,
  open: true,
  orders: [],
  nextOrderId: 1,
  nextVisitor: 8,
  todayRevenue: 0,
  todayCosts: 0,
  todayIngredientCost: 0,
  todayProfit: 0,
  rejected: 0,
  log: [],
  dailyReports: [],
};

export function distributeStockToIngredients(totalStock, savedIngredients = null) {
  const safeTotal = Math.max(0, Math.floor(Number.isFinite(Number(totalStock)) ? Number(totalStock) : 0));
  if (savedIngredients && typeof savedIngredients === 'object') {
    const cleaned = {};
    let sum = 0;
    for (const k of INGREDIENT_KEYS) {
      const val = Math.max(0, Math.floor(Number(savedIngredients[k]) || 0));
      cleaned[k] = val;
      sum += val;
    }
    if (sum === safeTotal) return cleaned;
  }
  const basePerKey = Math.floor(safeTotal / INGREDIENT_KEYS.length);
  let remainder = safeTotal % INGREDIENT_KEYS.length;
  const result = {};
  for (const k of INGREDIENT_KEYS) {
    result[k] = basePerKey + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder--;
  }
  return result;
}

export function totalIngredientStock(ingredients) {
  if (!ingredients || typeof ingredients !== 'object') return 0;
  return INGREDIENT_KEYS.reduce((sum, k) => sum + Math.max(0, Math.floor(Number(ingredients[k]) || 0)), 0);
}

const DEFAULT_ROLE_SEQUENCE = ['chef', 'waiter', 'cashier', 'chef', 'waiter', 'chef', 'waiter', 'cashier'];

export function createStaffRoster(staffCount = 3, savedRoster = null) {
  const count = Math.max(1, Math.min(30, Math.floor(Number(staffCount) || 3)));
  const roster = [];
  const validSaved = Array.isArray(savedRoster)
    ? savedRoster.filter(m => m && typeof m === 'object' && STAFF_ROLES.includes(m.role))
    : [];

  for (let i = 0; i < count; i++) {
    const existing = validSaved[i];
    const role = existing ? existing.role : DEFAULT_ROLE_SEQUENCE[i % DEFAULT_ROLE_SEQUENCE.length];
    const station = role === 'chef' ? 'kitchen' : role === 'cashier' ? 'counter' : 'hall';
    const rawSkill = existing && Number.isFinite(Number(existing.skill)) ? Number(existing.skill) : 1 + (i % 3) * 0.12;
    const rawWage = existing && Number.isFinite(Number(existing.wage)) ? Number(existing.wage) : 160000;
    roster.push({
      id: i + 1,
      name: existing && typeof existing.name === 'string' && existing.name.trim()
        ? existing.name.trim().slice(0, 24)
        : NAMES[(i + 3) % NAMES.length],
      role,
      label: STAFF_ROLE_LABELS[role],
      skill: Math.max(0.8, Math.min(2.0, Number(rawSkill.toFixed(2)))),
      wage: Math.max(100000, Math.min(500000, Math.round(rawWage))),
      status: existing && existing.status === 'busy' ? 'busy' : 'idle',
      orderId: existing && Number.isInteger(existing.orderId) ? existing.orderId : null,
      station,
    });
  }
  return roster;
}

export function countStaffByRole(state) {
  const counts = { chef: 0, waiter: 0, cashier: 0 };
  const roster = Array.isArray(state?.staffRoster) ? state.staffRoster : [];
  for (const m of roster) {
    if (counts[m.role] !== undefined) counts[m.role]++;
  }
  return counts;
}

export function createCitizens(count = 35, savedCitizens = null) {
  const safeCount = Math.max(5, Math.min(60, Math.floor(Number(count) || 35)));
  const roles = ['student', 'worker', 'shopkeeper', 'delivery', 'resident', 'worker', 'student'];
  const validSaved = Array.isArray(savedCitizens) ? savedCitizens : [];
  const citizens = [];

  for (let i = 0; i < safeCount; i++) {
    const prev = validSaved[i] && typeof validSaved[i] === 'object' ? validSaved[i] : null;
    const role = prev && typeof prev.role === 'string' ? prev.role : roles[i % roles.length];
    const home = HANOI_PLACES.homes[i % HANOI_PLACES.homes.length];
    const work = HANOI_PLACES.workplaces[i % HANOI_PLACES.workplaces.length];
    const defaultBudget = 120000 + (i % 6) * 45000;
    citizens.push({
      id: i + 1,
      name: prev && typeof prev.name === 'string' ? prev.name.slice(0, 24) : NAMES[i % NAMES.length],
      role,
      homeLabel: home.label,
      workLabel: role === 'student' ? 'Trường THPT Chu Văn An' : work.label,
      home: { x: home.x + ((i * 7) % 18) - 9, z: home.z },
      workplace: { x: work.x + ((i * 11) % 16) - 8, z: work.z },
      budget: prev && Number.isFinite(Number(prev.budget))
        ? Math.max(0, Math.min(5000000, Math.round(Number(prev.budget))))
        : defaultBudget,
      hunger: prev && Number.isFinite(Number(prev.hunger))
        ? Math.max(0, Math.min(100, Math.round(Number(prev.hunger))))
        : 25 + (i * 5) % 45,
      energy: prev && Number.isFinite(Number(prev.energy))
        ? Math.max(0, Math.min(100, Math.round(Number(prev.energy))))
        : 75 - (i % 20),
      mood: prev && Number.isFinite(Number(prev.mood))
        ? Math.max(0, Math.min(100, Math.round(Number(prev.mood))))
        : 70,
      activity: prev && typeof prev.activity === 'string' ? prev.activity : 'home',
      currentOrderId: prev && Number.isInteger(prev.currentOrderId) ? prev.currentOrderId : null,
    });
  }
  return citizens;
}

export function calculateProfit(state) {
  const rev = Number(state?.todayRevenue) || 0;
  const costs = Number(state?.todayCosts) || 0;
  const ingCost = Number(state?.todayIngredientCost) || 0;
  return Math.round(rev - costs - ingCost);
}

export function createState(saved = {}) {
  // Migrate compatible V0.1/V0.2/V0.3 saves; never trust arbitrary persisted objects.
  const src = saved && typeof saved === 'object' && saved.state && typeof saved.state === 'object'
    ? saved.state
    : (saved && typeof saved === 'object' ? saved : {});

  const s = { ...BASE };
  for (const field of [
    'cash', 'served', 'staff', 'stock', 'reputation', 'tables',
    'minute', 'day', 'nextOrderId', 'nextVisitor',
    'todayRevenue', 'todayCosts', 'todayIngredientCost', 'rejected',
  ]) {
    const n = Number(src[field]);
    if (src[field] !== undefined && Number.isFinite(n)) s[field] = n;
  }
  for (const field of ['rain', 'open']) {
    if (typeof src[field] === 'boolean') s[field] = src[field];
  }

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
  s.todayRevenue = Math.max(0, Math.round(s.todayRevenue));
  s.todayCosts = Math.max(0, Math.round(s.todayCosts));
  s.todayIngredientCost = Math.max(0, Math.round(s.todayIngredientCost));

  s.ingredients = distributeStockToIngredients(s.stock, src.ingredients);
  s.stock = totalIngredientStock(s.ingredients);

  s.staffRoster = createStaffRoster(s.staff, src.staffRoster);
  s.staff = s.staffRoster.length;

  s.orders = Array.isArray(src.orders)
    ? src.orders
        .filter(o =>
          o &&
          Number.isInteger(o.id) &&
          Number.isInteger(o.table) &&
          o.table >= 0 &&
          o.table < s.tables &&
          [...OCCUPIED, 'finished'].includes(o.status)
        )
        .slice(-60)
        .map(o => {
          const fallbackDish = MENU[(Math.max(1, o.id) - 1) % MENU.length];
          return {
            ...o,
            dishId: typeof o.dishId === 'string' ? o.dishId : fallbackDish.id,
            dishName: typeof o.dishName === 'string' ? o.dishName : fallbackDish.name,
            ingredient: INGREDIENT_KEYS.includes(o.ingredient) ? o.ingredient : fallbackDish.ingredient,
            price: Number.isFinite(Number(o.price)) ? Math.round(Number(o.price)) : fallbackDish.price,
            cost: Number.isFinite(Number(o.cost)) ? Math.round(Number(o.cost)) : fallbackDish.cost,
            paid: Boolean(o.paid || o.status === 'finished'),
          };
        })
    : [];

  s.citizens = createCitizens(35, src.citizens);
  s.log = Array.isArray(src.log) ? src.log.filter(x => typeof x === 'string').slice(0, 10) : [];
  s.dailyReports = Array.isArray(src.dailyReports)
    ? src.dailyReports.filter(r => r && Number.isInteger(r.day)).slice(-14)
    : [];
  s.todayProfit = calculateProfit(s);
  return s;
}

export function addLog(state, message) {
  state.log.unshift(
    'Ngày ' +
      state.day +
      ' • ' +
      String(Math.floor(state.minute / 60)).padStart(2, '0') +
      ':' +
      String(state.minute % 60).padStart(2, '0') +
      ' — ' +
      message
  );
  state.log.length = Math.min(state.log.length, 10);
}

export const isBusinessHour = m => m >= 11 * 60 && m < 23 * 60;
export const activeOrders = s => s.orders.filter(o => OCCUPIED.includes(o.status));

export function npcActivity(role, minute, options = {}) {
  const h = minute / 60;
  const rain = Boolean(options?.rain);
  if (h < 5 || h >= 23) return 'sleep';
  if (role === 'delivery') return h >= 7 && h < 22 ? 'commute' : 'home';
  if (role === 'student') {
    if (h < 6.5) return 'home';
    if (h < 7.5 || (h >= 16.5 && h < 17.5)) return 'commute';
    if (h < 11.5 || (h >= 13 && h < 16.5)) return 'work';
    if (h < 13) return 'lunch';
    if (rain && h >= 18.5) return 'home';
    return h < 20 ? 'leisure' : 'home';
  }
  if (role === 'worker') {
    if (h < 7) return 'home';
    if (h < 9 || (h >= 17 && h < 18.5)) return 'commute';
    if (h < 12 || (h >= 13 && h < 17)) return 'work';
    if (h < 13) return 'lunch';
    if (rain && h >= 19.5) return 'home';
    return h < 21 ? 'leisure' : 'home';
  }
  if (role === 'shopkeeper') {
    return h >= 8 && h < 21 ? (h >= 12 && h < 13 ? 'lunch' : 'work') : 'home';
  }
  if (h >= 17 && h < 21) return rain ? 'home' : 'shop';
  if (h >= 11 && h < 13) return 'lunch';
  return 'home';
}

export function npcPopulation(minute) {
  const h = minute / 60;
  return (h >= 6 && h < 9) || (h >= 16 && h < 21)
    ? 35
    : h >= 9 && h < 16
      ? 26
      : h >= 21 && h < 23
        ? 15
        : 5;
}

export function updateCitizens(state) {
  if (!Array.isArray(state.citizens)) state.citizens = createCitizens(35);
  const activeOrderIds = new Set(activeOrders(state).map(o => o.id));

  for (const c of state.citizens) {
    if (c.currentOrderId && activeOrderIds.has(c.currentOrderId)) {
      c.activity = 'dining_out';
      c.hunger = Math.max(5, c.hunger - 2);
      c.mood = Math.min(100, c.mood + 1);
      continue;
    }
    c.currentOrderId = null;
    const baseActivity = npcActivity(c.role, state.minute, { rain: state.rain });
    c.activity = baseActivity;

    if (baseActivity === 'sleep' || baseActivity === 'home') {
      c.energy = Math.min(100, c.energy + 1);
      if (state.minute % 30 === 0) c.hunger = Math.min(100, c.hunger + 1);
    } else if (baseActivity === 'work' || baseActivity === 'commute') {
      if (state.minute % 15 === 0) {
        c.hunger = Math.min(100, c.hunger + 2);
        c.energy = Math.max(10, c.energy - 1);
      }
    } else if (baseActivity === 'lunch') {
      if (state.minute % 10 === 0) c.hunger = Math.max(15, c.hunger - 3);
    } else if (baseActivity === 'leisure' || baseActivity === 'shop') {
      const h = state.minute / 60;
      if (h >= 18 && h < 21 && c.hunger >= 55) {
        c.activity = 'dinner';
      }
    }
  }
}

function occupiedTables(s) {
  return new Set(activeOrders(s).map(o => o.table));
}

function arrivalInterval(s, random) {
  // In-game minutes between guests, accelerated by reputation.
  const variance = Math.floor(Math.max(0, Math.min(0.999999, random())) * 8);
  return Math.max(5, 22 - Math.floor(s.reputation / 12) + variance + (s.rain ? 6 : 0));
}

export function selectMenuDish(state, random = Math.random, customerBudget = Infinity) {
  const ing = state.ingredients || distributeStockToIngredients(state.stock);
  const available = MENU.filter(d => (ing[d.ingredient] || 0) >= d.stockUnits && d.price <= customerBudget);
  const pool = available.length > 0
    ? available
    : MENU.filter(d => (ing[d.ingredient] || 0) >= d.stockUnits);

  if (pool.length === 0) {
    // If specific bucket was desynced from raw stock manipulation in tests, fall back to MENU[0] if state.stock > 0
    if (state.stock > 0) return MENU[0];
    return null;
  }
  const idx = Math.floor(Math.max(0, Math.min(0.999999, random())) * pool.length);
  return pool[idx];
}

function consumeDishIngredient(state, dish) {
  if (!state.ingredients || typeof state.ingredients !== 'object') {
    state.ingredients = distributeStockToIngredients(state.stock);
  }
  const currentTotal = totalIngredientStock(state.ingredients);
  if (currentTotal !== state.stock) {
    state.ingredients = distributeStockToIngredients(state.stock);
  }
  const key = dish?.ingredient && INGREDIENT_KEYS.includes(dish.ingredient) ? dish.ingredient : 'meat';
  if ((state.ingredients[key] || 0) > 0) {
    state.ingredients[key]--;
  } else {
    const fallbackKey = INGREDIENT_KEYS.find(k => (state.ingredients[k] || 0) > 0);
    if (fallbackKey) state.ingredients[fallbackKey]--;
  }
  state.stock = Math.max(0, state.stock - 1);
  const cost = Number.isFinite(Number(dish?.cost)) ? Number(dish.cost) : 28000;
  state.todayIngredientCost = (state.todayIngredientCost || 0) + cost;
  state.todayProfit = calculateProfit(state);
}

export function restockIngredients(state, units = 100, cost = 800000) {
  const addUnits = Math.max(1, Math.floor(Number(units) || 100));
  const totalCost = Math.max(0, Math.round(Number(cost) || 0));
  if (state.cash < totalCost) return false;
  state.cash -= totalCost;
  state.todayCosts += totalCost;
  if (!state.ingredients || typeof state.ingredients !== 'object') {
    state.ingredients = distributeStockToIngredients(state.stock);
  }
  const perKey = Math.floor(addUnits / INGREDIENT_KEYS.length);
  let rem = addUnits % INGREDIENT_KEYS.length;
  for (const k of INGREDIENT_KEYS) {
    state.ingredients[k] = (state.ingredients[k] || 0) + perKey + (rem > 0 ? 1 : 0);
    if (rem > 0) rem--;
  }
  state.stock = totalIngredientStock(state.ingredients);
  state.todayProfit = calculateProfit(state);
  addLog(state, 'Nhập thêm ' + addUnits + ' phần nguyên liệu (-' + totalCost.toLocaleString('vi-VN') + 'đ)');
  return true;
}

export function hireStaffMember(state, preferredRole = null, hireCost = 2000000) {
  if (state.staff >= 30 || state.cash < hireCost) return null;
  state.cash -= hireCost;
  state.todayCosts += hireCost;
  if (!Array.isArray(state.staffRoster)) {
    state.staffRoster = createStaffRoster(state.staff);
  }
  const counts = countStaffByRole(state);
  let role = preferredRole && STAFF_ROLES.includes(preferredRole) ? preferredRole : null;
  if (!role) {
    if (counts.chef <= counts.waiter && counts.chef <= counts.cashier) role = 'chef';
    else if (counts.waiter <= counts.cashier) role = 'waiter';
    else role = 'cashier';
  }
  const id = state.staffRoster.length + 1;
  const member = {
    id,
    name: NAMES[(id + 4) % NAMES.length],
    role,
    label: STAFF_ROLE_LABELS[role],
    skill: Number((1 + (id % 4) * 0.1).toFixed(2)),
    wage: 160000,
    status: 'idle',
    orderId: null,
    station: role === 'chef' ? 'kitchen' : role === 'cashier' ? 'counter' : 'hall',
  };
  state.staffRoster.push(member);
  state.staff = state.staffRoster.length;
  state.todayProfit = calculateProfit(state);
  addLog(state, 'Tuyển thêm ' + member.label + ' ' + member.name + ' (-' + hireCost.toLocaleString('vi-VN') + 'đ)');
  return member;
}

function syncStaffAssignments(state) {
  if (!Array.isArray(state.staffRoster) || state.staffRoster.length !== state.staff) {
    state.staffRoster = createStaffRoster(state.staff, state.staffRoster);
  }
  for (const m of state.staffRoster) {
    m.status = 'idle';
    m.orderId = null;
  }
  const assignRole = (role, orderStatus) => {
    const matchingOrders = state.orders.filter(o => o.status === orderStatus);
    const roleStaff = state.staffRoster.filter(m => m.role === role);
    for (let i = 0; i < matchingOrders.length && i < roleStaff.length; i++) {
      roleStaff[i].status = 'busy';
      roleStaff[i].orderId = matchingOrders[i].id;
    }
  };
  assignRole('chef', 'cooking');
  assignRole('waiter', 'serving');
  assignRole('cashier', 'paying');
}

function serveOrderToTable(s, o) {
  o.status = 'eating';
  o.remaining = o.eatMinutes || 8;
  addLog(s, 'Phục vụ đã mang ' + (o.dishName || 'món nhậu') + ' cho ' + o.customer + ' nhận món tại bàn ' + (o.table + 1));
}

function completeOrderPayment(s, o) {
  o.status = 'finished';
  o.paid = true;
  const basePrice = Number.isFinite(Number(o.price)) ? Number(o.price) : 115000;
  const amount = o.total > 0 ? o.total : basePrice + Math.round(s.reputation * 650);
  o.total = amount;
  s.cash += amount;
  s.todayRevenue += amount;
  s.served++;
  s.reputation = Math.min(100, s.reputation + 0.08);
  s.todayProfit = calculateProfit(s);

  if (Array.isArray(s.citizens) && o.citizenId) {
    const citizen = s.citizens.find(c => c.id === o.citizenId);
    if (citizen) {
      citizen.hunger = Math.max(0, citizen.hunger - 45);
      citizen.mood = Math.min(100, citizen.mood + 8);
      citizen.budget = Math.max(20000, citizen.budget - amount);
      citizen.currentOrderId = null;
    }
  }

  addLog(
    s,
    'Thu ngân chốt đơn bàn ' +
      (o.table + 1) +
      ' (' +
      o.customer +
      ' thanh toán +' +
      amount.toLocaleString('vi-VN') +
      'đ)'
  );
}

function onNewDay(s) {
  s.dailyReports = Array.isArray(s.dailyReports) ? s.dailyReports : [];
  s.dailyReports.push({
    day: s.day,
    revenue: s.todayRevenue,
    costs: s.todayCosts,
    ingredientCost: s.todayIngredientCost || 0,
    profit: calculateProfit(s),
    served: s.served,
  });
  if (s.dailyReports.length > 14) s.dailyReports.shift();

  s.day++;
  const staffWages = Array.isArray(s.staffRoster) && s.staffRoster.length === s.staff
    ? s.staffRoster.reduce((sum, m) => sum + (Number(m.wage) || 160000), 0)
    : s.staff * 160000;
  const expenses = 250000 + staffWages;
  s.cash -= expenses;
  s.todayCosts = expenses;
  s.todayRevenue = 0;
  s.todayIngredientCost = 0;
  s.todayProfit = calculateProfit(s);

  if (Array.isArray(s.citizens)) {
    for (const c of s.citizens) {
      c.budget = Math.min(1500000, c.budget + 180000);
    }
  }
  addLog(s, 'Sang ngày mới, đã trừ chi phí và lương ' + expenses.toLocaleString('vi-VN') + 'đ');
}

function stepMinute(s, random) {
  s.minute++;
  if (s.minute >= 1440) {
    s.minute = 0;
    onNewDay(s);
  }

  if (totalIngredientStock(s.ingredients) !== s.stock) {
    s.ingredients = distributeStockToIngredients(s.stock, s.ingredients);
  }
  if (!Array.isArray(s.staffRoster) || s.staffRoster.length !== s.staff) {
    s.staffRoster = createStaffRoster(s.staff, s.staffRoster);
  }

  const counts = countStaffByRole(s);
  const waiterSpeedBonus = Math.min(3, Math.floor((counts.waiter || 1) / 2));
  const cashierSpeedBonus = Math.min(2, Math.floor((counts.cashier || 1) / 2));

  // Orders progress through queued -> cooking -> serving -> eating -> paying -> finished.
  for (const o of s.orders) {
    if (o.status === 'queued') {
      o.wait = (o.wait || 0) + 1;
      if (o.wait > 70) {
        o.status = 'finished';
        s.rejected++;
        s.reputation = Math.max(0, s.reputation - 0.4);
        addLog(s, o.customer + ' rời quán do chờ lâu');
      }
    } else if (o.status === 'cooking') {
      o.remaining--;
      if (o.remaining <= 0) {
        o.status = 'serving';
        o.remaining = Math.max(2, 4 - waiterSpeedBonus);
      }
    } else if (o.status === 'serving') {
      o.remaining--;
      if (o.remaining <= 0) {
        serveOrderToTable(s, o);
      }
    } else if (o.status === 'eating') {
      o.remaining--;
      if (o.remaining <= 0) {
        o.status = 'paying';
        o.remaining = Math.max(2, 3 - cashierSpeedBonus);
      }
    } else if (o.status === 'paying') {
      o.remaining--;
      if (o.remaining <= 0) {
        completeOrderPayment(s, o);
      }
    }
  }

  // Independent Chefs start cooking queued orders up to chef capacity.
  const chefCapacity = Math.max(1, counts.chef || Math.max(1, s.staff - 1));
  let cooking = s.orders.filter(o => o.status === 'cooking').length;
  for (const o of s.orders) {
    if (o.status !== 'queued' || cooking >= chefCapacity || s.stock <= 0) continue;
    const dish = MENU.find(d => d.id === o.dishId) || MENU[0];
    consumeDishIngredient(s, dish);
    o.status = 'cooking';
    const prepBase = dish.prepMinutes || 10;
    o.remaining = Math.max(5, prepBase - Math.floor(s.staff / 4));
    cooking++;
    addLog(s, 'Đầu bếp bắt đầu nấu ' + (o.dishName || dish.name) + ' cho ' + o.customer + ', bàn ' + (o.table + 1));
  }

  s.nextVisitor--;
  if (s.nextVisitor <= 0) {
    s.nextVisitor = arrivalInterval(s, random);
    if (s.open && isBusinessHour(s.minute)) {
      const used = occupiedTables(s);
      const free = Array.from({ length: s.tables }, (_, i) => i).find(i => !used.has(i));
      if (free === undefined) {
        s.rejected++;
        addLog(s, 'Khách ghé qua nhưng đã hết bàn');
      } else if (s.stock <= 0) {
        s.rejected++;
        addLog(s, 'Khách không thể gọi món vì hết nguyên liệu');
      } else {
        const orderIndex = s.nextOrderId - 1;
        const citizenCandidate = Array.isArray(s.citizens)
          ? s.citizens.find(c => !c.currentOrderId && (c.activity === 'lunch' || c.activity === 'dinner' || c.hunger >= 50))
          : null;
        const customer = NAMES[orderIndex % NAMES.length];
        const dish = selectMenuDish(s, random, citizenCandidate ? citizenCandidate.budget : Infinity) || MENU[0];
        const total = dish.price + Math.round(s.reputation * 650);
        const order = {
          id: s.nextOrderId++,
          customer,
          citizenId: citizenCandidate ? citizenCandidate.id : null,
          table: free,
          dishId: dish.id,
          dishName: dish.name,
          ingredient: dish.ingredient,
          price: dish.price,
          cost: dish.cost,
          eatMinutes: dish.eatMinutes || 8,
          status: 'queued',
          remaining: 0,
          wait: 0,
          total,
          paid: false,
        };
        if (citizenCandidate) {
          citizenCandidate.currentOrderId = order.id;
          citizenCandidate.activity = 'dining_out';
        }
        s.orders.push(order);
        addLog(s, customer + ' vào quán, chọn bàn ' + (free + 1) + ' và gọi ' + dish.name);
      }
    }
  }

  updateCitizens(s);
  syncStaffAssignments(s);
  s.todayProfit = calculateProfit(s);

  // Keep save files bounded.
  if (s.orders.length > 80) {
    s.orders = s.orders.filter(o => o.status !== 'finished').slice(-60);
  }
}

export function advanceSimulation(state, gameMinutes = 1, random = Math.random) {
  const steps = Math.max(0, Math.min(1440, Math.floor(gameMinutes)));
  for (let i = 0; i < steps; i++) stepMinute(state, random);
  return state;
}

// --- Save Protection, Checksum & Backup Recovery (Goal 6) ---

export function computeSaveChecksum(payloadText) {
  let hash = 0x811c9dc5;
  const str = String(payloadText);
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

export function serializeSave(state) {
  const cleanState = createState(state);
  const stateJson = JSON.stringify(cleanState);
  const checksum = computeSaveChecksum(stateJson);
  return JSON.stringify({
    format: 'vietnam-life-3d-save',
    version: SIMULATION_VERSION,
    savedAt: Date.now(),
    checksum,
    state: cleanState,
  });
}

export function deserializeSave(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    return { ok: false, reason: 'empty', state: null };
  }
  let parsed;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    return { ok: false, reason: 'invalid_json', state: null };
  }
  if (!parsed || typeof parsed !== 'object') {
    return { ok: false, reason: 'invalid_root', state: null };
  }

  if (parsed.format === 'vietnam-life-3d-save') {
    if (!parsed.state || typeof parsed.state !== 'object') {
      return { ok: false, reason: 'missing_state', state: null };
    }
    const expectedChecksum = computeSaveChecksum(JSON.stringify(parsed.state));
    if (typeof parsed.checksum === 'string' && parsed.checksum !== expectedChecksum) {
      return { ok: false, reason: 'checksum_mismatch', state: null };
    }
    return { ok: true, version: parsed.version || SIMULATION_VERSION, migrated: false, state: createState(parsed.state) };
  }

  // Legacy V0.1 / V0.2 plain state object migration
  return { ok: true, version: 'legacy', migrated: true, state: createState(parsed) };
}

export function saveGameState(storage, state) {
  if (!storage || typeof storage.setItem !== 'function') return false;
  try {
    const existingPrimary = typeof storage.getItem === 'function' ? storage.getItem(SAVE_KEYS.primary) : null;
    if (existingPrimary) {
      const checkExisting = deserializeSave(existingPrimary);
      if (checkExisting.ok) {
        storage.setItem(SAVE_KEYS.backup, existingPrimary);
      }
    }
    const payload = serializeSave(state);
    storage.setItem(SAVE_KEYS.primary, payload);
    storage.setItem(SAVE_KEYS.legacy, JSON.stringify(createState(state)));
    return true;
  } catch {
    return false;
  }
}

export function loadGameState(storage) {
  if (!storage || typeof storage.getItem !== 'function') {
    return { state: createState(), source: 'fresh', recovered: false };
  }
  const primaryRaw = storage.getItem(SAVE_KEYS.primary);
  if (primaryRaw) {
    const res = deserializeSave(primaryRaw);
    if (res.ok && res.state) {
      return { state: res.state, source: 'primary', recovered: false };
    }
  }
  const backupRaw = storage.getItem(SAVE_KEYS.backup);
  if (backupRaw) {
    const res = deserializeSave(backupRaw);
    if (res.ok && res.state) {
      return { state: res.state, source: 'backup', recovered: true };
    }
  }
  const legacyRaw = storage.getItem(SAVE_KEYS.legacy);
  if (legacyRaw) {
    const res = deserializeSave(legacyRaw);
    if (res.ok && res.state) {
      return { state: res.state, source: 'legacy', recovered: false };
    }
  }
  return { state: createState(), source: 'fresh', recovered: false };
}
