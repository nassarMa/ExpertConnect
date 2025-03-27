const path = require('path');
module.exports = {
  async redirects() {
    return [
      {
        source: '/',
        destination: '/login',
        permanent: false,
      },
    ];
  },
  reactStrictMode: true,
  env: {
    API_URL: process.env.API_URL || 'http://localhost:8000/api',
  },
  images: {
    domains: ['localhost'],
  },
  webpack: (config) => {
    config.resolve.alias['@'] = path.resolve(__dirname, 'src');
    return config;
  },
}
