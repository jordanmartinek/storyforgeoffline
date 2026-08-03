/**
 * Utility to create page URLs for internal navigation.
 * @param {string} pageName - The page component name (e.g., 'Workspace')
 * @param {object} params - URL parameters (e.g., { id: '123' })
 * @returns {string} The constructed URL path
 */
export function createPageUrl(pageName, params = {}) {
  const routes = {
    Home: '/',
    Workspace: '/project/:id',
    StoryBible: '/project/:id/bible',
    StoryState: '/project/:id/state',
    StrategicBoard: '/project/:id/board',
    Analytics: '/project/:id/analytics',
    Login: '/login',
    Register: '/register',
    ForgotPassword: '/forgot-password',
    ResetPassword: '/reset-password',
  };

  let path = routes[pageName] || '/';
  if (params.id) {
    path = path.replace(':id', params.id);
  }
  return path;
}
