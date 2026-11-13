// VIETNAM LIFE 3D — V0.3 Hanoi 3D World, Restaurant Interior & Collision System.
import { createAssetRegistry, computeNpcLodTier } from './asset-loader.mjs';
import { npcActivity, npcPopulation, activeOrders } from '../simulation.mjs';

export const RESTAURANT_ZONES = {
  entrance: { x: -68, z: 12, label: 'Cổng vào Nhậu Phố Việt' },
  kitchen: { x: -77, z: 36.5, label: 'Quầy Bếp Nóng' },
  cashier: { x: -56.5, z: 26, label: 'Quầy Thu Ngân' },
  delivery: { x: -84, z: 34, label: 'Khu Giao Nhận Nguyên Liệu' },
  bounds: { minX: -86, maxX: -50, minZ: 12, maxZ: 43 },
};

// Solid building footprints along North & South street blocks (excluding the walkable restaurant interior).
export function createBuildingColliders() {
  const colliders = [];
  for (let i = 0; i < 11; i++) {
    const x = -162 + i * 15;
    // South row buildings (z = -55)
    colliders.push({ minX: x - 6.3, maxX: x + 6.3, minZ: -62.3, maxZ: -47.7 });
    // North row buildings (z = 55)
    colliders.push({ minX: x - 6.3, maxX: x + 6.3, minZ: 47.7, maxZ: 62.3 });
  }
  // Back wall of Nhậu Phố Việt pavilion (leaving front/sides open as an open-air beer garden)
  colliders.push({ minX: -83, maxX: -53, minZ: 40.5, maxZ: 42.8 });
  return colliders;
}

export const BUILDING_COLLIDERS = createBuildingColliders();

export function resolvePlayerCollision(prevPos, nextPos, radius = 1.0, colliders = BUILDING_COLLIDERS) {
  const clampedX = Math.max(-165, Math.min(165, Number(nextPos.x) || 0));
  const clampedZ = Math.max(-145, Math.min(145, Number(nextPos.z) || 0));

  const hitsBox = (x, z) =>
    colliders.some(
      b => x + radius > b.minX && x - radius < b.maxX && z + radius > b.minZ && z - radius < b.maxZ
    );

  if (!hitsBox(clampedX, clampedZ)) {
    return { x: clampedX, z: clampedZ, collided: false };
  }
  if (!hitsBox(clampedX, prevPos.z)) {
    return { x: clampedX, z: prevPos.z, collided: true };
  }
  if (!hitsBox(prevPos.x, clampedZ)) {
    return { x: prevPos.x, z: clampedZ, collided: true };
  }
  return { x: prevPos.x, z: prevPos.z, collided: true };
}

export function computeStaffTargetPosition(member, orders = [], tables = []) {
  const id = Number(member?.id) || 1;
  if (member?.role === 'chef') {
    return {
      x: RESTAURANT_ZONES.kitchen.x + ((id % 3) - 1) * 2.4,
      z: RESTAURANT_ZONES.kitchen.z,
    };
  }
  if (member?.role === 'cashier') {
    return {
      x: RESTAURANT_ZONES.cashier.x,
      z: RESTAURANT_ZONES.cashier.z + ((id % 2) * 1.6 - 0.8),
    };
  }
  // Waiter: moves to the table of their assigned serving order, or waits near kitchen pass-through.
  if (member?.status === 'busy' && member.orderId) {
    const ord = orders.find(o => o.id === member.orderId);
    if (ord && tables[ord.table]) {
      const [tx, tz] = tables[ord.table];
      return { x: tx - 1.2, z: tz + 0.9 };
    }
  }
  return {
    x: -74 + (id % 5) * 3.1,
    z: 31.5,
  };
}

export function computeGuestTargetPosition(order, tables = []) {
  if (!order) return { x: RESTAURANT_ZONES.entrance.x, z: RESTAURANT_ZONES.entrance.z };
  if (order.status === 'paying') {
    return {
      x: RESTAURANT_ZONES.cashier.x - 1.6,
      z: RESTAURANT_ZONES.cashier.z - 0.5 + (order.id % 3) * 0.6,
    };
  }
  const spot = tables[order.table];
  if (!spot) return { x: RESTAURANT_ZONES.entrance.x, z: RESTAURANT_ZONES.entrance.z };
  return { x: spot[0] + 0.85, z: spot[1] + 0.7 };
}

export function createHanoiScene(THREE, container, initialState) {
  const registry = createAssetRegistry(THREE);
  const mat = (c, r = 0.84, m = 0.06) => registry.getMaterial(c, r, m);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#a5cce0');
  scene.fog = new THREE.FogExp2('#a5cce0', 0.0055);

  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 700);
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
  renderer.shadowMap.enabled = true;
  container.appendChild(renderer.domElement);

  const hemi = new THREE.HemisphereLight(0xffffff, 0x536578, 1.9);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffe9c8, 2.4);
  sun.position.set(32, 72, 36);
  sun.castShadow = true;
  scene.add(sun);

  // Warm ambient point light inside Nhậu Phố Việt
  const restaurantLight = new THREE.PointLight(0xffb86c, 2.2, 48);
  restaurantLight.position.set(-68, 7.2, 28);
  scene.add(restaurantLight);

  function cube(w, h, d, c, x, y, z, cast = true) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(c));
    m.position.set(x, y, z);
    m.castShadow = cast;
    m.receiveShadow = true;
    scene.add(m);
    return m;
  }

  function ground(w, d, c, x, z, y = 0) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat(c));
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, y, z);
    m.receiveShadow = true;
    scene.add(m);
    return m;
  }

  function cyl(r, h, c, x, y, z) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 10), mat(c));
    m.position.set(x, y, z);
    m.castShadow = true;
    scene.add(m);
    return m;
  }

  function sphere(r, c, x, y, z) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), mat(c));
    m.position.set(x, y, z);
    m.castShadow = true;
    scene.add(m);
    return m;
  }

  function sign(txt, x, y, z, width = 15, height = 3.4, bg = '#743b2c', fg = '#ffe7b3') {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 128;
    const q = c.getContext('2d');
    q.fillStyle = bg;
    q.fillRect(0, 0, 512, 128);
    q.strokeStyle = '#f8c879';
    q.lineWidth = 6;
    q.strokeRect(8, 8, 496, 112);
    q.fillStyle = fg;
    q.font = 'bold 40px Arial';
    q.textAlign = 'center';
    q.fillText(txt, 256, 78);
    const t = new THREE.CanvasTexture(c);
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(width, height),
      new THREE.MeshBasicMaterial({ map: t, side: THREE.DoubleSide })
    );
    m.position.set(x, y, z);
    scene.add(m);
    return m;
  }

  // Terrain, main Hanoi boulevard, cross street, and tiled sidewalks
  ground(350, 310, '#9db290', 0, 0);
  ground(350, 30, '#384149', 0, 0, 0.02);
  ground(36, 310, '#384149', 35, 0, 0.025);
  ground(350, 7, '#c7bfb0', 0, 18.5, 0.03);
  ground(350, 7, '#c7bfb0', 0, -18.5, 0.03);

  for (let x = -165; x < 175; x += 13) cube(5, 0.05, 0.3, '#e1dab4', x, 0.04, 0, false);
  for (let z = -145; z < 155; z += 13) cube(0.3, 0.05, 5, '#e1dab4', 35, 0.06, z, false);
  ground(175, 76, '#d1c9b8', -82, 60, 0.03);
  ground(150, 76, '#d4c9b7', -93, -61, 0.03);

  // Hanoi tube houses (nhà ống) with balconies, rooftop water tanks, and shop signs
  function building(x, z, w, d, h, color, roofColor = '#8c4237') {
    cube(w, h, d, color, x, h / 2, z);
    cube(w + 0.8, 0.7, d + 0.8, roofColor, x, h + 0.35, z);
    // Rooftop stainless steel water tank (bồn nước Sơn Hà style)
    cyl(0.65, 1.8, '#bfc9d1', x - w * 0.22, h + 1.4, z - 1.2);
    const faceZ = z < 0 ? z + d / 2 + 0.08 : z - d / 2 - 0.08;
    const balconyZ = z < 0 ? z + d / 2 + 0.55 : z - d / 2 - 0.55;
    for (let j = 0; j < 3; j++) {
      const wx = x - w / 2 + (j + 1) * (w / 4);
      for (let k = 1; k < Math.ceil(h / 4.8); k++) {
        cube(1.85, 2.2, 0.12, '#9dbfd0', wx, k * 4.2, faceZ, false);
        if (j === 1) cube(3.4, 0.25, 0.9, '#52656f', x, k * 4.2 - 1.1, balconyZ, false);
      }
    }
  }

  const southColors = ['#d9b87c', '#c88f78', '#b8a69a', '#87969b'];
  const northColors = ['#dfbe82', '#a2b9a4', '#bd8c81', '#b3a18c'];
  for (let i = 0; i < 11; i++) {
    const x = -162 + i * 15;
    building(x, -55, 12, 14, 11 + (i % 4) * 4, southColors[i % 4], i % 2 ? '#8c4237' : '#375866');
    building(x, 55, 12, 14, 10 + (i % 5) * 3, northColors[i % 4], i % 2 ? '#375866' : '#8c4237');
  }

  // Neighborhood landmark signage
  sign('TRƯỜNG THPT CHU VĂN AN', -120, 8.5, -47.2, 12, 2.4, '#1f4868', '#ffffff');
  sign('PHỞ GIA TRUYỀN HÀ NỘI', -32, 6.2, -47.2, 11, 2.2, '#7d2923', '#ffe39f');
  sign('CÀ PHÊ PHỐ CỔ', 28, 6.2, 47.2, 10, 2.2, '#3a261b', '#f8d08b');
  sign('CHỢ ĐỒNG XUÂN • TẠP HÓA', 88, 6.5, 47.2, 12, 2.3, '#1e523a', '#e8f9ee');

  // Trees & Streetlamps
  function tree(x, z) {
    cyl(0.35, 5, '#74634a', x, 2.5, z);
    sphere(3.2, '#57845c', x, 6.5, z);
    sphere(2.2, '#4d764f', x + 1, 8, z - 0.5);
  }
  const lampBulbs = [];
  function streetLamp(x, z) {
    cyl(0.14, 6.8, '#384652', x, 3.4, z);
    const bulb = sphere(0.38, '#fff2b2', x, 6.9, z);
    lampBulbs.push(bulb);
  }
  for (let x = -160; x < 165; x += 17) {
    tree(x, 24);
    tree(x, -24);
    if (x % 34 === 0) {
      streetLamp(x + 5, 16);
      streetLamp(x + 5, -16);
    }
  }

  // --- NHẬU PHỐ VIỆT Restaurant Pavilion & Functional Zones ---
  ground(36, 34, '#e1c6a1', -68, 29.5, 0.07);
  // Open-air pavilion pillars and roof
  cube(30, 0.9, 20, '#a9533b', -68, 8.6, 33);
  cube(28, 3.2, 1.2, '#d8b38b', -68, 1.6, 41.5);
  for (const px of [-81.5, -54.5]) {
    for (const pz of [24, 41]) {
      cyl(0.32, 8.4, '#5a3828', px, 4.2, pz);
    }
  }
  sign('NHẬU PHỐ VIỆT', -68, 9.5, 22.8, 16, 3.5, '#743b2c', '#ffe7b3');

  // Kitchen Counter (Quầy Bếp)
  cube(7.5, 1.25, 2.2, '#54636e', RESTAURANT_ZONES.kitchen.x, 0.65, RESTAURANT_ZONES.kitchen.z + 1.4);
  cube(7.6, 0.8, 2.4, '#7d8c96', RESTAURANT_ZONES.kitchen.x, 4.2, RESTAURANT_ZONES.kitchen.z + 1.4);
  sign('BẾP NÓNG', RESTAURANT_ZONES.kitchen.x, 3.1, RESTAURANT_ZONES.kitchen.z + 2.6, 4.5, 1.1, '#8c3b2b', '#fff1c9');

  // Cashier Counter (Quầy Thu Ngân)
  cube(3.2, 1.2, 1.8, '#694432', RESTAURANT_ZONES.cashier.x + 1.2, 0.6, RESTAURANT_ZONES.cashier.z);
  cube(0.8, 0.55, 0.7, '#293540', RESTAURANT_ZONES.cashier.x + 1.2, 1.45, RESTAURANT_ZONES.cashier.z);
  sign('THU NGÂN', RESTAURANT_ZONES.cashier.x + 1.2, 2.9, RESTAURANT_ZONES.cashier.z, 3.6, 1.0, '#225943', '#e6fff2');

  // Delivery & Stock Zone (Khu Nguyên Liệu)
  cube(2.2, 1.0, 2.2, '#8b6843', RESTAURANT_ZONES.delivery.x, 0.5, RESTAURANT_ZONES.delivery.z);
  cube(1.6, 0.9, 1.6, '#9c7850', RESTAURANT_ZONES.delivery.x + 1.4, 0.45, RESTAURANT_ZONES.delivery.z - 1.5);

  // Restaurant Dining Tables & Vietnamese Plastic Stools
  const tables = [];
  function makeTable(i) {
    const cols = 5;
    const tx = -81 + (i % cols) * 6.3;
    const tz = 15 + Math.floor(i / cols) * 5.8;
    // Table top & base
    cyl(1.38, 0.14, '#8a553d', tx, 0.82, tz);
    cyl(0.28, 0.8, '#4a352a', tx, 0.4, tz);
    // Low plastic stools (blue & red Hanoi beer stools)
    const stoolColor = i % 2 === 0 ? '#2b6cb0' : '#c53030';
    cyl(0.34, 0.44, stoolColor, tx + 1.85, 0.22, tz);
    cyl(0.34, 0.44, stoolColor, tx - 1.85, 0.22, tz);
    cyl(0.34, 0.44, stoolColor, tx, 0.22, tz + 1.75);
    tables.push([tx, tz]);
  }
  for (let i = 0; i < initialState.tables; i++) makeTable(i);

  // Person Avatar Builder with Role Accessories
  function person(color, x, z, scale = 1, roleBadge = null) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.48, 2, 9), mat(color));
    body.position.y = 2;
    g.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.64, 10, 8), mat('#e6ae89'));
    head.position.y = 3.45;
    g.add(head);
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.64, 10, 8), mat('#252e36'));
    hair.position.y = 3.77;
    hair.scale.set(1, 0.5, 1);
    g.add(hair);

    if (roleBadge === 'chef') {
      const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.45, 0.75, 10), mat('#ffffff'));
      hat.position.y = 4.35;
      g.add(hat);
    } else if (roleBadge === 'cashier') {
      const visor = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.2, 0.9), mat('#225943'));
      visor.position.y = 4.05;
      g.add(visor);
    } else if (roleBadge === 'waiter') {
      const tray = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.08, 10), mat('#d4a359'));
      tray.position.set(0.75, 2.35, 0.35);
      g.add(tray);
    }

    g.position.set(x, 0, z);
    g.scale.setScalar(scale);
    scene.add(g);
    return g;
  }

  // Citizens on the street
  const people = [];
  const colors = ['#36739b', '#bc6a60', '#728a6c', '#b59158', '#676f9b', '#a35f89', '#db9c55'];
  const roles = ['student', 'worker', 'shopkeeper', 'delivery', 'resident', 'worker', 'student'];
  for (let i = 0; i < 35; i++) {
    const x = -150 + (i * 37) % 300;
    const z = i % 2 ? 21 : -21;
    people.push({
      i,
      role: roles[i % roles.length],
      activity: '',
      obj: person(colors[i % colors.length], x, z, 0.79 + (i % 4) * 0.06),
      speed: 0.07 + (i % 5) * 0.013,
      target: { x, z },
      dir: i % 2 ? 1 : -1,
    });
  }

  function npcDestination(p, activity, citizenData) {
    const i = p.i;
    if (activity === 'dining_out') {
      return { x: RESTAURANT_ZONES.entrance.x + (i % 5) - 2, z: RESTAURANT_ZONES.entrance.z + 3 };
    }
    if (activity === 'home' || activity === 'sleep') {
      if (citizenData?.home) return { x: citizenData.home.x, z: citizenData.home.z };
      return { x: -150 + (i * 19) % 295, z: i % 2 ? 43 : -43 };
    }
    if (activity === 'work') {
      if (citizenData?.workplace) return { x: citizenData.workplace.x, z: citizenData.workplace.z };
      return { x: -140 + (i * 23) % 280, z: i % 2 ? 26 : -26 };
    }
    if (activity === 'lunch' || activity === 'dinner') {
      return { x: -80 + (i % 8) * 4, z: 18 + (i % 3) * 3 };
    }
    if (activity === 'shop' || activity === 'leisure') {
      return { x: -108 + (i % 10) * 10, z: 21 + (i % 2) * 3 };
    }
    return { x: -148 + (i * 37) % 296, z: i % 2 ? 21 : -21 };
  }

  // Independent Restaurant Staff Avatars (Chefs, Waiters, Cashiers)
  const staffMap = new Map();
  const roleColors = {
    chef: '#e8eef2',
    waiter: '#c2593f',
    cashier: '#2d8a6b',
  };

  function syncStaffAvatars(state) {
    const roster = Array.isArray(state.staffRoster) ? state.staffRoster : [];
    const activeIds = new Set(roster.map(m => m.id));
    for (const m of roster) {
      if (!staffMap.has(m.id)) {
        const initTarget = computeStaffTargetPosition(m, state.orders, tables);
        const obj = person(roleColors[m.role] || '#ab4935', initTarget.x, initTarget.z, 0.86, m.role);
        staffMap.set(m.id, { member: m, obj });
      } else {
        staffMap.get(m.id).member = m;
      }
    }
    for (const [id, entry] of staffMap) {
      if (!activeIds.has(id)) {
        scene.remove(entry.obj);
        staffMap.delete(id);
      }
    }
  }
  syncStaffAvatars(initialState);

  // Player (Restaurant Owner)
  const player = person('#2c668d', -50, 14, 1);
  const playerMarker = sphere(0.32, '#ffd15b', -50, 4.6, 14);

  // Guest Avatars
  const guestAvatars = new Map();
  function syncGuests(state) {
    const current = activeOrders(state);
    const ids = new Set(current.map(o => o.id));
    for (const o of current) {
      if (!guestAvatars.has(o.id)) {
        guestAvatars.set(
          o.id,
          person(colors[o.id % colors.length], RESTAURANT_ZONES.entrance.x, RESTAURANT_ZONES.entrance.z, 0.78)
        );
      }
      const avatar = guestAvatars.get(o.id);
      avatar.userData.target = computeGuestTargetPosition(o, tables);
      avatar.userData.status = o.status;
    }
    for (const [id, g] of guestAvatars) {
      if (!ids.has(id)) {
        scene.remove(g);
        guestAvatars.delete(id);
      }
    }
  }
  syncGuests(initialState);

  // Motorbikes / Scooters on the street
  const vehicles = [];
  for (let i = 0; i < 11; i++) {
    const x = -165 + i * 32;
    const z = i % 2 ? -5 : 5;
    const body = cube(2, 1.1, 1.6, colors[i % colors.length], x, 1.2, z);
    const wheel1 = cyl(0.7, 0.25, '#20262c', x - 0.7, 0.6, z);
    const wheel2 = cyl(0.7, 0.25, '#20262c', x + 0.7, 0.6, z);
    vehicles.push({ body, wheel1, wheel2, dir: i % 2 ? -1 : 1, speed: 0.15 + i * 0.012 });
  }

  // Rain streaks
  const rainDrops = [];
  for (let i = 0; i < 65; i++) {
    const drop = cube(0.06, 1.4, 0.06, '#cfe8ff', -140 + (i * 19) % 280, 4 + (i % 14), -70 + (i * 23) % 140, false);
    drop.visible = false;
    rainDrops.push(drop);
  }

  let frameCounter = 0;

  function stepFrame(state, dt, keys, cameraControl) {
    frameCounter++;
    const speed = dt * 15;
    let nextX = player.position.x;
    let nextZ = player.position.z;
    if (keys.has('w') || keys.has('arrowup')) nextZ -= speed;
    if (keys.has('s') || keys.has('arrowdown')) nextZ += speed;
    if (keys.has('a') || keys.has('arrowleft')) nextX -= speed;
    if (keys.has('d') || keys.has('arrowright')) nextX += speed;

    const resolved = resolvePlayerCollision(
      { x: player.position.x, z: player.position.z },
      { x: nextX, z: nextZ },
      1.0
    );
    player.position.x = resolved.x;
    player.position.z = resolved.z;
    playerMarker.position.set(player.position.x, 4.6, player.position.z);

    // Update Citizens with distance-based LOD
    const popCount = npcPopulation(state.minute);
    for (const p of people) {
      const citizenData = state.citizens?.[p.i] || null;
      const phase = citizenData?.activity || npcActivity(p.role, state.minute, { rain: state.rain });
      p.obj.visible = p.i < popCount && phase !== 'dining_out';
      if (!p.obj.visible) continue;

      const distToPlayer = Math.hypot(p.obj.position.x - player.position.x, p.obj.position.z - player.position.z);
      const lod = computeNpcLodTier(distToPlayer);
      if (frameCounter % lod.frameStride !== 0) continue;

      if (phase !== p.activity) {
        p.activity = phase;
        p.target = npcDestination(p, phase, citizenData);
      }
      if (p.activity === 'commute' || p.activity === 'leisure' || p.activity === 'shop') {
        p.target.x += p.dir * dt * 3 * lod.frameStride;
        if (p.target.x > 155 || p.target.x < -155) p.dir *= -1;
      }
      const dx = p.target.x - p.obj.position.x;
      const dz = p.target.z - p.obj.position.z;
      const dist = Math.hypot(dx, dz);
      if (dist > 0.2) {
        const move = Math.min(dist, p.speed * dt * 60 * lod.frameStride);
        p.obj.position.x += (dx / dist) * move;
        p.obj.position.z += (dz / dist) * move;
        p.obj.rotation.y = Math.atan2(dx, dz);
      }
    }

    // Update Independent Staff Avatars (Chefs at stove, Waiters serving tables, Cashiers at checkout)
    for (const { member, obj } of staffMap.values()) {
      const target = computeStaffTargetPosition(member, state.orders, tables);
      const dx = target.x - obj.position.x;
      const dz = target.z - obj.position.z;
      const dist = Math.hypot(dx, dz);
      if (dist > 0.12) {
        const move = Math.min(dist, dt * 8.5);
        obj.position.x += (dx / dist) * move;
        obj.position.z += (dz / dist) * move;
        obj.rotation.y = Math.atan2(dx, dz);
      }
    }

    // Update Vehicles
    for (const v of vehicles) {
      for (const o of [v.body, v.wheel1, v.wheel2]) {
        o.position.x += v.dir * v.speed * dt * 60;
        if (Math.abs(o.position.x) > 170) o.position.x = -Math.sign(o.position.x) * 170;
      }
    }

    // Update Restaurant Guests (seating -> eating -> paying at cashier -> leaving)
    for (const g of guestAvatars.values()) {
      const target = g.userData.target;
      if (!target) continue;
      const dx = target.x - g.position.x;
      const dz = target.z - g.position.z;
      const dist = Math.hypot(dx, dz);
      if (dist > 0.15) {
        const move = Math.min(dist, dt * 9);
        g.position.x += (move * dx) / dist;
        g.position.z += (move * dz) / dist;
        g.rotation.y = Math.atan2(dx, dz);
      }
    }

    // Update Rain & Day/Night Lighting
    for (const drop of rainDrops) {
      drop.visible = Boolean(state.rain);
      if (state.rain) {
        drop.position.y -= dt * 26;
        if (drop.position.y < 0.5) drop.position.y = 18;
      }
    }

    const daylight = Math.sin((state.minute / 1440) * Math.PI * 2 - Math.PI / 2);
    const isNight = daylight <= -0.15;
    scene.background.set(!isNight ? (state.rain ? '#778a9b' : '#a5cce0') : '#16293f');
    sun.intensity = !isNight ? (state.rain ? 0.85 : 2.3) : 0.24;
    restaurantLight.intensity = isNight ? 3.2 : 1.5;

    const { yaw, zoom } = cameraControl;
    camera.position.set(
      player.position.x + Math.sin(yaw) * zoom,
      zoom * 0.68,
      player.position.z + Math.cos(yaw) * zoom
    );
    camera.lookAt(player.position.x, 2, player.position.z);
    renderer.render(scene, camera);
  }

  function resize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  return {
    scene,
    camera,
    renderer,
    tables,
    makeTable,
    syncGuests,
    syncStaffAvatars,
    stepFrame,
    resize,
    assetStats: () => registry.stats(),
  };
}
