import { resourceEffect } from "../resource.js";
import { defineResourceEffects } from "./shared.js";

export const createHealthEffects = defineResourceEffects(({ client }) => ({
  check: () =>
    resourceEffect({
      queryKey: ["health"] as const,
      effect: () => client.health.check(),
    }),
}));
