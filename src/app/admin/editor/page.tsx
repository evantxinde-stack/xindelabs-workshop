import { BlockEditor } from "@/components/BlockEditor";

export const dynamic = "force-dynamic";

export default function EditorPage() {
  return (
    <div>
      <header className="mb-5">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#00ff88]">// website editor</p>
        <h1 className="mt-2 text-2xl font-bold">Atur Tampilan Halaman</h1>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-white/45">
          Pilih halaman, ubah tulisan atau penawaran, lalu lihat hasilnya di preview sebelah kanan sebelum menyimpan.
        </p>
      </header>
      <div className="panel p-5">
        <BlockEditor />
      </div>
    </div>
  );
}