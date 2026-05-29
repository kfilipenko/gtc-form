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

  function normalizeCountryName(value) {
    return String(value || '')
      .trim()
      .toUpperCase()
      .replace(/&/g, 'AND')
      .replace(/[^A-Z0-9]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  const countryIsoOverrides = new Map([
    ['BOLIVIA PLURINATIONAL STATE OF', 'BO'],
    ['BRUNEI DARUSSALAM', 'BN'],
    ['CAPE VERDE', 'CV'],
    ['CONGO DEMOCRATIC REPUBLIC OF THE', 'CD'],
    ['CONGO THE DEMOCRATIC REPUBLIC OF THE', 'CD'],
    ['CONGO REPUBLIC OF THE', 'CG'],
    ['COTE D IVOIRE', 'CI'],
    ['CZECH REPUBLIC', 'CZ'],
    ['IRAN ISLAMIC REPUBLIC OF', 'IR'],
    ['KOREA DEMOCRATIC PEOPLE S REPUBLIC OF', 'KP'],
    ['KOREA REPUBLIC OF', 'KR'],
    ['LAO PEOPLE S DEMOCRATIC REPUBLIC', 'LA'],
    ['MACEDONIA THE FORMER YUGOSLAV REPUBLIC OF', 'MK'],
    ['MICRONESIA FEDERATED STATES OF', 'FM'],
    ['MOLDOVA REPUBLIC OF', 'MD'],
    ['RUSSIAN FEDERATION', 'RU'],
    ['SYRIAN ARAB REPUBLIC', 'SY'],
    ['TAIWAN PROVINCE OF CHINA', 'TW'],
    ['TANZANIA UNITED REPUBLIC OF', 'TZ'],
    ['VENEZUELA BOLIVARIAN REPUBLIC OF', 'VE'],
    ['VIET NAM', 'VN']
  ]);

  let countryIsoByDisplayName = null;

  const isoRegionCodes = 'AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS XK YE YT ZA ZM ZW'
    .split(' ');

  function resolveCountryIsoCode(displayName) {
    const normalized = normalizeCountryName(displayName);
    if (!normalized) {
      return '';
    }
    if (/^[A-Z]{2}$/.test(normalized)) {
      return normalized;
    }
    if (countryIsoOverrides.has(normalized)) {
      return countryIsoOverrides.get(normalized);
    }
    if (countryIsoByDisplayName === null) {
      countryIsoByDisplayName = new Map();
      try {
        if (typeof Intl !== 'undefined' && typeof Intl.DisplayNames === 'function') {
          const displayNames = new Intl.DisplayNames(['en'], { type: 'region' });
          isoRegionCodes.forEach((code) => {
            const name = displayNames.of(code);
            countryIsoByDisplayName.set(normalizeCountryName(name), code);
          });
        }
      } catch (error) {
        countryIsoByDisplayName = new Map();
      }
    }
    return countryIsoByDisplayName.get(normalized) || '';
  }

  function optionValue(record, options) {
    const opts = options || {};
    if (opts.countryIsoValue) {
      const countryCode = resolveCountryIsoCode(valueText(record));
      if (countryCode) {
        return countryCode;
      }
    }
    if (opts.preferValueCode && record && typeof record.value_code === 'string' && record.value_code.trim()) {
      return record.value_code.trim();
    }
    const displayName = valueText(record);
    if (displayName) {
      return displayName;
    }
    return record && typeof record.value_code === 'string' ? record.value_code.trim() : '';
  }

  function optionLabel(record, value, options) {
    const displayName = valueText(record);
    const code = options && options.countryIsoValue
      ? value
      : (record && typeof record.value_code === 'string' ? record.value_code.trim() : '');
    if (options && options.showCodeInLabel && displayName && code && normalizeKey(displayName) !== normalizeKey(code)) {
      return `${displayName} (${code})`;
    }
    return displayName || value;
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
      const value = optionValue(record, opts);
      const key = normalizeKey(value);
      if (!value || used.has(key)) {
        return;
      }
      used.add(key);
      const option = document.createElement('option');
      option.value = value;
      option.textContent = optionLabel(record, value, opts);
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
