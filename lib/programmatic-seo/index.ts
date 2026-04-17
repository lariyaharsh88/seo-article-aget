import catalogJson from "./templates.catalog.json";
import schemaJson from "./templates.schema.json";

export type ProgrammaticTemplateCatalog = typeof catalogJson;

/** Loaded catalog (version + templates). Safe to import in server components or API routes. */
export const programmaticSeoTemplateCatalog: ProgrammaticTemplateCatalog = catalogJson;

/** JSON Schema for validating template catalog objects (e.g. AJV in CI). */
export const programmaticSeoTemplatesSchema: typeof schemaJson = schemaJson;

export function getTemplateById(id: string) {
  return programmaticSeoTemplateCatalog.templates.find((t) => t.id === id);
}
