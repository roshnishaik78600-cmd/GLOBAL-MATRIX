import { Link2 } from "lucide-react";
import { toast } from "sonner";

/** Copies the current page's public link; uses the native share sheet on phones when available. */
export function ShareButton({ title }: { title?: string }) {
  const onClick = async () => {
    const url = window.location.origin + window.location.pathname;
    try {
      if (navigator.share && window.matchMedia("(pointer: coarse)").matches) {
        await navigator.share({ title: title ?? document.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    } catch (e) {
      if ((e as Error)?.name !== "AbortError") toast.error("Couldn't copy the link");
    }
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-full border border-[var(--exec-hairline-strong)] px-3.5 py-2 text-[13px] font-medium text-[var(--exec-ink)] transition-colors hover:border-[var(--exec-cyan)]"
    >
      <Link2 className="size-3.5" aria-hidden /> Copy link
    </button>
  );
}
