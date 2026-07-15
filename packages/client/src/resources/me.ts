import type { ApiClient } from "../client.js";
import { effectMutation, effectQuery } from "../query.js";
import type { EndpointPayload } from "./shared.js";
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
  setup: (workspaceId: string) =>
    effectQuery({
      queryKey: ["me", "setup", workspaceId] as const,
      effect: () => client.me.setup({ params: { workspaceId } }),
      runner,
    }),
  updateSetup: (workspaceId: string) =>
    effectMutation({
      mutationKey: ["me", "setup", workspaceId] as const,
      effect: (payload: EndpointPayload<ApiClient["me"]["updateSetup"]>) =>
        client.me.updateSetup({ params: { workspaceId }, payload }),
      runner,
    }),
  emailPreferences: () =>
    effectQuery({
      queryKey: ["me", "email-preferences"] as const,
      effect: () => client.me.emailPreferences(),
      runner,
    }),
  updateEmailPreferences: () =>
    effectMutation({
      mutationKey: ["me", "email-preferences"] as const,
      effect: (
        payload: EndpointPayload<ApiClient["me"]["updateEmailPreferences"]>
      ) => client.me.updateEmailPreferences({ payload }),
      runner,
    }),
}));
