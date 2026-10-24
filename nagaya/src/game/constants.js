export const FISH = {
  sakuraebi: { name: '桜エビ', price: 50, weight: 45, image: '/assets/sakuraebi.png', color: '#ef876d', label: 'SAKURA SHRIMP' },
  shirasu: { name: 'シラス', price: 70, weight: 35, image: '/assets/shirasu.png', color: '#d9e8ea', label: 'WHITEBAIT' },
  maguro: { name: 'マグロ', price: 150, weight: 20, image: '/assets/maguro.png', color: '#589baa', label: 'TUNA' },
};
export const BALANCE = { initialInterval: 1500, minInterval: 500, intervalFactor: 0.85, firstCost: 200, costFactor: 1.7, maxLevel: 5, swimDuration: 11000, maxFish: 24 };
export const emptyIngredients = () => Object.fromEntries(Object.keys(FISH).map(id => [id, 0]));
export const spawnInterval = level => Math.max(BALANCE.minInterval, Math.round(BALANCE.initialInterval * BALANCE.intervalFactor ** level));
export const upgradeCost = level => Math.round(BALANCE.firstCost * BALANCE.costFactor ** level);
export const bowlPrice = ingredients => Object.entries(ingredients).reduce((sum, [id, count]) => sum + FISH[id].price * count, 0);
export function randomFish(random = Math.random()) {
  let target = random * Object.values(FISH).reduce((sum, fish) => sum + fish.weight, 0);
  return Object.keys(FISH).find(id => (target -= FISH[id].weight) < 0) || 'maguro';
}
