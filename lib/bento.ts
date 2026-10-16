/**
 * Bento packing that keeps the items in order. Each item is placed at the
 * lowest free row, in the leftmost free run of columns there (the same cursor
 * CSS grid auto-placement uses), and its span is chosen from that item's
 * candidates so the run is either filled or leaves room for another item.
 * Reading order (top to bottom, left to right) therefore matches item order
 * and the grid never has holes. Positions are returned 0-based, for explicit
 * grid-column / grid-row placement.
 */
export type Span = { w: number; h: number };
export type Placement = Span & { col: number; row: number };

export function packBento<T>(items: T[], columns: number, candidates: (item: T, index: number) => Span[], minWidth: number): Placement[] {
  const heights = new Array<number>(columns).fill(0);
  return items.map((item, index) => {
    const row = Math.min(...heights);
    const col = heights.indexOf(row);
    let free = 0;
    while (col + free < columns && heights[col + free] <= row) free++;
    const options = candidates(item, index);
    const fits = options.find(span => span.w <= free && (free - span.w === 0 || free - span.w >= minWidth));
    const chosen = fits ?? { w: free, h: options[0]?.h ?? 1 };
    // The last item takes the rest of its row, so the grid ends flush.
    const span = index === items.length - 1 ? { ...chosen, w: free } : chosen;
    for (let c = col; c < col + span.w; c++) heights[c] = row + span.h;
    return { ...span, col, row };
  });
}
