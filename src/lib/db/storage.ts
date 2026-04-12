/**
 * Generic localStorage persistence helpers.
 *
 * All public functions accept a storage key and operate on typed arrays.
 * To swap in Supabase later: replace these implementations with async
 * Supabase client calls — the shape of each function stays the same.
 */

type WithId = { id: string }

export function readCollection<T extends WithId>(key: string): T[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T[]) : []
  } catch {
    return []
  }
}

export function writeCollection<T extends WithId>(key: string, items: T[]): void {
  localStorage.setItem(key, JSON.stringify(items))
}

export function upsertItem<T extends WithId>(key: string, item: T): T {
  const items = readCollection<T>(key)
  const idx = items.findIndex((i) => i.id === item.id)
  if (idx >= 0) {
    items[idx] = item
  } else {
    items.push(item)
  }
  writeCollection(key, items)
  return item
}

export function removeItem<T extends WithId>(key: string, id: string): void {
  writeCollection<T>(key, readCollection<T>(key).filter((i) => i.id !== id))
}

export function removeManyWhere<T extends WithId>(
  key: string,
  predicate: (item: T) => boolean
): void {
  writeCollection<T>(key, readCollection<T>(key).filter((i) => !predicate(i)))
}
