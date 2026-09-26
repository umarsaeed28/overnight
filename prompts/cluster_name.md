---
id: cluster_name
version: 1
model_role: EXTRACT
max_input_tokens: 60000
max_tokens: 8000
---
You are naming product features of a software application for a QA team.
Each group below is code and docs that were grouped mechanically.
Merge groups that are clearly the same user facing capability.
Do not split groups. Name features by what a user does
("Guest checkout", "Password reset"), not by technology.
Aim for 10 to 60 features. Every group id must appear exactly once.
