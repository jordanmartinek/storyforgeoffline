// Strategic engine label/color maps
// Badge classes are literal strings so Tailwind keeps them

export const SIDE_META = {
  protagonist: { label: 'Protagonist', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  antagonist: { label: 'Antagonist', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
  neutral: { label: 'Neutral', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200' },
};

export const PLAYER_STATUS = {
  active: { label: 'Active', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  dormant: { label: 'Dormant', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
  defeated: { label: 'Defeated', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
  victorious: { label: 'Victorious', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
};

export const OBJECTIVE_TYPES = {
  primary: { label: 'Primary', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  secondary: { label: 'Secondary', color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200' },
  secret: { label: 'Secret', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
  victory: { label: 'Victory', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' },
};

export const OBJECTIVE_STATUS = {
  active: { label: 'Active', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  achieved: { label: 'Achieved', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' },
  abandoned: { label: 'Abandoned', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200' },
  failed: { label: 'Failed', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
};

export const MOVE_OUTCOMES = {
  pending: { label: 'Pending', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200' },
  success: { label: 'Success', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  partial: { label: 'Partial', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
  failure: { label: 'Failure', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
  catastrophic: { label: 'Catastrophic', color: 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200' },
};

export const MOVE_RISK = {
  low: { label: 'Low', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  medium: { label: 'Medium', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
  high: { label: 'High', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' },
  extreme: { label: 'Extreme', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
};

export const RESOURCE_CATEGORIES = {
  military: { label: 'Military', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
  political: { label: 'Political', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200' },
  economic: { label: 'Economic', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' },
  magical: { label: 'Magical', color: 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200' },
  informational: { label: 'Informational', color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200' },
  material: { label: 'Material', color: 'bg-stone-100 text-stone-800 dark:bg-stone-800 dark:text-stone-200' },
  personnel: { label: 'Personnel', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  territory: { label: 'Territory', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  other: { label: 'Other', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200' },
};

export const RESOURCE_STATUS = {
  active: { label: 'Active', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  depleted: { label: 'Depleted', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' },
  lost: { label: 'Lost', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
  transferred: { label: 'Transferred', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
};
