import { useCallback, useEffect, useState } from "react";
import { fieldLabelClass, inputClass, segmentTabClass, tabBarClass } from "../uiClasses";

// --- Utilitários de Lógica ---

const CHARS = {
	LOWER: "abcdefghijklmnopqrstuvwxyz",
	UPPER: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
	NUMBERS: "01234456789",
	SYMBOLS: "!@#$%^&*()_+~`|}{[]:;?><,./-=",
};

interface PasswordOptions {
	includeLower: boolean;
	includeUpper: boolean;
	includeNumbers: boolean;
	includeSymbols: boolean;
}

// 1. Gerador de Senha Aleatória
function generateRandomPassword(length: number, options: PasswordOptions): string {
	let allChars = "";
	if (options.includeLower) allChars += CHARS.LOWER;
	if (options.includeUpper) allChars += CHARS.UPPER;
	if (options.includeNumbers) allChars += CHARS.NUMBERS;
	if (options.includeSymbols) allChars += CHARS.SYMBOLS;

	if (allChars.length === 0 || length < 1) return "";

	let password = "";
	const array = new Uint32Array(length);
	crypto.getRandomValues(array); // Mais seguro que Math.random()

	for (let i = 0; i < length; i++) {
		const random = array[i] ?? 0;
		password += allChars[random % allChars.length];
	}
	return password;
}

// 2. Gerador de Hash (Async)
async function generateHash(text: string, algorithm: "SHA-1" | "SHA-256" | "SHA-512"): Promise<string> {
	if (!text) return "";
	const msgBuffer = new TextEncoder().encode(text);
	const hashBuffer = await crypto.subtle.digest(algorithm, msgBuffer);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// 3. Base64 (UTF-8 Safe)
function utf8ToBase64(text: string): string {
	const bytes = new TextEncoder().encode(text);
	let binary = "";
	for (const byte of bytes) {
		binary += String.fromCharCode(byte);
	}
	return btoa(binary);
}

function base64ToUtf8(base64: string): string {
	const binary = atob(base64);
	const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
	return new TextDecoder().decode(bytes);
}

function handleBase64(text: string, mode: "encode" | "decode"): string {
	if (!text) return "";
	try {
		return mode === "encode" ? utf8ToBase64(text) : base64ToUtf8(text);
	} catch {
		return "Erro: Entrada inválida para Base64.";
	}
}

// --- Tipos de Modos ---
type GenMode = "password" | "uuid" | "hash" | "base64";

export default function SecurityToolsCard() {
	// Estado Global
	const [mode, setMode] = useState<GenMode>("password");
	const [output, setOutput] = useState("");
	const [inputText, setInputText] = useState("");
	const [copyFeedback, setCopyFeedback] = useState("");

	// Estado Senha
	const [pwLength, setPwLength] = useState(16);
	const [pwOptions, setPwOptions] = useState({
		includeLower: true,
		includeUpper: true,
		includeNumbers: true,
		includeSymbols: true,
	});

	// Estado Hash / Base64
	const [hashAlgo, setHashAlgo] = useState<"SHA-256" | "SHA-512" | "SHA-1">("SHA-256");
	const [base64Mode, setBase64Mode] = useState<"encode" | "decode">("encode");

	// --- Lógica Principal de Execução ---
	const executeAction = useCallback(async () => {
		let result = "";

		switch (mode) {
			case "password":
				result = generateRandomPassword(pwLength, pwOptions);
				break;
			case "uuid":
				result = crypto.randomUUID();
				break;
			case "hash":
				result = await generateHash(inputText, hashAlgo);
				break;
			case "base64":
				result = handleBase64(inputText, base64Mode);
				break;
		}

		setOutput(result);
		setCopyFeedback("");
	}, [mode, pwLength, pwOptions, inputText, hashAlgo, base64Mode]);

	// Executa automaticamente quando muda inputs (exceto hash pesado que poderia ter debounce, mas aqui é ok)
	useEffect(() => {
		executeAction();
	}, [executeAction]);

	// --- Helpers de UI ---

	const handlePwOption = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, checked } = e.currentTarget;
		setPwOptions((prev) => {
			const next = { ...prev, [name]: checked };
			if (!Object.values(next).some(Boolean)) return prev;
			return next;
		});
	};

	const copyToClipboard = () => {
		if (!output) return;
		navigator.clipboard.writeText(output).then(() => {
			setCopyFeedback("Copiada!");
			setTimeout(() => setCopyFeedback(""), 1500);
		});
	};

	// Estilos comuns
	const checkboxClass = "w-5 h-5 rounded bg-rule/60 border border-rule text-accent focus:ring-0";

	return (
		<div className="space-y-6">
			<div className={tabBarClass}>
				<button type="button" onClick={() => setMode("password")} className={segmentTabClass(mode === "password")}>
					Senha
				</button>
				<button type="button" onClick={() => setMode("uuid")} className={segmentTabClass(mode === "uuid")}>
					UUID
				</button>
				<button type="button" onClick={() => setMode("hash")} className={segmentTabClass(mode === "hash")}>
					Hash
				</button>
				<button type="button" onClick={() => setMode("base64")} className={segmentTabClass(mode === "base64")}>
					Base64
				</button>
			</div>

			{/* --- Área de Configuração (Muda conforme modo) --- */}
			<div className="min-h-30">
				{/* MODO: SENHA */}
				{mode === "password" && (
					<div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
						<div className="flex justify-between items-center px-1">
							<span className={fieldLabelClass}>Tamanho: {pwLength}</span>
							<input
								type="range"
								min="8"
								max="64"
								value={pwLength}
								onInput={(e) => setPwLength(Number(e.currentTarget.value))}
								className="w-1/2 h-2 bg-rule/50 rounded-lg appearance-none cursor-pointer accent-accent"
							/>
						</div>
						<div className="grid grid-cols-2 gap-3">
							{[
								{ label: "Maiúsculas", name: "includeUpper" },
								{ label: "Números", name: "includeNumbers" },
								{ label: "Símbolos", name: "includeSymbols" },
								{ label: "Minúsculas", name: "includeLower" },
							].map((opt) => (
								<label
									key={opt.name}
									className="flex items-center space-x-3 p-3 rounded-lg bg-[color-mix(in_srgb,var(--color-paper-2)_90%,#0000)] border border-transparent hover:border-rule/80 cursor-pointer"
								>
									<input
										type="checkbox"
										name={opt.name}
										checked={pwOptions[opt.name as keyof PasswordOptions]}
										onChange={handlePwOption}
										className={checkboxClass}
									/>
									<span className="text-ink-2 text-sm">{opt.label}</span>
								</label>
							))}
						</div>
						<button
							type="button"
							onClick={executeAction}
							className="w-full py-3 rounded-card font-semibold shadow-sm active:scale-[0.98] transition-transform bg-accent text-accent-ink hover:opacity-90"
						>
							Gerar Nova Senha
						</button>
					</div>
				)}

				{/* MODO: UUID */}
				{mode === "uuid" && (
					<div className="space-y-4 animate-in fade-in zoom-in-95 duration-300 text-center py-4">
						<p className="text-muted text-sm mb-4">
							Gera um Identificador Único Universal (UUID v4) criptograficamente seguro.
						</p>
						<button
							type="button"
							onClick={executeAction}
							className="w-full py-3 rounded-card font-semibold shadow-sm active:scale-[0.98] transition-transform bg-accent text-accent-ink hover:opacity-90"
						>
							Gerar Novo UUID
						</button>
					</div>
				)}

				{/* MODO: HASH */}
				{mode === "hash" && (
					<div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
						<textarea
							value={inputText}
							onInput={(e) => setInputText(e.currentTarget.value)}
							placeholder="Digite o texto para gerar o hash..."
							className={`${inputClass} h-24 resize-none`}
						/>
						<div className={tabBarClass}>
							{(["SHA-256", "SHA-512", "SHA-1"] as const).map((algo) => (
								<button
									key={algo}
									type="button"
									onClick={() => setHashAlgo(algo)}
									className={segmentTabClass(hashAlgo === algo)}
								>
									{algo}
								</button>
							))}
						</div>
					</div>
				)}

				{/* MODO: BASE64 */}
				{mode === "base64" && (
					<div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
						<textarea
							value={inputText}
							onInput={(e) => setInputText(e.currentTarget.value)}
							placeholder={base64Mode === "encode" ? "Texto para codificar..." : "Cole o Base64 aqui..."}
							className={`${inputClass} h-24 resize-none`}
						/>
						<div className={tabBarClass}>
							<button
								type="button"
								onClick={() => setBase64Mode("encode")}
								className={segmentTabClass(base64Mode === "encode")}
							>
								Codificar (Encode)
							</button>
							<button
								type="button"
								onClick={() => setBase64Mode("decode")}
								className={segmentTabClass(base64Mode === "decode")}
							>
								Decodificar (Decode)
							</button>
						</div>
					</div>
				)}
			</div>

			{/* --- Área de Resultado (Comum a todos) --- */}
			<div
				onClick={copyToClipboard}
				className="group relative mt-6 flex flex-col justify-center p-5 rounded-lg border-l-4 bg-[color-mix(in_srgb,var(--color-paper-2)_88%,#0000)] cursor-pointer hover:bg-[color-mix(in_srgb,var(--color-paper-2)_95%,#0000)] transition-all border-accent/20"
				title="Clique para Copiar"
			>
				<div className="flex justify-between items-start w-full">
					<code className="font-mono text-lg font-bold break-all text-ink-2 group-hover:text-ink transition-colors w-full pr-8">
						{output || (mode === "password" || mode === "uuid" ? "Clique em Gerar" : "Aguardando entrada...")}
					</code>
					<span
						className={`absolute top-5 right-5 text-xs font-bold uppercase tracking-wider transition-colors ${
							copyFeedback ? "text-accent" : "text-muted/70 group-hover:text-muted"
						}`}
					>
						{copyFeedback || "Copiar"}
					</span>
				</div>
				{mode === "hash" && output && (
					<span className="text-xs text-muted/80 mt-2 font-mono uppercase">{hashAlgo}</span>
				)}
			</div>
		</div>
	);
}
