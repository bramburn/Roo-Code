import { ApiConfiguration } from '../shared/api';
import { getConfiguration } from './configuration';

/**
 * Gets the appropriate model configuration for commit message generation.
 * If a secondary model is configured and enabled, it will be used.
 * Otherwise, falls back to the primary model configuration.
 *
 * @returns {Promise<ApiConfiguration>} The API configuration to use for commit message generation
 */
export async function getCommitModel(): Promise<ApiConfiguration> {
  const useSecondary = await getConfiguration<boolean>('useSecondaryModelForCommit');

  if (useSecondary) {
    const commitModelConfig = await getConfiguration<ApiConfiguration>('commitModelConfiguration');
    if (commitModelConfig) {
      return commitModelConfig;
    }
  }

  const primaryConfig = await getConfiguration<ApiConfiguration>('apiConfiguration');
  if (!primaryConfig) {
    // Return a default empty configuration if nothing is configured
    return {} as ApiConfiguration;
  }

  return primaryConfig;
}
