import { useMemo, useState } from "react";
import { toolPanelClass, toolStatCardClass } from "@/lib/toolUi";
import { segmentTabClass, tabBarClass } from "../uiClasses";

function calculatePercentageOfValue(x: number, y: number): number {
	return (x / 100) * y;
}

function calculatePercentOfTotal(part: number, total: number): number {
	if (total === 0) return 0;
	return (part / total) * 100;
}

function calculateDiscountOrIncrease(val: number, rate: number, isDiscount: boolean) {
	const amount = (rate / 100) * val;
	return {
		finalValue: isDiscount ? val - amount : val + amount,
		changeAmount: amount,
	};
}

function calculatePercentageChange(oldVal: number, newVal: number): number {
	if (oldVal === 0) return 0;
	return ((newVal - oldVal) / oldVal) * 100;
}

function calculateOriginalTotal(part: number, percent: number): number {
	if (percent === 0) return 0;
	return part / (percent / 100);
}

function formatResult(value: number | null | undefined, unit: string = "", fallback: string = "..."): string {
	if (value === null || value === undefined || Number.isNaN(value) || !Number.isFinite(value)) return fallback;
	return `${parseFloat(value.toFixed(4))}${unit}`;
}

const Row = ({ children, result, unit = "" }: { children: React.ReactNode; result: number | null; unit?: string }) => {
	return (
		<div className={`${toolPanelClass} flex flex-col items-center justify-between gap-4 lg:flex-row`}>
			<div className="w-full text-center text-xl font-light leading-relaxed text-ink-2 lg:text-left">{children}</div>
			<div className={`${toolStatCardClass} w-full items-end lg:w-auto`}>
				<span className="block w-full text-right font-mono text-xs tracking-label text-muted uppercase">Resultado</span>
				<span className="text-2xl leading-none font-bold text-accent">{formatResult(result, unit)}</span>
			</div>
		</div>
	);
};

export default function PercentageCalculatorCard() {
	const [inputs, setInputs] = useState({
		percentOfX: "",
		totalOfY: "",
		partOfY: "",
		totalOfZ: "",
		rateX: "",
		priceY: "",
		oldVal: "",
		newVal: "",
		knownPart: "",
		knownPercent: "",
	});

	const [isDiscount, setIsDiscount] = useState(true);

	const handleInput = (e: React.InputEvent<HTMLInputElement>) => {
		const { name, value } = e.currentTarget;
		if (/^[\d.-]*$/.test(value)) {
			setInputs((prev) => ({ ...prev, [name]: value }));
		}
	};

	const res1 = useMemo(
		() => calculatePercentageOfValue(parseFloat(inputs.percentOfX), parseFloat(inputs.totalOfY)),
		[inputs.percentOfX, inputs.totalOfY],
	);
	const res2 = useMemo(
		() => calculatePercentOfTotal(parseFloat(inputs.partOfY), parseFloat(inputs.totalOfZ)),
		[inputs.partOfY, inputs.totalOfZ],
	);
	const res3 = useMemo(
		() => calculateDiscountOrIncrease(parseFloat(inputs.priceY), parseFloat(inputs.rateX), isDiscount),
		[inputs.priceY, inputs.rateX, isDiscount],
	);
	const resChange = useMemo(
		() => calculatePercentageChange(parseFloat(inputs.oldVal), parseFloat(inputs.newVal)),
		[inputs.oldVal, inputs.newVal],
	);
	const resTotal = useMemo(
		() => calculateOriginalTotal(parseFloat(inputs.knownPart), parseFloat(inputs.knownPercent)),
		[inputs.knownPart, inputs.knownPercent],
	);

	const inlineInput =
		"mx-2 inline-block w-24 border-b-2 border-rule bg-transparent p-1 text-center font-bold text-accent transition-colors placeholder:text-muted focus:border-accent focus:outline-none lg:w-32";

	return (
		<div className="space-y-6">
			<Row result={res1}>
				Quanto é
				<input
					name="percentOfX"
					value={inputs.percentOfX}
					onInput={handleInput}
					placeholder="20"
					className={inlineInput}
					inputMode="decimal"
				/>
				% de
				<input
					name="totalOfY"
					value={inputs.totalOfY}
					onInput={handleInput}
					placeholder="1000"
					className={inlineInput}
					inputMode="decimal"
				/>
				?
			</Row>

			<Row result={res2} unit="%">
				O valor
				<input
					name="partOfY"
					value={inputs.partOfY}
					onInput={handleInput}
					placeholder="50"
					className={inlineInput}
					inputMode="decimal"
				/>
				é qual % de
				<input
					name="totalOfZ"
					value={inputs.totalOfZ}
					onInput={handleInput}
					placeholder="200"
					className={inlineInput}
					inputMode="decimal"
				/>
				?
			</Row>

			<Row result={resChange} unit="%">
				Se o valor for de
				<input
					name="oldVal"
					value={inputs.oldVal}
					onInput={handleInput}
					placeholder="100"
					className={inlineInput}
					inputMode="decimal"
				/>
				para
				<input
					name="newVal"
					value={inputs.newVal}
					onInput={handleInput}
					placeholder="150"
					className={inlineInput}
					inputMode="decimal"
				/>
				a variação é:
			</Row>

			<Row result={resTotal}>
				Se
				<input
					name="knownPart"
					value={inputs.knownPart}
					onInput={handleInput}
					placeholder="25"
					className={inlineInput}
					inputMode="decimal"
				/>
				representa
				<input
					name="knownPercent"
					value={inputs.knownPercent}
					onInput={handleInput}
					placeholder="10"
					className={inlineInput}
					inputMode="decimal"
				/>
				% do total, o total é:
			</Row>

			<div className={`${toolPanelClass} space-y-5`}>
				<div className="flex items-center justify-between border-b border-rule pb-2">
					<h4 className="text-lg font-semibold text-ink-2">Cálculo de Desconto/Aumento</h4>
					<div className={tabBarClass}>
						<button type="button" onClick={() => setIsDiscount(true)} className={segmentTabClass(isDiscount)}>
							Desconto
						</button>
						<button type="button" onClick={() => setIsDiscount(false)} className={segmentTabClass(!isDiscount)}>
							Aumento
						</button>
					</div>
				</div>

				<div className="text-center text-xl font-light leading-relaxed text-ink-2 lg:text-left">
					Qual o valor final após{" "}
					{isDiscount ? (
						<span className="font-medium text-accent">desconto</span>
					) : (
						<span className="font-medium text-ink">aumento</span>
					)}{" "}
					de
					<input
						name="rateX"
						value={inputs.rateX}
						onInput={handleInput}
						placeholder="15"
						className={inlineInput}
						inputMode="decimal"
					/>
					% em
					<input
						name="priceY"
						value={inputs.priceY}
						onInput={handleInput}
						placeholder="100"
						className={inlineInput}
						inputMode="decimal"
					/>
					?
				</div>

				<div className="grid grid-cols-1 gap-4 pt-2 lg:grid-cols-2">
					<div className={toolStatCardClass}>
						<p className="mb-1 text-sm text-muted">Valor Final</p>
						<span className="text-2xl font-bold text-accent">{formatResult(res3?.finalValue)}</span>
					</div>
					<div className={`${toolStatCardClass} lg:items-end lg:text-right`}>
						<p className="mb-1 text-sm text-muted">Diferença</p>
						<span className="text-xl font-semibold text-ink-2">{formatResult(res3?.changeAmount)}</span>
					</div>
				</div>
			</div>
		</div>
	);
}
