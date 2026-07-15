import { resourceEffect } from "../resource.js";
import { defineResourceEffects } from "./shared.js";

export const createMeEffects = defineResourceEffects(({ client }) => ({
  current: () =>
    resourceEffect({
      queryKey: ["me", "current"] as const,
      effect: () => client.me.current(),
    }),
  workspaces: () =>
    resourceEffect({
      queryKey: ["me", "workspaces"] as const,
      effect: () => client.me.workspaces(),
    }),
}));
