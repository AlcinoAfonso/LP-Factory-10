/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  webpack: (config) => {
    config.resolve.alias['@'] = path.resolve(__dirname, 'src');
    return config;
  },

  // (já aplicado) 6.3.1
  async rewrites() {
    return [
      { source: '/auth/confirm', has: [{ type: 'query', key: 'next', value: '^//.*' }], destination: '/auth/confirm?next=/a/home' },
      { source: '/auth/confirm', has: [{ type: 'query', key: 'next', value: '.*://.*' }], destination: '/auth/confirm?next=/a/home' },
      { source: '/auth/confirm', has: [{ type: 'query', key: 'next', value: '^(?!/).*' }], destination: '/auth/confirm?next=/a/home' },
    ];
  },

  // (já aplicado) 6.3.2
  async headers() {
    return [
      { source: '/auth/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' }] },
      { source: '/protected',   headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' }] },
    ];
  },

  // NOVO: garante UX correta para quem digitar /a
  async redirects() {
    return [
      { source: '/a', destination: '/a/home', permanent: false },
    ];
  },
};

module.exports = nextConfig;
