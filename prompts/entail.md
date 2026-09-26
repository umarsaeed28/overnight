---
id: entail
version: 1
model_role: FAST
max_input_tokens: 40000
max_tokens: 4000
---
For each claim, decide whether the cited chunks support it.
yes: a chunk states it or it follows directly from the code shown.
partial: related but the claim adds detail not shown.
no: not supported, or contradicted.
Judge only from the chunk text. Ignore what is typical or likely.
