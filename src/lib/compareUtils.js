/**
 * Compare list utilities using localStorage.
 * Stores an array of product IDs under the key 'compareList'.
 * Maximum of 5 items allowed.
 */

const STORAGE_KEY = 'compareList';
const MAX_ITEMS = 5;

/** Get the current compare list as an array of strings */
export function getCompareList() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to parse compare list', e);
    return [];
  }
}

/** Add a product ID to the compare list. Returns true if added, false if limit reached */
export function addToCompare(productId) {
  if (!productId) return false;
  const list = getCompareList();
  if (list.includes(productId)) return true; // already present
  if (list.length >= MAX_ITEMS) return false;
  list.push(productId);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    return true;
  } catch (e) {
    console.error('Failed to save compare list', e);
    return false;
  }
}

/** Remove a product ID from the compare list */
export function removeFromCompare(productId) {
  if (!productId) return;
  const list = getCompareList();
  const newList = list.filter((id) => id !== productId);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
  } catch (e) {
    console.error('Failed to update compare list', e);
  }
}
