import { shallow } from 'zustand/shallow';
import { createWithEqualityFn } from 'zustand/traditional';

import type {
  FullPostType,
  SocialProviderType,
  youtubeContentType,
} from '@delulu/validators/post';

interface StateValues {
  date: Date | undefined;
  time: string | null;
  post: FullPostType;
  youtubeContent: youtubeContentType;
  socialProviders: SocialProviderType[];
}

interface StateSetters {
  shouldReset: boolean;
  setShouldReset: (shouldReset: boolean) => void;
  setDate: (date: Date | undefined) => void;
  setTime: (time: string | null) => void;
  reset: () => void;
  setPost: (post: FullPostType) => void;
  setSocialProviders: (providers: SocialProviderType[]) => void;
}

type State = StateValues & StateSetters;

// Mock social providers - replace with real data later
const mockSocialProviders: SocialProviderType[] = [
  {
    socialId: '1',
    name: '@johndoe',
    socialType: 'TWITTER',
  },
  {
    socialId: '2',
    name: 'John Doe',
    socialType: 'LINKEDIN',
  },
  {
    socialId: '3',
    name: '@johndoe',
    socialType: 'INSTAGRAM',
  },
];

const initialState: StateValues = {
  date: undefined,
  time: '00:00',
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
  socialProviders: mockSocialProviders,
};

export const useStore = createWithEqualityFn<State>(
  (set) => ({
    ...initialState,
    shouldReset: false,
    setShouldReset: (shouldReset) =>
      set((state) => ({ ...state, shouldReset })),
    setDate: (date) => set((state) => ({ ...state, date })),
    setTime: (time) => set((state) => ({ ...state, time })),
    setPost: (post) => set((state) => ({ ...state, post })),
    setSocialProviders: (providers) =>
      set((state) => ({ ...state, socialProviders: providers })),
    reset: () => set(() => initialState),
  }),
  shallow
);
