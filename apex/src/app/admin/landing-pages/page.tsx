import { requireAdmin } from "@/lib/admin-auth";
import { BlockEditor } from "@/components/BlockEditor";

export const dynamic = "force-dynamic";

export default async function LandingPagesPage() {
  requireAdmin();
  return (
    <>
      <header className="scroll-mt-20 mb-6">
        <h1 className="text-2xl font-bold">Landing Page Management</h1>
        <p className="mt-0.5 text-sm text-white/45">Kelola landing page workshop - tambah, edit, customize HTML & blocks.</p>
      </header>
      <div className="panel scroll-mt-20 p-5">
        <BlockEditor />
      </div>
    </>
  );
}
