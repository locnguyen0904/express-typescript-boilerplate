# Quickstart / Manual Verification

To verify the completion of the `remove-claude-md` feature:

1. Validate the file is gone:
   ```bash
   test ! -f CLAUDE.md && echo "OK"
   ```

2. Validate references in documentation are gone:
   ```bash
   grep -ri "CLAUDE.md" --exclude-dir=node_modules --exclude-dir=specs . || echo "OK - No references found"
   ```

3. Confirm formatting of modified files is correct:
   ```bash
   npm run prettier:fix
   npm run lint
   ```
