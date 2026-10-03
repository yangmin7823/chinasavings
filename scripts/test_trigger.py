import contextlib
import io
import json
import unittest
from unittest.mock import patch

import trigger


class AutoPublishTests(unittest.TestCase):
    def run_article(self, links, content=None):
        generated = {
            'title': 'Factory sourcing checklist', 'slug': 'factory-sourcing-checklist',
            'content': content or '<p>' + 'supplier verification quality samples ' * 170 + '</p>',
            'faq': [{'q': 'How do I verify a supplier?', 'a': 'Review registration and samples.'}],
            'internal_links': links,
        }
        calls = []

        def api(path, payload=None, **kwargs):
            if path.startswith('/api/blog/posts'):
                return {'posts': [{'slug': 'supplier-guide', 'title': 'Supplier guide', 'category': 'Suppliers'}]}
            if payload is None:
                return {'topics': [{'topic': 'Factory sourcing checklist', 'keyword': 'factory sourcing checklist', 'category': 'Suppliers', 'status': 'active'}]}
            calls.append(payload)
            return {'ok': True, 'post': {'id': 'test-post'}}

        with patch.object(trigger, 'TOKEN', 'test-only'), patch.object(trigger, 'DRY_RUN', False), \
             patch.object(trigger, 'api', side_effect=api), \
             patch.object(trigger, 'agnes_chat', return_value=json.dumps(generated)), \
             contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
            result = trigger.main()
        return result, calls

    def test_string_and_object_links_publish(self):
        for links in [['/blog/supplier-guide/'], [{'slug': 'supplier-guide'}], [None, 17, '/blog/supplier-guide/']]:
            with self.subTest(links=links):
                result, calls = self.run_article(links)
                self.assertEqual(result, 0)
                self.assertEqual(calls[0]['post']['internal_links'], [{'slug': 'supplier-guide'}])
                self.assertEqual([call['action'] for call in calls], ['save', 'publish'])

    def test_failed_quality_check_never_saves_or_publishes(self):
        result, calls = self.run_article([], '<p>Too short.</p>')
        self.assertEqual(result, 1)
        self.assertEqual(calls, [])


if __name__ == '__main__':
    unittest.main()
