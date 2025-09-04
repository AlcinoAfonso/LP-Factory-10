/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  webpack: (config) => {
    config.resolve.alias['@'] = path.resolve(__dirname, 'src');
    return config;
  },

  // 6.3.1 — validação do `next` via rewrites (sem alterar SULB)
  async rewrites() {
    return [
      // next começando com "//" → força interno
      {
        source: '/auth/confirm',
        has: [{ type: 'query', key: 'next', value: '^//.*' }],
        destination: '/auth/confirm?next=/a/home',
      },
      // next com "://” (URL externa) → força interno
      {
        source: '/auth/confirm',
        has: [{ type: 'query', key: 'next', value: '.*://.*' }],
        destination: '/auth/confirm?next=/a/home',
      },
      // next que NÃO começa com "/" → força interno
      {
        source: '/auth/confirm',
        has: [{ type: 'query', key: 'next', value: '^(?!/).*' }],
        destination: '/auth/confirm?next=/a/home',
      },
    ];
  },
};

module.exports = nextConfig;
