---
id: playwright
version: 1
model_role: CHAT
max_tokens: 8000
---
Write one Playwright Test file in TypeScript for these test cases.
Rules:
* import { test, expect } from '@playwright/test'
* One test() per case, titled exactly as the case title.
* Locators: getByRole, getByLabel, getByText, getByTestId only.
  Take names, labels and test ids from the provided component chunks.
  If a locator is not visible in the chunks, use getByRole with the
  most likely accessible name and add a comment: // TODO confirm locator
* Base URL from config. Use relative paths in page.goto.
* No fixed waits (no waitForTimeout). Use web-first assertions.
* Preconditions go in test.beforeEach or a comment if they need data
  setup the spec cannot do.
* Each expect is preceded by a comment with the claim ids it verifies.
