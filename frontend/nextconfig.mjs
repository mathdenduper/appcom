/** @type {import('next').NextConfig} */
const nextConfig = {
  // This rewrites rule is our "receptionist".
  // It tells the Next.js server to proxy any request
  // starting with /api to our Python backend.
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://12-7.0.0.1:8000/:path*',
      },
    ]
  },
};

export default nextConfig;