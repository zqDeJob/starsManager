import {
  createStarsDataService,
  createGitHubCacheService,
  createLocalSettingsService,
} from '@github-stars-manager/core';
import { createChromeYamlStore } from '../storage/chrome-yaml-store.js';

const store = createChromeYamlStore();

export const starsData = createStarsDataService(store);
export const githubCache = createGitHubCacheService(store);
export const localSettings = createLocalSettingsService(store);
