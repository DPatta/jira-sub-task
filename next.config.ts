import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  images: {
    remotePatterns: [
      // Jira avatars and user images
      { protocol: "https", hostname: "*.atlassian.net" },
      { protocol: "https", hostname: "*.atlassianusercontent.com" },
      { protocol: "https", hostname: "avatar-management--avatars.us-west-2.prod.public.atl-paas.net" },
      { protocol: "https", hostname: "secure.gravatar.com" },
    ],
  },
};

export default nextConfig;
