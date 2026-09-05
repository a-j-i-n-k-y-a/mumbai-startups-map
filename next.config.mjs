/**
 * Kept deliberately minimal: this file is evaluated on every install and
 * every production build, which makes it a standing supply-chain target.
 * No imports, no network calls, no dynamic require() -- if you need to add
 * something here, review it as carefully as you would a dependency bump.
 *
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
