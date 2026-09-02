from pathlib import Path
import base64, hashlib, zipfile

ROOT = Path(__file__).parent
parts = [(ROOT / f"chunk_{i:02d}.txt").read_text().strip() for i in range(1, 8)]
data = base64.b64decode("".join(parts), validate=True)
out = ROOT / "MFS-SDK-V1-01-R5-CANDIDATE.zip"
out.write_bytes(data)
sha = hashlib.sha256(data).hexdigest()
print(f"NAME:{out.name}")
print(f"BYTES:{len(data)}")
print(f"SHA256:{sha}")
if len(data) != 19568 or sha != "51f0250d9af5e042eab1ff4b726ce91924432453a5b4f7cef8cba386bf585ba5":
    raise SystemExit("AUTHORITY_VERIFICATION:FAIL")
with zipfile.ZipFile(out) as z:
    bad = z.testzip()
    names = z.namelist()
    print(f"ENTRIES:{len(names)}")
    print(f"PACKAGE_LOCK_PRESENT:{'package-lock.json' in names}")
    print(f"ZIP_INTEGRITY:{'PASS' if bad is None else 'FAIL'}")
    if len(names) != 23 or bad is not None or 'package-lock.json' not in names:
        raise SystemExit("AUTHORITY_VERIFICATION:FAIL")
    extract = ROOT / 'extracted'
    extract.mkdir(exist_ok=True)
    z.extractall(extract)
print("AUTHORITY_VERIFICATION:PASS")
