import { describe, test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolInvocationBadge, getToolLabel } from "../ToolInvocationBadge";
import type { ToolInvocation } from "ai";

afterEach(() => {
  cleanup();
});

// --- getToolLabel unit tests ---

describe("getToolLabel", () => {
  describe("str_replace_editor — complete args", () => {
    test("create command strips leading slash", () => {
      expect(getToolLabel("str_replace_editor", { command: "create", path: "/App.jsx" }, "call")).toBe("Creating App.jsx");
    });

    test("create command with nested path", () => {
      expect(getToolLabel("str_replace_editor", { command: "create", path: "/src/components/Button.tsx" }, "call")).toBe("Creating src/components/Button.tsx");
    });

    test("str_replace command", () => {
      expect(getToolLabel("str_replace_editor", { command: "str_replace", path: "/src/Button.tsx" }, "call")).toBe("Editing src/Button.tsx");
    });

    test("insert command", () => {
      expect(getToolLabel("str_replace_editor", { command: "insert", path: "/App.jsx" }, "call")).toBe("Editing App.jsx");
    });

    test("view command shows Checking (not Reading)", () => {
      expect(getToolLabel("str_replace_editor", { command: "view", path: "/App.jsx" }, "call")).toBe("Checking App.jsx");
    });

    test("undo_edit command", () => {
      expect(getToolLabel("str_replace_editor", { command: "undo_edit", path: "/App.jsx" }, "call")).toBe("Reverting App.jsx");
    });

    test("path without leading slash is unchanged", () => {
      expect(getToolLabel("str_replace_editor", { command: "create", path: "App.jsx" }, "call")).toBe("Creating App.jsx");
    });
  });

  describe("str_replace_editor — partial-call / missing args", () => {
    test("partial-call with empty args returns Preparing file…", () => {
      expect(getToolLabel("str_replace_editor", {}, "partial-call")).toBe("Preparing file…");
    });

    test("partial-call with path but no command returns Preparing file…", () => {
      expect(getToolLabel("str_replace_editor", { path: "/App.jsx" }, "partial-call")).toBe("Preparing file…");
    });

    test("call state with missing path returns Preparing file…", () => {
      expect(getToolLabel("str_replace_editor", { command: "create" }, "call")).toBe("Preparing file…");
    });
  });

  describe("file_manager — complete args", () => {
    test("delete command strips leading slash", () => {
      expect(getToolLabel("file_manager", { command: "delete", path: "/old.jsx" }, "call")).toBe("Deleting old.jsx");
    });

    test("rename command with new_path", () => {
      expect(getToolLabel("file_manager", { command: "rename", path: "/old.jsx", new_path: "/new.jsx" }, "call")).toBe("Renaming old.jsx → new.jsx");
    });

    test("rename command without new_path", () => {
      expect(getToolLabel("file_manager", { command: "rename", path: "/old.jsx" }, "call")).toBe("Renaming old.jsx");
    });
  });

  describe("file_manager — partial-call / missing args", () => {
    test("partial-call with empty args returns Managing files…", () => {
      expect(getToolLabel("file_manager", {}, "partial-call")).toBe("Managing files…");
    });

    test("call state with missing path returns Managing files…", () => {
      expect(getToolLabel("file_manager", { command: "delete" }, "call")).toBe("Managing files…");
    });
  });

  test("unknown tool returns Working…", () => {
    expect(getToolLabel("some_other_tool", {}, "call")).toBe("Working…");
  });

  test("unknown tool in result state returns Working…", () => {
    expect(getToolLabel("some_other_tool", {}, "result")).toBe("Working…");
  });
});

// --- ToolInvocationBadge component tests ---

describe("ToolInvocationBadge", () => {
  test("shows friendly label for str_replace_editor create (no leading slash)", () => {
    const invocation: ToolInvocation = {
      toolCallId: "1",
      toolName: "str_replace_editor",
      args: { command: "create", path: "/App.jsx" },
      state: "result",
      result: "ok",
    };
    render(<ToolInvocationBadge toolInvocation={invocation} />);
    expect(screen.getByText("Creating App.jsx")).toBeDefined();
  });

  test("shows friendly label for str_replace_editor str_replace", () => {
    const invocation: ToolInvocation = {
      toolCallId: "2",
      toolName: "str_replace_editor",
      args: { command: "str_replace", path: "/src/Card.tsx" },
      state: "result",
      result: "ok",
    };
    render(<ToolInvocationBadge toolInvocation={invocation} />);
    expect(screen.getByText("Editing src/Card.tsx")).toBeDefined();
  });

  test("shows Checking (not Reading) for view command", () => {
    const invocation: ToolInvocation = {
      toolCallId: "3",
      toolName: "str_replace_editor",
      args: { command: "view", path: "/App.jsx" },
      state: "call",
    };
    render(<ToolInvocationBadge toolInvocation={invocation} />);
    expect(screen.getByText("Checking App.jsx")).toBeDefined();
  });

  test("shows friendly label for file_manager delete", () => {
    const invocation: ToolInvocation = {
      toolCallId: "4",
      toolName: "file_manager",
      args: { command: "delete", path: "/old.jsx" },
      state: "result",
      result: { success: true },
    };
    render(<ToolInvocationBadge toolInvocation={invocation} />);
    expect(screen.getByText("Deleting old.jsx")).toBeDefined();
  });

  test("shows friendly label for file_manager rename", () => {
    const invocation: ToolInvocation = {
      toolCallId: "5",
      toolName: "file_manager",
      args: { command: "rename", path: "/old.jsx", new_path: "/new.jsx" },
      state: "result",
      result: { success: true },
    };
    render(<ToolInvocationBadge toolInvocation={invocation} />);
    expect(screen.getByText("Renaming old.jsx → new.jsx")).toBeDefined();
  });

  test("shows Preparing file… during partial-call with no args", () => {
    const invocation: ToolInvocation = {
      toolCallId: "6",
      toolName: "str_replace_editor",
      args: {},
      state: "partial-call",
    };
    render(<ToolInvocationBadge toolInvocation={invocation} />);
    expect(screen.getByText("Preparing file…")).toBeDefined();
  });

  test("shows Managing files… during partial-call for file_manager", () => {
    const invocation: ToolInvocation = {
      toolCallId: "7",
      toolName: "file_manager",
      args: {},
      state: "partial-call",
    };
    render(<ToolInvocationBadge toolInvocation={invocation} />);
    expect(screen.getByText("Managing files…")).toBeDefined();
  });

  test("renders green dot when state is result", () => {
    const invocation: ToolInvocation = {
      toolCallId: "8",
      toolName: "str_replace_editor",
      args: { command: "create", path: "/App.jsx" },
      state: "result",
      result: "ok",
    };
    const { container } = render(<ToolInvocationBadge toolInvocation={invocation} />);
    expect(container.querySelector(".bg-emerald-500")).toBeDefined();
    expect(container.querySelector(".animate-spin")).toBeNull();
  });

  test("renders spinner when state is call", () => {
    const invocation: ToolInvocation = {
      toolCallId: "9",
      toolName: "str_replace_editor",
      args: { command: "create", path: "/App.jsx" },
      state: "call",
    };
    const { container } = render(<ToolInvocationBadge toolInvocation={invocation} />);
    expect(container.querySelector(".animate-spin")).toBeDefined();
    expect(container.querySelector(".bg-emerald-500")).toBeNull();
  });

  test("renders spinner when state is partial-call", () => {
    const invocation: ToolInvocation = {
      toolCallId: "10",
      toolName: "str_replace_editor",
      args: {},
      state: "partial-call",
    };
    const { container } = render(<ToolInvocationBadge toolInvocation={invocation} />);
    expect(container.querySelector(".animate-spin")).toBeDefined();
    expect(container.querySelector(".bg-emerald-500")).toBeNull();
  });
});
