/**
 * utils/imageUrl.ts — Utilitaire pour gérer les URLs d'images
 */

// Récupérer l'URL de base de l'API depuis les variables d'environnement
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1';
const BASE_URL = API_URL.replace('/api/v1', '');

/**
 * Convertit un chemin d'image relatif en URL complète
 * @param path - Chemin de l'image (peut être null, undefined, relatif ou absolu)
 * @param bustCache - Si true, ajoute un timestamp pour forcer le rechargement (défaut: false)
 * @returns URL complète de l'image ou null si pas d'image
 * 
 * @example
 * getImageUrl('/uploads/avatars/123.webp') // => 'http://localhost:5001/uploads/avatars/123.webp'
 * getImageUrl('http://example.com/image.jpg') // => 'http://example.com/image.jpg'
 * getImageUrl(null) // => null
 * getImageUrl('/uploads/avatars/123.webp', true) // => 'http://localhost:5001/uploads/avatars/123.webp?t=1234567890'
 */
export function getImageUrl(path: string | null | undefined, bustCache: boolean = false): string | null {
  if (!path) return null;
  
  // Si l'URL est déjà complète (commence par http), la retourner telle quelle
  let url = path.startsWith('http') ? path : `${BASE_URL}${path}`;
  
  // Ajouter un timestamp si demandé pour éviter le cache
  if (bustCache) {
    url = addTimestamp(url) || url;
  }
  
  return url;
}

/**
 * Ajoute un timestamp à une URL d'image pour forcer le rechargement
 * Utile après un upload pour éviter le cache du navigateur
 * @param url - URL de l'image
 * @returns URL avec timestamp
 * 
 * @example
 * addTimestamp('http://localhost:5001/uploads/avatars/123.webp')
 * // => 'http://localhost:5001/uploads/avatars/123.webp?t=1234567890'
 */
export function addTimestamp(url: string | null): string | null {
  if (!url) return null;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}t=${Date.now()}`;
}
