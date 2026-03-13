export const MAX_MEDIA_PER_PRODUCT = 5

const MEDIA_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.svg']

function normalizePath(value: string | null | undefined) {
  return String(value ?? '').split('?')[0].toLowerCase()
}

export function isMediaPath(value: string | null | undefined) {
  const path = normalizePath(value)
  return MEDIA_EXTENSIONS.some((ext) => path.endsWith(ext))
}

export function isMediaVideoRecord(record: { video_url?: string | null; storage_path?: string | null }) {
  return isMediaPath(record.storage_path) || isMediaPath(record.video_url)
}

export function isMediaFile(file: File | null | undefined) {
  if (!file) return false
  if (file.type && file.type.startsWith('image/')) return true
  return isMediaPath(file.name)
}