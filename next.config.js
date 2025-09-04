/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  webpack: (config) => {
    config.resolve.alias['@'] = path.resolve(__dirname, 'src');
    return config;
  },

  // 6.3.1 — validação do `next` via rewrites (somente caminhos internos)
  async rewrites() {
    return [
      { source: '/auth/confirm', has: [{ type: 'query', key: 'next', value: '^//.*' }], destination: '/auth/confirm?next=/a/home' },
      { source: '/auth/confirm', has: [{ type: 'query', key: 'next', value: '.*://.*' }], destination: '/auth/confirm?next=/a/home' },
      { source: '/auth/confirm', has: [{ type: 'query', key: 'next', value: '^(?!/).*' }], destination: '/auth/confirm?next=/a/home' },
    ];
  },

  // 6.3.2 — noindex via cabeçalho (sem alterar páginas do SULB)
  async headers() {
    return [
      {
        source: '/auth/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' }],
      },
      {
        source: '/protected',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' }],
      },
    ];
  },
};

module.exports = nextConfig;
