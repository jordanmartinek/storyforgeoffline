// Story Bible label/color maps

export const ROLE_META = {
  protagonist: { label: 'Protagonist', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  antagonist: { label: 'Antagonist', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
  ally: { label: 'Ally', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  mentor: { label: 'Mentor', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
  foil: { label: 'Foil', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' },
  supporting: { label: 'Supporting', color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200' },
  minor: { label: 'Minor', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200' },
};

export const CHARACTER_STATUS = {
  active: { label: 'Active', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  dormant: { label: 'Dormant', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
  deceased: { label: 'Deceased', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
  absent: { label: 'Absent', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200' },
};

export const LOCATION_TYPES = {
  city: { label: 'City', icon: 'Building2' },
  region: { label: 'Region', icon: 'Map' },
  structure: { label: 'Structure', icon: 'Castle' },
  wilderness: { label: 'Wilderness', icon: 'Trees' },
  landmark: { label: 'Landmark', icon: 'Landmark' },
  other: { label: 'Other', icon: 'MapPin' },
};

export const LORE_CATEGORIES = {
  magic_system: { label: 'Magic System', icon: 'Wand2' },
  faction: { label: 'Faction', icon: 'Users' },
  history: { label: 'History', icon: 'Clock' },
  item: { label: 'Item', icon: 'Gem' },
  religion: { label: 'Religion', icon: 'Sun' },
  culture: { label: 'Culture', icon: 'Globe' },
  creature: { label: 'Creature', icon: 'Bug' },
  language: { label: 'Language', icon: 'Languages' },
  other: { label: 'Other', icon: 'FileText' },
};

export const ENTITY_TYPES = {
  character: { label: 'Character', plural: 'Characters' },
  location: { label: 'Location', plural: 'Locations' },
  lore: { label: 'Lore', plural: 'Lore Entries' },
};
