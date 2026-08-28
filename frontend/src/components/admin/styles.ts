/** Shared design-system primitives extracted from Figma context */

export const cardShadow = "shadow-card";
export const btnShadow  = "shadow-card";

/** Primary filled pill button (green) */
export const btnPrimary = `bg-primary rounded-full px-4 h-10 text-primary-foreground text-xs font-semibold hover:bg-primary/80 transition-colors flex items-center gap-2 shrink-0 disabled:cursor-not-allowed disabled:opacity-50`;

/** Secondary pill button (white + shadow) */
export const btnSecondary = `bg-card rounded-full px-4 h-10 ${btnShadow} text-foreground text-xs font-semibold hover:bg-muted transition-colors flex items-center gap-2 shrink-0 disabled:cursor-not-allowed disabled:opacity-50`;

/** Table header cell */
export const thCell = `bg-muted/40 border-b border-border text-left px-4 h-10 text-muted-foreground text-xs font-medium whitespace-nowrap`;

/** Table data cell */
export const tdCell = `border-b border-border px-4 h-14 text-foreground text-sm font-medium`;

/** Pill search bar — matches Figma exactly */
export const searchBar = `flex items-center gap-1.5 bg-card border border-border shadow-sm rounded-full pl-3 pr-4 h-10`;

/** Segmented tab group (filter bar) */
export const tabGroup = `bg-muted border border-border rounded-lg overflow-hidden flex items-center`;
