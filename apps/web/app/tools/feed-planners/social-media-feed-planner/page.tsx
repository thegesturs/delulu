import {
  createFeedPlannerMetadata,
  FeedPlannerPage,
} from "../utils/feed-planner-page";
import { getFeedPlannerPage } from "../utils/feed-planner-pages";

const definition = getFeedPlannerPage("social-media-feed-planner");

export const metadata = createFeedPlannerMetadata(definition);

export default function SocialMediaFeedPlannerPage() {
  return <FeedPlannerPage definition={definition} />;
}
