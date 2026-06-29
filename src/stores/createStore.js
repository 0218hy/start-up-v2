import { useSyncExternalStore } from "react";

const identity = (state) => state;

export function createStore(createState) {
  let state;
  const listeners = new Set();

  const getState = () => state;

  const setState = (partial) => {
    const nextState = typeof partial === "function" ? partial(state) : partial;
    state =
      nextState && typeof nextState === "object"
        ? { ...state, ...nextState }
        : nextState;
    listeners.forEach((listener) => listener());
  };

  const subscribe = (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  state = createState(setState, getState);

  const useStore = (selector = identity) =>
    useSyncExternalStore(
      subscribe,
      () => selector(state),
      () => selector(state)
    );

  useStore.getState = getState;
  useStore.setState = setState;
  useStore.subscribe = subscribe;

  return useStore;
}
