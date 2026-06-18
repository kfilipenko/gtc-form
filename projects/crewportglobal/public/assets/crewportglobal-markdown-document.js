(function () {
  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function renderInline(value) {
    return escapeHtml(value)
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  }

  function closeList(state, output) {
    if (state.listType) {
      output.push('</' + state.listType + '>');
      state.listType = '';
    }
  }

  function renderMarkdown(markdown) {
    var output = [];
    var state = { listType: '', inCode: false, code: [] };
    var lines = String(markdown || '').replace(/\r\n/g, '\n').split('\n');

    lines.forEach(function (line) {
      if (/^```/.test(line.trim())) {
        closeList(state, output);
        if (state.inCode) {
          output.push('<pre><code>' + escapeHtml(state.code.join('\n')) + '</code></pre>');
          state.inCode = false;
          state.code = [];
        } else {
          state.inCode = true;
        }
        return;
      }

      if (state.inCode) {
        state.code.push(line);
        return;
      }

      var trimmed = line.trim();
      if (!trimmed) {
        closeList(state, output);
        return;
      }

      if (/^-{3,}$/.test(trimmed)) {
        closeList(state, output);
        output.push('<hr>');
        return;
      }

      var heading = /^(#{1,6})\s+(.+)$/.exec(trimmed);
      if (heading) {
        closeList(state, output);
        var level = Math.min(heading[1].length + 1, 6);
        output.push('<h' + level + '>' + renderInline(heading[2]) + '</h' + level + '>');
        return;
      }

      var unordered = /^[-*]\s+(.+)$/.exec(trimmed);
      if (unordered) {
        if (state.listType !== 'ul') {
          closeList(state, output);
          output.push('<ul>');
          state.listType = 'ul';
        }
        output.push('<li>' + renderInline(unordered[1]) + '</li>');
        return;
      }

      var ordered = /^\d+\.\s+(.+)$/.exec(trimmed);
      if (ordered) {
        if (state.listType !== 'ol') {
          closeList(state, output);
          output.push('<ol>');
          state.listType = 'ol';
        }
        output.push('<li>' + renderInline(ordered[1]) + '</li>');
        return;
      }

      closeList(state, output);
      output.push('<p>' + renderInline(trimmed) + '</p>');
    });

    closeList(state, output);
    if (state.inCode) {
      output.push('<pre><code>' + escapeHtml(state.code.join('\n')) + '</code></pre>');
    }
    return output.join('\n');
  }

  function loadMarkdownDocument(node) {
    var source = node.getAttribute('data-src');
    if (!source) {
      return;
    }
    fetch(source, { credentials: 'same-origin' })
      .then(function (response) {
        if (!response.ok) {
          throw new Error('Unable to load document: ' + response.status);
        }
        return response.text();
      })
      .then(function (markdown) {
        node.innerHTML = renderMarkdown(markdown);
        node.setAttribute('data-loaded', 'true');
      })
      .catch(function () {
        node.textContent = 'The full contract text is temporarily unavailable.';
        node.setAttribute('data-loaded', 'false');
      });
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-markdown-document]').forEach(loadMarkdownDocument);
  });
}());
