/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // Add allowed image domains here (e.g., Supabase storage)
      // { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
}

module.exports = nextConfig
