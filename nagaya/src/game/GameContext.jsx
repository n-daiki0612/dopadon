import React, { createContext, useContext, useReducer, useMemo } from 'react';
import { gameReducer, initialState } from './reducer.js';
const GameContext = createContext(null);
export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, undefined, initialState);
  const actions = useMemo(() => ({
    catchFish: id => dispatch({ type: 'CATCH_FISH', id }),
    createBowl: ingredients => dispatch({ type: 'CREATE_BOWL', ingredients }),
    sellBowl: () => dispatch({ type: 'SELL_BOWL' }),
    buyUpgrade: id => dispatch({ type: 'BUY_UPGRADE', id }),
    spawnFish: fish => dispatch({ type: 'SPAWN_FISH', fish }),
    removeFish: id => dispatch({ type: 'REMOVE_FISH', id }),
    clearFish: () => dispatch({ type: 'CLEAR_FISH' }),
  }), []);
  return <GameContext.Provider value={{ state, ...actions }}>{children}</GameContext.Provider>;
}
export const useGame = () => useContext(GameContext);
