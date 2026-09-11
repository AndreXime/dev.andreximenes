import type { ReactNode } from "react";
import { useEffect } from "react";
import { CopyLinkButton } from "@/lib/toolStorage/CopyLinkButton";
import { bootJsonPersistentAtoms } from "@/lib/toolStorage/persistentAtom";
import type { ToolStorageEntry } from "@/lib/toolStorage/types";
import { useImportStateFromUrl } from "@/lib/toolStorage/useImportStateFromUrl";

export interface ToolShellProps {
	title: string;
	description?: string;
	icon?: ReactNode;
	storage?: ToolStorageEntry;
	actions?: ReactNode;
	mainClassName?: string;
	children: ReactNode;
}

function HeaderActions({ storage, actions }: { storage?: ToolStorageEntry; actions?: ReactNode }) {
	if (!storage && !actions) return null;

	return (
		<div className="flex shrink-0 flex-wrap items-center gap-2xs">
			{storage && <CopyLinkButton storage={storage} />}
			{actions}
		</div>
	);
}

export function ToolShell({ title, description, icon, storage, actions, mainClassName, children }: ToolShellProps) {
	useEffect(() => {
		bootJsonPersistentAtoms();
	}, []);

	useImportStateFromUrl(storage);

	return (
		<div className="relative flex h-full min-h-0 w-full flex-1 flex-col">
			<header className="container-page w-full shrink-0 border-b border-b-rule pb-md pt-md">
				<div className="flex w-full flex-col gap-sm lg:flex-row lg:items-start lg:justify-between">
					<div className="flex min-w-0 flex-1 items-start gap-sm">
						{icon && <div className="shrink-0 pt-3xs text-muted">{icon}</div>}
						<div className="flex min-w-0 flex-1 flex-col gap-2xs">
							<h1 className="m-0 font-display text-xl font-semibold leading-snug tracking-display text-ink">{title}</h1>
							{description && <p className="m-0 leading-normal text-muted">{description}</p>}
						</div>
					</div>
					<HeaderActions {...(storage ? { storage } : {})} {...(actions ? { actions } : {})} />
				</div>
			</header>
			<section
				aria-label={title}
				className={[
					"container-page flex min-h-0 flex-1 flex-col gap-md overflow-y-auto pb-3xl pt-md",
					mainClassName ?? "",
				].join(" ")}
			>
				{children}
			</section>
		</div>
	);
}
