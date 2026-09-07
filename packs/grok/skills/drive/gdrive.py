#!/usr/bin/env python3
"""Read-only Drive helper for this Computer's member service account.

Commands: list | ls <folderId> | get <fileId> [--out PATH]
Never prints private_key or the access token.
"""

from __future__ import annotations

import base64
import json
import os
import ssl
import sys
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any, Callable

DRIVE = "https://www.googleapis.com/drive/v3"
TOKEN_URI = "https://oauth2.googleapis.com/token"
SCOPE = "https://www.googleapis.com/auth/drive.readonly"
FIELDS = "files(id,name,mimeType,parents,driveId,size),nextPageToken"
GOOGLE_APPS = "application/vnd.google-apps."

HttpFn = Callable[[str, str, dict[str, str], bytes | None], tuple[int, bytes]]


def _die(msg: str, code: int = 1) -> None:
    sys.stderr.write(msg.rstrip() + "\n")
    raise SystemExit(code)


def _redact(text: str) -> str:
    out = text
    for needle in ("BEGIN PRIVATE KEY", "private_key", "ya29.", "access_token"):
        if needle in out:
            out = "redacted"
            break
    return out


def credential_paths() -> list[Path]:
    env = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS", "").strip()
    paths = []
    if env:
        paths.append(Path(env).expanduser())
    paths.extend([Path("/etc/fdn/gcp-sa.json"), Path.home() / ".fdn" / "gcp-sa.json"])
    seen: set[str] = set()
    out: list[Path] = []
    for p in paths:
        key = str(p)
        if key in seen:
            continue
        seen.add(key)
        out.append(p)
    return out


def load_credentials() -> dict[str, Any]:
    last = ""
    for path in credential_paths():
        try:
            raw = path.read_text(encoding="utf-8")
        except OSError as err:
            last = str(err)
            continue
        try:
            obj = json.loads(raw)
        except json.JSONDecodeError:
            _die(f"invalid service-account JSON at {path}")
        if not isinstance(obj, dict) or obj.get("type") != "service_account":
            _die(f"not a service-account JSON at {path}")
        email = str(obj.get("client_email") or "")
        if "@" not in email or "PRIVATE KEY" not in str(obj.get("private_key") or ""):
            _die(f"incomplete service-account JSON at {path}")
        obj["_path"] = str(path)
        return obj
    _die("no service-account JSON (set GOOGLE_APPLICATION_CREDENTIALS, or plant /etc/fdn/gcp-sa.json)")
    raise AssertionError(last)


def share_email(creds: dict[str, Any] | None = None) -> str:
    sidecar = Path.home() / ".fdn" / "gcp-sa.email"
    try:
        text = sidecar.read_text(encoding="utf-8").strip()
        if "@" in text:
            return text
    except OSError:
        pass
    if creds is None:
        creds = load_credentials()
    planted = Path(str(creds.get("_path") or "")).with_suffix(".email")
    try:
        text = planted.read_text(encoding="utf-8").strip()
        if "@" in text:
            return text
    except OSError:
        pass
    return str(creds.get("client_email") or "")


def _b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def mint_jwt(creds: dict[str, Any]) -> str:
    now = int(time.time())
    claim = {
        "iss": creds["client_email"],
        "sub": creds["client_email"],
        "aud": creds.get("token_uri") or TOKEN_URI,
        "iat": now,
        "exp": now + 3600,
        "scope": SCOPE,
    }
    pem = str(creds["private_key"])
    try:
        import jwt  # type: ignore[import-untyped]

        token = jwt.encode(claim, pem, algorithm="RS256")
        return token if isinstance(token, str) else token.decode("ascii")
    except Exception:
        pass
    header = _b64url(json.dumps({"alg": "RS256", "typ": "JWT"}, separators=(",", ":")).encode())
    payload = _b64url(json.dumps(claim, separators=(",", ":")).encode())
    signing_input = f"{header}.{payload}".encode()
    with tempfile.NamedTemporaryFile("w", delete=False) as handle:
        handle.write(pem if pem.endswith("\n") else pem + "\n")
        key_path = handle.name
    os.chmod(key_path, 0o600)
    try:
        import subprocess

        proc = subprocess.run(
            ["openssl", "dgst", "-sha256", "-sign", key_path],
            input=signing_input,
            capture_output=True,
            check=False,
        )
        if proc.returncode != 0:
            _die("could not sign Drive JWT (install PyJWT or openssl)")
        return f"{header}.{payload}.{_b64url(proc.stdout)}"
    finally:
        try:
            os.unlink(key_path)
        except OSError:
            pass


def default_http(method: str, url: str, headers: dict[str, str], body: bytes | None) -> tuple[int, bytes]:
    req = urllib.request.Request(url, data=body, method=method, headers=headers)
    ctx = ssl.create_default_context()
    try:
        with urllib.request.urlopen(req, context=ctx) as res:
            return res.getcode() or 200, res.read()
    except urllib.error.HTTPError as err:
        return err.code, err.read()


def mint_access_token(creds: dict[str, Any], http: HttpFn = default_http) -> str:
    assertion = mint_jwt(creds)
    body = urllib.parse.urlencode(
        {
            "grant_type": "urn:ietf:params:oauth:grant-type:jwt-bearer",
            "assertion": assertion,
        }
    ).encode()
    status, raw = http(
        "POST",
        str(creds.get("token_uri") or TOKEN_URI),
        {"Content-Type": "application/x-www-form-urlencoded"},
        body,
    )
    if status != 200:
        _die(f"Drive token exchange failed ({status})")
    try:
        payload = json.loads(raw.decode())
    except json.JSONDecodeError:
        _die("Drive token exchange returned non-JSON")
    token = payload.get("access_token")
    if not isinstance(token, str) or not token:
        _die("Drive token exchange returned no access_token")
    return token


def drive_json(token: str, path: str, query: dict[str, str], http: HttpFn = default_http) -> dict[str, Any]:
    url = f"{DRIVE}{path}"
    if query:
        url += "?" + urllib.parse.urlencode(query)
    status, raw = http("GET", url, {"Authorization": "Bearer " + token}, None)
    if status != 200:
        _die(f"Drive {path} failed ({status}): {_redact(raw.decode('utf-8', 'replace')[:200])}")
    try:
        payload = json.loads(raw.decode())
    except json.JSONDecodeError:
        _die(f"Drive {path} returned non-JSON")
    if not isinstance(payload, dict):
        _die(f"Drive {path} returned a non-object")
    return payload


def cmd_list(token: str, email: str, http: HttpFn) -> dict[str, Any]:
    shared = drive_json(
        token,
        "/files",
        {
            "q": "sharedWithMe=true and trashed=false",
            "pageSize": "100",
            "supportsAllDrives": "true",
            "includeItemsFromAllDrives": "true",
            "fields": FIELDS,
        },
        http,
    )
    drives = drive_json(token, "/drives", {"pageSize": "100", "fields": "drives(id,name)"}, http)
    return {
        "email": email,
        "sharedWithMe": shared.get("files") or [],
        "drives": drives.get("drives") or [],
    }


def cmd_ls(token: str, folder_id: str, http: HttpFn) -> dict[str, Any]:
    folder_id = folder_id.strip()
    if not folder_id:
        _die("ls requires a folder id")
    payload = drive_json(
        token,
        "/files",
        {
            "q": f"'{folder_id}' in parents and trashed=false",
            "pageSize": "100",
            "supportsAllDrives": "true",
            "includeItemsFromAllDrives": "true",
            "corpora": "allDrives",
            "fields": FIELDS,
        },
        http,
    )
    return {"folderId": folder_id, "files": payload.get("files") or []}


def cmd_get(token: str, file_id: str, out: str | None, http: HttpFn) -> None:
    file_id = file_id.strip()
    if not file_id:
        _die("get requires a file id")
    meta = drive_json(
        token,
        f"/files/{urllib.parse.quote(file_id)}",
        {"supportsAllDrives": "true", "fields": "id,name,mimeType,size,driveId"},
        http,
    )
    mime = str(meta.get("mimeType") or "")
    if mime.startswith(GOOGLE_APPS):
        export_map = {
            "application/vnd.google-apps.document": "text/plain",
            "application/vnd.google-apps.spreadsheet": "text/csv",
            "application/vnd.google-apps.presentation": "text/plain",
        }
        export = export_map.get(mime)
        if not export:
            _die(f"cannot export {mime}")
        url = f"{DRIVE}/files/{urllib.parse.quote(file_id)}/export?" + urllib.parse.urlencode(
            {"mimeType": export}
        )
    else:
        url = f"{DRIVE}/files/{urllib.parse.quote(file_id)}?alt=media&supportsAllDrives=true"
    status, raw = http("GET", url, {"Authorization": "Bearer " + token}, None)
    if status != 200:
        _die(f"Drive get failed ({status})")
    if out:
        Path(out).write_bytes(raw)
        sys.stdout.write(json.dumps({"id": meta.get("id"), "name": meta.get("name"), "bytes": len(raw), "out": out}) + "\n")
        return
    sys.stdout.buffer.write(raw)


def main(argv: list[str] | None = None, http: HttpFn | None = None, token: str | None = None) -> int:
    args = list(sys.argv[1:] if argv is None else argv)
    http_fn = http or default_http
    if not args or args[0] in {"-h", "--help"}:
        sys.stdout.write("usage: gdrive.py list | ls <folderId> | get <fileId> [--out PATH]\n")
        return 0
    cmd = args[0]
    creds = load_credentials()
    email = share_email(creds)
    bearer = token if token is not None else mint_access_token(creds, http_fn)
    if cmd == "list":
        sys.stdout.write(json.dumps(cmd_list(bearer, email, http_fn), indent=2) + "\n")
        return 0
    if cmd == "ls":
        folder = args[1] if len(args) > 1 else ""
        sys.stdout.write(json.dumps(cmd_ls(bearer, folder, http_fn), indent=2) + "\n")
        return 0
    if cmd == "get":
        file_id = args[1] if len(args) > 1 else ""
        out = None
        if "--out" in args:
            idx = args.index("--out")
            out = args[idx + 1] if idx + 1 < len(args) else ""
            if not out:
                _die("get --out requires a path")
        cmd_get(bearer, file_id, out, http_fn)
        return 0
    _die(f"unknown command {cmd}")
    return 1


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except SystemExit:
        raise
    except Exception as err:
        _die(_redact(str(err)))
