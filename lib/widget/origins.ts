export function normalizeAllowedOrigins(input: string): string[] {
  const origins = input.split(",").map((value) => {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" && url.hostname !== "localhost") {
      throw new Error("Use HTTPS website URLs (localhost is allowed for testing)");
    }
    return url.origin;
  });
  return [...new Set(origins)];
}
