# Decisions

Spec-silent choices, recorded per section 0 of the build spec.

## 2026-09-26

- **Node 24 tolerated locally, `engines: >=22`.** Spec calls for Node 22 LTS. The dev
  machine has 24.5.0; nothing in the stack needs 22 specifically, so `engines` allows
  `>=22` and CI pins 22. Reason: simplest option that keeps the spec's floor.
- **Package scope `@oqa/*`.** Spec names directories, not packages. Reason: short,
  collision-free, matches the `oqa` database user in the spec's config.
- **ESM everywhere (`"type": "module"`).** Reason: Next 15, Vitest, and the Anthropic
  SDK are all ESM-first; a single module system avoids dual-build tooling.
- **Packages consumed from source, not built `dist/`.** Internal packages export
  `./src/index.ts` directly and TypeScript path-maps resolve them. Reason: removes a
  build step from the inner dev loop; apps bundle or transpile at their own boundary.
- **Vitest projects `unit` and `integration` split by filename.** `*.integration.test.ts`
  runs only in the integration project. Reason: unit tests must stay runnable without
  Postgres, Redis, or MinIO.
- **`chunks.id` counter lives in its own table (`chunk_id_counters`).** Spec requires a
  per-workspace base36 counter but does not say where the counter is stored. Reason: a
  dedicated row per workspace can be locked with `for update` inside the chunk
  transaction, which keeps ids gapless and race-free.
- **RLS uses two Postgres roles, `oqa_migrator` and `oqa_app`.** Spec says migrations
  bypass RLS and the app role does not. Reason: role separation is the only way to make
  that difference enforceable and testable.
- **`current_setting('app.workspace_id', true)` (missing_ok) in policies.** Reason: a
  connection with no workspace set must return zero rows rather than raise, so a
  forgotten `set local` is a silent-empty bug caught by tests, not a 500.
- **The app pool selects `oqa_app` with the `-c role=` startup parameter,** not a
  `set role` after connecting. Reason: a post-connect `SET ROLE` leaves a window in
  which a query can run as the table owner and silently bypass RLS.
- **`workspaces` and `memberships` get a second policy arm keyed on `app.user_id`.**
  Reason: `GET /workspaces` has to run before any workspace is in scope, so strict
  `workspace_id = app_workspace_id()` would make the workspace list always empty.
- **`users` gets RLS too, scoped to self plus co-members of the workspace in scope.**
  Spec section 7 says only that `users` has no `workspace_id`. Reason: without a
  policy, any app connection could read every customer's email address.
- **Integration tests take `TEST_DATABASE_URL` when set and fall back to
  testcontainers.** Reason: the spec names testcontainers, but a container runtime is
  not always present on a dev machine; pointing at a local Postgres 16 with pgvector
  keeps the tests runnable either way. CI uses the container path.
- **Workspace creation and user upsert are the only operations on the owner pool.**
  They cannot run under RLS: the membership row that would grant access does not
  exist yet, so no `app.workspace_id` can satisfy the policy. Both live in
  `apps/api/src/services/workspaces.ts` so the exception is auditable in one file.
- **Auth.js sessions are JWTs, and the API decrypts the cookie itself.** Reason:
  spec section 21 authenticates by session cookie, and a database-backed session
  would make every API request wait on a lookup in the web app. The cookie name
  doubles as the JWE salt, so the API tries both the `__Secure-` and plain names.
- **Auth.js needs three tables the spec does not model** (`auth_accounts`,
  `auth_verification_tokens`, and `users.email_verified` / `users.image`). Magic-link
  sign-in cannot work without a verification token store. They hold credentials, not
  tenant data, so `oqa_app` is denied access instead of being given a policy.
- **Member management endpoints** (`GET/PATCH/DELETE /workspaces/:ws/members`) were
  added; section 21 omits them although section 20.1 specifies a members settings
  page. Removing the last owner is refused, since that would leave the workspace
  unmanageable.
- **shadcn/ui primitives are hand-written in `components/ui`** rather than pulled in
  by the CLI. Reason: shadcn is a copy-in component collection, not a dependency, and
  only Button, Input and Skeleton are needed so far. More get added as views need them.
- **Next's webpack gets `resolve.extensionAlias` for `.js` → `.ts`.** The workspace
  packages use NodeNext-style `./x.js` specifiers that resolve to `./x.ts`; tsc, tsx
  and Vitest understand this, webpack does not.
- **Initial migration is hand-written SQL, not drizzle-kit generated.** Reason: the
  schema needs a generated `tsvector` column, a partial HNSW index, RLS policies, and
  role grants, none of which the Drizzle schema DSL can express. The Drizzle schema
  still defines every table for typed queries, and the runtime migrator applies the
  SQL through the normal journal.
## 2026-09-27

- **The fixture connector takes a `flavour` (`repo` | `docs` | `tickets`).** Section
  22.6 asks one connector to read three folders "as if they were GitHub, Confluence
  and Jira". The flavour is what decides that, so `fixtures/shopdemo` is connected as
  three sources rather than one.
- **`Connector.fetchBatch` is an optional addition to the 8.1 interface.** Section 8.2
  requires GitHub blobs to be fetched 50 per GraphQL query, which the single-item
  `fetchItem` cannot express. `fetchItem` delegates to a batch of one, so connectors
  without batching are unaffected.
- **Removed files are signalled with `meta.removed` on the `ItemRef`.** Section 8.2
  says removed files are marked `is_current = false`, but `listItems` has no other
  channel for a deletion. The worker reads the flag instead of fetching the item.
- **Ticket connectors emit the provider payload as content and the structured fields
  as `meta`.** The 10.4 markdown normalisation is a parsing concern, so it stays in
  `packages/parsing` where the spec puts it, and the raw payload is what gets stored
  and hashed.
- **GitHub reads work unauthenticated when no installation token is supplied.** M2
  acceptance requires ingesting a real public repository; requiring a GitHub App for
  that would make the milestone unverifiable without one.
- **ShopDemo's 12 Playwright tests deliberately leave password reset, order history
  and the admin catalogue untested.** Section 22.6 asks for "roughly half the flows",
  and M5 needs real coverage gaps to find.

## 2026-09-29 (Vibe Check landing page)

- **The page lives in a new app, `apps/vibe` (`@oqa/vibe`, port 3000).** The brief said
  `apps/web`, but that is the committed product shell, and `apps/site` already holds a
  different landing page. Both are untouched. Reason: no overwriting of existing work.
- **`packages/ui` and `packages/contracts` follow the source-export convention.** Tokens are
  a Tailwind 4 CSS file; `SubmitUrl` is a zod string schema that also accepts a bare
  domain and adds `https://`.
- **`SubmitUrl` rejects `.test`, `.example` and `.invalid` as well as private suffixes.**
  Reason: none of them resolve on the public internet.
- **CSP keeps `'unsafe-inline'` for scripts,** matching `apps/web`. Next's bootstrap is an
  inline script, and a nonce would make every page dynamic.
- **`CLAUDE.md` and the skills `web-ui`, `repo-boundaries` and `security-baseline` do not
  exist in this repo.** The brief's own rules and this file's conventions were followed
  instead.
- **The look went through five passes:** cobalt "night ledger", pastel anime, watercolor,
  neumorphism, and now the "night-shift stage": real CSS 3D, a pinned scroll story, and
  extra-heavy type. Each earlier look was judged too corporate, too childish or too quiet.
  Reason: the last brief asked for clean UI with 3D and immersive elements, bold type, and
  design that pops.
- **The 3D is pure CSS** (`perspective`, `preserve-3d`, `translateZ`). Reason: no new
  dependency, no CSP change, and no WebGL cost for an effect that is five flat rectangles.
  Registered custom properties (`@property`) let CSS animate the explode, scan and camera
  values that layer positions are computed from.
- **The story is driven by CSS scroll timelines** (`view-timeline`, `animation-timeline`),
  not a scroll library. Older Firefox and reduced-motion users get a static composition with
  the steps as a normal list, and a Playwright test covers that path.
- **One accent with two stops.** `#CC2B08` on light grounds and `#FF6B47` on dark, because
  the page cuts between grounds and no single stop clears 4.5:1 on both.
- **Archivo (width axis) and Geist Mono** through `next/font` replace the earlier faces.
  Display is weight 900, `wdth` 112.
- **Dev and production builds use different output folders.** `apps/vibe` dev writes to
  `.next-dev`; `next build` and `next start` use `.next`. Running a build while the dev
  server was up corrupted its cache and made every page return 500. The root `pnpm build`
  also ran `apps/web`'s build, which can do the same to that app's dev server.
- **The hero is a dark night scene with extruded type.** The earlier light hero read as basic.
  Atmosphere (glow, floor, pointer light, dust) is decorative, `aria-hidden`, and off under
  reduced motion.
- **A solid CSS phone replaces the flat email sheet.** It is built from three offset layers for
  thickness; no 3D library.
- **Loud blocks were removed in favour of restraint.** The brief for a high-end, trustworthy
  page ruled out full-width accent bands and giant type. Accent stays on small controls.
- **The product provides markdown prompts for coding agents,** so the report shows a real
  prompt with a copy button. The text is illustrative, and the page says the report is an
  example. No customer logos, counts or badges were invented.
- **The agent system is explained as four agents with one job each.** The product facts used are
  the ones already on the page (explore like a visitor, tests in your repo, nightly runs,
  out-of-date tests updated, plain-English report with bugs first and prompts). The agent names
  and the real-bug versus stale-test split are how the page describes them, not technical
  claims about implementation; no models, timings or accuracy are stated.
- **The whole site is claymorphism,** on request. One material (`.clay`, `.clay-well`,
  `.clay-press`) carries every surface; a colour variable `--c` and a radius variable `--r`
  parameterise it. The earlier "too childish" concern is handled with muted pastels, dark ink,
  one display weight, and no mascots.
- **Clay parameters must not be set with Tailwind arbitrary properties when the class also
  declares them.** Unlayered component CSS beats Tailwind's layered utilities, so `--c` has
  variant classes (`.clay-coral`, `.clay-white`, ...) and only `--r` is set inline.
- **Inputs keep a real edge.** Clay shading is not a 3:1 boundary, so the URL field has a 3px solid
  edge (`#666B8C`, `#8D93C0` in dark).
- **Light neumorphism with a little maximalism replaces clay,** on request. One surface color and
  a pale shadow pair; `--depth` scales every offset so surfaces can emerge on scroll. The
  ornaments (rings, dial, toggles, slider, LEDs, bubbles) are decorative and add no claims.
- **Palette softened twice after feedback** (too sour, too heavy): periwinkle accent, dusty tints,
  separate muted rose for bugs and sage for passes, and display weight 470.
- **Bug, pass and accent are three separate hues** so state never reads as an action.
- **The page is near-minimal, on request:** white canvas, hairlines, light type, one ink key, no
  decorative ornaments. The `.nm-*` class names were kept but their material is now nearly flat, so
  components did not need rewriting. The 3D stack and agent relay stay because they explain the
  product.
- **A border rule must not live in a class that components also give border utilities.**
  Unlayered CSS beats Tailwind's layered utilities, so `.nm-inset` has no border and the input sets
  its own; `.nm` (cards) carries its hairline because no card overrides it.
- **A theme color must not be named `base`.** Tailwind reads `text-base` as a font size, and a
  color of that name silently turned text invisible in an earlier pass.
- **`vibe-check-design` is a project skill** in `.claude/skills/`, generated with Hue
  from the built page. The four HTML previews Hue normally makes were skipped, since
  the live page is the proof.
- **Playwright can use an installed Chromium** through `PLAYWRIGHT_CHROMIUM_EXECUTABLE`,
  so the suite runs without downloading a browser.

## 2026-09-26 (landing page)

The landing page brief was silent on a handful of implementation points.

- **The page lives in `apps/site` on port 3001, separate from `apps/web`.** The
  product shell and the marketing page share no layout, auth or data, and keeping
  them apart means the marketing page ships no application JavaScript.
- **Shippori Mincho is loaded from the font CSS API rather than `next/font`.** The
  brief asks for the kanji subset only. `next/font/google` cannot subset by
  character, and the family's full Japanese subset is close to a megabyte, so the
  stylesheet is requested with `text=夕夜朝`, the three glyphs the page draws.
- **The signup section is stored in the Resend contact's `lastName`.** Resend
  audience contacts expose only `firstName` and `lastName` as writable properties,
  and there is no custom property field, so `lastName` carries `hero` or `footer`
  and `firstName` stays free for a real name later.
- **The subscribe rate limit is an in process counter keyed by client address.** A
  single page site has one instance and a ten minute window, so a shared store
  would add a dependency without changing the outcome.
- **The FAQ heading is the word FAQ.** The brief names the section but gives no
  title, and a heading is needed for the document outline. Inventing a line of
  marketing copy would break the rule that the copy is used exactly as given.
- **The hero art stacks above the headline below 640px.** The brief asks for the
  art to scale down and sit above the headline on mobile. Scaling the absolutely
  positioned desktop scene put the moon and clouds behind the words, so the same
  pieces are laid out in a short block of their own instead.
- **White comes from the `white` theme token, and the only literal hex values left
  are SVG mask luminance stops.** The rule against raw hex applies to colour, and
  a mask reads black and white as opacity zero and one rather than as paint, so
  the crescent moons and the wave fade keep their literal stops.
