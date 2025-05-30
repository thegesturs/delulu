import type {
  FullPostType,
  SocialProviderType,
  youtubeContentType,
} from '@delulu/validators/post';
import { create } from 'zustand';
import { createJSONStorage, devtools, persist } from 'zustand/middleware';
import { useShallow } from 'zustand/shallow';

// Define the store's state types
interface PostState {
  date: Date | undefined;
  time: string | null;
  post: FullPostType;
  youtubeContent: youtubeContentType;
  selectedSocialProviders: SocialProviderType[];
  shouldReset: boolean;
}

// Define the store's actions
interface PostActions {
  setShouldReset: (shouldReset: boolean) => void;
  setDate: (date: Date | undefined) => void;
  setTime: (time: string | null) => void;
  setPost: (post: FullPostType) => void;
  setSelectedSocialProviders: (providers: SocialProviderType[]) => void;
  reset: () => void;
}

const initialState: PostState = {
  date: undefined,
  time: '00:00',
  shouldReset: false,
  youtubeContent: {
    youtubeId: '',
    name: '',
    thumbnail: '',
    videoDescription: '',
    videoTags: [],
    videoTitle: '',
    videoUrl: '',
  },
  post: {
    id: '',
    content: [
      {
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
};

// Create the store with SSR support and persistence
export const useStore = create<PostState & PostActions>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,
        setShouldReset: (shouldReset) => set({ shouldReset }),
        setDate: (date) => set({ date }),
        setTime: (time) => set({ time }),
        setPost: (post) => set({ post }),
        setSelectedSocialProviders: (providers) =>
          set({ selectedSocialProviders: providers }),
        reset: () => set(initialState),
      }),
      {
        name: 'post-storage',
        storage: createJSONStorage(() => sessionStorage),
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

export const usePost = () => useStore(postSelector);
export const useAlternativeContent = () =>
  useStore(useShallow(alternativeContentSelector));
export const useDateTime = () => useStore(useShallow(dateTimeSelector));
export const useSelectedSocialProviders = () =>
  useStore(useShallow(selectedProvidersSelector));

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
