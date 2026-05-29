(function () {
  const DEFAULT_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
  const DEFAULT_ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
  const DEFAULT_ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.webp'];
  const ACTION_REQUIRED_STATUSES = ['correction_requested', 'rejected'];

  function valueOrDash(value) {
    return value === null || value === undefined || String(value).trim() === ''
      ? '-'
      : String(value).trim();
  }

  function formatBytes(value) {
    const bytes = Number(value);
    if (!Number.isFinite(bytes) || bytes <= 0) {
      return '-';
    }
    if (bytes < 1024 * 1024) {
      return `${Math.ceil(bytes / 1024)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function fileHasAllowedDocumentType(file, allowedMimeTypes, allowedExtensions) {
    const mimeType = file && typeof file.type === 'string' ? file.type.toLowerCase() : '';
    const fileName = file && typeof file.name === 'string' ? file.name.toLowerCase() : '';
    return (allowedMimeTypes || DEFAULT_ALLOWED_MIME_TYPES).includes(mimeType)
      || (allowedExtensions || DEFAULT_ALLOWED_EXTENSIONS).some((extension) => fileName.endsWith(extension));
  }

  function defaultFormat(template, values) {
    return Object.entries(values || {}).reduce(
      (acc, entry) => acc.replace(`{${entry[0]}}`, String(entry[1])),
      template
    );
  }

  function createController(config) {
    const options = config || {};
    const doc = options.document || document;
    const nodes = options.nodes || {};
    const prefix = options.translationPrefix || 'upload';
    const maxFileSizeBytes = Number.isFinite(Number(options.maxFileSizeBytes))
      ? Number(options.maxFileSizeBytes)
      : DEFAULT_MAX_FILE_SIZE_BYTES;
    const allowedMimeTypes = Array.isArray(options.allowedMimeTypes)
      ? options.allowedMimeTypes
      : DEFAULT_ALLOWED_MIME_TYPES;
    const allowedExtensions = Array.isArray(options.allowedExtensions)
      ? options.allowedExtensions
      : DEFAULT_ALLOWED_EXTENSIONS;
    const formType = options.formType || '';
    const listFormType = options.listFormType || formType;
    const getDraftId = typeof options.getDraftId === 'function' ? options.getDraftId : () => '';
    const t = typeof options.t === 'function' ? options.t : (key) => key;
    const tFormat = typeof options.tFormat === 'function'
      ? options.tFormat
      : (key, values) => defaultFormat(t(key), values);
    const displayValue = typeof options.valueOrDash === 'function' ? options.valueOrDash : valueOrDash;
    const beforeUpload = typeof options.beforeUpload === 'function' ? options.beforeUpload : () => ({ ok: true });
    const canListDocuments = typeof options.canListDocuments === 'function' ? options.canListDocuments : () => true;
    const onUploaded = typeof options.onUploaded === 'function' ? options.onUploaded : async () => {};
    const onRefreshed = typeof options.onRefreshed === 'function' ? options.onRefreshed : async () => {};
    const onError = typeof options.onError === 'function' ? options.onError : (error) => console.error(error);
    const uploadDocument = typeof options.uploadDocument === 'function'
      ? options.uploadDocument
      : (draftId, payload) => window.CPGDrafts.uploadDocument(draftId, payload);
    const listDocuments = typeof options.listDocuments === 'function'
      ? options.listDocuments
      : (draftId, documentFormType) => window.CPGDrafts.listDocuments(draftId, documentFormType);

    function key(suffix) {
      return `${prefix}.${suffix}`;
    }

    function tr(suffix) {
      return t(key(suffix));
    }

    function trFormat(suffix, values) {
      return tFormat(key(suffix), values);
    }

    function setStatusText(text) {
      if (nodes.status) {
        nodes.status.textContent = text || '';
      }
    }

    function setStatusWithLink(text, url, linkText) {
      if (!nodes.status) {
        return;
      }
      nodes.status.textContent = '';
      nodes.status.appendChild(doc.createTextNode(`${text || ''} `));
      const link = doc.createElement('a');
      link.href = url || '#';
      link.textContent = linkText || url || '';
      nodes.status.appendChild(link);
    }

    function setControlsDisabled(disabled) {
      [nodes.type, nodes.file, nodes.submit].forEach((node) => {
        if (node) {
          node.disabled = Boolean(disabled);
        }
      });
    }

    function documentTypeLabel(value) {
      const optionsList = nodes.type && nodes.type.options ? Array.from(nodes.type.options) : [];
      const option = optionsList.find((item) => item.value === value);
      return option ? option.textContent.trim() : displayValue(value);
    }

    function reviewStatusLabel(value) {
      const normalized = typeof value === 'string' ? value.trim() : '';
      return normalized ? tr(`review.${normalized}`) : '-';
    }

    function validationMessage(file) {
      if (!file) {
        return tr('status.chooseFile');
      }
      if (!Number.isFinite(file.size) || file.size <= 0) {
        return tr('status.emptyFile');
      }
      if (file.size > maxFileSizeBytes) {
        return trFormat('status.tooLarge', {
          maxSize: formatBytes(maxFileSizeBytes)
        });
      }
      if (!fileHasAllowedDocumentType(file, allowedMimeTypes, allowedExtensions)) {
        return tr('status.unsupportedType');
      }
      return '';
    }

    function serverErrorMessage(error) {
      const code = error && error.payload && typeof error.payload.error === 'string'
        ? error.payload.error
        : '';
      const translationKey = code ? key(`server.${code}`) : '';
      const translated = translationKey ? t(translationKey) : '';
      if (translated && translated !== translationKey) {
        return translated;
      }
      if (error && typeof error.message === 'string' && error.message.trim()) {
        return error.message.trim();
      }
      return tr('status.error');
    }

    function documentsNeedingAction(documents) {
      return Array.isArray(documents)
        ? documents.filter((documentRecord) => (
          ACTION_REQUIRED_STATUSES.includes(documentRecord.review_status)
          && typeof documentRecord.review_note === 'string'
          && documentRecord.review_note.trim() !== ''
        ))
        : [];
    }

    function renderDocumentActionTasks(documents) {
      if (!nodes.actionList) {
        return;
      }
      nodes.actionList.innerHTML = '';
      const tasks = documentsNeedingAction(documents);
      nodes.actionList.hidden = tasks.length === 0;
      tasks.forEach((documentRecord) => {
        const task = doc.createElement('article');
        task.className = 'document-action-task';

        const title = doc.createElement('strong');
        title.textContent = tr('task.title');
        task.appendChild(title);

        const meta = doc.createElement('div');
        meta.className = 'document-action-task__meta';
        [
          `${tr('task.document')}: ${documentTypeLabel(documentRecord.document_type)}`,
          `${tr('task.status')}: ${reviewStatusLabel(documentRecord.review_status)}`,
          `${tr('task.reason')}: ${documentRecord.review_note.trim()}`
        ].forEach((text) => {
          const line = doc.createElement('p');
          line.textContent = text;
          meta.appendChild(line);
        });
        task.appendChild(meta);

        const actions = doc.createElement('div');
        actions.className = 'document-action-task__actions';
        const button = doc.createElement('button');
        button.type = 'button';
        button.className = 'button primary document-replacement-action';
        button.textContent = tr('task.uploadReplacement');
        button.addEventListener('click', () => {
          if (documentRecord.document_type && nodes.type) {
            nodes.type.value = documentRecord.document_type;
          }
          setStatusText(trFormat('task.replacementHint', {
            document: documentTypeLabel(documentRecord.document_type)
          }));
          if (nodes.file && typeof nodes.file.focus === 'function') {
            nodes.file.focus();
          }
        });
        actions.appendChild(button);
        task.appendChild(actions);

        nodes.actionList.appendChild(task);
      });
    }

    function renderUploadedDocuments(documents) {
      renderDocumentActionTasks(documents);
      if (!nodes.list) {
        return;
      }
      nodes.list.innerHTML = '';
      if (!Array.isArray(documents) || documents.length === 0) {
        const empty = doc.createElement('p');
        empty.className = 'status-note';
        empty.textContent = tr('status.empty');
        nodes.list.appendChild(empty);
        return;
      }

      documents.forEach((documentRecord) => {
        const item = doc.createElement('article');
        item.className = 'document-upload-item';

        const title = doc.createElement('strong');
        title.textContent = documentRecord.original_filename || documentRecord.document_type || '-';
        item.appendChild(title);

        const meta = doc.createElement('div');
        meta.className = 'document-upload-meta';
        [
          `${tr('type')}: ${displayValue(documentRecord.document_type)}`,
          `${tr('meta.scan')}: ${displayValue(documentRecord.scan_status)}`,
          `${tr('meta.review')}: ${displayValue(documentRecord.review_status)}`,
          `${tr('meta.size')}: ${formatBytes(documentRecord.file_size_bytes)}`
        ].forEach((text) => {
          const chip = doc.createElement('span');
          chip.textContent = text;
          meta.appendChild(chip);
        });
        item.appendChild(meta);

        if (documentRecord.review_note && ACTION_REQUIRED_STATUSES.includes(documentRecord.review_status)) {
          const reason = doc.createElement('p');
          reason.className = 'status-note';
          reason.textContent = `${tr('task.reason')}: ${documentRecord.review_note}`;
          item.appendChild(reason);
        }

        if (documentRecord.scan_status === 'clean' && documentRecord.review_status === 'pending_human_review') {
          const note = doc.createElement('p');
          note.className = 'status-note';
          note.textContent = tr('meta.cleanReady');
          item.appendChild(note);
        }

        nodes.list.appendChild(item);
      });
    }

    async function refreshUploadedDocuments() {
      const draftId = getDraftId();
      if (!draftId || !canListDocuments(draftId)) {
        renderUploadedDocuments([]);
        return;
      }

      try {
        const response = await listDocuments(draftId, listFormType);
        renderUploadedDocuments(response.documents || []);
        await onRefreshed(response, draftId);
      } catch (error) {
        onError(error);
      }
    }

    async function uploadSelectedDocument() {
      const draftId = getDraftId();
      if (!draftId) {
        setStatusText(tr('status.saveFirst'));
        return;
      }

      const gate = beforeUpload(draftId) || { ok: true };
      if (gate === false || gate.ok === false) {
        if (gate.url && gate.linkText) {
          setStatusWithLink(gate.message || gate.text || '', gate.url, gate.linkText);
        } else {
          setStatusText(gate.message || gate.text || '');
        }
        return;
      }

      const file = nodes.file && nodes.file.files && nodes.file.files[0] ? nodes.file.files[0] : null;
      const message = validationMessage(file);
      if (message) {
        setStatusText(message);
        return;
      }

      setControlsDisabled(true);
      setStatusText(tr('status.uploading'));

      try {
        const response = await uploadDocument(draftId, {
          formType,
          documentType: nodes.type ? nodes.type.value : '',
          file
        });
        if (nodes.file) {
          nodes.file.value = '';
        }
        setStatusText(response.document && response.document.scan_status === 'clean'
          ? tr('status.uploaded')
          : `${tr('meta.scan')}: ${displayValue(response.document && response.document.scan_status)}`);
        await refreshUploadedDocuments();
        await onUploaded(response, draftId);
      } catch (error) {
        setStatusText(trFormat('status.errorDetail', {
          message: serverErrorMessage(error)
        }));
        onError(error);
      } finally {
        setControlsDisabled(false);
      }
    }

    return {
      formatBytes,
      fileHasAllowedDocumentType: (file) => fileHasAllowedDocumentType(file, allowedMimeTypes, allowedExtensions),
      validationMessage,
      serverErrorMessage,
      documentTypeLabel,
      reviewStatusLabel,
      documentsNeedingAction,
      renderDocumentActionTasks,
      renderUploadedDocuments,
      refreshUploadedDocuments,
      uploadSelectedDocument,
      setStatusText,
      setStatusWithLink,
      setControlsDisabled
    };
  }

  window.CPGProtectedUpload = {
    createController,
    formatBytes,
    fileHasAllowedDocumentType,
    DEFAULT_MAX_FILE_SIZE_BYTES,
    DEFAULT_ALLOWED_MIME_TYPES,
    DEFAULT_ALLOWED_EXTENSIONS
  };
})();
