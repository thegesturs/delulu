import type { GetPostByIdSchema } from '@delulu/database/convex/schemas/posts_media';
import type { Id } from '@delulu/database/convex/_generated/dataModel';
import type {
  FullPostType,
  ProviderSetting,
  SocialProviderType,
  TikTokSettings,
} from '@delulu/validators/post';
import { create } from 'zustand';
import { createJSONStorage, devtools, persist } from 'zustand/middleware';
import { useShallow } from 'zustand/shallow';

// Define the store's state types
interface PostState {
  date: Date | undefined;
  time: string | null;
  post: FullPostType;
  selectedSocialProviders: SocialProviderType[];
  shouldReset: boolean;
  // TikTok specific settings - @deprecated use providerSettings
  tiktokSettings: TikTokSettings | null;
  // Provider-specific settings map (socialProviderId -> settings)
  providerSettings: Map<string, ProviderSetting>;
  // Media upload state
  isMediaUploading: boolean;
}

// Define the store's actions
interface PostActions {
  setShouldReset: (shouldReset: boolean) => void;
  setDateAlongWithTime: (date: Date | undefined) => void;
  setTime: (time: string | null) => void;
  setPost: (post: FullPostType) => void;
  setSelectedSocialProviders: (providers: SocialProviderType[]) => void;
  setTikTokSettings: (settings: Partial<TikTokSettings>) => void; // @deprecated
  setProviderSettings: (
    providerId: string,
    setting: ProviderSetting
  ) => void;
  getProviderSettings: (
    providerId: string
  ) => ProviderSetting | undefined;
  setIsMediaUploading: (isUploading: boolean) => void;
  loadPost: (postData: GetPostByIdSchema) => void;
  reset: () => void;
}

const initialState: PostState = {
  date: undefined,
  time: '00:00',
  shouldReset: false,
  post: {
    id: '',
    content: [
      {
        title: '',
        text: '',
        media: [],
        name: 'DEFAULT',
        order: 0,
        tags: [],
      },
    ],
    alternativeContent: [],
    scheduledTime: undefined,
    orgId: '',
  },
  selectedSocialProviders: [],
  // TikTok specific settings defaults - @deprecated
  tiktokSettings: null,
  // Provider-specific settings
  providerSettings: new Map<string, ProviderSetting>(),
  // Media upload state defaults
  isMediaUploading: false,
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
        setPost: (post) => set({ post }),
        setSelectedSocialProviders: (providers) =>
          set({ selectedSocialProviders: providers }),
        setTikTokSettings: (settings) =>
          set((state) => {
            // Initialize with defaults if not set
            const currentSettings = state.tiktokSettings || {
              privacy: 'PUBLIC_TO_EVERYONE',
              allowComments: true,
              allowDuet: false,
              allowStitch: false,
              promotionContent: 'NONE',
            };

            // Merge new settings
            const newSettings = { ...currentSettings, ...settings };

            // Enforce business rule: paid partnerships can't be private
            if (
              newSettings.promotionContent === 'PAID' &&
              newSettings.privacy === 'SELF_ONLY'
            ) {
              newSettings.privacy = 'PUBLIC_TO_EVERYONE';
            }

            return {
              ...state,
              tiktokSettings: newSettings,
            };
          }),
        setProviderSettings: (providerId, setting) =>
          set((state) => {
            const newProviderSettings = new Map(state.providerSettings);
            newProviderSettings.set(providerId, setting);
            return { providerSettings: newProviderSettings };
          }),
        getProviderSettings: (providerId) => {
          const state = get();
          return state.providerSettings.get(providerId);
        },
        setIsMediaUploading: (isUploading) => set({ isMediaUploading: isUploading }),
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
            orgId: postData.organizationId || '',
          };

          // Set scheduled date/time if exists
          const scheduledDate = postData.scheduledAt
            ? new Date(postData.scheduledAt)
            : undefined;

          // Load provider settings if they exist
          const providerSettings = new Map<string, ProviderSetting>();
          if (postData.providerSettings) {
            postData.providerSettings.forEach((setting) => {
              // Only add valid provider settings
              if (setting.type && setting.socialProviderId && setting.settings) {
                providerSettings.set(setting.socialProviderId, setting as ProviderSetting);
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
              ? `${scheduledDate.getHours().toString().padStart(2, '0')}:${scheduledDate.getMinutes().toString().padStart(2, '0')}`
              : '00:00',
            providerSettings,
          });
        },
        reset: () => set(initialState),
      }),
      {
        name: 'post-storage',
        storage: createJSONStorage(() => localStorage),
        skipHydration: true,
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

const providerSettingsForConvexSelector = (state: PostState & PostActions) =>
  Array.from(state.providerSettings.values()).map(setting => ({
    type: setting.type,
    socialProviderId: setting.socialProviderId as Id<'socialProviders'>,
    settings: setting.settings
  }));

export const usePost = () => useStore(postSelector);
export const useAlternativeContent = () =>
  useStore(useShallow(alternativeContentSelector));
export const useDateTime = () => useStore(useShallow(dateTimeSelector));
export const useSelectedSocialProviders = () =>
  useStore(useShallow(selectedProvidersSelector));
export const useIsMediaUploading = () => useStore(mediaUploadingSelector);
export const useProviderSettingsForConvex = () => useStore(providerSettingsForConvexSelector);

// Action creators with proper typing
export const postActions = {
  addSocialProvider: (provider: SocialProviderType) =>
    useStore.setState((state) => ({
      selectedSocialProviders: [...state.selectedSocialProviders, provider],
    })),
  removeSocialProvider: (socialId: string) =>
    useStore.setState((state) => ({
      selectedSocialProviders: state.selectedSocialProviders.filter(
        (provider) => provider.socialId !== socialId
      ),
      post: {
        ...state.post,
        alternativeContent: state.post.alternativeContent.filter(
          (content) => content.socialProvider.socialId !== socialId
        ),
      },
    })),
  updatePost: (updates: Partial<FullPostType>) =>
    useStore.setState((state) => ({
      post: { ...state.post, ...updates },
    })),
};

// Hydration helper
// if (typeof window !== 'undefined') {
// useStore.persist.rehydrate();
// }
