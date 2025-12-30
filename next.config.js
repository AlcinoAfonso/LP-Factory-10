/** @type {import('next').NextConfig} */

const nextConfig = {
  // 6.3.1 — validação do `next` em /auth/confirm (somente caminhos internos)
  async rewrites() {
    return [
      {
        source: '/auth/confirm',
        has: [{ type: 'query', key: 'next', value: '^//.*' }],
        destination: '/auth/confirm?next=/a/home',
      },
      {
        source: '/auth/confirm',
        has: [{ type: 'query', key: 'next', value: '.*://.*' }],
        destination: '/auth/confirm?next=/a/home',
      },
      {
        source: '/auth/confirm',
        has: [{ type: 'query', key: 'next', value: '^(?!/).*' }],
        destination: '/auth/confirm?next=/a/home',
      },
    ];
  },

  // 6.3.2 — noindex para rotas de auth/protected (sem tocar no SULB)
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

  // UX: unificação das rotas em /a/home
  async redirects() {
    return [
      { source: '/a', destination: '/a/home', permanent: false },
      { source: '/protected', destination: '/a/home', permanent: false },
      { source: '/auth/protected', destination: '/a/home', permanent: false },
    ];
  },
};

module.exports = nextConfig;
