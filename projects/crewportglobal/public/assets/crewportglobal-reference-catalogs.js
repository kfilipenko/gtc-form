(function () {
  const catalogCache = new Map();

  function safeCatalogCode(value) {
    return typeof value === 'string' && /^[a-z][a-z0-9_]*$/.test(value) ? value : '';
  }

  function valuesFromResponse(body) {
    if (!body || body.ok !== true || !Array.isArray(body.catalogs) || body.catalogs.length === 0) {
      return [];
    }

    const firstCatalog = body.catalogs[0];
    return Array.isArray(firstCatalog.values) ? firstCatalog.values : [];
  }

  async function fetchCatalog(catalogCode) {
    const safeCode = safeCatalogCode(catalogCode);
    if (!safeCode) {
      return [];
    }

    if (catalogCache.has(safeCode)) {
      return catalogCache.get(safeCode);
    }

    try {
      const response = await fetch(`/api/v1/reference-catalogs?catalog_code=${encodeURIComponent(safeCode)}`, {
        headers: {
          Accept: 'application/json'
        }
      });
      if (!response.ok) {
        catalogCache.set(safeCode, []);
        return [];
      }
      const body = await response.json();
      const values = valuesFromResponse(body);
      catalogCache.set(safeCode, values);
      return values;
    } catch (error) {
      catalogCache.set(safeCode, []);
      return [];
    }
  }

  function resolveElement(target) {
    if (target instanceof HTMLElement) {
      return target;
    }
    return typeof target === 'string' ? document.getElementById(target) : null;
  }

  function valueText(record) {
    return record && typeof record.display_name === 'string' ? record.display_name.trim() : '';
  }

  function optionValue(record) {
    const displayName = valueText(record);
    if (displayName) {
      return displayName;
    }
    return record && typeof record.value_code === 'string' ? record.value_code.trim() : '';
  }

  function normalizeKey(value) {
    return String(value || '').trim().toLowerCase();
  }

  function recordsFromFallback(values) {
    return Array.isArray(values)
      ? values.map((value) => ({ display_name: String(value || '').trim(), value_code: String(value || '').trim() }))
      : [];
  }

  function populateDatalist(datalistTarget, values) {
    const datalist = resolveElement(datalistTarget);
    if (!(datalist instanceof HTMLDataListElement)) {
      return 0;
    }

    datalist.innerHTML = '';
    const fragment = document.createDocumentFragment();
    const used = new Set();
    values.forEach((record) => {
      const displayName = valueText(record);
      if (!displayName || used.has(displayName)) {
        return;
      }
      used.add(displayName);
      const option = document.createElement('option');
      option.value = displayName;
      if (record && typeof record.value_code === 'string') {
        option.dataset.valueCode = record.value_code;
      }
      fragment.appendChild(option);
    });
    datalist.appendChild(fragment);
    return used.size;
  }

  async function bindDatalist(binding) {
    const values = await fetchCatalog(binding.catalogCode);
    return populateDatalist(binding.datalist, values);
  }

  function populateSelect(selectTarget, values, options) {
    const select = resolveElement(selectTarget);
    if (!(select instanceof HTMLSelectElement)) {
      return 0;
    }

    const opts = options || {};
    const sourceValues = Array.isArray(values) && values.length > 0
      ? values
      : recordsFromFallback(opts.fallbackValues);
    const selectedValues = select.multiple
      ? Array.from(select.selectedOptions).map((option) => option.value)
      : [select.value].filter(Boolean);

    select.innerHTML = '';
    const fragment = document.createDocumentFragment();
    const used = new Set();

    if (!select.multiple && opts.includeEmpty !== false) {
      const option = document.createElement('option');
      option.value = '';
      option.textContent = typeof opts.placeholderText === 'string' ? opts.placeholderText : '';
      fragment.appendChild(option);
    }

    sourceValues.forEach((record) => {
      const value = optionValue(record);
      const key = normalizeKey(value);
      if (!value || used.has(key)) {
        return;
      }
      used.add(key);
      const option = document.createElement('option');
      option.value = value;
      option.textContent = valueText(record) || value;
      if (record && typeof record.value_code === 'string') {
        option.dataset.valueCode = record.value_code;
      }
      fragment.appendChild(option);
    });

    selectedValues.forEach((value) => {
      const normalized = normalizeKey(value);
      if (!normalized || used.has(normalized)) {
        return;
      }
      used.add(normalized);
      const option = document.createElement('option');
      option.value = value;
      option.textContent = value;
      option.dataset.legacyValue = 'true';
      fragment.appendChild(option);
    });

    select.appendChild(fragment);

    if (select.multiple) {
      Array.from(select.options).forEach((option) => {
        option.selected = selectedValues.some((value) => normalizeKey(value) === normalizeKey(option.value));
      });
    } else {
      const selectedValue = selectedValues[0] || '';
      const hasSelectedValue = Array.from(select.options).some((option) => normalizeKey(option.value) === normalizeKey(selectedValue));
      select.value = hasSelectedValue ? selectedValue : '';
    }

    return used.size;
  }

  async function bindSelect(binding) {
    const values = await fetchCatalog(binding.catalogCode);
    return populateSelect(binding.select, values, binding.options || {});
  }

  async function bindCatalogs(bindings) {
    if (!Array.isArray(bindings)) {
      return [];
    }
    return Promise.all(bindings.map((binding) => bindDatalist(binding)));
  }

  window.CPGReferenceCatalogs = {
    fetchCatalog,
    populateDatalist,
    bindDatalist,
    populateSelect,
    bindSelect,
    bindCatalogs
  };
})();
