import * as vscode from 'vscode';
import { ApiConfiguration } from '../shared/api';

/**
 * Global extension state that can be accessed and updated
 */
let globalState: Record<string, any> = {};

/**
 * Gets a configuration value from the extension's global state
 * 
 * @param key The configuration key to retrieve
 * @returns The configuration value, or undefined if not found
 */
export async function getConfiguration<T>(key: string): Promise<T | undefined> {
  return globalState[key] as T | undefined;
}

/**
 * Sets a configuration value in the extension's global state
 * 
 * @param key The configuration key to set
 * @param value The value to set
 */
export async function setConfiguration<T>(key: string, value: T): Promise<void> {
  globalState[key] = value;
}

/**
 * Updates the API configuration in the extension's global state
 * 
 * @param config The API configuration to update
 * @param isCommitConfig Whether this is the commit-specific configuration
 */
export async function updateApiConfiguration(
  config: ApiConfiguration, 
  isCommitConfig: boolean = false
): Promise<void> {
  const key = isCommitConfig ? 'commitModelConfiguration' : 'apiConfiguration';
  await setConfiguration(key, config);
}

/**
 * Loads the API configuration from the extension's global state
 * 
 * @param isCommitConfig Whether to load the commit-specific configuration
 * @returns The API configuration
 */
export async function loadApiConfiguration(
  isCommitConfig: boolean = false
): Promise<ApiConfiguration | undefined> {
  const key = isCommitConfig ? 'commitModelConfiguration' : 'apiConfiguration';
  return await getConfiguration<ApiConfiguration>(key);
}

/**
 * Toggles the use of a secondary model for commit messages
 * 
 * @param value Whether to use a secondary model for commit messages
 */
export async function toggleSecondaryModelForCommit(value: boolean): Promise<void> {
  await setConfiguration('useSecondaryModelForCommit', value);
}

/**
 * Initializes the configuration service with the extension context
 * 
 * @param context The extension context
 */
export function initializeConfiguration(context: vscode.ExtensionContext): void {
  // Initialize with values from context.globalState if needed
  globalState = {
    apiConfiguration: context.globalState.get('apiConfiguration'),
    commitModelConfiguration: context.globalState.get('commitModelConfiguration'),
    useSecondaryModelForCommit: context.globalState.get('useSecondaryModelForCommit') || false,
  };
}
