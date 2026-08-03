/**
 * Genre-based gradient cover fallbacks.
 */

export const GENRE_GRADIENTS = {
  fantasy: 'from-indigo-600 via-purple-600 to-pink-500',
  'sci-fi': 'from-cyan-600 via-blue-700 to-indigo-900',
  romance: 'from-rose-400 via-pink-500 to-red-500',
  thriller: 'from-gray-900 via-red-900 to-black',
  mystery: 'from-slate-700 via-indigo-900 to-black',
  horror: 'from-gray-900 via-red-950 to-black',
  literary: 'from-amber-100 via-orange-200 to-rose-200',
  historical: 'from-amber-700 via-yellow-800 to-stone-700',
  adventure: 'from-emerald-500 via-teal-600 to-cyan-700',
  dystopian: 'from-zinc-800 via-orange-900 to-red-950',
  comedy: 'from-yellow-300 via-amber-400 to-orange-400',
  drama: 'from-slate-600 via-blue-800 to-indigo-900',
  western: 'from-amber-600 via-orange-700 to-red-800',
  crime: 'from-zinc-800 via-slate-900 to-black',
  default: 'from-slate-500 via-slate-600 to-slate-700',
};

/**
 * Get gradient classes for a genre.
 * @param {string} genre
 * @returns {string} Tailwind gradient classes
 */
export function gradientFor(genre) {
  const key = (genre || '').toLowerCase().trim();
  return GENRE_GRADIENTS[key] || GENRE_GRADIENTS.default;
}
