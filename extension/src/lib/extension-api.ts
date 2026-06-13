import type { StarsApi } from '@app/api';
import { apiRequest } from './api';

export function createExtensionApi(): StarsApi {
  return {
    saveToken: token => apiRequest({ type: 'saveToken', token }),
    clearToken: () => apiRequest({ type: 'clearToken' }),
    getUser: () => apiRequest({ type: 'getUser' }),
    sync: () => apiRequest({ type: 'sync' }),
    getSyncStatus: () => apiRequest({ type: 'getSyncStatus' }),
    getStars: q => apiRequest({ type: 'getStars', q }),
    getStarLists: () => apiRequest({ type: 'getStarLists' }),
    getCategories: () => apiRequest({ type: 'getCategories' }),
    createCategory: (name, color) => apiRequest({ type: 'createCategory', name, color }),
    updateCategory: (id, data) => apiRequest({ type: 'updateCategory', id, ...data }),
    deleteCategory: id => apiRequest({ type: 'deleteCategory', id }),
    addRepoToCategory: (categoryId, repoNodeId) =>
      apiRequest({ type: 'addRepoToCategory', categoryId, repoNodeId }),
    removeRepoFromCategory: (categoryId, repoNodeId) =>
      apiRequest({ type: 'removeRepoFromCategory', categoryId, repoNodeId }),
    getReposWithMeta: (q, categoryId, uncategorized) =>
      apiRequest({ type: 'getReposWithMeta', q, categoryId, uncategorized }),
    updateRepoMeta: (repoNodeId, data) => apiRequest({ type: 'updateRepoMeta', repoNodeId, ...data }),
    getTags: () => apiRequest({ type: 'getTags' }),
    getDataInfo: () => apiRequest({ type: 'getDataInfo' }),
    exportStarsData: () => apiRequest({ type: 'exportStarsData' }),
    importStarsData: content => apiRequest({ type: 'importStarsData', content }),
  };
}
