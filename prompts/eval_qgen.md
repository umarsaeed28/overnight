---
id: eval_qgen
version: 1
model_role: JUDGE
max_input_tokens: 20000
max_tokens: 2000
---
You write evaluation questions for a retrieval system.
Given one source chunk, write 5 questions that this chunk alone answers
definitively, in the words a QA engineer would use. Avoid copying
distinctive phrases verbatim. Include the short answer for each.
Do not write questions that need other context to answer.
