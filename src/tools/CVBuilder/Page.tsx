import { useStore } from "@nanostores/react";
import { parsedContent$ } from "./lib/store";
import type { UserData } from "./lib/types";

export default function ResumeContent() {
	const content = useStore(parsedContent$);

	if (!content) return null;

	return (
		<div className="a4-page">
			<Header data={content.header} />
			<Intro text={content.intro} />
			<Experience experiences={content.experience} />
			<Projects projects={content.projects} />
			<Skills skills={content.skills} />
			<Education educations={content.education} />
		</div>
	);
}

const removeHttps = (url: string) => url.replace(/^https?:\/\//, "");

// Para resolver negritos e italicos do markdown que podem aparecer
function RichText({ content }: { content: string }) {
	const html = content.replace(/\*\*(.*?)\*\*/g, "<strong >$1</strong>").replace(/\*(.*?)\*/g, "<em >$1</em>");
	return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

function Header({ data }: { data: UserData["header"] }) {
	return (
		<header className="text-center border-b-2 border-black pb-3 mb-3">
			<h1 className="text-3xl font-bold uppercase tracking-wide mb-0.5">{data.name}</h1>
			<p className="text-base uppercase tracking-wider font-medium mb-1">{data.role}</p>
			<div className="text-xs font-medium space-y-0.5">
				<p>
					{data.location} {" | "}
					{data.phone} {" | "}
					<a href={`mailto:${data.email}`} className="text-blue-700 underline decoration-blue-700">
						{data.email}
					</a>
				</p>
				<p>
					<a
						href={data.links.portfolio}
						target="_blank"
						rel="noopener noreferrer"
						className="text-blue-700 underline decoration-blue-700"
					>
						{removeHttps(data.links.portfolio)}
					</a>
					{" | "}
					<a
						href={data.links.linkedin}
						target="_blank"
						rel="noopener noreferrer"
						className="text-blue-700 underline decoration-blue-700"
					>
						{removeHttps(data.links.linkedin)}
					</a>
					{" | "}
					<a
						href={data.links.github}
						target="_blank"
						rel="noopener noreferrer"
						className="text-blue-700 underline decoration-blue-700"
					>
						{removeHttps(data.links.github)}
					</a>
				</p>
			</div>
		</header>
	);
}

function Intro({ text }: { text: UserData["intro"] }) {
	return (
		<section className="mb-3">
			<h2 className="text-[14px] font-bold uppercase border-b border-black mb-1.5 pb-0.5">Resumo Profissional</h2>
			<p className="text-[12px] leading-normal text-left">
				<RichText content={text} />
			</p>
		</section>
	);
}

function Skills({ skills }: { skills: UserData["skills"] }) {
	return (
		<section className="mb-3">
			<h2 className="text-[14px] font-bold uppercase border-b border-black mb-1.5 pb-0.5">Habilidades Técnicas</h2>
			<div className="text-[12px] leading-normal grid grid-cols-1 gap-0.5">
				{skills.map((skill) => (
					<div key={skill}>
						<RichText content={skill} />
					</div>
				))}
			</div>
		</section>
	);
}

function Experience({ experiences }: { experiences: UserData["experience"] }) {
	return (
		<section className="mb-3">
			<h2 className="text-[14px] font-bold uppercase border-b border-black mb-2 pb-0.5">Experiência Profissional</h2>

			{experiences.map((experience) => (
				<div key={experience.company} className="mb-2 last:mb-0">
					<div className="flex justify-between items-baseline">
						<h3 className="font-bold text-[13px]">{experience.role}</h3>
						<span className="text-[12px] font-bold">{experience.period}</span>
					</div>
					<div className="mb-1 flex justify-between items-baseline">
						<div className="text-[12px] italic">{experience.company}</div>
						{experience.url && (
							<a
								href={experience.url}
								target="_blank"
								rel="noopener noreferrer"
								className="block text-[11px] text-blue-700 underline decoration-blue-700 break-all mt-0.5"
							>
								{removeHttps(experience.url)}
							</a>
						)}
					</div>
					{experience.shortdescription && (
						<div className="text-[12px] leading-normal mb-1">
							<RichText content={experience.shortdescription} />
						</div>
					)}
					{experience.descriptionList && experience.descriptionList.length > 0 && (
						<ul className="list-disc list-outside ml-4 text-[12px] leading-normal space-y-0.5 text-left">
							{experience.descriptionList.map((text) => (
								<li key={text}>
									<RichText content={text} />
								</li>
							))}
						</ul>
					)}
				</div>
			))}
		</section>
	);
}

function Projects({ projects }: { projects: UserData["projects"] }) {
	return (
		<section className="mb-3">
			<h2 className="text-[14px] font-bold uppercase border-b border-black mb-1.5 pb-0.5">Projetos Relevantes</h2>

			{projects.map((project) => (
				<div key={project.title} className="mb-3 last:mb-0">
					<div className="flex justify-between items-baseline mb-1">
						<h3 className="font-bold text-[13px]">{project.title}</h3>
						{project.url && (
							<a
								href={project.url}
								target="_blank"
								rel="noopener noreferrer"
								className="block text-[11px] text-blue-700 underline decoration-blue-700 break-all"
							>
								{removeHttps(project.url)}
							</a>
						)}
					</div>
					<p className="text-[12px] leading-normal text-left">
						<RichText content={project.description} />
					</p>
					{project.descriptionList && project.descriptionList.length > 0 && (
						<ul className="list-disc list-outside ml-4 text-[12px] leading-normal space-y-0.5 text-left">
							{project.descriptionList.map((text) => (
								<li key={text}>
									<RichText content={text} />
								</li>
							))}
						</ul>
					)}
				</div>
			))}
		</section>
	);
}

function Education({ educations }: { educations: UserData["education"] }) {
	return (
		<section className="mb-0 pb-0">
			<h2 className="text-[14px] font-bold uppercase border-b border-black mb-1.5 pb-0.5">Formação Acadêmica</h2>
			{educations.map((edu) => (
				<div key={edu.institution} className="mb-4 text-[12px] leading-normal last:mb-0">
					<div className="flex justify-between items-baseline">
						<span className="font-bold">{edu.degree}</span>
						<span className="font-bold whitespace-nowrap ml-2">{edu.period}</span>
					</div>
					<div className="flex justify-between items-baseline">
						<span className="block italic text-[11px] mt-0.5">{edu.institution}</span>
						{edu.url && (
							<a
								href={edu.url}
								target="_blank"
								rel="noopener noreferrer"
								className="block text-[11px] text-blue-700 underline decoration-blue-700 break-all"
							>
								{removeHttps(edu.url)}
							</a>
						)}
					</div>
				</div>
			))}
		</section>
	);
}
