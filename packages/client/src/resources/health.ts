import { effectQuery } from "../query.js";
import { defineResourceOptions } from "./shared.js";

export const createHealthOptions = defineResourceOptions(
  ({ client, runner }) => ({
    check: () =>
      effectQuery({
        queryKey: ["health"] as const,
        effect: () => client.health.check(),
        runner,
      }),
  })
);
