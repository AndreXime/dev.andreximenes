import { Flame } from "lucide-react";
import { useMemo, useState } from "react";
import { ToolShell } from "../ToolShell";
import { InputField, ResultCard } from "./Components";
import {
	calcularPlanoAposentadoriaTributado,
	defaultFinancialPlanInput,
	type FinancialPlanInput,
	formatarMoeda,
} from "./domain";

export default function FirePlanner() {
	const [inputs, setInputs] = useState<FinancialPlanInput>(defaultFinancialPlanInput);
	const [showEvolution, setShowEvolution] = useState(false);

	const resultado = useMemo(() => {
		if (
			inputs.salarioAtual <= 0 ||
			inputs.alvoAposentadoria <= 0 ||
			inputs.taxaAportePercentual <= 0 ||
			inputs.taxaJurosAnualReal <= 0 ||
			inputs.salarioContribuicaoInss < 0 ||
			inputs.idadeAtual <= 0 ||
			inputs.idadeMinimaInss <= inputs.idadeAtual ||
			inputs.aliquotaIrRetirada < 0 ||
			inputs.aliquotaIrRetirada >= 100
		) {
			return null;
		}

		return calcularPlanoAposentadoriaTributado(inputs);
	}, [inputs]);

	const updateInput = <K extends keyof FinancialPlanInput>(key: K, value: FinancialPlanInput[K]) => {
		setInputs((prev) => ({ ...prev, [key]: value }));
	};

	const patrimonioMaximo =
		resultado?.evolucaoPatrimonio.reduce((max, row) => Math.max(max, row.patrimonioTotal), 0) ?? 0;

	return (
		<ToolShell
			title="Planejador de Independência Financeira (FIRE)"
			description="Projeção de quando você pode viver dos investimentos, com gap do INSS e tributação na retirada. Regra dos 0,5% ao mês e gross-up de IR no saque."
			icon={<Flame className="size-6" strokeWidth={2} />}
		>
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
				<InputField
					id="salarioAtual"
					label="Salário atual (R$ / mês)"
					value={inputs.salarioAtual}
					onChange={(v) => updateInput("salarioAtual", v)}
					min={0}
					step={100}
				/>
				<InputField
					id="alvoAposentadoria"
					label="Renda líquida desejada (R$ / mês)"
					value={inputs.alvoAposentadoria}
					onChange={(v) => updateInput("alvoAposentadoria", v)}
					min={0}
					step={100}
				/>
				<InputField
					id="taxaAportePercentual"
					label="Taxa de aporte (%)"
					value={inputs.taxaAportePercentual}
					onChange={(v) => updateInput("taxaAportePercentual", Math.min(100, Math.max(0, v)))}
					suffix="%"
					min={0}
					max={100}
					step={1}
				/>
				<InputField
					id="taxaJurosAnualReal"
					label="Rentabilidade real dos investimentos (% a.a., acima da inflação)"
					value={inputs.taxaJurosAnualReal}
					onChange={(v) => updateInput("taxaJurosAnualReal", v)}
					suffix="%"
					min={0}
					step={0.1}
				/>
				<InputField
					id="valorInssFixo"
					label="Benefício INSS na aposentadoria (R$ / mês)"
					value={inputs.valorInssFixo}
					onChange={(v) => updateInput("valorInssFixo", v)}
					min={0}
					step={50}
				/>
				<InputField
					id="aliquotaIrRetirada"
					label="Alíquota média de IR (%)"
					value={inputs.aliquotaIrRetirada}
					onChange={(v) => updateInput("aliquotaIrRetirada", Math.min(99, Math.max(0, v)))}
					suffix="%"
					min={0}
					max={99}
					step={1}
				/>
				<InputField
					id="idadeAtual"
					label="Idade atual (anos)"
					value={inputs.idadeAtual}
					onChange={(v) => updateInput("idadeAtual", v)}
					min={1}
					step={1}
				/>
				<InputField
					id="idadeMinimaInss"
					label="Idade mínima INSS (anos)"
					value={inputs.idadeMinimaInss}
					onChange={(v) => updateInput("idadeMinimaInss", v)}
					min={1}
					step={1}
				/>
			</div>

			<div className="h-px w-full bg-linear-to-r from-transparent via-rule/70 to-transparent" />

			{!resultado ? (
				<div className="rounded-card border border-rule bg-paper-2 px-4 py-3 text-sm text-muted">
					Ajuste os valores para gerar a projeção. A idade mínima do INSS precisa ser maior que a idade atual.
				</div>
			) : (
				<div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
						<ResultCard
							label="Tempo restante"
							value={`${resultado.tempoAnos} anos`}
							hint={`Aos ${resultado.idadeAposentadoriaProjetada} anos de idade`}
							highlight
						/>
						<ResultCard
							label="Patrimônio alvo"
							value={formatarMoeda(resultado.patrimonioAlvoNecessario)}
							hint={resultado.considerouInssNoAlvo ? "Com desconto do INSS" : "Sem INSS no cálculo"}
						/>
						<ResultCard
							label="Valor livre para gasto"
							value={formatarMoeda(resultado.valorLivreParaGasto)}
							hint={`Aporte ${formatarMoeda(resultado.aporteMensal)} + INSS ${formatarMoeda(resultado.contribuicaoInssMensal)} / mês (base mínima)`}
						/>
						<ResultCard
							label="Saque bruto mensal"
							value={formatarMoeda(resultado.rendaBrutaNecessaria)}
							hint={`Para sobrar ${formatarMoeda(inputs.alvoAposentadoria)} líquidos`}
						/>
					</div>

					<div className="rounded-card border border-rule bg-[color-mix(in_srgb,var(--color-paper)_50%,transparent)] px-4 py-3 text-xs text-muted/85 leading-relaxed">
						{resultado.considerouInssNoAlvo ? (
							<>
								A partir dos {inputs.idadeMinimaInss} anos, o INSS de {formatarMoeda(inputs.valorInssFixo)} reduz a
								necessidade de saque do investimento. O patrimônio alvo considera apenas o gap restante, já com gross-up
								de {inputs.aliquotaIrRetirada}% de IR.
							</>
						) : (
							<>
								A independência foi atingida antes da idade mínima do INSS. O patrimônio alvo cobre a renda líquida
								integral, com gross-up de {inputs.aliquotaIrRetirada}% de IR.
							</>
						)}
					</div>

					<div className="rounded-card border border-rule bg-paper-2 overflow-hidden">
						<button
							type="button"
							onClick={() => setShowEvolution((prev) => !prev)}
							className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left text-sm font-semibold text-ink hover:bg-accent-bg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
						>
							<span>Evolução do patrimônio</span>
							<span className="text-xs font-medium text-muted/70">
								{showEvolution ? "Ocultar" : "Ver"} ({resultado.evolucaoPatrimonio.length} pontos)
							</span>
						</button>

						{showEvolution && (
							<div className="border-t border-rule overflow-x-auto">
								<table className="w-full min-w-144 text-sm">
									<thead>
										<tr className="text-left text-[10px] uppercase tracking-[0.12em] text-muted/75 border-b border-rule">
											<th className="px-4 py-2 font-semibold">Idade</th>
											<th className="px-4 py-2 font-semibold">Investido</th>
											<th className="px-4 py-2 font-semibold">Juros</th>
											<th className="px-4 py-2 font-semibold">Patrimônio</th>
											<th className="px-4 py-2 font-semibold w-32">Progresso</th>
										</tr>
									</thead>
									<tbody>
										{resultado.evolucaoPatrimonio.map((row) => {
											const progresso =
												patrimonioMaximo > 0 ? Math.min(100, (row.patrimonioTotal / patrimonioMaximo) * 100) : 0;
											const atingiuAlvo =
												row.patrimonioTotal >= resultado.patrimonioAlvoNecessario &&
												resultado.patrimonioAlvoNecessario > 0;

											return (
												<tr
													key={row.idade}
													className={[
														"border-b border-rule/60 last:border-b-0",
														atingiuAlvo ? "bg-accent-bg" : "",
													].join(" ")}
												>
													<td className="px-4 py-2 tabular-nums text-ink">{row.idade}</td>
													<td className="px-4 py-2 tabular-nums text-muted">{formatarMoeda(row.totalInvestido)}</td>
													<td className="px-4 py-2 tabular-nums text-muted">{formatarMoeda(row.jurosAcumulados)}</td>
													<td className="px-4 py-2 tabular-nums font-medium text-ink">
														{formatarMoeda(row.patrimonioTotal)}
													</td>
													<td className="px-4 py-2">
														<div className="h-2 rounded-full bg-rule/50 overflow-hidden">
															<div
																className="h-full rounded-full bg-accent transition-all"
																style={{ width: `${progresso}%` }}
															/>
														</div>
													</td>
												</tr>
											);
										})}
									</tbody>
								</table>
							</div>
						)}
					</div>
				</div>
			)}
		</ToolShell>
	);
}
