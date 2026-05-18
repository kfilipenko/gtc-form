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
    bindCatalogs
  };
})();
