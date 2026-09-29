import type { UserData } from "@/tools/CVBuilder/lib/types";
import { escapeHtml, removeHttps, richTextToHtml } from "./escapeHtml";

const PAGE_CSS = `
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    background: #fff;
    color: #000;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .a4-page {
    width: 210mm;
    min-height: 297mm;
    margin: 0;
    background: #fff;
    padding: 10mm;
    font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
    line-height: 1.4;
  }
  .a4-page a { text-decoration: underline; color: #1d4ed8; }
  header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 12px; }
  h1 { font-size: 1.875rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 2px; }
  .role { font-size: 1rem; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 500; margin: 0 0 4px; }
  .meta { font-size: 0.75rem; font-weight: 500; }
  .meta p { margin: 2px 0; }
  section { margin-bottom: 12px; }
  h2 {
    font-size: 14px;
    font-weight: 700;
    text-transform: uppercase;
    border-bottom: 1px solid #000;
    margin: 0 0 6px;
    padding-bottom: 2px;
  }
  .body-text { font-size: 12px; line-height: 1.4; text-align: left; margin: 0; }
  .row { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; }
  .item { margin-bottom: 8px; }
  .item:last-child { margin-bottom: 0; }
  .item-title { font-size: 13px; font-weight: 700; margin: 0; }
  .item-period { font-size: 12px; font-weight: 700; white-space: nowrap; }
  .item-sub { font-size: 12px; font-style: italic; }
  .item-link { font-size: 11px; word-break: break-all; }
  ul { list-style: disc; margin: 4px 0 0; padding-left: 16px; font-size: 12px; line-height: 1.4; }
  li { margin: 2px 0; }
  .skills { display: grid; grid-template-columns: 1fr; gap: 2px; font-size: 12px; }
`;

function link(href: string, label: string): string {
	const safeHref = escapeHtml(href);
	const safeLabel = escapeHtml(label);
	return `<a href="${safeHref}">${safeLabel}</a>`;
}

function renderHeader(data: UserData["header"]): string {
	const links = [
		data.links.portfolio ? link(data.links.portfolio, removeHttps(data.links.portfolio)) : "",
		data.links.linkedin ? link(data.links.linkedin, removeHttps(data.links.linkedin)) : "",
		data.links.github ? link(data.links.github, removeHttps(data.links.github)) : "",
	].filter(Boolean);

	const contactBits = [
		escapeHtml(data.location),
		escapeHtml(data.phone),
		data.email ? link(`mailto:${data.email}`, data.email) : "",
	].filter(Boolean);

	return `
    <header>
      <h1>${escapeHtml(data.name)}</h1>
      <p class="role">${escapeHtml(data.role)}</p>
      <div class="meta">
        <p>${contactBits.join(" | ")}</p>
        ${links.length > 0 ? `<p>${links.join(" | ")}</p>` : ""}
      </div>
    </header>
  `;
}

function renderIntro(text: string): string {
	if (!text.trim()) return "";
	return `
    <section>
      <h2>Resumo Profissional</h2>
      <p class="body-text">${richTextToHtml(text)}</p>
    </section>
  `;
}

function renderSkills(skills: UserData["skills"]): string {
	if (skills.length === 0) return "";
	return `
    <section>
      <h2>Habilidades Técnicas</h2>
      <div class="skills">
        ${skills.map((skill) => `<div>${richTextToHtml(skill)}</div>`).join("")}
      </div>
    </section>
  `;
}

function renderExperience(experiences: UserData["experience"]): string {
	if (experiences.length === 0) return "";
	const items = experiences
		.map((experience) => {
			const bullets =
				experience.descriptionList && experience.descriptionList.length > 0
					? `<ul>${experience.descriptionList.map((text) => `<li>${richTextToHtml(text)}</li>`).join("")}</ul>`
					: "";
			const short = experience.shortdescription
				? `<div class="body-text" style="margin-bottom:4px">${richTextToHtml(experience.shortdescription)}</div>`
				: "";
			const url = experience.url
				? `<span class="item-link">${link(experience.url, removeHttps(experience.url))}</span>`
				: "";

			return `
        <div class="item">
          <div class="row">
            <h3 class="item-title">${escapeHtml(experience.role)}</h3>
            <span class="item-period">${escapeHtml(experience.period)}</span>
          </div>
          <div class="row" style="margin-bottom:4px">
            <div class="item-sub">${escapeHtml(experience.company)}</div>
            ${url}
          </div>
          ${short}
          ${bullets}
        </div>
      `;
		})
		.join("");

	return `
    <section>
      <h2>Experiência Profissional</h2>
      ${items}
    </section>
  `;
}

function renderProjects(projects: UserData["projects"]): string {
	if (projects.length === 0) return "";
	const items = projects
		.map((project) => {
			const bullets =
				project.descriptionList && project.descriptionList.length > 0
					? `<ul>${project.descriptionList.map((text) => `<li>${richTextToHtml(text)}</li>`).join("")}</ul>`
					: "";
			const url = project.url ? `<span class="item-link">${link(project.url, removeHttps(project.url))}</span>` : "";

			return `
        <div class="item">
          <div class="row" style="margin-bottom:4px">
            <h3 class="item-title">${escapeHtml(project.title)}</h3>
            ${url}
          </div>
          <p class="body-text">${richTextToHtml(project.description)}</p>
          ${bullets}
        </div>
      `;
		})
		.join("");

	return `
    <section>
      <h2>Projetos Relevantes</h2>
      ${items}
    </section>
  `;
}

function renderEducation(educations: UserData["education"]): string {
	if (educations.length === 0) return "";
	const items = educations
		.map((edu) => {
			const url = edu.url ? `<span class="item-link">${link(edu.url, removeHttps(edu.url))}</span>` : "";
			return `
        <div class="item">
          <div class="row">
            <span style="font-weight:700;font-size:12px">${escapeHtml(edu.degree)}</span>
            <span class="item-period">${escapeHtml(edu.period)}</span>
          </div>
          <div class="row">
            <span class="item-sub" style="font-size:11px">${escapeHtml(edu.institution)}</span>
            ${url}
          </div>
        </div>
      `;
		})
		.join("");

	return `
    <section style="margin-bottom:0">
      <h2>Formação Acadêmica</h2>
      ${items}
    </section>
  `;
}

export function renderResumeHtml(data: UserData): string {
	return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(data.header.name || "Currículo")}</title>
  <style>${PAGE_CSS}</style>
</head>
<body>
  <div class="a4-page">
    ${renderHeader(data.header)}
    ${renderIntro(data.intro)}
    ${renderExperience(data.experience)}
    ${renderProjects(data.projects)}
    ${renderSkills(data.skills)}
    ${renderEducation(data.education)}
  </div>
</body>
</html>`;
}
