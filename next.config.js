module.exports = {
  reactStrictMode: true,
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
