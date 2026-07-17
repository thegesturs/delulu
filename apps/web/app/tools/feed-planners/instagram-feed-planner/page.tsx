import {
  createFeedPlannerMetadata,
  FeedPlannerPage,
} from "../utils/feed-planner-page";
import { getFeedPlannerPage } from "../utils/feed-planner-pages";

const definition = getFeedPlannerPage("instagram-feed-planner");

export const metadata = createFeedPlannerMetadata(definition);

export default function InstagramFeedPlannerPage() {
  return <FeedPlannerPage definition={definition} />;
}
