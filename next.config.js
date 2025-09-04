/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  webpack: (config) => {
    // Alias do app
    config.resolve.alias['@'] = path.resolve(__dirname, 'src');
    // Alias específico para o SULB: garante que "@/lib/supabase/*" aponte para /lib/supabase (raiz)
    config.resolve.alias['@/lib/supabase'] = path.resolve(__dirname, 'lib/supabase');
    return config;
  },

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
      { source: '/auth/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' }] },
      { source: '/protected', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' }] },
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
