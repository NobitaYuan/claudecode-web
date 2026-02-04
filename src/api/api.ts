export const CCServerBaseUrl = import.meta.env.VITE_APP_BASE_CCSERVER_API_URL

// API endpoints
export const api = {
  // Auth endpoints (no token required)
  auth: {
    status: () => fetch(CCServerBaseUrl + '/auth/status'),
    login: (username: any, password: any) =>
      fetch(CCServerBaseUrl + '/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      }),
    register: (username: any, password: any) =>
      fetch(CCServerBaseUrl + '/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      }),
    user: () => authenticatedFetch(CCServerBaseUrl + '/auth/user'),
    logout: () => authenticatedFetch(CCServerBaseUrl + '/auth/logout', { method: 'POST' }),
  },

  // Protected endpoints
  // config endpoint removed - no longer needed (frontend uses window.location)
  projects: () => authenticatedFetch(CCServerBaseUrl + '/projects'),
  sessions: (projectName: string, limit = 5, offset = 0) =>
    authenticatedFetch(`${CCServerBaseUrl}/projects/${projectName}/sessions?limit=${limit}&offset=${offset}`),
  sessionMessages: (projectName: string, sessionId: string, limit: number = null, offset = 0, provider = 'claude') => {
    const params = new URLSearchParams()
    if (limit !== null) {
      params.append('limit', limit as unknown as string)
      params.append('offset', offset as unknown as string)
    }
    const queryString = params.toString()

    // Route to the correct endpoint based on provider
    let url
    if (provider === 'codex') {
      url = `${CCServerBaseUrl}/codex/sessions/${sessionId}/messages${queryString ? `?${queryString}` : ''}`
    } else if (provider === 'cursor') {
      url = `${CCServerBaseUrl}/cursor/sessions/${sessionId}/messages${queryString ? `?${queryString}` : ''}`
    } else {
      url = `${CCServerBaseUrl}/projects/${projectName}/sessions/${sessionId}/messages${queryString ? `?${queryString}` : ''}`
    }
    return authenticatedFetch(url)
  },
  renameProject: (projectName: any, displayName: any) =>
    authenticatedFetch(`${CCServerBaseUrl}/projects/${projectName}/rename`, {
      method: 'PUT',
      body: JSON.stringify({ displayName }),
    }),
  deleteSession: (projectName: any, sessionId: any) =>
    authenticatedFetch(`${CCServerBaseUrl}/projects/${projectName}/sessions/${sessionId}`, {
      method: 'DELETE',
    }),
  deleteCodexSession: (sessionId: any) =>
    authenticatedFetch(`${CCServerBaseUrl}/codex/sessions/${sessionId}`, {
      method: 'DELETE',
    }),
  deleteProject: (projectName: any, force = false) =>
    authenticatedFetch(`${CCServerBaseUrl}/projects/${projectName}${force ? '?force=true' : ''}`, {
      method: 'DELETE',
    }),
  createProject: (path: any) =>
    authenticatedFetch(CCServerBaseUrl + '/projects/create', {
      method: 'POST',
      body: JSON.stringify({ path }),
    }),
  createFolder: (folderPath: string): Promise<Response> =>
    authenticatedFetch(CCServerBaseUrl + '/create-folder', {
      method: 'POST',
      body: JSON.stringify({ path: folderPath }),
    } as APIConfig),
  createWorkspace: (workspaceData: { workspaceType: string; path: string }): Promise<Response> =>
    authenticatedFetch(CCServerBaseUrl + '/projects/create-workspace', {
      method: 'POST',
      body: JSON.stringify(workspaceData),
    } as APIConfig),
  readFile: (projectName: any, filePath: string | number | boolean) =>
    authenticatedFetch(`${CCServerBaseUrl}/projects/${projectName}/file?filePath=${encodeURIComponent(filePath)}`),
  saveFile: (projectName: any, filePath: any, content: any) =>
    authenticatedFetch(`${CCServerBaseUrl}/projects/${projectName}/file`, {
      method: 'PUT',
      body: JSON.stringify({ filePath, content }),
    }),
  getFiles: (projectName: any) => authenticatedFetch(`${CCServerBaseUrl}/projects/${projectName}/files`),
  transcribe: (formData: any) =>
    authenticatedFetch(CCServerBaseUrl + '/transcribe', {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set Content-Type for FormData
    }),

  // TaskMaster endpoints
  taskmaster: {
    // Initialize TaskMaster in a project
    init: (projectName: any) =>
      authenticatedFetch(`${CCServerBaseUrl}/taskmaster/init/${projectName}`, {
        method: 'POST',
      }),

    // Add a new task
    addTask: (projectName: any, { prompt, title, description, priority, dependencies }: any) =>
      authenticatedFetch(`${CCServerBaseUrl}/taskmaster/add-task/${projectName}`, {
        method: 'POST',
        body: JSON.stringify({ prompt, title, description, priority, dependencies }),
      }),

    // Parse PRD to generate tasks
    parsePRD: (projectName: any, { fileName, numTasks, append }: any) =>
      authenticatedFetch(`${CCServerBaseUrl}/taskmaster/parse-prd/${projectName}`, {
        method: 'POST',
        body: JSON.stringify({ fileName, numTasks, append }),
      }),

    // Get available PRD templates
    getTemplates: () => authenticatedFetch(CCServerBaseUrl + '/taskmaster/prd-templates'),

    // Apply a PRD template
    applyTemplate: (projectName: any, { templateId, fileName, customizations }: any) =>
      authenticatedFetch(`${CCServerBaseUrl}/taskmaster/apply-template/${projectName}`, {
        method: 'POST',
        body: JSON.stringify({ templateId, fileName, customizations }),
      }),

    // Update a task
    updateTask: (projectName: any, taskId: any, updates: any) =>
      authenticatedFetch(`${CCServerBaseUrl}/taskmaster/update-task/${projectName}/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      }),
  },

  // Browse filesystem for project suggestions
  browseFilesystem: (dirPath: string = null) => {
    const params = new URLSearchParams()
    if (dirPath) params.append('path', dirPath)

    return authenticatedFetch(`${CCServerBaseUrl}/browse-filesystem?${params}`)
  },

  // User endpoints
  user: {
    gitConfig: () => authenticatedFetch(CCServerBaseUrl + '/user/git-config'),
    updateGitConfig: (gitName: any, gitEmail: any) =>
      authenticatedFetch(CCServerBaseUrl + '/user/git-config', {
        method: 'POST',
        body: JSON.stringify({ gitName, gitEmail }),
      }),
    onboardingStatus: () => authenticatedFetch(CCServerBaseUrl + '/user/onboarding-status'),
    completeOnboarding: () =>
      authenticatedFetch(CCServerBaseUrl + '/user/complete-onboarding', {
        method: 'POST',
      }),
  },

  // Generic GET method for any endpoint
  get: (endpoint: any) => authenticatedFetch(`${CCServerBaseUrl}${endpoint}`),
}

export interface APIConfig {
  headers?: Record<string, string>
  method?: string
  body?: string | FormData
}

// Utility function for authenticated API calls
export const authenticatedFetch = (url: RequestInfo | URL, options: Record<string, any> = {}) => {
  const isPlatform = import.meta.env.VITE_IS_PLATFORM === 'true'
  const token = localStorage.getItem('auth-token')

  const defaultHeaders: Record<string, any> = {}

  // Only set Content-Type for non-FormData requests
  if (!(options.body instanceof FormData)) {
    defaultHeaders['Content-Type'] = 'application/json'
  }

  if (!isPlatform && token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`
  }

  return fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  })
}
