import copy
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('preview_pull', Path(__file__).with_name('preview_pull.py'))
p = importlib.util.module_from_spec(spec)
spec.loader.exec_module(p)


class PreviewTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        root = Path(self.temp.name)
        self.exchange = root / 'exchange'
        self.private = root / 'private'
        (self.exchange / 'tasks').mkdir(parents=True)
        (self.exchange / 'reports').mkdir()
        self.receipt = 'r-' + 'a' * 32
        body = 'Manifest ' + 'b' * 64 + ' MP4 ' + p.digest(b'video')
        (self.exchange / 'tasks' / (p.TASK + '.json')).write_text(json.dumps({'task_sha256': 'c' * 64}))
        self.report_path = self.exchange / 'reports' / (self.receipt + '.json')
        self.report_path.write_text(json.dumps({'task_id': p.TASK, 'task_sha256': 'c' * 64,
            'status': 'READY_FOR_REVIEW', 'body': body, 'body_sha256': p.digest(body.encode())}))
        self.data = {'schema_version': 1, 'id': 'test-v1', 'task_id': p.TASK, 'project_id': '0040',
            'receipt_id': self.receipt, 'title': 'Test', 'summary': 'Summary', 'status_label': 'Review',
            'cost_note': 'No calls', 'status': 'READY_FOR_OWNER_REVIEW', 'date': '2026-09-23',
            'source_manifest_sha256': 'b' * 64, 'notes': ['Quality pending'],
            'files': [{'file': 'combined.mp4', 'kind': 'video', 'sha256': p.digest(b'video'),
                       'size': 5, 'primary': True, 'label': 'Video'}]}

    def tearDown(self):
        self.temp.cleanup()

    def publish(self, data=None, content=b'video', raw_hash=None):
        d = data or self.data
        return p.publish(d, raw_hash or p.digest(json.dumps(d).encode()), self.exchange, self.private,
                         lambda _id, _asset, dest: dest.write_bytes(content))

    def test_publication_and_idempotent_replay(self):
        first = self.publish()
        self.assertEqual(first, self.publish())
        self.assertEqual(first['status'], 'PUBLISHED_INTERNAL_REVIEW')
        self.assertEqual(len(p.read_json(self.private / 'test-results.json')['tests']), 1)
        self.assertEqual((self.private / 'test-test-v1--combined.mp4').stat().st_mode & 0o777, 0o640)

    def test_modified_bundle_requires_new_id(self):
        self.publish()
        d = copy.deepcopy(self.data); d['title'] = 'Changed'
        with self.assertRaises(ValueError): self.publish(d)

    def test_wrong_asset_hash_never_publishes(self):
        with self.assertRaises(ValueError): self.publish(content=b'wrong')
        self.assertFalse((self.private / 'test-results.json').exists())

    def test_paths_and_unsupported_content(self):
        for name in ['../x.mp4', 'x.html', 'x/combined.mp4', 'x..mp4']:
            d = copy.deepcopy(self.data); d['files'][0]['file'] = name
            with self.subTest(name=name), self.assertRaises(ValueError): self.publish(d)

    def test_scope_and_false_approval_rejected(self):
        for key, value in [('project_id', '0032'), ('task_id', 'OTHER'), ('status', 'APPROVED')]:
            d = copy.deepcopy(self.data); d[key] = value
            with self.subTest(key=key), self.assertRaises(ValueError): self.publish(d)

    def test_report_hash_and_revision_binding(self):
        r = json.loads(self.report_path.read_text()); r['body'] = 'Altered'; self.report_path.write_text(json.dumps(r))
        with self.assertRaises(ValueError): self.publish()

    def test_symlink_destination_rejected(self):
        self.private.mkdir()
        (self.private / 'test-test-v1--combined.mp4').symlink_to(self.report_path)
        with self.assertRaises(ValueError): self.publish()

    def test_asset_absent_from_report_rejected(self):
        d = copy.deepcopy(self.data); d['files'][0]['sha256'] = p.digest(b'other')
        with self.assertRaises(ValueError): self.publish(d, content=b'other')

if __name__ == '__main__':
    unittest.main()
