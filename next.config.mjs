/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'eofrmifusmyhsnubrppa.supabase.co',
      },
    ],
  },
};

export default nextConfig;
