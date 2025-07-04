import React, { memo, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { CodeBlock } from "./code-block";
import "katex/dist/katex.min.css";

const preprocessNumberFormatting = (content: string): string => {
  try {
    let processed = content;

    processed = processed.replace(
      /(\d+(?:\.\d+)?)(billion|million|trillion|B|M|T)(?=\s|$)/gi,
      "$1 $2"
    );
    processed = processed.replace(/(\d{4})(to|by|in)(\d{4})/gi, "$1 $2 $3");

    // Only add spaces for actual currency patterns (no space between $ and number)
    processed = processed.replace(/(\$)(\d+(?:\.\d+)?)/g, "$1 $2");

    return processed;
  } catch (error) {
    console.warn("Error in number formatting:", error);
    return content;
  }
};

const latexMatrixRegex =
  /\\begin\{(pmatrix|bmatrix|matrix)\}([\s\S]*?)\\end\{\1\}/g;

function latexMatrixToAsciiTable(latex: string): string {
  try {
    // Split rows by \\ and cells by &
    return latex
      .trim()
      .split("\\\\")
      .map(
        (row) =>
          "| " +
          row
            .trim()
            .split("&")
            .map((cell) => cell.trim())
            .join("  ") +
          " |"
      )
      .join("\n");
  } catch (error) {
    console.warn("Error converting LaTeX matrix:", error);
    return latex;
  }
}

const preprocessMathContent = (content: string): string => {
  try {
    let processed = content;

    // 1. Convert LaTeX matrices to ASCII/markdown tables (per MATRIX_FORMATTING_RULE)
    processed = processed.replace(
      latexMatrixRegex,
      (match, _type, matrixContent) => {
        return latexMatrixToAsciiTable(matrixContent);
      }
    );

    // 2. Block math normalization (for non-matrix math)
    processed = processed.replace(/\\\[([\s\S]*?)\\\]/g, (match, expr) => {
      if (expr.trim().length > 1000) {
        console.warn("Skipping very long math expression");
        return match;
      }
      return `\n\n$$${expr.trim()}$$\n\n`;
    });

    processed = processed.replace(/\\\\\[([\s\S]*?)\\\\\]/g, (match, expr) => {
      if (expr.trim().length > 1000) {
        console.warn("Skipping very long math expression");
        return match;
      }
      return `\n\n$$${expr.trim()}$$\n\n`;
    });

    // 3. Inline math normalization
    processed = processed.replace(/\\\(([\s\S]*?)\\\)/g, (match, expr) => {
      if (expr.trim().length > 200) {
        console.warn("Skipping very long inline math expression");
        return match;
      }
      return `$${expr.trim()}$`;
    });

    processed = processed.replace(/\\\\\(([\s\S]*?)\\\\\)/g, (match, expr) => {
      if (expr.trim().length > 200) {
        console.warn("Skipping very long inline math expression");
        return match;
      }
      return `$${expr.trim()}$`;
    });

    return processed;
  } catch (error) {
    console.warn("Error in math content preprocessing:", error);
    return content;
  }
};

const preprocessTableContent = (content: string): string => {
  try {
    // Convert text-based tables to proper markdown tables
    const lines = content.split("\n");
    const processedLines: string[] = [];
    let inTable = false;
    let tableLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Check if this line looks like a table row (starts and ends with |)
      if (line.startsWith("|") && line.endsWith("|") && line.includes("|")) {
        if (!inTable) {
          inTable = true;
          tableLines = [];
        }

        // Clean up the line - remove extra spaces and dashes
        const cleanLine = line
          .replace(/\|\s*-+\s*\|/g, "|---|") // Convert dash separators
          .replace(/\|\s*-+\s*/g, "|---") // Convert dash separators at start/end
          .replace(/\s*-+\s*\|/g, "---|") // Convert dash separators at start/end
          .replace(/\s+/g, " ") // Normalize spaces
          .trim();

        tableLines.push(cleanLine);
      } else {
        if (inTable && tableLines.length > 0) {
          // We've finished a table, process it
          if (tableLines.length >= 2) {
            // Add header separator if not present
            const hasHeaderSeparator = tableLines[1].includes("---");
            if (!hasHeaderSeparator) {
              const headerCols = tableLines[0].split("|").length - 2;
              const separator =
                "|" + Array(headerCols).fill("---").join("|") + "|";
              tableLines.splice(1, 0, separator);
            }
          }
          processedLines.push(...tableLines);
          tableLines = [];
          inTable = false;
        }
        processedLines.push(line);
      }
    }

    // Handle case where table is at the end
    if (inTable && tableLines.length > 0) {
      if (tableLines.length >= 2) {
        const hasHeaderSeparator = tableLines[1].includes("---");
        if (!hasHeaderSeparator) {
          const headerCols = tableLines[0].split("|").length - 2;
          const separator = "|" + Array(headerCols).fill("---").join("|") + "|";
          tableLines.splice(1, 0, separator);
        }
      }
      processedLines.push(...tableLines);
    }

    return processedLines.join("\n");
  } catch (error) {
    console.warn("Error in table preprocessing:", error);
    return content;
  }
};

const components: Partial<Components> = {
  code: (props: React.ComponentProps<"code"> & { inline?: boolean }) => (
    <CodeBlock
      inline={props.inline ?? false}
      className={props.className ?? ""}
      {...props}
    >
      {props.children}
    </CodeBlock>
  ),
  pre: ({ children }) => <>{children}</>,
  table: ({ children, ...props }) => (
    <div className="w-full overflow-x-auto my-6">
      <table
        className="min-w-full border-collapse border border-neutral-600 bg-neutral-800/50 rounded-lg overflow-hidden"
        {...props}
      >
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }) => (
    <thead className="bg-neutral-700" {...props}>
      {children}
    </thead>
  ),
  tbody: ({ children, ...props }) => <tbody {...props}>{children}</tbody>,
  tr: ({ children, ...props }) => (
    <tr className="border-b border-neutral-600 last:border-b-0" {...props}>
      {children}
    </tr>
  ),
  th: ({ children, ...props }) => (
    <th
      className="border-r border-neutral-600 last:border-r-0 px-4 py-3 text-left font-semibold text-white bg-neutral-700"
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ children, ...props }) => (
    <td
      className="border-r border-neutral-600 last:border-r-0 px-4 py-3 text-white"
      {...props}
    >
      {children}
    </td>
  ),
  ol: ({ children, ...props }) => (
    <ol className="list-decimal list-outside ml-6 space-y-1" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }) => (
    <li className="leading-7" {...props}>
      {children}
    </li>
  ),
  ul: ({ children, ...props }) => (
    <ul className="space-y-1 ml-0" {...props}>
      {React.Children.map(children, (child, index) => {
        if (React.isValidElement(child) && child.type === "li") {
          return (
            <li key={index} className="flex items-start leading-7">
              <span className="text-gray-400 mr-3 mt-0.5 select-none">•</span>
              <span className="flex-1">
                {
                  (child as React.ReactElement<{ children: React.ReactNode }>)
                    .props.children
                }
              </span>
            </li>
          );
        }
        return child;
      })}
    </ul>
  ),
  strong: ({ children, ...props }) => (
    <strong className="font-semibold" {...props}>
      {children}
    </strong>
  ),
  a: ({ children, ...props }) => (
    <a
      className="text-blue-500 hover:underline"
      target="_blank"
      rel="noreferrer"
      {...props}
    >
      {children}
    </a>
  ),
  h1: ({ children, ...props }) => (
    <h1 className="text-2xl font-semibold mt-8 mb-4" {...props}>
      {children}
    </h1>
  ),
  h2: ({ children, ...props }) => (
    <h2 className="text-xl font-semibold mt-6 mb-3" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3 className="text-lg font-semibold mt-6 mb-2" {...props}>
      {children}
    </h3>
  ),
  h4: ({ children, ...props }) => (
    <h4 className="text-base font-semibold mt-4 mb-2" {...props}>
      {children}
    </h4>
  ),
  h5: ({ children, ...props }) => (
    <h5 className="text-sm font-semibold mt-4 mb-2" {...props}>
      {children}
    </h5>
  ),
  h6: ({ children, ...props }) => (
    <h6 className="text-sm font-semibold mt-4 mb-2" {...props}>
      {children}
    </h6>
  ),
  p: ({ children, ...props }) => (
    <p className="leading-7 [&:not(:first-child)]:mt-4" {...props}>
      {children}
    </p>
  ),
  blockquote: ({ children, ...props }) => (
    <blockquote
      className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic my-4"
      {...props}
    >
      {children}
    </blockquote>
  ),
};

const NonMemoizedMarkdown = ({ children }: { children: string }) => {
  const processedContent = useMemo(() => {
    try {
      // Skip processing for very large content to prevent performance issues
      if (children.length > 50000) {
        console.warn("Skipping preprocessing for very large content");
        return children;
      }

      const formattedContent = preprocessNumberFormatting(children);
      const mathProcessedContent = preprocessMathContent(formattedContent);
      return preprocessTableContent(mathProcessedContent);
    } catch (error) {
      console.warn("Error processing markdown content:", error);
      return children;
    }
  }, [children]);

  return (
    <div className="max-w-full overflow-x-auto pl-2">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeRaw, rehypeKatex]}
        components={components}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
};

export const Markdown = memo(
  NonMemoizedMarkdown,
  (prevProps, nextProps) => prevProps.children === nextProps.children
);
