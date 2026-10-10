import { createFileRoute } from "@tanstack/react-router";
import AuthPage from "@/pages/Auth";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create account — GlobalMatrix" },
      {
        name: "description",
        content:
          "Create a GlobalMatrix account to build your personal view of global events and exposure.",
      },
      { property: "og:title", content: "Create account — GlobalMatrix" },
      {
        property: "og:description",
        content:
          "Create a GlobalMatrix account to build your personal view of global events and exposure.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <AuthPage mode="signup" redirectAfterAuth="/app" />,
});
