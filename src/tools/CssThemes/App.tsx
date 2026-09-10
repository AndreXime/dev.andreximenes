import { Tabs } from "./components/ui/Tabs";
import { SectionShowcase } from "./features/sections/SectionShowcase";
import { ThemePicker } from "./features/theme/ThemePicker";
import { TokenPreview } from "./features/theme/TokenPreview";

function ThemeTab() {
	return (
		<div className="flex flex-col gap-6 lg:flex-row lg:items-start">
			<aside className="w-full shrink-0 lg:sticky lg:top-6 lg:w-90">
				<ThemePicker />
			</aside>
			<main className="min-w-0 flex-1">
				<TokenPreview />
			</main>
		</div>
	);
}

export function App() {
	return (
		<Tabs
			tabs={[
				{
					id: "theme",
					label: "Tema e tokens",
					content: <ThemeTab />,
				},
				{
					id: "sections",
					label: "Seções",
					content: <SectionShowcase />,
				},
			]}
		/>
	);
}
