import { admin } from "@/lib/supabase/server";
import { DEFAULT_BLOCKS, type Block, type BlockType, type PageKey } from "@/lib/content-data";

export async function getPageBlocks(page: PageKey): Promise<Block[]> {
  const { data, error } = await admin
    .from("page_blocks")
    .select("id,block_type,sort_order,props")
    .eq("page", page)
    .order("sort_order", { ascending: true });

  if (error || !data) return DEFAULT_BLOCKS[page];

  return data.map((b) => ({
    id: b.id,
    block_type: b.block_type as BlockType,
    sort_order: b.sort_order,
    props: (b.props ?? {}) as Record<string, string>,
  }));
}