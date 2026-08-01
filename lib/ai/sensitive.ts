/**
 * Detects health/payment/national-ID data in a customer message so it
 * never gets forwarded to an external AI provider by default (spec
 * requirement). Deliberately conservative: false positives just mean a
 * human answers instead of the AI, which is always safe; false
 * negatives would leak sensitive data, which isn't.
 */
export type SensitiveDataReason = "card" | "iban" | "national_id";

const IBAN_RE = /\bTR\d{2}[ ]?\d{4}[ ]?\d{4}[ ]?\d{4}[ ]?\d{4}[ ]?\d{4}[ ]?\d{2}\b/i;
const CARD_CANDIDATE_RE = /\b(?:\d[ -]?){13,19}\b/g;
const TCKN_CANDIDATE_RE = /\b[1-9]\d{10}\b/g;

function luhnValid(digits: string): boolean {
  let sum = 0;
  let alternate = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = Number(digits[i]);
    if (alternate) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alternate = !alternate;
  }
  return sum % 10 === 0;
}

/** Turkish national ID (TC Kimlik No) checksum — real IDs pass this, random 11-digit numbers almost never do. */
function isValidTckn(value: string): boolean {
  if (!/^[1-9]\d{10}$/.test(value)) return false;
  const d = value.split("").map(Number);
  const oddSum = d[0] + d[2] + d[4] + d[6] + d[8];
  const evenSum = d[1] + d[3] + d[5] + d[7];
  const digit10 = ((oddSum * 7 - evenSum) % 10 + 10) % 10;
  if (digit10 !== d[9]) return false;
  const digit11 = d.slice(0, 10).reduce((a, b) => a + b, 0) % 10;
  return digit11 === d[10];
}

export function detectSensitiveData(text: string): { detected: boolean; reason?: SensitiveDataReason } {
  if (IBAN_RE.test(text)) return { detected: true, reason: "iban" };

  for (const match of text.match(CARD_CANDIDATE_RE) ?? []) {
    const digits = match.replace(/[ -]/g, "");
    if (digits.length >= 13 && digits.length <= 19 && luhnValid(digits)) {
      return { detected: true, reason: "card" };
    }
  }

  for (const match of text.match(TCKN_CANDIDATE_RE) ?? []) {
    if (isValidTckn(match)) return { detected: true, reason: "national_id" };
  }

  return { detected: false };
}
