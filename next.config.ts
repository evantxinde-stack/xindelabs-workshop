import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/karyawan", destination: "/service", permanent: true },
      { source: "/karyawan.html", destination: "/service", permanent: true },
      { source: "/admin/leads", destination: "/admin", permanent: true },
      { source: "/admin/unified-leads", destination: "/admin", permanent: true },
      { source: "/admin/pipeline", destination: "/admin", permanent: true },
      { source: "/admin/leaks", destination: "/admin", permanent: true },
    ];
  },
};

export default nextConfig;
