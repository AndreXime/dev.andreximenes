import { useEffect, useMemo, useState } from "react";
import { toolCardClass, toolPanelClass, toolStatCardClass } from "@/lib/toolUi";
import { fieldLabelClass, inputClass } from "../uiClasses";

interface TaxaApiItem {
	nome: string;
	valor: number;
}

async function getServerApiData() {
	let inflacao = 4.5 / 100; // Fallback IPCA
	let cdi = 11.25 / 100; // Fallback CDI
	let isFallback = true;

	try {
		const responseTaxas = await fetch("https://brasilapi.com.br/api/taxas/v1");
		if (!responseTaxas.ok) throw new Error("Erro API");
		const data: TaxaApiItem[] = await responseTaxas.json();

		const ipcaObj = data.find((t) => t.nome === "IPCA");
		if (ipcaObj) inflacao = ipcaObj.valor / 100;

		const cdiObj = data.find((t) => t.nome === "CDI");
		if (cdiObj) cdi = cdiObj.valor / 100;

		if (ipcaObj && cdiObj) isFallback = false;
	} catch {
		// Mantém fallback local quando a BrasilAPI estiver indisponivel.
	}

	return { inflacao, cdi, isFallback };
}

function formatarMoeda(valor: number) {
	return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function InvestmentCard() {
	const [metaRenda, setMetaRenda] = useState(1518);
	const [percCDI, setPercCDI] = useState(100);
	const [dadosMercado, setDadosMercado] = useState({ inflacao: 0, cdi: 0, isFallback: false });

	useEffect(() => {
		getServerApiData().then(setDadosMercado);
	}, []);

	const resultado = useMemo(() => {
		if (!dadosMercado.cdi || metaRenda <= 0 || percCDI <= 0) return null;

		const cdiMensal = (1 + dadosMercado.cdi) ** (1 / 12) - 1;
		const inflacaoMensal = (1 + dadosMercado.inflacao) ** (1 / 12) - 1;

		const rendimentoBrutoMensal = cdiMensal * (percCDI / 100);
		const aliquotaIR = 0.15;
		const rendimentoLiquidoMensal = rendimentoBrutoMensal * (1 - aliquotaIR);

		const capitalNecessario = metaRenda / rendimentoLiquidoMensal;

		const proporcaoReinvestir = inflacaoMensal / rendimentoLiquidoMensal;
		const valorReinvestir = metaRenda * proporcaoReinvestir;
		const rendaRealDisponivel = metaRenda - valorReinvestir;

		return {
			capital: capitalNecessario,
			taxaMensalLiq: rendimentoLiquidoMensal,
			porcentagemReinvestir: proporcaoReinvestir * 100,
			valorReinvestir: valorReinvestir,
			rendaReal: rendaRealDisponivel,
		};
	}, [metaRenda, percCDI, dadosMercado]);

	const inputClassName = inputClass;
	const cardClass = `${toolPanelClass} border-l-4 border-l-accent`;

	const MarketIndicator = ({ label, value, colorClass }: { label: string; value: string; colorClass: string }) => (
		<div
			className={`${toolStatCardClass} relative overflow-hidden ${dadosMercado.isFallback ? "border-accent-muted" : ""}`}
		>
			{dadosMercado.isFallback && (
				<div
					className="absolute top-0 right-0 m-1 size-2 rounded-full bg-accent"
					title="Valor Estimado (API Offline)"
				/>
			)}
			<span className="font-mono text-xs tracking-label text-muted uppercase">{label}</span>
			<strong className={`text-xl ${colorClass || "text-accent"}`}>{value}</strong>
		</div>
	);

	return (
		<div className="space-y-6">
			<div className="space-y-4">
				<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
					<div>
						<label htmlFor="rendamensal" className={fieldLabelClass}>
							Meta de Renda Mensal
						</label>
						<input
							id="rendamensal"
							type="number"
							value={metaRenda}
							onInput={(e) => setMetaRenda(Number(e.currentTarget.value))}
							className={inputClassName}
							placeholder="Ex: 5000"
						/>
					</div>
					<div>
						<label htmlFor="rentabilidade" className={fieldLabelClass}>
							Rentabilidade (% do CDI)
						</label>
						<div className="relative">
							<input
								id="rentabilidade"
								type="number"
								value={percCDI}
								onInput={(e) => setPercCDI(Number(e.currentTarget.value))}
								className={inputClassName}
								placeholder="100"
							/>
							<span className="absolute right-4 top-3 text-muted/80 font-bold text-sm">%</span>
						</div>
					</div>
				</div>

				{/* Cards de Indicadores de Mercado */}
				<div className="grid grid-cols-2 gap-4">
					<MarketIndicator label="CDI Atual (Ano)" value={`${(dadosMercado.cdi * 100).toFixed(2)}%`} colorClass="" />
					<MarketIndicator
						label="Inflação (IPCA)"
						value={`${(dadosMercado.inflacao * 100).toFixed(2)}%`}
						colorClass="text-ink"
					/>
				</div>
				{dadosMercado.isFallback && (
					<p className="text-xs text-accent/75 text-right mt-1">* Valores estimados. API indisponível.</p>
				)}
			</div>

			{/* --- Resultado --- */}
			{resultado && (
				<div className={`${cardClass} border-accent/20 animate-in fade-in slide-in-from-bottom-2 duration-500`}>
					<h3 className="text-lg font-bold mb-4 uppercase tracking-wide text-accent">Planejamento Financeiro</h3>

					<div className="flex flex-col gap-6">
						{/* Capital Principal */}
						<div>
							<p className="text-ink-2 mb-1 text-sm">Patrimônio Necessário:</p>
							<p className="text-3xl font-extrabold tracking-tight text-ink lg:text-4xl">
								{formatarMoeda(resultado.capital)}
							</p>
						</div>

						<div className={`${toolCardClass} relative overflow-hidden p-md`}>
							<div className="absolute top-0 left-0 h-1 w-full bg-accent/40 opacity-50"></div>

							<h4 className="mb-3 flex items-center text-sm font-bold text-ink-2">Distribuição da Renda Gerada</h4>

							<div className="grid grid-cols-1 gap-3 text-sm lg:grid-cols-2">
								<div className="rounded-input border border-accent-muted bg-accent-bg p-3">
									<span className="mb-1 block font-bold text-accent uppercase">Reinvestir (Inflação)</span>
									<strong className="block text-lg text-ink-2">{formatarMoeda(resultado.valorReinvestir)}</strong>
									<span className="text-muted">{resultado.porcentagemReinvestir.toFixed(1)}% do total</span>
								</div>
								<div className="rounded-input border border-rule bg-paper p-3">
									<span className="mb-1 block font-bold text-ink uppercase">Pode Gastar (Livre)</span>
									<strong className="block text-lg text-ink-2">{formatarMoeda(resultado.rendaReal)}</strong>
									<span className="text-muted">{(100 - resultado.porcentagemReinvestir).toFixed(1)}% do total</span>
								</div>
							</div>
						</div>

						<div className="flex justify-between items-center border-t border-rule pt-2 text-muted">
							<span>
								Rend. Líquido Real: <strong>~{(resultado.taxaMensalLiq * 100).toFixed(2)}% a.m.</strong>
							</span>
							<span>
								IR: <strong>15%</strong>
							</span>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
