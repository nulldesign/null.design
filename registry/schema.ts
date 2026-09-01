import { z } from "zod";

/**
 * Null Design canonical registry schema.
 *
 * Every public page, agent workflow and audit reads from records that validate
 * against these schemas. IDs are permanent (see AGENTS.md §3).
 */

export const ID = {
  project: /^ND-\d{3}$/,
  program: /^ND-R\d{2}$/,
  experiment: /^AE-\d{3}$/,
  product: /^ND-P\d{2}$/,
  run: /^RUN-\d{4}-\d{4}$/,
} as const;

export const Slug = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug must be lowercase-kebab");

export const Classification = z.enum([
  "FLAGSHIP",
  "ACTIVE",
  "EXPERIMENT",
  "RESEARCH",
  "PRODUCT CANDIDATE",
  "CLIENT-CAPABLE",
  "PRIVATE INFRASTRUCTURE",
  "TEACHING",
  "HISTORICAL",
  "ARCHIVE",
  "FORK / THIRD-PARTY",
  "DO NOT PUBLISH",
]);

export const Practice = z.enum([
  "intelligent systems",
  "agentic systems",
  "learning environments",
  "software",
  "research infrastructure",
  "automation",
  "data systems",
  "physical computing",
  "fabrication",
  "experimental interfaces",
]);

export const Status = z.enum([
  "active",
  "planned",
  "paused",
  "complete",
  "archived",
]);

export const Visibility = z.enum(["public", "private", "internal"]);

export const Ownership = z.enum([
  "original",
  "collaboration",
  "fork",
  "adaptation",
  "student-work",
  "research",
  "client",
  "unknown",
]);

/** Repository disposition from discovery — where the code should live, not whether a case study exists. */
export const Recommendation = z.enum([
  "MOVE TO NULL",
  "MIRROR UNDER NULL",
  "FEATURE ONLY",
  "KEEP PERSONAL",
  "KEEP PRIVATE",
  "ARCHIVE",
]);

export const AgentRole = z.enum([
  "Scout",
  "Researcher",
  "Builder",
  "Analyst",
  "Critic",
  "Archivist",
  "Publisher",
  "Operator",
]);

export const Repository = z.object({
  url: z.string().url(),
  role: z.enum(["canonical", "mirror", "related", "publish-sink"]),
  visibility: Visibility,
  note: z.string().optional(),
});

export const Project = z.object({
  id: z.string().regex(ID.project),
  title: z.string().min(1),
  slug: Slug,
  classification: z.object({
    type: z.array(Classification).min(1),
    practice: z.array(Practice).min(1),
  }),
  status: Status,
  visibility: Visibility,
  year: z.object({
    started: z.number().int().min(2000),
    ended: z.number().int().min(2000).nullable(),
  }),
  summary: z.string().min(20),
  topics: z.array(z.string()).default([]),
  research_programs: z.array(z.string().regex(ID.program)).default([]),
  repositories: z.array(Repository).default([]),
  agents: z.array(AgentRole).default([]),
  human_gates: z.array(z.string()).default([]),
  commercial: z.object({
    commissionable: z.boolean(),
    product_candidate: z.boolean(),
    revenue_model: z.string().nullable(),
  }),
  provenance: z.object({
    ownership: Ownership,
    original_repository: z.string().nullable(),
    notes: z.string().default(""),
    review_required: z.boolean().default(false),
    third_party: z.array(z.string()).default([]),
    ai_coauthored: z.boolean().default(false),
  }),
  publication: z.object({
    case_study: z.boolean(),
    public_url: z.string().url().nullable(),
    featured: z.boolean().default(false),
    recommendation: Recommendation,
    order: z.number().int().optional(),
    /** ISO date the entry (or the underlying work) first became public. */
    published: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  }),
  /** Real, countable facts safe to display. Never estimates. */
  facts: z.array(z.object({ label: z.string(), value: z.string() })).default([]),
});

export const Program = z.object({
  id: z.string().regex(ID.program),
  title: z.string().min(1),
  slug: Slug,
  status: Status,
  visibility: Visibility,
  year: z.object({ started: z.number().int(), ended: z.number().int().nullable() }),
  summary: z.string().min(20),
  definition: z.string().optional(),
  principle: z.string().optional(),
  workflow: z.array(z.string()).default([]),
  questions: z.array(z.string()).default([]),
  outputs: z.array(z.string()).default([]),
  experiments: z
    .array(
      z.object({
        id: z.string().regex(ID.experiment),
        title: z.string(),
        status: Status,
        project: z.string().regex(ID.project).nullable(),
        summary: z.string(),
      }),
    )
    .default([]),
  projects: z.array(z.string().regex(ID.project)).default([]),
  publication: z.object({
    public_url: z.string().url().nullable(),
    featured: z.boolean().default(false),
    published: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  }),
});

export const Product = z.object({
  id: z.string().regex(ID.product),
  code: z.string().regex(/^[A-Z]{2}-KIT-\d{3}$|^[A-Z]{2}-BRIEF-\d{3}$/),
  title: z.string().min(1),
  slug: Slug,
  family: z.enum(["Null Kits", "Null Brief", "Software", "Licence"]),
  status: z.enum(["candidate", "in-development", "available", "retired"]),
  visibility: Visibility,
  summary: z.string().min(20),
  derived_from: z.array(z.string()).default([]),
  contents: z.array(z.string()).default([]),
  revenue_model: z.string().nullable(),
  maintenance: z.string().optional(),
  launch_requires: z.array(z.string()).default([]),
});

export const RunRecord = z.object({
  id: z.string().regex(ID.run),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  title: z.string(),
  trigger: z.string(),
  human_director: z.string(),
  status: z.enum(["running", "complete", "aborted"]),
  inputs: z.array(z.string()).default([]),
  tools: z.array(z.string()).default([]),
  roles: z
    .array(
      z.object({
        role: AgentRole,
        agent: z.string(),
        scope: z.string(),
      }),
    )
    .default([]),
  artifacts: z.array(z.string()).default([]),
  critiques: z.array(z.string()).default([]),
  human_decisions: z
    .array(
      z.object({
        decision: z.string(),
        outcome: z.enum(["approved", "rejected", "deferred", "pending"]),
        date: z.string().nullable(),
      }),
    )
    .default([]),
  result: z.object({
    commit: z.string().nullable(),
    publication: z.string().nullable(),
  }),
  notes: z.string().optional(),
});

export type Project = z.infer<typeof Project>;
export type Program = z.infer<typeof Program>;
export type Product = z.infer<typeof Product>;
export type RunRecord = z.infer<typeof RunRecord>;
export type AgentRole = z.infer<typeof AgentRole>;
export type Classification = z.infer<typeof Classification>;
