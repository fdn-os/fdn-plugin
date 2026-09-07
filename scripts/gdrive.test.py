#!/usr/bin/env python3
from __future__ import annotations

import io
import json
import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import gdrive


def http_map(routes: dict[tuple[str, str], tuple[int, dict | bytes]]):
    def http(method: str, url: str, headers: dict[str, str], body: bytes | None):
        auth = headers.get("Authorization", "")
        if "ya29." in auth:
            raise AssertionError("test http saw a live-looking token")
        for (m, prefix), (status, payload) in routes.items():
            if method == m and url.startswith(prefix):
                raw = payload if isinstance(payload, bytes) else json.dumps(payload).encode()
                return status, raw
        raise AssertionError(f"unexpected {method} {url}")

    return http


class GdriveTests(unittest.TestCase):
    def test_share_email_prefers_sidecar_not_json(self):
        with tempfile.TemporaryDirectory() as tmp:
            home = Path(tmp) / "home"
            fdn = home / ".fdn"
            fdn.mkdir(parents=True)
            key = fdn / "gcp-sa.json"
            key.write_text(
                json.dumps(
                    {
                        "type": "service_account",
                        "client_email": "from-json@fdn.iam.gserviceaccount.com",
                        "private_key": "-----BEGIN PRIVATE KEY-----\nMII\n-----END PRIVATE KEY-----\n",
                    }
                )
            )
            (fdn / "gcp-sa.email").write_text("from-sidecar@fdn.iam.gserviceaccount.com\n")
            with patch.object(Path, "home", return_value=home):
                with patch.dict(os.environ, {"GOOGLE_APPLICATION_CREDENTIALS": str(key)}, clear=False):
                    creds = gdrive.load_credentials()
                    self.assertEqual(gdrive.share_email(creds), "from-sidecar@fdn.iam.gserviceaccount.com")

    def test_list_uses_sharedWithMe_and_never_prints_token(self):
        routes = {
            ("GET", "https://www.googleapis.com/drive/v3/files?"): (
                200,
                {"files": [{"id": "1", "name": "Test", "mimeType": "application/vnd.google-apps.folder"}]},
            ),
            ("GET", "https://www.googleapis.com/drive/v3/drives?"): (200, {"drives": []}),
        }
        buf = io.StringIO()
        with patch.object(gdrive, "load_credentials", return_value={"client_email": "sa@x.iam.gserviceaccount.com"}):
            with patch.object(gdrive, "share_email", return_value="sa@x.iam.gserviceaccount.com"):
                with patch("sys.stdout", buf):
                    gdrive.main(["list"], http=http_map(routes), token="not-a-google-token")
        text = buf.getvalue()
        payload = json.loads(text)
        self.assertEqual(payload["email"], "sa@x.iam.gserviceaccount.com")
        self.assertEqual(payload["sharedWithMe"][0]["name"], "Test")
        self.assertNotIn("private_key", text)
        self.assertNotIn("ya29.", text)
        self.assertNotIn("not-a-google-token", text)

    def test_ls_queries_parents(self):
        seen: list[str] = []

        def http(method: str, url: str, headers: dict[str, str], body: bytes | None):
            seen.append(url)
            return 200, json.dumps({"files": [{"id": "f", "name": "a.txt"}]}).encode()

        buf = io.StringIO()
        with patch.object(gdrive, "load_credentials", return_value={"client_email": "sa@x"}):
            with patch.object(gdrive, "share_email", return_value="sa@x"):
                with patch("sys.stdout", buf):
                    gdrive.main(["ls", "1wj-folder"], http=http, token="t")
        self.assertIn("1wj-folder", seen[0])
        self.assertIn("in+parents", seen[0])
        self.assertEqual(json.loads(buf.getvalue())["files"][0]["name"], "a.txt")

    def test_get_writes_bytes(self):
        def http(method: str, url: str, headers: dict[str, str], body: bytes | None):
            if "alt=media" in url:
                return 200, b"hello-drive"
            return 200, json.dumps({"id": "file1", "name": "a.txt", "mimeType": "text/plain"}).encode()

        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp) / "a.txt"
            buf = io.StringIO()
            with patch.object(gdrive, "load_credentials", return_value={"client_email": "sa@x"}):
                with patch.object(gdrive, "share_email", return_value="sa@x"):
                    with patch("sys.stdout", buf):
                        gdrive.main(["get", "file1", "--out", str(out)], http=http, token="ya29.secret")
            self.assertEqual(out.read_bytes(), b"hello-drive")
            self.assertNotIn("ya29.", buf.getvalue())
            self.assertNotIn("private_key", buf.getvalue())

    def test_redact_strips_keys(self):
        self.assertEqual(gdrive._redact("-----BEGIN PRIVATE KEY----- abc"), "redacted")
        self.assertEqual(gdrive._redact('{"access_token":"ya29.xx"}'), "redacted")


if __name__ == "__main__":
    unittest.main()
