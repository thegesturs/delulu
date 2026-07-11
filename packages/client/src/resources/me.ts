import { effectQuery } from "../query.js";
import { defineResourceOptions } from "./shared.js";

export const createMeOptions = defineResourceOptions(({ client, runner }) => ({
  current: () =>
    effectQuery({
      queryKey: ["me", "current"] as const,
      effect: () => client.me.current(),
      runner,
    }),
  workspaces: () =>
    effectQuery({
      queryKey: ["me", "workspaces"] as const,
      effect: () => client.me.workspaces(),
      runner,
    }),
}));
