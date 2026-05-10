"use client";

import { Loader2 } from "lucide-react";
import type { ToolInvocation } from "ai";

type ToolState = "partial-call" | "call" | "result";

function displayPath(path: string): string {
  return path.startsWith("/") ? path.slice(1) : path;
}

export function getToolLabel(
  toolName: string,
  args: Record<string, unknown>,
  state: ToolState
): string {
  const path = args.path as string | undefined;

  if (toolName === "str_replace_editor") {
    if (!path) return "Preparing file…";
    const p = displayPath(path);
    switch (args.command) {
      case "create":
        return `Creating ${p}`;
      case "str_replace":
      case "insert":
        return `Editing ${p}`;
      case "view":
        return `Checking ${p}`;
      case "undo_edit":
        return `Reverting ${p}`;
    }
    return "Preparing file…";
  }

  if (toolName === "file_manager") {
    if (!path) return "Managing files…";
    const p = displayPath(path);
    const newPath = args.new_path as string | undefined;
    if (args.command === "rename")
      return newPath
        ? `Renaming ${p} → ${displayPath(newPath)}`
        : `Renaming ${p}`;
    if (args.command === "delete") return `Deleting ${p}`;
    return "Managing files…";
  }

  return "Working…";
}

interface ToolInvocationBadgeProps {
  toolInvocation: ToolInvocation;
}

export function ToolInvocationBadge({
  toolInvocation,
}: ToolInvocationBadgeProps) {
  const isDone = toolInvocation.state === "result";
  const label = getToolLabel(
    toolInvocation.toolName,
    (toolInvocation.args ?? {}) as Record<string, unknown>,
    toolInvocation.state
  );

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {isDone ? (
        <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
      ) : (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600 flex-shrink-0" />
      )}
      <span className="text-neutral-700">{label}</span>
    </div>
  );
}
