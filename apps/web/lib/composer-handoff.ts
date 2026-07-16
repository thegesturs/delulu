const COMPOSER_DRAFT_PARAMETER = "draft";

export const createComposerHandoffUrl = (
  composerUrl: string,
  draft: string
): string => {
  const url = new URL(composerUrl);
  url.searchParams.set(COMPOSER_DRAFT_PARAMETER, draft);
  return url.toString();
};
