import { defineConfig } from "vite";

function resolveBase() {
  const repository = process.env.GITHUB_REPOSITORY;
  const isGithubActions = process.env.GITHUB_ACTIONS === "true";

  if (!isGithubActions || !repository) {
    return "/";
  }

  const [, repoName] = repository.split("/");
  if (!repoName || repoName.endsWith(".github.io")) {
    return "/";
  }

  return `/${repoName}/`;
}

export default defineConfig({
  base: resolveBase(),
  build: {
    // The initial app chunk intentionally carries the generated offline icon
    // fallback catalogs. Keep the warning slightly above that reviewed baseline
    // so future unplanned growth is still reported.
    chunkSizeWarningLimit: 7200,
  },
});
