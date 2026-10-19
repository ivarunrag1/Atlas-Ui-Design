/* Grid templates shared by the rate cards and their sticky price header, so columns line up. */

/** Price grid shared by the sticky header and every card, so columns line up. */
export const priceCols = (n: number) => ({ gridTemplateColumns: `2.25rem repeat(${n}, minmax(0, 1fr))` });
/**
 * Card split shared with the header: route (flexes) | prices (fixed). The price
 * section keeps its size when side panels open — only the route side contracts.
 * Width = label col + 4.25rem per equipment col + gaps + padding (+1px divider).
 */
export const cardGrid = (n: number) => ({
  gridTemplateColumns: `minmax(0, 1fr) calc(2.25rem + ${n} * 4.25rem + ${n} * 0.5rem + 1.5rem + 1px)`,
});
