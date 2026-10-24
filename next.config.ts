import type { NextConfig } from "next";

// Satu pintu admin: xindelabs.web.id/admin → CMS penuh di admin.xindelabs.web.id/admin
// (admin.html 3038 baris + js/admin/* tinggal di project static, tidak diduplikasi ke sini).
const CMS = "https://admin.xindelabs.web.id/admin";

const nextConfig: NextConfig = {
  async redirects() {
    return [{ source: "/admin/:path*", destination: CMS, permanent: false }];
  },
};

export default nextConfig;
