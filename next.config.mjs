/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export: no server part at all, the `out/` folder goes to any host.
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
};

export default nextConfig;
