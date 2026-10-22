import { admin } from "@/lib/supabase/server";

type Props = { searchParams: Promise<{ email?: string }> };

export const dynamic = "force-dynamic";

export default async function UnsubscribePage({ searchParams }: Props) {
  const { email } = await searchParams;
  let done = false;
  if (email) {
    const e = String(email).trim().toLowerCase();
    if (e.includes("@")) {
      const { error } = await admin.from("unsubscribes").insert({ email: e });
      done = !error;
    }
  }

  return (
    <div className="grid-bg relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-16 font-sans text-white">
      <main className="glass anim-fade-up relative z-10 w-full max-w-md rounded-2xl p-6 text-center shadow-xl md:p-8">
        <h1 className="text-2xl font-bold">
          {done ? "Berhasil Berhenti Berlangganan" : "Link Tidak Valid"}
        </h1>
        <p className="mt-3 text-sm text-white/50">
          {done
            ? "Emailmu tidak akan lagi menerima email dari kami. Terima kasih sudah berlangganan."
            : "Buka link ini dari email yang kamu terima."}
        </p>
        <a
          href="/"
          className="mt-6 block text-sm text-white/40 underline transition hover:text-[var(--accent)]"
        >
          Kembali ke Halaman Utama
        </a>
      </main>
    </div>
  );
}
