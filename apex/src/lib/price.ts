export function parsePrice(s: string | undefined | null) {
  if (!s) return 0;
  const str = s
    .toString()
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/\s+/g, "");
  if (str.includes("jt")) {
    const m = str.match(/(\d+(?:[.,]\d+)?)/);
    return Math.round(parseFloat((m ? m[1].replace(",", ".") : "0")) * 1_000_000);
  }
  if (str.includes("rb")) {
    const m = str.match(/(\d+(?:[.,]\d+)?)/);
    return Math.round(parseFloat((m ? m[1].replace(",", ".") : "0")) * 1_000);
  }
  if (str.includes("k")) {
    const m = str.match(/(\d+(?:[.,]\d+)?)/);
    return Math.round(parseFloat((m ? m[1].replace(",", ".") : "0")) * 1_000);
  }
  const m = str.match(/(\d+)/);
  return parseInt(m ? m[1] : "0");
}