---
name: drive
description: "List or read this Computer's Google Drive via scripts/gdrive.py. Invoke when asked to list Drive, open a shared folder, get a Drive file, or copy the share-with email. Read-only."
argument-hint: "[list | ls <folderId> | get <fileId>]"
allowed-tools: Bash, Read
---

# /fdn:drive — run the helper, do not hunt

Read-only. Share target is `~/.fdn/gcp-sa.email` (do not open the JSON).

Run `scripts/gdrive.py`. Resolve the script in this order: next to this `SKILL.md`, then `~/.fdn/plugin/scripts/gdrive.py`, then walk up to the plugin root that contains `CLAUDE.md`.

```bash
python3 "$GDRIVE" list
python3 "$GDRIVE" ls <folderId>
python3 "$GDRIVE" get <fileId> --out /tmp/file
```

Empty My Drive is normal. Shared folders show on `list` (`sharedWithMe`). Folder contents are `ls`.

Do not install a Google client. Do not search for `googleapis`. Do not print `private_key` or the access token.
