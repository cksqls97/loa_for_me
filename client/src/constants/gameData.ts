export type MaterialType = 'abidos' | 'superior';

export const COSTS: Record<MaterialType, { rare: number, uncommon: number, common: number, gold: number }> = {
  abidos: { rare: 33, uncommon: 45, common: 86, gold: 400 },
  superior: { rare: 43, uncommon: 59, common: 112, gold: 520 }
};

export interface CraftingEntry {
  id: string;
  timestamp: number;
  type: MaterialType;
  unitCost: number;
  totalCost: number;
  expectedOutput: number;
  expectedProfit: number;
  actualOutput?: number;
  actualProfit?: number;
}
