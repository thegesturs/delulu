import { createComposerHandoffUrl } from "@/lib/composer-handoff";

export type PlannerItemKind = "image" | "video";

export interface PlannerItem {
  id: string;
  name: string;
  kind: PlannerItemKind;
  previewUrl: string;
}

export const movePlannerItem = (
  items: readonly PlannerItem[],
  activeId: string,
  targetId: string
): PlannerItem[] => {
  const from = items.findIndex((item) => item.id === activeId);
  const to = items.findIndex((item) => item.id === targetId);

  if (from < 0 || to < 0 || from === to) {
    return [...items];
  }

  const reordered = [...items];
  const [active] = reordered.splice(from, 1);
  if (!active) {
    return [...items];
  }
  reordered.splice(to, 0, active);
  return reordered;
};

export const movePlannerItemByOffset = (
  items: readonly PlannerItem[],
  id: string,
  offset: -1 | 1
): PlannerItem[] => {
  const from = items.findIndex((item) => item.id === id);
  const to = from + offset;

  if (from < 0 || to < 0 || to >= items.length) {
    return [...items];
  }

  return movePlannerItem(items, id, items[to]?.id ?? id);
};

export const removePlannerItem = (
  items: readonly PlannerItem[],
  id: string
): PlannerItem[] => items.filter((item) => item.id !== id);

export const selectedPlannerItems = (
  items: readonly PlannerItem[],
  selectedIds: ReadonlySet<string>
): PlannerItem[] => {
  if (selectedIds.size === 0) {
    return [...items];
  }
  return items.filter((item) => selectedIds.has(item.id));
};

export const buildComposerDraft = (
  items: readonly PlannerItem[],
  selectedIds: ReadonlySet<string>
): string => {
  const selected = selectedPlannerItems(items, selectedIds);
  const orderedNames = selected.map(
    (item, index) => `${index + 1}. ${item.name}`
  );
  return `Planned post order:\n\n${orderedNames.join("\n")}`;
};

export const buildComposerUrl = (
  composerUrl: string,
  items: readonly PlannerItem[],
  selectedIds: ReadonlySet<string>
): string => {
  return createComposerHandoffUrl(
    composerUrl,
    buildComposerDraft(items, selectedIds)
  );
};
