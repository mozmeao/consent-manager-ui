import { h, JSX } from 'preact';
import { useState } from 'preact/hooks';
import { BUNDLE_ID } from '../constants';

const CSS_SOURCES: Record<string, string> = {
  local: '../../dist/cm.css',
  'cm-test': `https://cdn.transcend.io/cm-test/${BUNDLE_ID}/cm.css`,
  prod: `https://cdn.transcend.io/cm/${BUNDLE_ID}/cm.css`,
};

/**
 * Get the current CSS source key from loadOptions in localStorage
 */
function getCurrentSource(): string {
  try {
    const loadOptions = JSON.parse(
      localStorage.getItem('loadOptions') || '{}',
    );
    const css = loadOptions.css || '';
    for (const [key, url] of Object.entries(CSS_SOURCES)) {
      if (css === url) return key;
    }
  } catch {
    // ignore
  }
  return 'local';
}

/**
 * Dropdown to switch the CSS source between local, cm-test, and prod
 */
export function CssSourceSelector(): JSX.Element {
  const [source, setSource] = useState<string>(getCurrentSource);

  const handleChange = (e: JSX.TargetedEvent<HTMLSelectElement>): void => {
    const value = (e.target as HTMLSelectElement).value;
    setSource(value);

    // Update css in loadOptions
    let loadOptions: Record<string, unknown> = {};
    try {
      loadOptions = JSON.parse(
        localStorage.getItem('loadOptions') || '{}',
      );
    } catch {
      // ignore
    }
    loadOptions.css = CSS_SOURCES[value];
    localStorage.setItem('loadOptions', JSON.stringify(loadOptions));

    // Reload to apply
    window.location.reload();
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <label
        for="css-source"
        style={{ fontWeight: '600', fontSize: '12px', whiteSpace: 'nowrap' }}
      >
        CSS source
      </label>
      <select
        id="css-source"
        value={source}
        onChange={handleChange}
        style={{ fontSize: '12px', padding: '2px 4px' }}
      >
        <option value="local">Local (dist/cm.css)</option>
        <option value="cm-test">CDN cm-test</option>
        <option value="prod">CDN prod</option>
      </select>
    </div>
  );
}
