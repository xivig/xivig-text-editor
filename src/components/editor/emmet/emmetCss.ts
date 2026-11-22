const cssExactMap: Record<string, string> = {
  // Display
  df: 'display: flex;',
  'd:f': 'display: flex;',
  db: 'display: block;',
  'd:b': 'display: block;',
  dib: 'display: inline-block;',
  'd:ib': 'display: inline-block;',
  di: 'display: inline;',
  'd:i': 'display: inline;',
  dn: 'display: none;',
  'd:n': 'display: none;',
  dg: 'display: grid;',
  'd:g': 'display: grid;',

  // Position
  poa: 'position: absolute;',
  'pos:a': 'position: absolute;',
  por: 'position: relative;',
  'pos:r': 'position: relative;',
  pof: 'position: fixed;',
  'pos:f': 'position: fixed;',
  pos: 'position: static;',
  'pos:s': 'position: static;',

  // Text align
  tac: 'text-align: center;',
  tal: 'text-align: left;',
  tar: 'text-align: right;',
  taj: 'text-align: justify;',

  // Flexbox / Grid alignment
  jcc: 'justify-content: center;',
  jcsb: 'justify-content: space-between;',
  jcsa: 'justify-content: space-around;',
  jcfs: 'justify-content: flex-start;',
  jcfe: 'justify-content: flex-end;',
  aic: 'align-items: center;',
  aifs: 'align-items: flex-start;',
  aife: 'align-items: flex-end;',
  ais: 'align-items: stretch;',
  fdc: 'flex-direction: column;',
  fdr: 'flex-direction: row;',
  fww: 'flex-wrap: wrap;',
  fwnw: 'flex-wrap: nowrap;',

  // Box Model / Sizing
  bxz: 'box-sizing: border-box;',
  'bxz:bb': 'box-sizing: border-box;',
  'bxz:cb': 'box-sizing: content-box;',
  ovh: 'overflow: hidden;',
  'ov:h': 'overflow: hidden;',
  ova: 'overflow: auto;',
  'ov:a': 'overflow: auto;',
  ovs: 'overflow: scroll;',
  'ov:s': 'overflow: scroll;',

  // Colors & Backgrounds
  bgc: 'background-color: #${1:fff};',
  'bgc:t': 'background-color: transparent;',
  b: 'border: 1px solid #${1:000};',
  bn: 'border: none;',
  bd: 'border: 1px dashed #${1:000};',
  c: 'color: #${1:000};',
  'c:w': 'color: #fff;',
  'c:b': 'color: #000;',
  'c:t': 'color: transparent;',

  // Typography
  fwb: 'font-weight: bold;',
  fwn: 'font-weight: normal;',
  fsi: 'font-style: italic;',
  tdn: 'text-decoration: none;',
  tdu: 'text-decoration: underline;',
  ttu: 'text-transform: uppercase;',
  ttl: 'text-transform: lowercase;',
  ttc: 'text-transform: capitalize;',
  wsnw: 'white-space: nowrap;',
  toe: 'text-overflow: ellipsis;',

  // Cursor & Pointer
  cup: 'cursor: pointer;',
  'cur:p': 'cursor: pointer;',
  cud: 'cursor: default;',
  'cur:d': 'cursor: default;',
  usn: 'user-select: none;',
  pen: 'pointer-events: none;',
  pea: 'pointer-events: auto;',

  // Extras
  bsh: 'box-shadow: ${1:0 2px 8px rgba(0, 0, 0, 0.15)};',
  bdrs: 'border-radius: ${1:4px};',
  bdrs50p: 'border-radius: 50%;',
  ts: 'transition: ${1:all 0.2s ease};',
  fl: 'float: left;',
  fr: 'float: right;',
  fn: 'float: none;',
  cl: 'clear: both;',
};

const cssPrefixMap: Record<string, string> = {
  m: 'margin',
  mt: 'margin-top',
  mb: 'margin-bottom',
  ml: 'margin-left',
  mr: 'margin-right',
  p: 'padding',
  pt: 'padding-top',
  pb: 'padding-bottom',
  pl: 'padding-left',
  pr: 'padding-right',
  w: 'width',
  h: 'height',
  mw: 'max-width',
  mh: 'max-height',
  miw: 'min-width',
  mih: 'min-height',
  fz: 'font-size',
  lh: 'line-height',
  t: 'top',
  b: 'bottom',
  l: 'left',
  r: 'right',
  z: 'z-index',
  op: 'opacity',
  bdrs: 'border-radius',
  gap: 'gap',
};

/**
 * Parses numerical value string into CSS unit.
 * E.g.: "10" -> "10px", "10p" -> "10%", "1.5rem" -> "1.5rem", "0" -> "0"
 */
function parseUnit(val: string): string {
  if (val === '0') return '0';
  if (val.endsWith('p')) {
    return val.slice(0, -1) + '%';
  }
  if (/^[0-9]+vh$/.test(val)) return val;
  if (/^[0-9]+vw$/.test(val)) return val;
  if (/^[0-9.]+rem$/.test(val)) return val;
  if (/^[0-9.]+em$/.test(val)) return val;
  if (/^[0-9]+px$/.test(val)) return val;
  if (/^[0-9.]+$/.test(val)) {
    // If integer, default to px, unless float which might be unitless (like line-height or opacity)
    return `${val}px`;
  }
  return val;
}

export function expandCssAbbreviation(abbr: string): string | null {
  const trimmed = abbr.trim();
  if (!trimmed) return null;

  // 1. Direct exact lookup
  if (cssExactMap[trimmed]) {
    return cssExactMap[trimmed];
  }

  // 2. Numerical / Unit based expansion
  // e.g. m10 -> margin: 10px;
  // e.g. m10-20 -> margin: 10px 20px;
  // e.g. w100p -> width: 100%;
  // e.g. z-1 -> z-index: -1;
  // e.g. op0.5 -> opacity: 0.5;
  for (const [prefix, property] of Object.entries(cssPrefixMap)) {
    if (trimmed.startsWith(prefix)) {
      const rest = trimmed.slice(prefix.length);

      if (!rest) continue;

      if (rest === 'auto') {
        return `${property}: auto;`;
      }

      // Check multi-value (e.g. 10-20-30-40)
      if (rest.includes('-') && !rest.startsWith('-')) {
        const parts = rest.split('-');
        const parsed = parts.map(parseUnit).join(' ');
        return `${property}: ${parsed};`;
      }

      // Check single value (including negative numbers like z-1)
      if (/^-?[0-9.]+([a-z%]+)?$/.test(rest)) {
        if (property === 'opacity' || (property === 'line-height' && rest.includes('.'))) {
          return `${property}: ${rest};`;
        }
        if (property === 'z-index') {
          return `${property}: ${rest};`;
        }
        return `${property}: ${parseUnit(rest)};`;
      }
    }
  }

  return null;
}
