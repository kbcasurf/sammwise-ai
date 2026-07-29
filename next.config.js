/** @type {import('next').NextConfig} */
const nextConfig = {
  // Pin the workspace root to this directory. Without it Next walks up looking
  // for a lockfile and can pick a parent directory (e.g. when this checkout
  // lives inside another repo, as a git worktree does), which it warns about at
  // build time. The app is always the root of its own build.
  turbopack: {
    root: __dirname,
  },
}

module.exports = nextConfig
