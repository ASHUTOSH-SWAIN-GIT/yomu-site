import { useState } from "react";
import { Check, Copy } from "lucide-react";

/** A command in a box with a button that copies it. */
export function CopyCommand({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard blocked: the text is selectable in the box.
    }
  };

  return (
    <div className="bg-card flex items-center justify-between gap-4 rounded-xl py-3 pr-3 pl-5 shadow-[0_0_0_1px_var(--color-line)]">
      <code className="min-w-0 overflow-x-auto font-mono text-[13px] whitespace-nowrap sm:text-sm">
        <span className="text-muted select-none">$ </span>
        {command}
      </code>
      <button
        type="button"
        onClick={() => void copy()}
        aria-label={copied ? "Copied" : "Copy command"}
        className="text-muted hover:text-ink hover:bg-wash grid size-9 shrink-0 place-items-center rounded-lg"
      >
        {copied ? (
          <Check className="size-4 text-green-600" />
        ) : (
          <Copy className="size-4" />
        )}
      </button>
    </div>
  );
}
