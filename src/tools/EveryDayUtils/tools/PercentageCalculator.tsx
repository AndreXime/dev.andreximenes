import { useMemo, useState } from "react";
import { segmentTabClass, tabBarClass } from "../uiClasses";

// --- Funções de Cálculo (Mantidas iguais) ---
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

// --- COMPONENTE AUXILIAR (MOVIDO PARA FORA) ---
// Agora ele é estável e não causa re-renderização desnecessária dos filhos
const Row = ({ children, result, unit = "" }: { children: React.ReactNode; result: number | null; unit?: string }) => {
	const resultBox =
		"flex flex-col justify-center items-end px-4 py-2 rounded-lg bg-[color-mix(in_srgb,var(--color-paper-2)_90%,#0000)] border-l-4 border-accent/20";

	return (
		<div className="bg-[color-mix(in_srgb,var(--color-paper-2)_88%,#0000)] p-5 rounded-card border border-rule/50 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
			<div className="text-xl font-light text-ink-2 leading-relaxed w-full text-center sm:text-left">{children}</div>
			<div className={`shrink-0 w-full sm:w-auto ${resultBox}`}>
				<span className="text-xs uppercase tracking-wider text-muted/90 font-semibold text-right w-full block">
					Resultado
				</span>
				<span className="text-2xl font-bold leading-none text-accent">{formatResult(result, unit)}</span>
			</div>
		</div>
	);
};

// --- COMPONENTE PRINCIPAL ---
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

	// Memos
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

	// Estilo do Input
	const inlineInput =
		"inline-block w-24 sm:w-32 mx-2 p-1 text-center font-bold bg-transparent border-b-2 border-rule text-accent placeholder:text-muted/40 transition-colors focus:outline-none focus:border-accent";

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

			{/* O bloco de Desconto/Aumento continua igual pois é HTML direto */}
			<div className="bg-[color-mix(in_srgb,var(--color-paper-2)_88%,#0000)] p-5 rounded-card border border-rule/50 shadow-sm space-y-5">
				<div className="flex items-center justify-between border-b border-rule/50 pb-2">
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

				<div className="text-xl font-light text-ink-2 leading-relaxed text-center sm:text-left">
					Qual o valor final após{" "}
					{isDiscount ? (
						<span className="text-accent font-medium">desconto</span>
					) : (
						<span className="text-ink font-medium">aumento</span>
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

				<div className="grid grid-cols-2 gap-4 pt-2">
					<div
						className={`p-3 rounded-lg bg-[color-mix(in_srgb,var(--color-paper-2)_90%,#0000)] border border-rule/50`}
					>
						<p className="text-muted/80 text-sm mb-1">Valor Final</p>
						<span className="text-2xl font-bold text-accent">{formatResult(res3?.finalValue)}</span>
					</div>
					<div
						className={`p-3 rounded-lg bg-[color-mix(in_srgb,var(--color-paper-2)_90%,#0000)] border border-rule/50 text-right`}
					>
						<p className="text-muted/80 text-sm mb-1">Diferença</p>
						<span className="text-xl font-semibold text-ink-2">{formatResult(res3?.changeAmount)}</span>
					</div>
				</div>
			</div>
		</div>
	);
}
