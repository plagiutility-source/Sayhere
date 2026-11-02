/**
 * The demo's `copyText`: clipboard API first, hidden textarea fallback for
 * browsers or origins without the async clipboard. The toast is only shown
 * after a successful copy.
 */
export async function copyText(text: string, onCopied?: () => void): Promise<void> {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    onCopied?.();
    return;
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    try {
      document.execCommand("copy");
      onCopied?.();
    } finally {
      area.remove();
    }
  }
}
