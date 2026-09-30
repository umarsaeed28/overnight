import { describe, expect, it } from "vitest";
import {
  classifyKind,
  filterItem,
  isBinary,
  isGenerated,
  isLockfile,
  isExcludedPath,
  prioritize,
  priorityOf,
} from "./filters.js";

const limits = { maxFileBytes: 512_000 };

describe("isExcludedPath", () => {
  it.each([
    "node_modules/react/index.js",
    "app/dist/bundle.js",
    "api/build/server.js",
    "web/out/index.html",
    "web/.next/static/chunk.js",
    "php/vendor/autoload.php",
    "svc/bin/tool",
    "svc/obj/Debug/a.dll",
    "coverage/lcov-report/index.html",
    ".git/config",
    "py/__pycache__/mod.pyc",
    "public/jquery.min.js",
    "dist/app.js.map",
  ])("excludes %s", (path) => {
    expect(isExcludedPath(path)).toBe(true);
  });

  it("does not exclude a file merely named like an excluded directory", () => {
    expect(isExcludedPath("src/build.ts")).toBe(false);
    expect(isExcludedPath("src/dist.ts")).toBe(false);
  });
});

describe("isLockfile", () => {
  it.each(["package-lock.json", "pnpm-lock.yaml", "yarn.lock", "poetry.lock", "Cargo.lock"])(
    "matches %s",
    (name) => {
      expect(isLockfile(`some/dir/${name}`)).toBe(true);
    },
  );

  it("matches any .lock file", () => {
    expect(isLockfile("infra/terraform.lock")).toBe(true);
  });

  it("leaves ordinary files alone", () => {
    expect(isLockfile("src/lockService.ts")).toBe(false);
  });
});

describe("isBinary", () => {
  it("detects by extension", () => {
    expect(isBinary("public/logo.png", "not really")).toBe(true);
  });

  it("detects a null byte in the first 8 KB", () => {
    expect(isBinary("data/blob.txt", Buffer.from([0x61, 0x00, 0x62]))).toBe(true);
  });

  it("ignores a null byte after the first 8 KB", () => {
    const content = Buffer.concat([Buffer.alloc(9000, 0x61), Buffer.from([0x00])]);
    expect(isBinary("data/blob.txt", content)).toBe(false);
  });

  it("accepts ordinary text", () => {
    expect(isBinary("src/app.ts", "export const a = 1;")).toBe(false);
  });
});

describe("isGenerated", () => {
  it.each(["@generated", "auto-generated", "DO NOT EDIT"])("detects %s in the head", (marker) => {
    expect(isGenerated(`// ${marker}\nexport const a = 1;`)).toBe(true);
  });

  it("ignores a marker below line 20", () => {
    const content = `${"// filler\n".repeat(25)}// @generated`;
    expect(isGenerated(content)).toBe(false);
  });
});

describe("classifyKind", () => {
  it.each([
    ["tests/e2e/checkout.spec.ts", "test"],
    ["src/__tests__/cart.ts", "test"],
    ["e2e/login.ts", "test"],
    ["cypress/integration/a.js", "test"],
    ["src/cart.test.ts", "test"],
    ["package.json", "config"],
    ["infra/values.yaml", "config"],
    ["Dockerfile", "config"],
    [".github/workflows/ci.yml", "config"],
    ["docs/overview.md", "doc"],
    ["README.txt", "doc"],
    ["api/routes/cart.ts", "code"],
    ["prisma/schema.prisma", "code"],
  ])("classifies %s as %s", (path, expected) => {
    expect(classifyKind(path)).toBe(expected);
  });

  it("prefers test over config for a test fixture json", () => {
    expect(classifyKind("tests/fixtures/order.json")).toBe("test");
  });
});

describe("filterItem", () => {
  it("keeps an ordinary source file and reports its kind", () => {
    expect(filterItem({ path: "api/routes/cart.ts", content: "export {}", bytes: 9 }, limits)).toEqual(
      { keep: true, kind: "code" },
    );
  });

  it("skips a file over the size limit before reading it as text", () => {
    expect(
      filterItem({ path: "src/big.ts", content: "x", bytes: limits.maxFileBytes + 1 }, limits),
    ).toEqual({ keep: false, reason: "too_large" });
  });

  it.each([
    ["node_modules/a/index.js", "path_excluded"],
    ["pnpm-lock.yaml", "lockfile"],
    ["public/logo.png", "binary"],
  ])("skips %s as %s", (path, reason) => {
    expect(filterItem({ path, content: "x", bytes: 1 }, limits)).toEqual({ keep: false, reason });
  });

  it("skips generated files", () => {
    expect(
      filterItem({ path: "src/api.ts", content: "// @generated\nexport {}", bytes: 22 }, limits),
    ).toEqual({ keep: false, reason: "generated" });
  });
});

describe("prioritize", () => {
  it("keeps routes and pages before tests, and tests before the rest", () => {
    const items = [
      { pathOrUrl: "src/lib/format.ts" },
      { pathOrUrl: "tests/e2e/cart.spec.ts" },
      { pathOrUrl: "api/routes/cart.ts" },
    ];

    expect(prioritize(items, { maxFilesPerSource: 3 }).kept.map((i) => i.pathOrUrl)).toEqual([
      "api/routes/cart.ts",
      "tests/e2e/cart.spec.ts",
      "src/lib/format.ts",
    ]);
  });

  it("breaks ties on path depth, then path", () => {
    const items = [
      { pathOrUrl: "src/a/b/c/deep.ts" },
      { pathOrUrl: "src/zebra.ts" },
      { pathOrUrl: "src/apple.ts" },
    ];

    expect(prioritize(items, { maxFilesPerSource: 3 }).kept.map((i) => i.pathOrUrl)).toEqual([
      "src/apple.ts",
      "src/zebra.ts",
      "src/a/b/c/deep.ts",
    ]);
  });

  it("reports what was cut when the source is over the limit", () => {
    const items = [{ pathOrUrl: "api/routes/a.ts" }, { pathOrUrl: "src/b.ts" }];
    const result = prioritize(items, { maxFilesPerSource: 1 });

    expect(result.kept.map((i) => i.pathOrUrl)).toEqual(["api/routes/a.ts"]);
    expect(result.cut.map((i) => i.pathOrUrl)).toEqual(["src/b.ts"]);
  });

  it("ranks a handler file ahead of a plain module", () => {
    expect(priorityOf("server/handlers/checkout.ts")).toBeLessThan(priorityOf("server/util.ts"));
  });
});
