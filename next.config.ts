import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/karyawan", destination: "/service", permanent: true },
      { source: "/karyawan.html", destination: "/service", permanent: true },
    ];
  },
};

export default nextConfig;
