import { getCommitModel } from '../commit-model-service';
import { getConfiguration } from '../configuration';

// Mock the configuration service
jest.mock('../configuration', () => ({
  getConfiguration: jest.fn(),
}));

describe('Commit Model Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return primary model when secondary model is disabled', async () => {
    // Mock the configuration service to return false for useSecondaryModelForCommit
    (getConfiguration as jest.Mock).mockImplementation((key: string) => {
      if (key === 'useSecondaryModelForCommit') {
        return Promise.resolve(false);
      } else if (key === 'apiConfiguration') {
        return Promise.resolve({ apiProvider: 'openai', apiKey: 'primary-key' });
      }
      return Promise.resolve(undefined);
    });

    const result = await getCommitModel();
    
    expect(result).toEqual({ apiProvider: 'openai', apiKey: 'primary-key' });
    expect(getConfiguration).toHaveBeenCalledWith('useSecondaryModelForCommit');
    expect(getConfiguration).toHaveBeenCalledWith('apiConfiguration');
    expect(getConfiguration).not.toHaveBeenCalledWith('commitModelConfiguration');
  });

  it('should return secondary model when enabled and configured', async () => {
    // Mock the configuration service to return true for useSecondaryModelForCommit
    (getConfiguration as jest.Mock).mockImplementation((key: string) => {
      if (key === 'useSecondaryModelForCommit') {
        return Promise.resolve(true);
      } else if (key === 'commitModelConfiguration') {
        return Promise.resolve({ apiProvider: 'anthropic', apiKey: 'secondary-key' });
      } else if (key === 'apiConfiguration') {
        return Promise.resolve({ apiProvider: 'openai', apiKey: 'primary-key' });
      }
      return Promise.resolve(undefined);
    });

    const result = await getCommitModel();
    
    expect(result).toEqual({ apiProvider: 'anthropic', apiKey: 'secondary-key' });
    expect(getConfiguration).toHaveBeenCalledWith('useSecondaryModelForCommit');
    expect(getConfiguration).toHaveBeenCalledWith('commitModelConfiguration');
  });

  it('should fall back to primary model when secondary is enabled but not configured', async () => {
    // Mock the configuration service to return true for useSecondaryModelForCommit but undefined for commitModelConfiguration
    (getConfiguration as jest.Mock).mockImplementation((key: string) => {
      if (key === 'useSecondaryModelForCommit') {
        return Promise.resolve(true);
      } else if (key === 'commitModelConfiguration') {
        return Promise.resolve(undefined);
      } else if (key === 'apiConfiguration') {
        return Promise.resolve({ apiProvider: 'openai', apiKey: 'primary-key' });
      }
      return Promise.resolve(undefined);
    });

    const result = await getCommitModel();
    
    expect(result).toEqual({ apiProvider: 'openai', apiKey: 'primary-key' });
    expect(getConfiguration).toHaveBeenCalledWith('useSecondaryModelForCommit');
    expect(getConfiguration).toHaveBeenCalledWith('commitModelConfiguration');
    expect(getConfiguration).toHaveBeenCalledWith('apiConfiguration');
  });
});
