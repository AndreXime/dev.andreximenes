import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { cn } from "../lib/cn";
import { ACME } from "./acme/data";

export function Pricing1() {
	return (
		<section className="bg-ct-background px-6 py-20">
			<div className="mx-auto max-w-6xl">
				<div className="mb-12 text-center">
					<h2 className="font-ct-heading text-3xl font-bold text-ct-foreground">Simple, transparent pricing</h2>
					<p className="mt-2 text-ct-muted-foreground">Choose the plan that&apos;s right for your team</p>
				</div>
				<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
					{ACME.plans.map((plan) => (
						<article
							key={plan.name}
							className={cn(
								"flex flex-col rounded-xl border p-6",
								plan.highlighted
									? "border-ct-primary bg-ct-primary/5 shadow-lg ring-1 ring-ct-primary/20"
									: "border-ct-border bg-ct-background",
							)}
						>
							<div className="flex items-center justify-between gap-2">
								<h3 className="font-ct-heading text-xl font-semibold">{plan.name}</h3>
								{"badge" in plan && plan.badge && <Badge>{plan.badge}</Badge>}
							</div>
							<p className="mt-4 font-ct-heading text-4xl font-bold">
								{plan.price}
								<span className="text-base font-normal text-ct-muted-foreground">{plan.period}</span>
							</p>
							<p className="mt-2 text-sm text-ct-muted-foreground">{plan.description}</p>
							<ul className="mt-6 flex-1 space-y-2 text-sm text-ct-muted-foreground">
								{plan.features.map((feature) => (
									<li key={feature} className="flex gap-2">
										<span className="text-ct-primary">✓</span>
										{feature}
									</li>
								))}
							</ul>
							<Button className="mt-8 w-full" variant={plan.highlighted ? "primary" : "outline"}>
								Get started
							</Button>
						</article>
					))}
				</div>
				<p className="mt-8 text-center text-sm text-ct-muted-foreground">
					All plans include a 14-day free trial. No credit card required.
				</p>
			</div>
		</section>
	);
}

export function Pricing2() {
	const featured = ACME.plans.find((p) => p.highlighted) ?? ACME.plans[1];
	if (!featured) return null;

	return (
		<section className="bg-ct-muted px-6 py-20">
			<div className="mx-auto max-w-lg">
				<article className="overflow-hidden rounded-2xl border border-ct-border bg-ct-background shadow-sm">
					<div className="bg-ct-primary px-6 py-8 text-ct-primary-foreground">
						{"badge" in featured && featured.badge && (
							<p className="text-sm font-medium opacity-90">{featured.badge}</p>
						)}
						<h2 className="mt-1 font-ct-heading text-3xl font-bold">{featured.name}</h2>
						<p className="mt-4 font-ct-heading text-5xl font-bold">
							{featured.price}
							<span className="text-lg font-normal opacity-80">{featured.period}</span>
						</p>
					</div>
					<div className="p-6">
						<p className="text-sm text-ct-muted-foreground">{featured.description}</p>
						<ul className="mt-6 space-y-2 text-sm">
							{featured.features.map((f) => (
								<li key={f}>{f}</li>
							))}
						</ul>
						<Button className="mt-8 w-full" size="lg">
							Start free trial
						</Button>
					</div>
				</article>
			</div>
		</section>
	);
}

export function Pricing3() {
	return (
		<section className="bg-ct-background px-6 py-20">
			<div className="mx-auto max-w-4xl overflow-x-auto">
				<h2 className="font-ct-heading text-3xl font-bold text-ct-foreground">Compare plans</h2>
				<table className="mt-8 w-full min-w-144 border-collapse text-left text-sm">
					<thead>
						<tr className="border-b border-ct-border">
							<th className="py-3 pr-4 font-semibold text-ct-muted-foreground">Feature</th>
							{ACME.plans.map((plan) => (
								<th key={plan.name} className="px-4 py-3 font-ct-heading font-semibold">
									{plan.name}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{[
							["Price", ...ACME.plans.map((p) => `${p.price}${p.period}`)],
							["Team size", "10", "50", "Unlimited"],
							["Storage", "5 GB", "100 GB", "Unlimited"],
							["Support", "Email", "Priority", "24/7 dedicated"],
						].map(([label, ...values]) => (
							<tr key={label} className="border-b border-ct-border">
								<td className="py-4 pr-4 font-medium">{label}</td>
								{values.map((val) => (
									<td key={`${label}-${val}`} className="px-4 py-4 text-ct-muted-foreground">
										{val}
									</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</section>
	);
}
