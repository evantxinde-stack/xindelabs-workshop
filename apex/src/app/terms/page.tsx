import Link from "next/link";

export const metadata = {
  title: "Syarat & Ketentuan | XindeLabs",
  description: "Syarat dan ketentuan penggunaan layanan XindeLabs",
};

export default function Terms() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 prose prose-neutral dark:prose-invert">
      <h1>Syarat &amp; Ketentuan</h1>
      <p className="text-sm text-neutral-500">Terakhir diperbarui: 25 September 2026</p>

      <h2>1. Penerimaan Ketentuan</h2>
      <p>
        Dengan mengakses atau menggunakan layanan XindeLabs (termasuk kursus, workshop,
        dan materi digital), Anda menyetujui syarat dan ketentuan ini.
      </p>

      <h2>2. Produk Digital</h2>
      <ul>
        <li>Semua produk berupa materi digital (kursus online, template, komunitas).</li>
        <li>Akses LMS bersifat personal dan tidak dapat dipindahtangankan.</li>
        <li>Pembagian, penjualan ulang, atau distribusi materi tanpa izin tidak diizinkan.</li>
      </ul>

      <h2>3. Pembayaran &amp; Pengembalian Dana</h2>
      <ul>
        <li>Pembayaran diproses melalui penyedia pihak ketiga (Mayar).</li>
        <li>Karena sifat produk yang digital, pembelian yang sudah diakses tidak dapat dikembalikan, kecuali ada kesalahan teknis dari pihak kami.</li>
      </ul>

      <h2>4. Hasil Penggunaan</h2>
      <p>
        Kami menyediakan materi edukasi dan tools otomasi. Hasil penggunaan (income, konversi,
        performa iklan) bergantung pada banyak faktor di luar kendali kami. Kami tidak menjamin
        hasil tertentu dari penggunaan produk.
      </p>

      <h2>5. Batasan Tanggung Jawab</h2>
      <p>
        XindeLabs tidak bertanggung jawab atas kerugian tidak langsung yang timbul dari
        penggunaan atau ketidakmampuan menggunakan layanan, sejauh diizinkan oleh hukum yang berlaku.
      </p>

      <h2>6. Perubahan Layanan</h2>
      <p>
        Kami berhak memperbarui, mengubah, atau menghentikan bagian dari layanan dengan
        pemberitahuan yang wajar.
      </p>

      <h2>7. Kontak</h2>
      <p>Pertanyaan tentang ketentuan ini: <strong>evant.xinde@gmail.com</strong></p>

      <p>
        <Link href="/">← Kembali ke beranda</Link>
      </p>
    </main>
  );
}
