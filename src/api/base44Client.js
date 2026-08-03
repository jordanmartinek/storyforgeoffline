/**
 * Local Storage adapter.
 * Drop-in replacement for Base44 SDK — same API surface,
 * all data persisted in browser localStorage.
 */

function generateId() {
  return crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function now() {
  return new Date().toISOString();
}

class LocalEntity {
  constructor(name) {
    this.name = name;
    this.storageKey = `storyforge_${name}`;
  }

  _getAll() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  _saveAll(items) {
    localStorage.setItem(this.storageKey, JSON.stringify(items));
  }

  async list(sort = '-created_date', limit = 100) {
    let items = this._getAll();

    // Sort
    if (sort) {
      const desc = sort.startsWith('-');
      const field = desc ? sort.slice(1) : sort;
      items.sort((a, b) => {
        const av = a[field] || '';
        const bv = b[field] || '';
        if (av < bv) return desc ? 1 : -1;
        if (av > bv) return desc ? -1 : 1;
        return 0;
      });
    }

    return items.slice(0, limit);
  }

  async get(id) {
    const items = this._getAll();
    const item = items.find(i => i.id === id);
    if (!item) throw new Error(`${this.name}/${id} not found`);
    return item;
  }

  async create(data) {
    const items = this._getAll();
    const item = {
      ...data,
      id: generateId(),
      created_date: now(),
      updated_date: now(),
      created_by_id: 'local-user',
    };
    items.push(item);
    this._saveAll(items);
    return item;
  }

  async update(id, data) {
    const items = this._getAll();
    const idx = items.findIndex(i => i.id === id);
    if (idx === -1) throw new Error(`${this.name}/${id} not found`);
    items[idx] = { ...items[idx], ...data, updated_date: now() };
    this._saveAll(items);
    return items[idx];
  }

  async delete(id) {
    let items = this._getAll();
    items = items.filter(i => i.id !== id);
    this._saveAll(items);
    return { success: true };
  }

  async filter(query) {
    const items = this._getAll();
    return items.filter(item => {
      return Object.entries(query).every(([key, value]) => item[key] === value);
    });
  }
}

class LocalIntegrations {
  get Core() {
    return {
      /**
       * InvokeLLM — stub that returns a placeholder response.
       * To connect a real LLM, replace this with a fetch to your own
       * endpoint (e.g., OpenAI API via a proxy, or Ollama locally).
       */
      async InvokeLLM(params) {
        console.log('[StoryForge] LLM invocation (no backend configured):', params.prompt?.slice(0, 100));
        // Return a mock response that matches expected schemas
        if (params.prompt?.includes('proofread') || params.prompt?.includes('editor')) {
          return { corrections: [] };
        }
        if (params.prompt?.includes('imagery') || params.prompt?.includes('metaphor')) {
          return {
            suggestions: [
              { type: 'metaphor', suggestion: 'Connect an LLM API to get real suggestions.', effect: 'See src/api/base44Client.js InvokeLLM()' },
            ],
          };
        }
        if (params.prompt?.includes('referee') || params.prompt?.includes('strategic')) {
          return {
            observations: [
              { category: 'information', severity: 'low', title: 'LLM Not Connected', detail: 'Connect an OpenAI-compatible API in src/api/base44Client.js to enable AI referee analysis.' },
            ],
          };
        }
        return {};
      },

      async UploadFile(file) {
        // Convert to data URL for local storage
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve({ url: reader.result });
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      },
    };
  }
}

class LocalAuth {
  async currentUser() {
    const stored = localStorage.getItem('storyforge_user');
    if (stored) return JSON.parse(stored);
    // Auto-create a local user on first visit
    const user = { id: 'local-user', email: 'writer@storyforge.local', name: 'Writer' };
    localStorage.setItem('storyforge_user', JSON.stringify(user));
    return user;
  }

  async login({ email }) {
    const user = { id: 'local-user', email, name: email.split('@')[0] };
    localStorage.setItem('storyforge_user', JSON.stringify(user));
    return user;
  }

  async register({ email }) {
    return this.login({ email });
  }

  async logout() {
    localStorage.removeItem('storyforge_user');
  }
}

class LocalClient {
  constructor() {
    const entityNames = [
      'Project', 'Chapter', 'Scene', 'Character', 'Location',
      'LoreEntry', 'Connection', 'Player', 'Objective', 'Move',
      'Resource', 'WritingSession',
    ];

    this.entities = {};
    entityNames.forEach(name => {
      this.entities[name] = new LocalEntity(name);
    });

    this.integrations = new LocalIntegrations();
    this.auth = new LocalAuth();
  }
}

export const base44 = new LocalClient();
