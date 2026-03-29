/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}
module.exports = {
  images: {
    unoptimized: true,
  },
}
export default nextConfig
