import { FISH, BALANCE, emptyIngredients, bowlPrice, upgradeCost } from './constants.js';
export const initialState = () => ({ money: 0, inventory: emptyIngredients(), upgrades: { lure: 0 }, bowl: null, activeFish: [], stats: { caught: 0, sold: 0, earned: 0 } });
export function gameReducer(state, action) {
  switch (action.type) {
    case 'SPAWN_FISH':
      if (!action.fish || !FISH[action.fish.species] || !action.fish.id || state.activeFish.length >= BALANCE.maxFish || state.activeFish.some(f => f.id === action.fish.id)) return state;
      return { ...state, activeFish: [...state.activeFish, action.fish] };
    case 'REMOVE_FISH': return { ...state, activeFish: state.activeFish.filter(f => f.id !== action.id) };
    case 'CLEAR_FISH': return { ...state, activeFish: [] };
    case 'CATCH_FISH': {
      const fish = state.activeFish.find(f => f.id === action.id);
      if (!fish) return state;
      return { ...state, activeFish: state.activeFish.filter(f => f.id !== action.id), inventory: { ...state.inventory, [fish.species]: state.inventory[fish.species] + 1 }, stats: { ...state.stats, caught: state.stats.caught + 1 } };
    }
    case 'CREATE_BOWL': {
      const input = action.ingredients;
      if (state.bowl || !input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).some(id => !Object.hasOwn(FISH, id))) return state;
      const ingredients = { ...emptyIngredients(), ...input };
      if (Object.entries(ingredients).some(([id, n]) => !Number.isSafeInteger(n) || n < 0 || n > state.inventory[id]) || !Object.values(ingredients).some(n => n > 0)) return state;
      return { ...state, inventory: Object.fromEntries(Object.entries(state.inventory).map(([id, n]) => [id, n - ingredients[id]])), bowl: { ingredients, price: bowlPrice(ingredients) } };
    }
    case 'SELL_BOWL':
      if (!state.bowl) return state;
      return { ...state, money: state.money + state.bowl.price, bowl: null, stats: { ...state.stats, sold: state.stats.sold + 1, earned: state.stats.earned + state.bowl.price } };
    case 'BUY_UPGRADE': {
      if (action.id !== 'lure') return state;
      const level = state.upgrades.lure;
      const cost = upgradeCost(level);
      if (level >= BALANCE.maxLevel || state.money < cost) return state;
      return { ...state, money: state.money - cost, upgrades: { ...state.upgrades, lure: level + 1 } };
    }
    default: return state;
  }
}
