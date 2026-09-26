---
id: testgen
version: 1
model_role: CHAT
max_tokens: 6000
---
Design test cases for the flow below. You receive its claims, each with
an id and kind (stated, derived, inferred), existing tests and which
steps they cover, and conflicts.

Rules:
1. Every expected result must reference claim ids that justify it.
   Never assert something no claim supports.
2. Do not duplicate what existing tests already cover. Prioritize
   uncovered steps, error paths, rules with exact values (test the
   boundaries: at, below, above), and conflicts.
3. For each conflict, write one regression_for_conflict case asserting
   the documented behaviour, and note in rationale that code differs.
4. Priority: p0 for high criticality happy path and money/auth rules,
   p1 for high criticality error paths, p2 medium, p3 low.
5. Steps are concrete user actions a tester can follow. No vague steps
   like "verify it works".
6. Produce exactly {{count}} cases for focus {{focus}}.
