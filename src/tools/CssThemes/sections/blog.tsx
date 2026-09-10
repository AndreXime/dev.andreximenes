import { placeholderForIndex } from "../assets/images";
import { Button } from "../components/ui/Button";
import { ACME } from "./acme/data";
import { SectionImage } from "./shared/SectionImage";

export function Blog1() {
	return (
		<section className="bg-ct-background px-6 py-20">
			<div className="mx-auto max-w-6xl">
				<div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
					<div>
						<p className="text-sm font-semibold uppercase tracking-widest text-ct-primary">Journal</p>
						<h2 className="mt-2 font-ct-heading text-3xl font-bold text-ct-foreground">
							Latest Insights from the Acme Blog
						</h2>
					</div>
					<Button variant="ghost">View all</Button>
				</div>
				<div className="grid grid-cols-1 gap-6 md:grid-cols-3">
					{ACME.blog.map((post, index) => (
						<article
							key={post.title}
							className="group flex min-w-0 flex-col rounded-ct-lg border border-ct-border transition-shadow duration-150 hover:shadow-md"
						>
							<SectionImage
								alt={post.title}
								placeholder={placeholderForIndex(index)}
								className="aspect-16/10 rounded-t-lg"
							/>
							<div className="flex flex-1 flex-col p-5">
								<p className="text-xs text-ct-muted-foreground">
									{post.date} · {post.author}
								</p>
								<h3 className="mt-2 font-ct-heading font-semibold text-ct-foreground group-hover:text-ct-primary">
									{post.title}
								</h3>
								<p className="mt-2 flex-1 text-sm text-ct-muted-foreground">{post.excerpt}</p>
								<Button variant="ghost" size="sm" className="mt-4 w-fit px-0">
									Read
								</Button>
							</div>
						</article>
					))}
				</div>
			</div>
		</section>
	);
}

export function Blog2() {
	return (
		<section className="bg-ct-muted px-6 py-20">
			<div className="mx-auto max-w-3xl">
				<h2 className="font-ct-heading text-3xl font-bold text-ct-foreground">Latest from the Journal</h2>
				<ul className="mt-8 divide-y divide-border">
					{ACME.blog.map((post) => (
						<li key={post.title} className="py-6">
							<p className="text-xs text-ct-muted-foreground">
								{post.date} · {post.author}
							</p>
							<h3 className="mt-1 font-ct-heading text-lg font-semibold text-ct-foreground">{post.title}</h3>
							<p className="mt-2 text-sm text-ct-muted-foreground">{post.excerpt}</p>
						</li>
					))}
				</ul>
			</div>
		</section>
	);
}

export function Blog3() {
	const [featured, ...rest] = ACME.blog;
	return (
		<section className="bg-ct-background px-6 py-20">
			<div className="mx-auto max-w-6xl">
				<p className="text-sm font-semibold uppercase tracking-widest text-ct-primary">Journal</p>
				{featured && (
					<article className="mt-6 grid grid-cols-1 gap-8 border-b border-ct-border pb-10 lg:grid-cols-2">
						<SectionImage alt={featured.title} placeholder={1} className="aspect-4/3 rounded-ct-lg" />
						<div>
							<p className="text-xs text-ct-muted-foreground">
								{featured.date} · {featured.author}
							</p>
							<h3 className="mt-2 font-ct-heading text-2xl font-bold text-ct-foreground">{featured.title}</h3>
							<p className="mt-3 text-ct-muted-foreground">{featured.excerpt}</p>
							<Button className="mt-6" variant="outline">
								Read article
							</Button>
						</div>
					</article>
				)}
				<div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
					{rest.map((post, index) => (
						<article key={post.title}>
							<SectionImage
								alt={post.title}
								placeholder={placeholderForIndex(index + 1)}
								className="mb-4 aspect-16/10 rounded-ct-lg"
							/>
							<p className="text-xs text-ct-muted-foreground">
								{post.date} · {post.author}
							</p>
							<h3 className="mt-1 font-ct-heading font-semibold">{post.title}</h3>
						</article>
					))}
				</div>
			</div>
		</section>
	);
}
