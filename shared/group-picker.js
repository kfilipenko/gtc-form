const DEFAULT_COLORS = ['#60a5fa', '#f97316', '#34d399', '#a78bfa', '#f472b6', '#facc15', '#fb7185'];
let stylesInjected = false;

function injectPickerStyles() {
  if (stylesInjected || typeof document === 'undefined') return;
  const style = document.createElement('style');
  style.dataset.component = 'group-picker';
  style.textContent = `
    .group-picker-backdrop {
      position: fixed;
      inset: 0;
      display: none;
      align-items: center;
      justify-content: center;
      background: rgba(5, 7, 15, 0.75);
      backdrop-filter: blur(6px);
      z-index: 9999;
      padding: 24px;
    }
    .group-picker-backdrop[data-open="true"] {
      display: flex;
    }
    .group-picker-panel {
      width: min(520px, 100%);
      max-height: min(640px, 100%);
      border-radius: 24px;
      border: 1px solid rgba(255,255,255,0.08);
      background: radial-gradient(circle at top, rgba(255,255,255,0.05), rgba(8,10,18,0.98));
      color: #f8fafc;
      font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      display: flex;
      flex-direction: column;
      box-shadow: 0 25px 80px rgba(0, 0, 0, 0.35);
    }
    .group-picker-header {
      padding: 20px 24px 12px;
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
    }
    .group-picker-header h3 {
      margin: 0;
      font-size: 1.15rem;
    }
    .group-picker-header p {
      margin: 4px 0 0;
      color: rgba(248, 250, 252, 0.7);
      font-size: 0.92rem;
    }
    .group-picker-close {
      border: none;
      background: rgba(255,255,255,0.08);
      color: inherit;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      cursor: pointer;
      font-size: 1.1rem;
    }
    .group-picker-body {
      flex: 1;
      overflow-y: auto;
      padding: 0 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .group-picker-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .group-picker-option {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border-radius: 14px;
      border: 1px solid rgba(255,255,255,0.08);
      background: rgba(255,255,255,0.02);
      font-size: 0.95rem;
    }
    .group-picker-option input[type="checkbox"] {
      width: 18px;
      height: 18px;
      accent-color: #38bdf8;
      cursor: pointer;
    }
    .group-picker-swatch {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      border: 2px solid rgba(255,255,255,0.35);
      flex-shrink: 0;
    }
    .group-picker-option-name {
      flex: 1;
      font-weight: 500;
    }
    .group-picker-tag {
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: rgba(248, 250, 252, 0.6);
    }
    .group-picker-empty {
      border: 1px dashed rgba(255,255,255,0.2);
      border-radius: 18px;
      padding: 18px;
      text-align: center;
      color: rgba(248, 250, 252, 0.65);
      font-size: 0.92rem;
    }
    .group-picker-create {
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 18px;
      padding: 16px;
      background: rgba(255,255,255,0.02);
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .group-picker-create input[type="text"] {
      width: 100%;
      border-radius: 12px;
      border: 1px solid rgba(255,255,255,0.15);
      background: rgba(3, 5, 12, 0.6);
      color: inherit;
      padding: 10px 12px;
    }
    .group-picker-palette {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .group-picker-color {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: 2px solid transparent;
      cursor: pointer;
      background: var(--picker-color, #ffffff);
    }
    .group-picker-color[data-selected="true"] {
      border-color: rgba(255,255,255,0.9);
      box-shadow: 0 0 0 4px rgba(255,255,255,0.15);
    }
    .group-picker-footer {
      padding: 16px 24px 24px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 12px;
    }
    .group-picker-status {
      font-size: 0.85rem;
      color: rgba(248, 250, 252, 0.7);
    }
    .group-picker-error {
      color: #f87171;
      font-size: 0.85rem;
    }
    .group-picker-footer button {
      border-radius: 999px;
      padding: 10px 20px;
      border: 1px solid rgba(255,255,255,0.2);
      background: rgba(255,255,255,0.04);
      color: inherit;
      cursor: pointer;
      font-weight: 600;
    }
    .group-picker-footer button[data-role="primary"] {
      background: linear-gradient(135deg, #38bdf8, #2563eb);
      border: none;
    }
  `;
  document.head.appendChild(style);
  stylesInjected = true;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function draftId() {
  return `draft:${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeGroups(groups, palette) {
  const colors = palette.length ? palette : DEFAULT_COLORS;
  const seen = new Set();
  const normalized = [];
  groups.forEach((raw, index) => {
    if (!raw) return;
    const id = typeof raw.id === 'string' ? raw.id : raw.group_id || raw.slug || null;
    const nameSource = typeof raw.name === 'string' && raw.name.trim()
      ? raw.name.trim()
      : (typeof raw.title === 'string' ? raw.title.trim() : null);
    const resolvedId = id || (nameSource ? `group:${nameSource.toLowerCase().replace(/\s+/g, '-')}` : `group:${index}`);
    if (seen.has(resolvedId)) return;
    seen.add(resolvedId);
    normalized.push({
      id: resolvedId,
      name: nameSource || `Group ${index + 1}`,
      color: raw.color || colors[index % colors.length] || '#94a3b8',
      draft: Boolean(raw.draft)
    });
  });
  return normalized;
}

export class GroupPicker {
  constructor(options = {}) {
    this.baseMaxSelections = options.maxSelections || 12;
    this.palette = Array.isArray(options.colorPalette) && options.colorPalette.length ? options.colorPalette : DEFAULT_COLORS;
    injectPickerStyles();
    this.selection = new Set();
    this.groups = [];
    this.isOpen = false;
    this.selectedColor = this.palette[0];
    this.buildDom();
    this.bindEvents();
  }

  buildDom() {
    this.backdrop = document.createElement('div');
    this.backdrop.className = 'group-picker-backdrop';
    this.backdrop.dataset.open = 'false';
    this.backdrop.innerHTML = `
      <div class="group-picker-panel" role="dialog" aria-modal="true">
        <div class="group-picker-header">
          <div>
            <h3 data-picker-title>Assign groups</h3>
            <p data-picker-subtitle hidden></p>
          </div>
          <button type="button" class="group-picker-close" data-picker-close aria-label="Close">×</button>
        </div>
        <div class="group-picker-body">
          <div class="group-picker-empty" data-picker-empty hidden>No groups available yet. Use the form below to create one.</div>
          <div class="group-picker-list" data-picker-list></div>
          <div class="group-picker-create">
            <div>
              <label for="groupPickerName" style="display:block;font-size:0.85rem;margin-bottom:6px;opacity:0.7;">Create new group</label>
              <input id="groupPickerName" data-picker-name type="text" placeholder="Group name" />
            </div>
            <div>
              <span style="font-size:0.8rem;opacity:0.7;">Color</span>
              <div class="group-picker-palette" data-picker-colors></div>
            </div>
            <div>
              <button type="button" data-picker-add style="width:100%;border-radius:12px;padding:10px 12px;border:1px solid rgba(255,255,255,0.15);background:rgba(56,189,248,0.2);color:#f8fafc;cursor:pointer;">Add & select</button>
            </div>
          </div>
        </div>
        <div class="group-picker-footer">
          <div>
            <div class="group-picker-status" data-picker-status></div>
            <div class="group-picker-error" data-picker-error></div>
          </div>
          <div style="flex:1 0 auto;"></div>
          <button type="button" data-picker-cancel>Cancel</button>
          <button type="button" data-picker-save data-role="primary">Save</button>
        </div>
      </div>`;
    document.body.appendChild(this.backdrop);
    this.panel = this.backdrop.querySelector('.group-picker-panel');
    this.titleEl = this.backdrop.querySelector('[data-picker-title]');
    this.subtitleEl = this.backdrop.querySelector('[data-picker-subtitle]');
    this.listEl = this.backdrop.querySelector('[data-picker-list]');
    this.emptyState = this.backdrop.querySelector('[data-picker-empty]');
    this.nameInput = this.backdrop.querySelector('[data-picker-name]');
    this.paletteEl = this.backdrop.querySelector('[data-picker-colors]');
    this.addBtn = this.backdrop.querySelector('[data-picker-add]');
    this.saveBtn = this.backdrop.querySelector('[data-picker-save]');
    this.cancelBtn = this.backdrop.querySelector('[data-picker-cancel]');
    this.closeBtn = this.backdrop.querySelector('[data-picker-close]');
    this.statusEl = this.backdrop.querySelector('[data-picker-status]');
    this.errorEl = this.backdrop.querySelector('[data-picker-error]');
  }

  bindEvents() {
    this.listEl.addEventListener('change', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement) || target.type !== 'checkbox') return;
      const value = target.value;
      if (!value) return;
      if (target.checked) {
        if (this.selection.has(value)) return;
        if (this.selection.size >= this.maxSelections) {
          target.checked = false;
          this.setError(`You can assign up to ${this.maxSelections} groups.`);
          return;
        }
        this.selection.add(value);
      } else {
        this.selection.delete(value);
      }
      this.updateStatus();
    });
    this.addBtn.addEventListener('click', () => this.handleCreate());
    this.nameInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        this.handleCreate();
      }
    });
    this.paletteEl.addEventListener('click', (event) => {
      const swatch = event.target instanceof Element ? event.target.closest('[data-color]') : null;
      if (!swatch) return;
      this.selectedColor = swatch.getAttribute('data-color');
      this.renderPalette();
    });
    this.saveBtn.addEventListener('click', () => this.confirm());
    this.cancelBtn.addEventListener('click', () => this.cancel());
    this.closeBtn.addEventListener('click', () => this.cancel());
    this.backdrop.addEventListener('mousedown', (event) => {
      if (event.target === this.backdrop) {
        this.cancel();
      }
    });
    this.handleKeydown = (event) => {
      if (!this.isOpen) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        this.cancel();
      }
    };
  }

  async pick(options = {}) {
    if (this.isOpen) {
      this.finish({ status: 'cancelled' });
    }
    this.maxSelections = options.maxSelections || this.baseMaxSelections;
    this.groups = normalizeGroups(options.groups || [], this.palette);
    this.selection = new Set((options.selection || []).filter(Boolean));
    const selectionIds = Array.from(this.selection);
    selectionIds.forEach((id, index) => {
      if (!id) return;
      const exists = this.groups.some((group) => group.id === id);
      if (!exists) {
        this.groups.push({
          id,
          name: id,
          color: this.palette[(this.groups.length + index) % this.palette.length] || '#94a3b8',
          draft: false
        });
      }
    });
    this.selectedColor = this.palette[0];
    this.titleEl.textContent = options.title || 'Assign groups';
    if (options.subtitle) {
      this.subtitleEl.hidden = false;
      this.subtitleEl.textContent = options.subtitle;
    } else {
      this.subtitleEl.hidden = true;
      this.subtitleEl.textContent = '';
    }
    this.nameInput.value = options.prefillName || '';
    this.focusNew = Boolean(options.focusNew);
    this.clearError();
    this.renderPalette();
    this.renderList();
    this.updateStatus();
    this.backdrop.dataset.open = 'true';
    this.isOpen = true;
    document.addEventListener('keydown', this.handleKeydown);
    if (this.focusNew) {
      requestAnimationFrame(() => this.nameInput.focus());
    }
    return new Promise((resolve) => {
      this.pendingResolver = resolve;
    });
  }

  renderPalette() {
    this.paletteEl.innerHTML = this.palette.map((color) => (
      `<button type="button" class="group-picker-color" data-color="${color}" data-selected="${this.selectedColor === color}" style="--picker-color:${color};"></button>`
    )).join('');
  }

  renderList() {
    if (!this.groups.length) {
      this.emptyState.hidden = false;
      this.listEl.innerHTML = '';
    } else {
      this.emptyState.hidden = true;
      this.listEl.innerHTML = this.groups.map((group) => (
        `<label class="group-picker-option" data-group-option>
          <input type="checkbox" value="${escapeHtml(group.id)}" ${this.selection.has(group.id) ? 'checked' : ''} />
          <span class="group-picker-swatch" style="background:${group.color || '#475569'};"></span>
          <span class="group-picker-option-name">${escapeHtml(group.name)}</span>
          ${group.draft ? '<span class="group-picker-tag">new</span>' : ''}
        </label>`
      )).join('');
    }
  }

  handleCreate() {
    const name = this.nameInput.value.trim();
    if (!name) {
      this.setError('Enter a group name first.');
      this.nameInput.focus();
      return;
    }
    const exists = this.groups.find((group) => group.name.toLowerCase() === name.toLowerCase());
    if (exists) {
      this.setError('Group already exists. Select it from the list.');
      return;
    }
    if (this.selection.size >= this.maxSelections) {
      this.setError(`You can assign up to ${this.maxSelections} groups.`);
      return;
    }
    const entry = {
      id: draftId(),
      name,
      color: this.selectedColor,
      draft: true
    };
    this.groups = [entry, ...this.groups];
    this.selection.add(entry.id);
    this.nameInput.value = '';
    this.clearError();
    this.renderList();
    this.updateStatus();
  }

  updateStatus() {
    this.statusEl.textContent = `${this.selection.size}/${this.maxSelections} selected`;
  }

  setError(message) {
    this.errorEl.textContent = message || '';
  }

  clearError() {
    this.setError('');
  }

  getSelectionEntries() {
    const entries = [];
    const index = new Map(this.groups.map((group) => [group.id, group]));
    for (const id of this.selection) {
      if (index.has(id)) {
        entries.push(index.get(id));
      } else {
        entries.push({ id, name: id, color: null });
      }
    }
    return entries;
  }

  confirm() {
    this.finish({ status: 'confirmed', selection: this.getSelectionEntries() });
  }

  cancel() {
    this.finish({ status: 'cancelled' });
  }

  finish(result) {
    if (!this.isOpen) {
      if (this.pendingResolver) {
        this.pendingResolver(result);
        this.pendingResolver = null;
      }
      return;
    }
    this.isOpen = false;
    this.backdrop.dataset.open = 'false';
    document.removeEventListener('keydown', this.handleKeydown);
    if (this.pendingResolver) {
      this.pendingResolver(result);
      this.pendingResolver = null;
    }
  }
}
