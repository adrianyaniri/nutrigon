export function requireApiUrl(mode: string, apiUrl: string | undefined): void {
  if (mode !== "production") return;

  if (!apiUrl?.trim()) {
    throw new Error("VITE_API_URL must be set for production builds");
  }

  let url: URL;
  try {
    url = new URL(apiUrl);
  } catch {
    throw new Error("VITE_API_URL must be an HTTPS origin for production builds");
  }

  if (
    url.protocol !== "https:" ||
    url.pathname !== "/" ||
    url.search ||
    url.hash ||
    url.username ||
    url.password ||
    ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
  ) {
    throw new Error("VITE_API_URL must be an HTTPS origin for production builds");
  }
}
