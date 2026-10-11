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
    <div className="bg-card flex items-center justify-between gap-3 rounded-lg py-1.5 pr-1.5 pl-3.5 shadow-[0_0_0_1px_var(--color-line)]">
      <code className="min-w-0 overflow-x-auto font-mono text-[12px] whitespace-nowrap">
        <span className="text-muted select-none">$ </span>
        {command}
      </code>
      <button
        type="button"
        onClick={() => void copy()}
        aria-label={copied ? "Copied" : "Copy command"}
        className="text-muted hover:text-ink hover:bg-wash grid size-7 shrink-0 place-items-center rounded-md"
      >
        {copied ? (
          <Check className="size-3.5 text-green-600" />
        ) : (
          <Copy className="size-3.5" />
        )}
      </button>
    </div>
  );
}
