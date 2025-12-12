/** @type {import('next').NextConfig} */
// Backend runs on port 4000 (IU Unified Backend)
const backendOrigin = process.env.NEXT_PUBLIC_BACKEND_ORIGIN || 'http://localhost:4000';
const uploadBackendOrigin = process.env.NEXT_PUBLIC_UPLOAD_BACKEND_ORIGIN || 'http://localhost:4000';

const nextConfig = {
  async rewrites() {
    return [
      // Route document upload endpoints to the file-storage backend
      {
        source: '/api/documents/:path*',
        destination: `${uploadBackendOrigin}/api/documents/:path*`,
      },
      // Route loan workflow endpoints to Fabric-connected backend (4001 by default)
      {
        source: '/api/loans/:path*',
        destination: `${uploadBackendOrigin}/api/loans/:path*`,
      },
      {
        source: '/api/loans',
        destination: `${uploadBackendOrigin}/api/loans`,
      },
      {
        source: '/api/:path*',
        destination: `${backendOrigin}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
