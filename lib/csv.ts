export function csvEscape(value: string): string {
  // Spreadsheet apps execute cells beginning with these characters as
  // formulas. Prefix user-controlled values so exported contact data stays
  // inert when opened in Excel/Sheets.
  const safe = /^[=+\-@]/.test(value) ? `'${value}` : value;
  if (/[",\n]/.test(safe)) return `"${safe.replace(/"/g, '""')}"`;
  return safe;
}
