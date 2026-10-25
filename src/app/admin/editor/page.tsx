import { BlockEditor } from "@/components/BlockEditor";

export const dynamic = "force-dynamic";

export default function EditorPage() {
  return (
    <div className="panel scroll-mt-20 p-5">
      <BlockEditor />
    </div>
  );
}