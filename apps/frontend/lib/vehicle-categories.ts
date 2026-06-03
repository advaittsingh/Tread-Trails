/** Display order for vehicle hubs grouped by platform type. */
export const VEHICLE_CATEGORY_ORDER = [
  "Pickup",
  "SUV",
  "4×4",
  "Armoured & special utility",
  "Restoration",
] as const;

export type VehicleCategory = (typeof VEHICLE_CATEGORY_ORDER)[number];

export function sortCarsByCategory<T extends { category: string; name: string }>(
  items: T[]
): T[] {
  const rank = new Map(
    VEHICLE_CATEGORY_ORDER.map((c, i) => [c, i] as const)
  );
  return [...items].sort((a, b) => {
    const ra = rank.get(a.category as VehicleCategory) ?? 99;
    const rb = rank.get(b.category as VehicleCategory) ?? 99;
    if (ra !== rb) return ra - rb;
    return a.name.localeCompare(b.name);
  });
}

export function groupCarsByCategory<T extends { category: string; name: string }>(
  items: T[]
): { category: string; items: T[] }[] {
  const sorted = sortCarsByCategory(items);
  const groups: { category: string; items: T[] }[] = [];
  for (const item of sorted) {
    const last = groups[groups.length - 1];
    if (last?.category === item.category) {
      last.items.push(item);
    } else {
      groups.push({ category: item.category, items: [item] });
    }
  }
  return groups;
}
