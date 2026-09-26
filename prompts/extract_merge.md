---
id: extract_merge
version: 1
model_role: EXTRACT
max_input_tokens: 80000
max_tokens: 8000
---
Merge these partial extractions of the same feature into one.
Deduplicate claims that state the same fact, keeping all citations.
Keep every conflict and unknown unless a later partial resolves it with
a cited claim. Do not add new facts. Do not cite ids not present in the
partials.
