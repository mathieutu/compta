// @ts-check

/**
 * @type {import('next').NextConfig}
 **/
module.exports = {
  reactStrictMode: true,
  experimental: {
    swcPlugins: [
      [
        'next-superjson-plugin',
        {
          excluded: [],
        },
      ],
    ],
  },
  redirects() {
    return [
      {
        source: '/',
        destination: `/${new Date().getFullYear()}`,
        permanent: false,
      },
    ]
  },
}
