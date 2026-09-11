import { useMemo, useState } from "react";
import { toolResultRowClass } from "@/lib/toolUi";
import { fieldLabelClass, inputClass } from "../uiClasses";

function calcularCustoCombustivel(distancia: number, kml: number, preco: number, freq: number) {
	// Retorna tudo zerado se faltar dados
	if ([distancia, kml, preco, freq].some((val) => !val || val <= 0)) {
		return { diario: 0, semanal: 0, mensal: 0, anual: 0, litros: 0 };
	}

	const litrosDiarios = distancia / kml;
	const custoDiario = litrosDiarios * preco;
	const custoSemanal = custoDiario * freq;
	const custoMensal = custoSemanal * 4.28; // Média mais precisa de semanas/mês (30/7)
	const custoAnual = custoMensal * 12;

	return {
		litros: litrosDiarios,
		diario: custoDiario,
		semanal: custoSemanal,
		mensal: custoMensal,
		anual: custoAnual,
	};
}

export default function FuelCostCard() {
	const [inputs, setInputs] = useState({
		distanciaTotalDiaria: 54,
		kmPorLitroMedio: 15.0,
		precoGasolinaPorLitro: 6.29,
		frequenciaSemanal: 5,
	});

	// Tipo auxiliar para garantir segurança no handleChange
	type InputKeys = keyof typeof inputs;

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.currentTarget;
		let numValue = parseFloat(value);

		// Tratamento para evitar NaN visual
		if (Number.isNaN(numValue)) numValue = 0;

		// Regras de negócio
		if (name === "frequenciaSemanal") {
			if (numValue > 7) numValue = 7;
			if (numValue < 0) numValue = 0;
		} else if (numValue < 0) {
			numValue = 0;
		}

		// AQUI: Usamos 'as InputKeys' para o TypeScript não reclamar
		setInputs((prev) => ({ ...prev, [name as InputKeys]: numValue }));
	};

	const res = useMemo(() => {
		return calcularCustoCombustivel(
			inputs.distanciaTotalDiaria,
			inputs.kmPorLitroMedio,
			inputs.precoGasolinaPorLitro,
			inputs.frequenciaSemanal,
		);
	}, [inputs]);

	const inputClasses = inputClass;

	return (
		<div className="space-y-6">
			<p className="text-sm text-muted">Descubra o impacto do combustível no seu orçamento mensal e anual.</p>

			{/* --- Campos de Entrada --- */}
			<div className="space-y-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
				<InputGroup
					label="Distância Diária (Km)"
					name="distanciaTotalDiaria"
					value={inputs.distanciaTotalDiaria}
					onChange={handleChange}
					classes={inputClasses}
				/>
				<InputGroup
					label="Consumo (Km/L)"
					name="kmPorLitroMedio"
					value={inputs.kmPorLitroMedio}
					onChange={handleChange}
					classes={inputClasses}
					step="0.1"
				/>
				<InputGroup
					label="Preço Gasolina (R$)"
					name="precoGasolinaPorLitro"
					value={inputs.precoGasolinaPorLitro}
					onChange={handleChange}
					classes={inputClasses}
					step="0.01"
				/>
				<InputGroup
					label="Dias por Semana"
					name="frequenciaSemanal"
					value={inputs.frequenciaSemanal}
					onChange={handleChange}
					classes={inputClasses}
					min={1}
					max={7}
				/>
			</div>

			{/* --- Resultados --- */}
			<div className="mt-8 border-t border-rule/50 pt-6 space-y-3">
				<h3 className="text-lg font-bold mb-4 text-accent">Estimativa de Gastos</h3>

				<div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
					{/* Coluna da Esquerda (Curto Prazo) */}
					<div className="space-y-3">
						<ResultItem label="Litros/Dia" value={`${res.litros.toFixed(1)} L`} />
						<ResultItem label="Custo Diário" value={`R$ ${res.diario.toFixed(2)}`} />
						<ResultItem label="Custo Semanal" value={`R$ ${res.semanal.toFixed(2)}`} />
					</div>

					{/* Coluna da Direita (Longo Prazo - Destaque) */}
					<div className="space-y-3">
						<ResultItem label="Custo Mensal" value={`R$ ${res.mensal.toFixed(2)}`} isTotal />
						<ResultItem label="Custo Anual" value={`R$ ${res.anual.toFixed(2)}`} isTotal />
					</div>
				</div>
			</div>
		</div>
	);
}

// --- Componentes Auxiliares (Fora do Componente Principal para Performance) ---

interface InputGroupProps extends React.InputHTMLAttributes<HTMLInputElement> {
	label: string;
	name: string;
	value: number;
	classes: string;
}

const InputGroup: React.FC<InputGroupProps> = ({ label, name, value, classes, ...props }) => (
	<div className="flex flex-col gap-1.5">
		<label htmlFor={name} className={fieldLabelClass}>
			{label}
		</label>
		<input
			type="number"
			id={name}
			name={name}
			value={value.toString()} // toString ajuda a evitar warnings do React
			className={classes}
			required
			{...props}
		/>
	</div>
);

interface ResultItemProps {
	label: string;
	value: string;
	isTotal?: boolean;
}

const ResultItem: React.FC<ResultItemProps> = ({ label, value }) => (
	<div className={toolResultRowClass}>
		<span className="font-medium text-ink-2">{label}</span>
		<span className="text-lg font-bold text-accent">{value}</span>
	</div>
);
