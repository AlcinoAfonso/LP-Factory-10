/** @type {import('next').NextConfig} */

const nextConfig = {
  outputFileTracingIncludes: {
    '/admin/documentacao': [
      './docs/roadmap.md',
      './docs/base-tecnica.md',
      './docs/schema.md',
      './docs/design-system.md',
      './docs/gestor-codex.md',
      './docs/gestor-automations.md',
      './docs/automations.md',
      './docs/prompt-estrategista.md',
      './docs/prompt-executor.md',
      './docs/template-briefing-codex.md',
      './docs/template-prompts.md',
    ],
  },

  // 6.3.1 — validação do `next` em /auth/confirm (somente caminhos internos)
  async rewrites() {
    return [
      {
        source: '/auth/confirm',
        has: [{ type: 'query', key: 'next', value: '^//.*' }],
        destination: '/auth/confirm?next=/a',
      },
      {
        source: '/auth/confirm',
        has: [{ type: 'query', key: 'next', value: '.*://.*' }],
        destination: '/auth/confirm?next=/a',
      },
      {
        source: '/auth/confirm',
        has: [{ type: 'query', key: 'next', value: '^(?!/).*' }],
        destination: '/auth/confirm?next=/a',
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
