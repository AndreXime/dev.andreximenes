import { CheckSquare, ImagePlus, Square } from "lucide-react";
import { toolBtnGhostClass, toolBtnPrimaryClass } from "@/lib/toolUi";
import type { ImageItem } from "../domain";
import { ACCEPTED_EXTENSIONS } from "../domain";
import { clearAll, clearSelection, removeItem, selectAll, selectSolo, toggleSelected } from "../store";
import { ImageListItem } from "./components";

export function ImageQueue({
	items,
	activeItemId,
	selectedIds,
	anyProcessing,
	addMoreInputRef,
	onFileSelect,
}: {
	items: ImageItem[];
	activeItemId: string | null;
	selectedIds: string[];
	anyProcessing: boolean;
	addMoreInputRef: React.RefObject<HTMLInputElement | null>;
	onFileSelect: (files: FileList | null) => void;
}) {
	return (
		<aside className="w-full space-y-3">
			<div className="flex flex-wrap items-center gap-2">
				<button type="button" onClick={selectAll} className={toolBtnGhostClass}>
					<CheckSquare className="size-5" aria-hidden="true" />
					Selecionar todas
				</button>
				<button type="button" onClick={clearSelection} className={toolBtnGhostClass}>
					<Square className="size-5" aria-hidden="true" />
					Limpar selecao
				</button>
				<button type="button" onClick={clearAll} className={`${toolBtnGhostClass} ml-auto`}>
					Limpar tudo
				</button>
			</div>

			<ul className="grid max-h-[40vh] grid-cols-1 gap-2 overflow-y-auto lg:grid-cols-3 xl:grid-cols-4">
				{items.map((item) => (
					<ImageListItem
						key={item.id}
						item={item}
						active={activeItemId === item.id}
						selected={selectedIds.includes(item.id)}
						onSelect={() => selectSolo(item.id)}
						onToggleSelected={() => toggleSelected(item.id)}
						onRemove={() => removeItem(item.id)}
					/>
				))}
			</ul>

			<button
				type="button"
				onClick={() => addMoreInputRef.current?.click()}
				disabled={anyProcessing}
				className={`${toolBtnPrimaryClass} w-full`}
			>
				<ImagePlus className="size-5" aria-hidden="true" />
				Adicionar imagens
			</button>
			<input
				ref={addMoreInputRef}
				type="file"
				accept={ACCEPTED_EXTENSIONS}
				multiple
				className="hidden"
				onChange={(e) => void onFileSelect(e.target.files)}
			/>
		</aside>
	);
}
