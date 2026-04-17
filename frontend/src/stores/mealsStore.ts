import { create } from 'zustand';

interface MealsStore {
  // Counter that increments each time we need to refresh meals
  refreshCounter: number;
  // Function to trigger a refresh
  triggerRefresh: () => void;
}

export const useMealsStore = create<MealsStore>((set) => ({
  refreshCounter: 0,
  triggerRefresh: () => set((state) => ({ refreshCounter: state.refreshCounter + 1 })),
}));
