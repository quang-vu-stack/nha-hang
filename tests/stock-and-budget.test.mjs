import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createState, advanceSimulation, restockIngredients, menuAvailability,
  selectMenuDish, serializeSave, deserializeSave,
} from '../src/simulation.mjs';

function stockState(ingredients, extra = {}) {
  return createState({
    stock: Object.values(ingredients).reduce((sum, value) => sum + value, 0),
    ingredients, open: false, ...extra,
  });
}
const noStock = { meat: 0, seafood: 0, veggies: 0, drinks: 0, spices: 0 };

test('old queued orders wait for their actual ingredient and resume after targeted restock', () => {
  let state = stockState({ ...noStock, drinks: 4 }, {
    orders: [{ id: 1, table: 0, dishId: 'nem_ran', status: 'queued', remaining: 0, wait: 0 }],
  });
  advanceSimulation(state, 3, () => 0);
  assert.equal(state.orders[0].status, 'queued');
  assert.equal(state.ingredients.drinks, 4);
  assert.equal(state.todayIngredientCost, 0);
  assert.equal(restockIngredients(state, 20, 160000, 'meat'), true);
  state = deserializeSave(serializeSave(state)).state;
  advanceSimulation(state, 1, () => 0);
  assert.equal(state.orders[0].status, 'cooking');
  assert.equal(state.ingredients.meat, 19);
  assert.equal(state.ingredients.drinks, 4);
  assert.equal(state.stock, 23);
});

test('queued orders reserve stock shared by different dishes', () => {
  const state = stockState({ ...noStock, meat: 1, drinks: 1 }, {
    orders: [{ id: 1, table: 0, dishId: 'nem_ran', status: 'queued' }],
  });
  const menu = menuAvailability(state);
  assert.equal(menu.find(dish => dish.id === 'nem_ran').available, 0);
  assert.equal(menu.find(dish => dish.id === 'bo_luc_lac').available, 0);
  assert.equal(selectMenuDish(state, () => 0).id, 'bia_lac');
  assert.equal(state.ingredients.meat, 1, 'availability does not consume reserved stock');
});

test('vegetables alone cannot produce an unrelated menu dish', () => {
  const state = stockState({ ...noStock, veggies: 50 }, { open: true, nextVisitor: 1 });
  assert.equal(selectMenuDish(state), null);
  advanceSimulation(state, 1, () => 0);
  assert.equal(state.orders.length, 0);
  assert.equal(state.rejected, 1);
  assert.equal(state.stock, 50);
});

test('menu respects the entire bill and citizens pay without a free wallet top-up', () => {
  const state = stockState({ ...noStock, drinks: 5 }, { open: true, nextVisitor: 1 });
  const total = menuAvailability(state).find(dish => dish.id === 'bia_lac').total;
  assert.equal(selectMenuDish(state, () => 0, total - 1), null);
  assert.equal(selectMenuDish(state, () => 0, total).id, 'bia_lac');
  state.citizens[0].budget = total;
  state.citizens[0].hunger = 80;
  state.citizens[0].name = 'Khách thử';
  advanceSimulation(state, 1, () => 0);
  assert.equal(state.orders[0].customer, 'Khách thử');
  state.open = false;
  const cash = state.cash;
  advanceSimulation(state, 40, () => 0);
  assert.equal(state.citizens[0].budget, 0);
  assert.equal(state.cash, cash + total);
  assert.equal(state.served, 1);
});

test('unaffordable arrivals leave without an order or wallet mutation', () => {
  const state = createState({ nextVisitor: 1 });
  for (const citizen of state.citizens) {
    citizen.hunger = 80;
    citizen.budget = 50000;
  }
  advanceSimulation(state, 1, () => 0);
  assert.equal(state.orders.length, 0);
  assert.equal(state.rejected, 1);
  assert.equal(state.citizens[0].budget, 50000);
  assert.equal(state.citizens[0].currentOrderId, null);
});

test('failed or invalid restock is atomic and targeted restock changes only one bucket', () => {
  const state = createState({ cash: 160000 });
  const snapshot = structuredClone(state);
  for (const args of [[20, 160001, 'meat'], [20, 1, 'unknown'], [Infinity, 1, 'meat'], [20, NaN, 'meat']]) {
    assert.equal(restockIngredients(state, ...args), false);
    assert.deepEqual(state, snapshot);
  }
  assert.equal(restockIngredients(state, 20, 160000, 'seafood'), true);
  assert.equal(state.cash, 0);
  assert.equal(state.ingredients.seafood, snapshot.ingredients.seafood + 20);
  assert.equal(state.ingredients.meat, snapshot.ingredients.meat);
  assert.equal(state.stock, snapshot.stock + 20);
});
