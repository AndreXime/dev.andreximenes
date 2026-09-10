export const toolLabelClass = "font-mono text-xs tracking-label text-muted uppercase";

export const toolInputClass =
	"w-full min-h-10 rounded-input border border-rule bg-paper px-sm py-2 text-sm text-ink placeholder:text-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:border-accent transition-[border-color,box-shadow]";

export const toolTextareaClass =
	"w-full min-h-40 resize-y rounded-input border border-rule bg-paper px-sm py-2 text-sm leading-relaxed text-ink-2 placeholder:text-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-accent";

export const toolCardClass = "rounded-card border border-rule bg-paper-2";

export const toolPanelClass = "rounded-card border border-rule bg-paper-2 p-md";

export const toolStatCardClass =
	"flex min-w-0 flex-1 flex-col justify-center rounded-card border border-rule bg-paper-2 px-md py-sm";

export const toolBtnPrimaryClass =
	"inline-flex items-center justify-center gap-2xs rounded-input px-sm py-2 text-sm font-semibold bg-accent text-accent-ink transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50";

export const toolBtnGhostClass =
	"inline-flex items-center gap-2xs rounded-input border border-rule px-sm py-2 font-medium text-muted transition-colors hover:border-accent-muted hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50";

export const toolIconBtnClass =
	"rounded-input p-2 text-muted transition-colors hover:bg-paper-2 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent";

export const toolIconBtnActiveClass =
	"rounded-input bg-accent-bg p-2 text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent";

export const toolTabBarClass = "flex gap-3xs rounded-input border border-rule bg-paper-2 p-3xs";

export function toolSegmentTabClass(active: boolean): string {
	return [
		"flex-1 rounded-input py-2 text-sm font-semibold transition-colors",
		active ? "bg-accent text-accent-ink" : "text-muted hover:bg-accent-bg hover:text-ink",
	].join(" ");
}

export const toolEmptyPanelClass =
	"rounded-card border border-dashed border-rule bg-paper-2/50 p-xl text-center text-muted";

export const toolListItemClass =
	"w-full rounded-card border border-rule bg-paper-2 text-left transition-colors hover:border-accent-muted hover:bg-accent-bg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent";

export const toolListItemActiveClass = "border-accent-muted bg-accent-bg";

export const toolDividerClass = "h-px w-full bg-rule";

export const toolEditorSurfaceClass =
	"flex min-h-0 flex-1 flex-col overflow-hidden rounded-card border border-rule bg-paper-2";

export const toolProseClass = "prose prose-sm max-w-none h-full overflow-y-auto p-md text-ink-2";

export const toolSelectCardClass =
	"group flex w-full cursor-pointer items-center justify-between rounded-card border border-rule bg-paper-2 p-md text-left transition-[border-color,background-color] hover:border-accent-muted hover:bg-accent-bg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent";
