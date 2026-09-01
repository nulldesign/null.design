import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { compileMDX } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import type { ComponentPropsWithoutRef, ReactElement, ReactNode } from "react";
import { createElement } from "react";

export const CONTENT_ROOT = resolve(process.cwd(), "content");

export type Section = "work" | "research" | "dev-null";

export interface Frontmatter {
  id: string;
  slug: string;
  title: string;
  deck?: string;
  date?: string;
  status?: string;
}

export interface Compiled {
  frontmatter: Frontmatter;
  content: ReactElement;
}

function Placeholder({ children }: { children?: ReactNode }) {
  return createElement("div", { className: "placeholder", role: "note" }, children);
}

/** Numbered h2/h3 like a technical report. New counter per document. */
function numberedHeadings() {
  let h2 = 0;
  let h3 = 0;
  return {
    h2: (props: ComponentPropsWithoutRef<"h2">) => {
      h2 += 1;
      h3 = 0;
      return createElement("h2", { ...props, "data-number": `${h2}` });
    },
    h3: (props: ComponentPropsWithoutRef<"h3">) => {
      h3 += 1;
      return createElement("h3", { ...props, "data-number": `${h2}.${h3}` });
    },
  };
}

export function contentPath(section: Section, slug: string) {
  return join(CONTENT_ROOT, section, `${slug}.mdx`);
}

export function hasContent(section: Section, slug: string) {
  return existsSync(contentPath(section, slug));
}

export function listContent(section: Section): string[] {
  const dir = join(CONTENT_ROOT, section);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".mdx") && !f.startsWith("_"))
    .map((f) => f.replace(/\.mdx$/, ""))
    .sort();
}

export async function compileContent(section: Section, slug: string): Promise<Compiled | null> {
  const file = contentPath(section, slug);
  if (!existsSync(file)) return null;
  const source = readFileSync(file, "utf8");
  const { content, frontmatter } = await compileMDX<Frontmatter>({
    source,
    options: { parseFrontmatter: true, mdxOptions: { remarkPlugins: [remarkGfm] } },
    components: { Placeholder, ...numberedHeadings() },
  });
  return { content, frontmatter };
}
