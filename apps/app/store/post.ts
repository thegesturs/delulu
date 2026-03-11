import type { Id } from "@delulu/database/convex/_generated/dataModel";
import type { GetPostByIdSchema } from "@delulu/database/convex/schemas/posts_media";
import { DEFAULT_TIKTOK_SETTINGS } from "@delulu/validators/constants/settings";
import type {
  FullPostType,
  ProviderSetting,
  SocialProviderType,
  TikTokSettings,
} from "@delulu/validators/post";
import { promotionContentTypes } from "@delulu/validators/post";
import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";
import { useShallow } from "zustand/shallow";
import type { NodePositions } from "@/components/automations/flow-builder/hooks/use-automation-state";
import type {
  AutomationStep,
  Note,
  TriggerStep,
} from "@/components/automations/flow-builder/utils/flow-types";

export interface InlineAutomationConfig {
  templateSlug: string;
  socialProviderId: string;
  name: string;
  triggers: TriggerStep[];
  steps: AutomationStep[];
  notes: Note[];
  nodePositions: NodePositions;
  isActive: boolean;
  /** Set when editing an existing automation — triggers update instead of create */
  existingAutomationId?: string;
}

// Define the store's state types
interface PostState {
  date: Date | undefined;
  time: string | null;
  post: FullPostType;
  selectedSocialProviders: SocialProviderType[];
  shouldReset: boolean;
  // TikTok specific settings - @deprecated use providerSettings
  tiktokSettings: TikTokSettings | null;
  // Provider-specific settings (socialProviderId -> settings)
  providerSettings: Record<string, ProviderSetting>;
  // Media upload state
  isMediaUploading: boolean;
  // Inline automation configs (keyed by socialProviderId)
  automationConfigs: Record<string, InlineAutomationConfig>;
}

// Define the store's actions
interface PostActions {
  setShouldReset: (shouldReset: boolean) => void;
  setDateAlongWithTime: (date: Date | undefined) => void;
  setTime: (time: string | null) => void;
  setPost: (
    post: FullPostType | ((currentPost: FullPostType) => FullPostType)
  ) => void;
  setSelectedSocialProviders: (providers: SocialProviderType[]) => void;
  setTikTokSettings: (settings: Partial<TikTokSettings>) => void; // @deprecated
  setProviderSettings: (providerId: string, setting: ProviderSetting) => void;
  getProviderSettings: (providerId: string) => ProviderSetting | undefined;
  setIsMediaUploading: (isUploading: boolean) => void;
  setAutomationConfig: (
    providerId: string,
    config: InlineAutomationConfig | null
  ) => void;
  loadPost: (postData: GetPostByIdSchema) => void;
  cleanupDeletedProviders: (validProviderIds: string[]) => void;
  reset: () => void;
}

const initialState: PostState = {
  date: undefined,
  time: "00:00",
  shouldReset: false,
  post: {
    id: "",
    content: [
      {
        title: "",
        text: "",
        media: [],
        name: "DEFAULT",
        order: 0,
        tags: [],
      },
    ],
    alternativeContent: [],
    scheduledTime: undefined,
    orgId: "",
  },
  selectedSocialProviders: [],
  // TikTok specific settings defaults - @deprecated
  tiktokSettings: null,
  // Provider-specific settings
  providerSettings: {},
  // Media upload state defaults
  isMediaUploading: false,
  // Inline automation configs
  automationConfigs: {},
};

// Create the store with SSR support and persistence
export const useStore = create<PostState & PostActions>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,
        setShouldReset: (shouldReset) => set({ shouldReset }),
        setDateAlongWithTime: (date) => set({ date }),
        setTime: (time) => set({ time }),
        setPost: (post) =>
          set((state) => ({
            post: typeof post === "function" ? post(state.post) : post,
          })),
        setSelectedSocialProviders: (providers) =>
          set({ selectedSocialProviders: providers }),
        setTikTokSettings: (settings) =>
          set((state) => {
            // Initialize with defaults if not set
            const currentSettings =
              state.tiktokSettings || DEFAULT_TIKTOK_SETTINGS;

            // Merge new settings
            const newSettings = { ...currentSettings, ...settings };

            // Enforce business rule: paid partnerships can't be private
            if (
              (newSettings.promotionContent === promotionContentTypes.PAID ||
                newSettings.promotionContent === promotionContentTypes.BOTH) &&
              newSettings.privacy === "SELF_ONLY"
            ) {
              newSettings.privacy = DEFAULT_TIKTOK_SETTINGS.privacy;
            }

            return {
              ...state,
              tiktokSettings: newSettings,
            };
          }),
        setProviderSettings: (providerId, setting) =>
          set((state) => ({
            providerSettings: {
              ...state.providerSettings,
              [providerId]: setting,
            },
          })),
        getProviderSettings: (providerId) => {
          const state = get();
          return state.providerSettings[providerId];
        },
        setIsMediaUploading: (isUploading) =>
          set({ isMediaUploading: isUploading }),
        setAutomationConfig: (providerId, config) =>
          set((state) => {
            if (config === null) {
              const { [providerId]: _, ...rest } = state.automationConfigs;
              return { automationConfigs: rest };
            }
            return {
              automationConfigs: {
                ...state.automationConfigs,
                [providerId]: config,
              },
            };
          }),
        loadPost: (postData) => {
          // Map Convex post data to store format
          const mappedPost: FullPostType = {
            id: postData._id,
            content: postData.content.map((content) => ({
              ...content,
              tags: content.tags || [],
            })),
            alternativeContent: postData.alternativeContent.map((alt) => ({
              content: alt.content.map((content) => ({
                ...content,
                tags: content.tags || [],
              })),
              socialProvider: {
                name: alt.socialProvider.fullName,
                socialId: alt.socialProvider._id,
                socialType: alt.socialProvider.socialType,
              },
            })),
            scheduledTime: postData.scheduledAt
              ? new Date(postData.scheduledAt)
              : undefined,
            orgId: postData.organizationId || "",
          };

          // Set scheduled date/time if exists
          const scheduledDate = postData.scheduledAt
            ? new Date(postData.scheduledAt)
            : undefined;

          // Load provider settings if they exist
          const providerSettings: Record<string, ProviderSetting> = {};
          if (postData.providerSettings) {
            postData.providerSettings.forEach((setting) => {
              // Only add valid provider settings
              if (
                setting.type &&
                setting.socialProviderId &&
                setting.settings
              ) {
                providerSettings[setting.socialProviderId] =
                  setting as ProviderSetting;
              }
            });
          }

          set({
            post: mappedPost,
            selectedSocialProviders: postData.socialProviders.map(
              (provider) => ({
                name: provider.fullName,
                socialId: provider._id,
                socialType: provider.socialType,
              })
            ),
            date: scheduledDate,
            time: scheduledDate
              ? `${scheduledDate.getHours().toString().padStart(2, "0")}:${scheduledDate.getMinutes().toString().padStart(2, "0")}`
              : "00:00",
            providerSettings,
          });
        },
        cleanupDeletedProviders: (validProviderIds) => {
          const state = get();
          const validIds = new Set(validProviderIds);

          // Filter selectedSocialProviders
          const validSelectedProviders = state.selectedSocialProviders.filter(
            (provider) => validIds.has(provider.socialId)
          );

          // Filter alternative content
          const validAlternativeContent = state.post.alternativeContent.filter(
            (alt) => validIds.has(alt.socialProvider.socialId)
          );

          // Filter provider settings
          const validProviderSettings: Record<string, ProviderSetting> = {};
          for (const [providerId, setting] of Object.entries(
            state.providerSettings
          )) {
            if (validIds.has(providerId)) {
              validProviderSettings[providerId] = setting;
            }
          }

          set({
            selectedSocialProviders: validSelectedProviders,
            post: {
              ...state.post,
              alternativeContent: validAlternativeContent,
            },
            providerSettings: validProviderSettings,
          });
        },
        reset: () => set(initialState),
      }),
      {
        name: "post-storage",
        storage: createJSONStorage(() => localStorage),
        skipHydration: true,
        partialize: (state) => {
          // Exclude transient state that should never persist across sessions
          const { isMediaUploading, ...rest } = state;
          return rest;
        },
        merge: (persistedState, currentState) => ({
          ...currentState,
          ...(persistedState as Partial<PostState & PostActions>),
          // Always reset transient upload state on hydration
          isMediaUploading: false,
        }),
      }
    )
  )
);

// Stable selectors
const postSelector = (state: PostState & PostActions) => state.post;
const dateTimeSelector = (state: PostState & PostActions) => ({
  date: state.date,
  time: state.time,
});
const selectedProvidersSelector = (state: PostState & PostActions) =>
  state.selectedSocialProviders;
const alternativeContentSelector = (state: PostState & PostActions) =>
  state.post.alternativeContent;
const mediaUploadingSelector = (state: PostState & PostActions) =>
  state.isMediaUploading;

export const usePost = () => useStore(postSelector);
export const useAlternativeContent = () =>
  useStore(useShallow(alternativeContentSelector));
export const useDateTime = () => useStore(useShallow(dateTimeSelector));
export const useSelectedSocialProviders = () =>
  useStore(useShallow(selectedProvidersSelector));
export const useIsMediaUploading = () => useStore(mediaUploadingSelector);
export const useAutomationConfig = (providerId: string) =>
  useStore((state) => state.automationConfigs[providerId] ?? null);
// Stable function that gets state directly without React hooks
export const getProviderSettingsForConvex = () => {
  const state = useStore.getState();
  const values = Object.values(state.providerSettings);

  return values.map((setting) => ({
    type: setting.type,
    socialProviderId: setting.socialProviderId as Id<"socialProviders">,
    settings: setting.settings,
  }));
};

// Action creators with proper typing
export const postActions = {
  addSocialProvider: (provider: SocialProviderType) =>
    useStore.setState((state) => ({
      selectedSocialProviders: [...state.selectedSocialProviders, provider],
    })),
  removeSocialProvider: (socialId: string) =>
    useStore.setState((state) => {
      const { [socialId]: _ps, ...restProviderSettings } =
        state.providerSettings;
      const { [socialId]: _ac, ...restAutomationConfigs } =
        state.automationConfigs;
      return {
        selectedSocialProviders: state.selectedSocialProviders.filter(
          (provider) => provider.socialId !== socialId
        ),
        post: {
          ...state.post,
          alternativeContent: state.post.alternativeContent.filter(
            (content) => content.socialProvider.socialId !== socialId
          ),
        },
        providerSettings: restProviderSettings,
        automationConfigs: restAutomationConfigs,
      };
    }),
  updatePost: (updates: Partial<FullPostType>) =>
    useStore.setState((state) => ({
      post: { ...state.post, ...updates },
    })),
};

// Hydration helper
// if (typeof window !== 'undefined') {
// useStore.persist.rehydrate();
// }
