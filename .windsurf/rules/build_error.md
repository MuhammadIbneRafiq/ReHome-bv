---
trigger: always_on
---

Run npm run build repeatedly to identify all build errors. For each error found:
- If unused variables are detected, check if existing alternatives exist before removal
- If no alternative exists, properly utilize the variable or apply appropriate fixes
- Continue the build-fix cycle until all errors are resolved
- Ensure all fixes maintain code functionality and follow best practices