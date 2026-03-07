import fs from 'fs';
import path from 'path';

/**
 * Renders an HTML email template by name with variable substitution.
 *
 * Supports:
 *  - {{key}}           — simple variable replacement
 *  - {{#key}}...{{/key}} — conditional block, rendered only when vars[key] is non-empty
 */
export function renderEmail(templateName: string, vars: Record<string, string>): string {
  const filePath = path.join(__dirname, '../emails', `${templateName}.html`);
  let html = fs.readFileSync(filePath, 'utf-8');

  // Conditional blocks
  html = html.replace(
    /\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g,
    (_match, key: string, inner: string) => (vars[key] ? inner : ''),
  );

  // Variable substitution
  for (const [key, value] of Object.entries(vars)) {
    html = html.split(`{{${key}}}`).join(value);
  }

  return html;
}