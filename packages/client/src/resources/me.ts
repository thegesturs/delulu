import type { ApiClient } from "../client.js";
import { mutationEffect, resourceEffect } from "../resource.js";
import type { EndpointPayload } from "./shared.js";
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
  overview: (workspaceId: string) =>
    resourceEffect({
      queryKey: ["me", "overview", workspaceId] as const,
      effect: () => client.me.overview({ params: { workspaceId } }),
    }),
  setup: (workspaceId: string) =>
    resourceEffect({
      queryKey: ["me", "setup", workspaceId] as const,
      effect: () => client.me.setup({ params: { workspaceId } }),
    }),
  updateSetup: (workspaceId: string) =>
    mutationEffect({
      mutationKey: ["me", "setup", workspaceId] as const,
      effect: (payload: EndpointPayload<ApiClient["me"]["updateSetup"]>) =>
        client.me.updateSetup({ params: { workspaceId }, payload }),
    }),
  completeSetup: (workspaceId: string) =>
    mutationEffect({
      mutationKey: ["me", "setup", workspaceId] as const,
      effect: () => client.me.completeSetup({ params: { workspaceId } }),
    }),
  emailPreferences: () =>
    resourceEffect({
      queryKey: ["me", "email-preferences"] as const,
      effect: () => client.me.emailPreferences(),
    }),
  updateEmailPreferences: () =>
    mutationEffect({
      mutationKey: ["me", "email-preferences"] as const,
      effect: (
        payload: EndpointPayload<ApiClient["me"]["updateEmailPreferences"]>
      ) => client.me.updateEmailPreferences({ payload }),
    }),
}));
