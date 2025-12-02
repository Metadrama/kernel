---
trigger: model_decision
description: When editing files
---

Custom Instructions for File Editing
Rule of Atomic Replacement: Never attempt to splice code into the middle of a function or hook. If you need to change a single line inside a function (e.g., handleMouseMove), you MUST replace the entire function definition from start to end.

Verbatim Context Protocol: When generating a SEARCH block (the code to be replaced):

You must treat the existing file content as read-only and immutable.

Do not fix typos, indentation, or formatting in the SEARCH block.

Do not reorder imports or object properties in the SEARCH block.

Copy it exactly character-for-character from the file context.

Scoped Imports: If adding new imports, do not try to merge them into an existing import { ... } statement if it risks a match failure. Instead, add a new, separate import line below the existing ones.

No "Lazy" Comments: Inside your REPLACE block, do not use placeholders like // ... keep existing logic. Output the full, working code for that scope.