import { Hono } from "hono";
import type { ApiKeyData, Env } from "../../types";
import accounts from "./accounts";
import media from "./media";
import posts from "./posts";
import reviews from "./reviews";
import stats from "./stats";

interface V1Env {
  Bindings: Env;
  Variables: { apiKey: ApiKeyData };
}

const v1 = new Hono<V1Env>();

v1.route("/posts", posts);
v1.route("/accounts", accounts);
v1.route("/stats", stats);
v1.route("/media", media);
v1.route("/reviews", reviews);

export default v1;
