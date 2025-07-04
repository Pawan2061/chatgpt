"use client";

import { memo, useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

interface CodeBlockProps {
  inline?: boolean;
  className?: string;
  children: React.ReactNode;
  [key: string]: unknown;
}

export const CodeBlock = memo(function CodeBlock({
  inline,
  className,
  children,
  ...props
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const match = /language-(\w+)/.exec(className || "");
  const language = match ? match[1] : "";

  // Don't show certain language labels
  const shouldShowLanguage =
    language && !["latex", "markdown"].includes(language.toLowerCase());

  const handleCopy = async () => {
    const code = String(children).replace(/\n$/, "");
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (inline) {
    return (
      <code
        className={cn(
          "relative rounded bg-neutral-800 px-1.5 py-0.5 font-mono text-sm text-white break-words",
          className
        )}
        {...props}
      >
        {children}
      </code>
    );
  }

  return (
    <div className="relative group my-4 max-w-full">
      <div className="flex items-center justify-between rounded-t-md bg-neutral-800 px-4 py-2.5 text-sm">
        <span className="text-neutral-400 font-medium">
          {shouldShowLanguage ? language : ""}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded px-2 py-1 text-xs text-neutral-400 hover:bg-neutral-700 hover:text-white transition-colors"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              Copy code
            </>
          )}
        </button>
      </div>
      <div className="overflow-x-auto">
        <pre className="rounded-b-md bg-neutral-900 p-4 min-w-0">
          <code
            className={cn(
              "font-mono text-sm text-white leading-relaxed whitespace-pre-wrap break-words",
              className
            )}
            {...props}
          >
            {children}
          </code>
        </pre>
      </div>
    </div>
  );
});
