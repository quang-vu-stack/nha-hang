import { helpOrder } from './simulation.mjs';
import { RESTAURANT_ZONES } from './world/hanoi-scene.mjs';

export function nearbyOwnerAction(state, position, tables) {
  let nearest = null;
  let nearestDistance = 3.2;
  for (const order of state.orders) {
    if (order.paid) continue;
    let target;
    let action;
    if (order.status === 'serving' && tables[order.table]) {
      const [x, z] = tables[order.table];
      target = { x, z };
      action = 'serve';
    } else if (order.status === 'paying') {
      target = RESTAURANT_ZONES.cashier;
      action = 'pay';
    } else {
      continue;
    }
    const distance = Math.hypot(position.x - target.x, position.z - target.z);
    if (distance <= nearestDistance) {
      nearestDistance = distance;
      nearest = {
        orderId: order.id,
        action,
        label: action === 'serve'
          ? `Giao ${order.dishName} · Bàn ${order.table + 1}`
          : `Thu tiền bàn ${order.table + 1}`,
      };
    }
  }
  return nearest;
}

export function performOwnerAction(state, position, tables) {
  const target = nearbyOwnerAction(state, position, tables);
  return target && helpOrder(state, target.orderId, target.action) ? target : null;
}
