import * as vscode from 'vscode';
import { getConfiguration, setConfiguration, updateApiConfiguration, loadApiConfiguration, toggleSecondaryModelForCommit, initializeConfiguration } from '../configuration';
import { ApiConfiguration } from '../../shared/api';

// Mock the vscode.ExtensionContext
const mockContext = {
  globalState: {
    get: jest.fn(),
    update: jest.fn(),
  }
} as unknown as vscode.ExtensionContext;

describe('Configuration Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getConfiguration', () => {
    it('should return the value from global state', async () => {
      // Initialize with test data
      initializeConfiguration(mockContext);
      
      // Set a test value
      await setConfiguration('testKey', 'testValue');
      
      // Get the value
      const result = await getConfiguration('testKey');
      
      expect(result).toBe('testValue');
    });

    it('should return undefined for non-existent keys', async () => {
      // Initialize with test data
      initializeConfiguration(mockContext);
      
      // Get a non-existent key
      const result = await getConfiguration('nonExistentKey');
      
      expect(result).toBeUndefined();
    });
  });

  describe('setConfiguration', () => {
    it('should set a value in global state', async () => {
      // Initialize with test data
      initializeConfiguration(mockContext);
      
      // Set a test value
      await setConfiguration('testKey', 'testValue');
      
      // Get the value to verify it was set
      const result = await getConfiguration('testKey');
      
      expect(result).toBe('testValue');
    });
  });

  describe('updateApiConfiguration', () => {
    it('should update the primary API configuration by default', async () => {
      // Initialize with test data
      initializeConfiguration(mockContext);
      
      const testConfig: ApiConfiguration = {
        apiProvider: 'openai',
        apiKey: 'test-key'
      };
      
      // Update the API configuration
      await updateApiConfiguration(testConfig);
      
      // Get the value to verify it was set
      const result = await getConfiguration('apiConfiguration');
      
      expect(result).toEqual(testConfig);
    });

    it('should update the commit API configuration when isCommitConfig is true', async () => {
      // Initialize with test data
      initializeConfiguration(mockContext);
      
      const testConfig: ApiConfiguration = {
        apiProvider: 'anthropic',
        apiKey: 'commit-test-key'
      };
      
      // Update the commit API configuration
      await updateApiConfiguration(testConfig, true);
      
      // Get the value to verify it was set
      const result = await getConfiguration('commitModelConfiguration');
      
      expect(result).toEqual(testConfig);
    });
  });

  describe('loadApiConfiguration', () => {
    it('should load the primary API configuration by default', async () => {
      // Initialize with test data
      initializeConfiguration(mockContext);
      
      const testConfig: ApiConfiguration = {
        apiProvider: 'openai',
        apiKey: 'test-key'
      };
      
      // Set the API configuration
      await setConfiguration('apiConfiguration', testConfig);
      
      // Load the API configuration
      const result = await loadApiConfiguration();
      
      expect(result).toEqual(testConfig);
    });

    it('should load the commit API configuration when isCommitConfig is true', async () => {
      // Initialize with test data
      initializeConfiguration(mockContext);
      
      const testConfig: ApiConfiguration = {
        apiProvider: 'anthropic',
        apiKey: 'commit-test-key'
      };
      
      // Set the commit API configuration
      await setConfiguration('commitModelConfiguration', testConfig);
      
      // Load the commit API configuration
      const result = await loadApiConfiguration(true);
      
      expect(result).toEqual(testConfig);
    });
  });

  describe('toggleSecondaryModelForCommit', () => {
    it('should toggle the use of a secondary model for commit messages', async () => {
      // Initialize with test data
      initializeConfiguration(mockContext);
      
      // Toggle on
      await toggleSecondaryModelForCommit(true);
      
      // Get the value to verify it was set
      let result = await getConfiguration('useSecondaryModelForCommit');
      
      expect(result).toBe(true);
      
      // Toggle off
      await toggleSecondaryModelForCommit(false);
      
      // Get the value to verify it was set
      result = await getConfiguration('useSecondaryModelForCommit');
      
      expect(result).toBe(false);
    });
  });

  describe('initializeConfiguration', () => {
    it('should initialize the global state with values from context.globalState', () => {
      // Mock the context.globalState.get method
      (mockContext.globalState.get as jest.Mock).mockImplementation((key: string) => {
        if (key === 'apiConfiguration') {
          return { apiProvider: 'openai', apiKey: 'test-key' };
        } else if (key === 'commitModelConfiguration') {
          return { apiProvider: 'anthropic', apiKey: 'commit-test-key' };
        } else if (key === 'useSecondaryModelForCommit') {
          return true;
        }
        return undefined;
      });
      
      // Initialize with test data
      initializeConfiguration(mockContext);
      
      // Verify the values were set
      getConfiguration('apiConfiguration').then(result => {
        expect(result).toEqual({ apiProvider: 'openai', apiKey: 'test-key' });
      });
      
      getConfiguration('commitModelConfiguration').then(result => {
        expect(result).toEqual({ apiProvider: 'anthropic', apiKey: 'commit-test-key' });
      });
      
      getConfiguration('useSecondaryModelForCommit').then(result => {
        expect(result).toBe(true);
      });
    });
  });
});
