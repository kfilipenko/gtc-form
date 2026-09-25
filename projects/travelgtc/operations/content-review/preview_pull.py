#!/usr/bin/env python3
"""Import hash-bound preview bundles into the authenticated CRM gallery. No model calls."""
import fcntl
import hashlib
import json
import os
from pathlib import Path
import re
import shlex
import stat
import subprocess
import tempfile
from datetime import datetime, timezone

EXCHANGE = Path('/srv/gtc-docs-published/review/travelgtc-coordination')
PRIVATE = Path('/var/lib/travelgtc/content-review/pilot-20260922')
REMOTE_ROOT = '/home/gtcops/travelgtc-exchange/previews'
TASK = 'GTC-AI-CONTENT-CATALOG-001'
HOST = 'gtc-agent-01-admin'
PAGE = 'https://travelgtc.com/crm/strategy/content-review/'
ID = re.compile(r'[a-z0-9][a-z0-9-]{0,63}\Z')
NAME = re.compile(r'[a-zA-Z0-9][a-zA-Z0-9_.-]{0,120}\.(mp4|mp3|wav|png|jpg|webp|srt|vtt|md|txt|json)\Z')
SHA = re.compile(r'[a-f0-9]{64}\Z')
KINDS = {'mp4': 'video', 'mp3': 'audio', 'wav': 'audio', 'png': 'image',
         'jpg': 'image', 'webp': 'image', 'srt': 'subtitles', 'vtt': 'subtitles',
         'md': 'document', 'txt': 'document', 'json': 'document'}


def digest(data):
    return hashlib.sha256(data).hexdigest()


def atomic_json(path, data, mode=0o640):
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(prefix='.preview-', dir=path.parent)
    try:
        with os.fdopen(fd, 'w') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            f.write('\n')
        os.chmod(tmp, mode)
        os.replace(tmp, path)
    finally:
        if os.path.exists(tmp):
            os.unlink(tmp)


def read_json(path):
    fd = os.open(path, os.O_RDONLY | os.O_NOFOLLOW)
    with os.fdopen(fd) as f:
        info = os.fstat(f.fileno())
        if not stat.S_ISREG(info.st_mode) or info.st_size > 1048576:
            raise ValueError('Invalid metadata file')
        return json.load(f)


def validate(data, exchange):
    if data.get('schema_version') != 1 or data.get('project_id') != '0040' or data.get('task_id') != TASK:
        raise ValueError('Scope mismatch')
    if not ID.fullmatch(data.get('id', '')):
        raise ValueError('Invalid preview id')
    if not re.fullmatch(r'r-[a-f0-9]{32}', data.get('receipt_id', '')):
        raise ValueError('Invalid report id')
    task = read_json(exchange / 'tasks' / (TASK + '.json'))
    report = read_json(exchange / 'reports' / (data['receipt_id'] + '.json'))
    if not (report.get('task_id') == TASK and report.get('task_sha256') == task['task_sha256']
            and report.get('status') == 'READY_FOR_REVIEW'
            and digest(report['body'].encode()) == report.get('body_sha256')):
        raise ValueError('Report binding invalid')
    for key, limit in [('title', 180), ('summary', 1800), ('status_label', 180), ('cost_note', 1500)]:
        if not isinstance(data.get(key), str) or not 0 < len(data[key]) <= limit:
            raise ValueError('Invalid text field')
    if data.get('status') not in ('TECHNICAL_PASS_PRODUCT_REVISE', 'REVISE', 'BLOCKED', 'READY_FOR_OWNER_REVIEW'):
        raise ValueError('Publication approval cannot be granted by bundle')
    if not re.fullmatch(r'\d{4}-\d{2}-\d{2}', data.get('date', '')) or not SHA.fullmatch(data.get('source_manifest_sha256', '')):
        raise ValueError('Invalid provenance')
    if data['source_manifest_sha256'] not in report['body']:
        raise ValueError('Source manifest absent from bound report')
    notes = data.get('notes')
    if not isinstance(notes, list) or not 1 <= len(notes) <= 12 or any(not isinstance(n, str) or len(n) > 1200 for n in notes):
        raise ValueError('Invalid review notes')
    assets = data.get('files')
    if not isinstance(assets, list) or not 1 <= len(assets) <= 12:
        raise ValueError('Invalid asset count')
    names = set()
    for asset in assets:
        name = asset.get('file', '')
        if not NAME.fullmatch(name) or '..' in name or name in names:
            raise ValueError('Invalid asset name')
        names.add(name)
        if asset.get('kind') != KINDS[name.rsplit('.', 1)[1]] or not SHA.fullmatch(asset.get('sha256', '')):
            raise ValueError('Invalid asset type or hash')
        if type(asset.get('size')) is not int or not 0 < asset['size'] <= 52428800:
            raise ValueError('Invalid asset size')
        if type(asset.get('primary', False)) is not bool or not isinstance(asset.get('label'), str) or not 0 < len(asset['label']) <= 150:
            raise ValueError('Invalid asset label or primary marker')
    primary = [a for a in assets if a.get('primary')]
    if len(primary) != 1 or primary[0]['sha256'] not in report['body']:
        raise ValueError('Primary artifact must be bound to report')
    if sum(a['size'] for a in assets) > 157286400:
        raise ValueError('Preview too large')


def fetch_asset(preview_id, asset, destination):
    # Paths are validated above; remote code also refuses symlinks and wrong sizes.
    script = f'''import os,stat,sys
from pathlib import Path
root=Path({REMOTE_ROOT!r})
folder=root/{preview_id!r}
if root.resolve()!=root or folder.is_symlink() or not folder.is_dir():raise SystemExit(2)
fd=os.open(folder/{asset['file']!r},os.O_RDONLY|os.O_NOFOLLOW)
with os.fdopen(fd,'rb') as f:
 s=os.fstat(f.fileno())
 if not stat.S_ISREG(s.st_mode) or s.st_size!={asset['size']}:raise SystemExit(3)
 while True:
  chunk=f.read(1048576)
  if not chunk:break
  sys.stdout.buffer.write(chunk)
'''
    with open(destination, 'xb') as output:
        r = subprocess.run(['ssh', '-o', 'BatchMode=yes', '-o', 'StrictHostKeyChecking=yes',
                            '-o', 'ConnectTimeout=10', HOST, 'python3 -c ' + shlex.quote(script)],
                           stdout=output, stderr=subprocess.PIPE, timeout=45)
    if r.returncode:
        raise ValueError('Asset transfer failed')


def publish(data, raw_hash, exchange=EXCHANGE, private=PRIVATE, fetch=fetch_asset):
    validate(data, exchange)
    private.mkdir(parents=True, exist_ok=True, mode=0o750)
    catalog_path = private / 'test-results.json'
    catalog = read_json(catalog_path) if catalog_path.exists() else {'schema_version': 1, 'tests': []}
    if catalog.get('schema_version') != 1 or not isinstance(catalog.get('tests'), list):
        raise ValueError('Invalid existing catalog')
    old = next((t for t in catalog['tests'] if t.get('id') == data['id']), None)
    if old and old.get('preview_sha256') != raw_hash:
        raise ValueError('Immutable preview conflict; use a new id')
    item = {k: data[k] for k in ['id', 'project_id', 'task_id', 'receipt_id', 'title', 'summary',
                               'status', 'status_label', 'cost_note', 'notes', 'date', 'source_manifest_sha256']}
    item.update(preview_sha256=raw_hash, files=[], publication_status='INTERNAL_REVIEW_ONLY')
    with tempfile.TemporaryDirectory(prefix='.preview-stage-', dir=private) as stage_name:
        stage = Path(stage_name)
        for asset in data['files']:
            target_name = 'test-' + data['id'] + '--' + asset['file']
            target = private / target_name
            if target.is_symlink():
                raise ValueError('Symlink target rejected')
            if target.exists():
                if target.stat().st_size != asset['size'] or digest(target.read_bytes()) != asset['sha256']:
                    raise ValueError('Existing asset conflict')
            else:
                fetched = stage / target_name
                fetch(data['id'], asset, fetched)
                if fetched.is_symlink() or not fetched.is_file() or fetched.stat().st_size != asset['size'] or digest(fetched.read_bytes()) != asset['sha256']:
                    raise ValueError('Transferred asset mismatch')
                fetched.chmod(0o640)
            item['files'].append({**asset, 'file': target_name})
        for fetched in stage.iterdir():
            os.replace(fetched, private / fetched.name)
    if not old:
        catalog['tests'].insert(0, item)
        encoded = json.dumps(catalog, ensure_ascii=False).encode()
        if len(encoded) > 900000:
            raise ValueError('Gallery index needs archiving')
        atomic_json(catalog_path, catalog)
    receipt = {'id': data['id'], 'task_id': TASK, 'project_id': '0040', 'status': 'PUBLISHED_INTERNAL_REVIEW',
               'preview_sha256': raw_hash, 'report_receipt_id': data['receipt_id'],
               'url': PAGE + '#test-' + data['id'], 'published_at': datetime.now(timezone.utc).isoformat(),
               'publication_status': 'INTERNAL_REVIEW_ONLY',
               'files': [{k: a[k] for k in ['file', 'size', 'sha256']} for a in item['files']]}
    receipt_path = exchange / 'previews' / (data['id'] + '.json')
    if not receipt_path.exists():
        atomic_json(receipt_path, receipt, 0o644)
    else:
        existing = read_json(receipt_path)
        if existing.get('preview_sha256') != raw_hash:
            raise ValueError('Publication receipt conflict')
        receipt = existing
    return receipt


def main():
    lock = open(Path(__file__).with_suffix('.lock'), 'w')
    try:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except BlockingIOError:
        return
    remote = f'''from pathlib import Path
import json,hashlib,re
root=Path({REMOTE_ROOT!r})
if not root.exists():raise SystemExit(0)
if root.resolve()!=root:raise SystemExit(2)
sent=0
for d in sorted(root.iterdir()):
 if not re.fullmatch(r'[a-z0-9][a-z0-9-]{{0,63}}',d.name) or d.is_symlink() or not d.is_dir():continue
 p=d/'preview.json'
 if p.is_symlink() or not p.is_file() or p.stat().st_size>98304:continue
 raw=p.read_bytes();h=hashlib.sha256(raw).hexdigest()
 receipt=Path('/mnt/gtc-docs/review/travelgtc-coordination/previews')/(d.name+'.json')
 try:
  if receipt.is_file():
   r=json.loads(receipt.read_text())
   if r.get('preview_sha256')==h and r.get('status')=='PUBLISHED_INTERNAL_REVIEW':continue
  data=json.loads(raw)
  if data.get('id')!=d.name:continue
  print(json.dumps({{'data':data,'sha256':h}}));sent+=1
  if sent>=2:break
 except (ValueError,OSError):continue
'''
    r = subprocess.run(['ssh', '-o', 'BatchMode=yes', '-o', 'StrictHostKeyChecking=yes',
                        '-o', 'ConnectTimeout=10', HOST, 'python3 -c ' + shlex.quote(remote)],
                       capture_output=True, text=True, timeout=20)
    if r.returncode:
        raise SystemExit('Preview metadata transport failed')
    ok = bad = 0
    for line in r.stdout.splitlines():
        try:
            entry = json.loads(line)
            publish(entry['data'], entry['sha256'])
            ok += 1
        except (ValueError, OSError, KeyError, TypeError, subprocess.TimeoutExpired):
            bad += 1
    print(f'Previews published: {ok}; rejected: {bad}')
    if bad:
        raise SystemExit(1)


if __name__ == '__main__':
    main()
