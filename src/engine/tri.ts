import { Tri } from './types';

/**
 * Three-valued Kleene Logic
 *
 * AND:
 * - Any UNMET gives UNMET
 * - Else any UNKNOWN gives UNKNOWN
 * - Else MET
 *
 * OR:
 * - Any MET gives MET
 * - Else any UNKNOWN gives UNKNOWN
 * - Else UNMET
 *
 * NOT:
 * - MET -> UNMET
 * - UNMET -> MET
 * - UNKNOWN -> UNKNOWN
 */

export function triAnd(a: Tri, b: Tri): Tri {
  if (a === 'UNMET' || b === 'UNMET') return 'UNMET';
  if (a === 'UNKNOWN' || b === 'UNKNOWN') return 'UNKNOWN';
  return 'MET';
}

export function triAndAll(values: Tri[]): Tri {
  if (values.length === 0) return 'UNKNOWN';
  if (values.includes('UNMET')) return 'UNMET';
  if (values.includes('UNKNOWN')) return 'UNKNOWN';
  return 'MET';
}

export function triOr(a: Tri, b: Tri): Tri {
  if (a === 'MET' || b === 'MET') return 'MET';
  if (a === 'UNKNOWN' || b === 'UNKNOWN') return 'UNKNOWN';
  return 'UNMET';
}

export function triOrAll(values: Tri[]): Tri {
  if (values.length === 0) return 'UNKNOWN';
  if (values.includes('MET')) return 'MET';
  if (values.includes('UNKNOWN')) return 'UNKNOWN';
  return 'UNMET';
}

export function triNot(val: Tri): Tri {
  if (val === 'MET') return 'UNMET';
  if (val === 'UNMET') return 'MET';
  return 'UNKNOWN';
}
