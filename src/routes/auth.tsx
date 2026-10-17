import { createFileRoute } from "@tanstack/react-router";
import AuthPage from "@/pages/Auth";

// Compat: the original auth URL keeps working and lands on the sign-in
// face of the same flow.
export const Route = createFileRoute("/auth")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { name: "robots", content: "noindex" },
      { title: "Sign in — GlobalMatrix" },
      {
        name: "description",
        content: "Sign in to your GlobalMatrix account to save watchlists and notes.",
      },
      { property: "og:title", content: "Sign in — GlobalMatrix" },
      {
        property: "og:description",
        content: "Sign in to your GlobalMatrix account to save watchlists and notes.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <AuthPage redirectAfterAuth="/app" />,
});
