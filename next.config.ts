import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'phimimg.com' },
      { protocol: 'https', hostname: 'img.ophim.com' },
      { protocol: 'https', hostname: 'image.tmdb.org' },
      { protocol: 'https', hostname: 'img.phimapi.com' },
      { protocol: 'https', hostname: 'media.cdn.phimapi.com' },
      { protocol: 'https', hostname: 'img.kkphim.com' },
      { protocol: 'https', hostname: 'kkphim.com' },
      { protocol: 'https', hostname: 'img.kkphim.live' },
      { protocol: 'https', hostname: 'vsmov.com' },
      { protocol: 'https', hostname: 'www.vsmov.com' },
      { protocol: 'https', hostname: 'phimapi.com' },
      { protocol: 'https', hostname: 'ophim.cc' },
      { protocol: 'https', hostname: 'ophim1.com' },
      { protocol: 'https', hostname: 'img.ophim.live' },
      { protocol: 'https', hostname: 'img.ophim1.com' },
      { protocol: 'https', hostname: 'img.ophim.org' },
      { protocol: 'https', hostname: 'aphim.net' },
      { protocol: 'https', hostname: 'img.aphim.net' },
      { protocol: 'http', hostname: 'img.ophim.live' },
    ],
  },
};

export default nextConfig;
