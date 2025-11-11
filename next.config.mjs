/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enforce type-safety on builds for better production hygiene
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
