import Link from "next/link";

export const metadata = {
  title: "Kebijakan Privasi | Xinde Labs",
  description: "Kebijakan privasi Xinde Labs",
};

export default function PrivacyPolicy() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 prose prose-neutral dark:prose-invert">
      <h1>Kebijakan Privasi</h1>
      <p className="text-sm text-neutral-500">Terakhir diperbarui: 25 September 2026</p>

      <p>
        Xinde Labs (&quot;kami&quot;) menghargai privasi Anda. Kebijakan ini menjelaskan data
        apa yang kami kumpulkan, bagaimana kami menggunakannya, dan hak Anda atas data tersebut.
      </p>

      <h2>1. Data yang Kami Kumpulkan</h2>
      <ul>
        <li><strong>Data identitas kontak</strong>: nama, alamat email, dan nomor WhatsApp yang Anda isi saat mendaftar lead magnet, workshop, atau membeli produk.</li>
        <li><strong>Data pembayaran</strong>: diproses oleh penyedia pembayaran pihak ketiga (Mayar). Kami tidak pernah menyimpan nomor kartu kredit atau kredensial pembayaran Anda.</li>
        <li><strong>Data penggunaan platform</strong>: progres modul dan aktivitas login di LMS (Learning Management System) kami.</li>
        <li><strong>Data teknis</strong>: alamat IP, jenis perangkat, dan cookie analitik (jika diaktifkan) untuk keperluan pengukuran performa halaman.</li>
      </ul>

      <h2>2. Cara Kami Menggunakan Data</h2>
      <ul>
        <li>Mengirimkan materi pembelian, akses LMS, dan email onboarding.</li>
        <li>Mengirimkan follow-up edukatif dan penawaran terkait produk Xinde Labs (Anda bisa berhenti berlangganan kapan saja melalui link unsubscribe di setiap email).</li>
        <li>Meningkatkan kualitas produk dan layanan kami.</li>
      </ul>

      <h2>3. Berbagi Data ke Pihak Ketiga</h2>
      <p>
        Kami tidak menjual data pribadi Anda. Data hanya dibagikan terbatas kepada penyedia layanan
        yang kami gunakan untuk mengoperasikan bisnis: penyedia pembayaran (Mayar), penyedia email
        (Resend), penyedia database/cloud (Supabase, Vercel), dan platform sosial media terkait
        (Meta/Threads/Instagram) sesuai kebutuhan operasional.
      </p>

      <h2>4. Penyimpanan &amp; Keamanan</h2>
      <p>
        Data disimpan pada infrastruktur cloud terenkripsi. Kami menerapkan pembatasan akses
        berbasis peran dan hanya personel yang berwenang yang dapat mengakses data pribadi.
      </p>

      <h2>5. Hak Anda</h2>
      <ul>
        <li>Meminta salinan, koreksi, atau penghapusan data pribadi Anda.</li>
        <li>Menarik persetujuan pemasaran kapan saja (unsubscribe).</li>
        <li>Meminta akun LMS Anda dihapus permanen.</li>
      </ul>
      <p>
        Permintaan dapat dikirim ke: <strong>evant.xinde@gmail.com</strong>
      </p>

      <h2>6. Aplikasi Threads / Instagram</h2>
      <p>
        Jika Anda menghubungkan akun Threads atau Instagram dengan layanan kami, kami hanya
        mengakses izin (permission) yang Anda setujui secara eksplisit (seperti threads_basic,
        threads_content_publish) dan hanya digunakan untuk fungsi yang Anda minta. Anda dapat
        mencabut akses kapan saja melalui pengaturan akun Meta Anda.
      </p>

      <h2>7. Perubahan Kebijakan</h2>
      <p>
        Kebijakan ini dapat kami perbarui sewaktu-waktu. Perubahan signifikan akan diumumkan
        melalui halaman ini.
      </p>

      <p>
        <Link href="/">← Kembali ke beranda</Link>
      </p>
    </main>
  );
}
