import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listReviews from "./tools/list-reviews";
import getReview from "./tools/get-review";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "rate-review-kd",
  title: "rate-review-kd",
  version: "0.1.0",
  instructions: "Tools für das Bewertungssystem von Der Kamindoktor. Nutze `list_reviews` zum Durchsuchen und `get_review` für Details.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listReviews, getReview],
});
