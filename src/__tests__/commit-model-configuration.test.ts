import * as vscode from 'vscode';
import { ExtensionState } from '../shared/ExtensionMessage';
import { ApiConfiguration } from '../shared/api';
import { getCommitModel } from '../services/commit-model-service';

// Mock the configuration service
jest.mock('../services/configuration', () => ({
  getConfiguration: jest.fn(),
}));

// Import the mocked configuration service
import { getConfiguration } from '../services/configuration';

describe('Commit Model Configuration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCommitModel', () => {
    it('should return the primary model when useSecondaryModelForCommit is false', async () => {
      // Arrange
      const mockPrimaryConfig: ApiConfiguration = {
        apiProvider: 'anthropic',
        apiKey: 'primary-key',
      };
      const mockSecondaryConfig: ApiConfiguration = {
        apiProvider: 'openai',
        apiKey: 'secondary-key',
      };
      
      (getConfiguration as jest.Mock).mockImplementation((key: string) => {
        if (key === 'useSecondaryModelForCommit') return false;
        if (key === 'apiConfiguration') return mockPrimaryConfig;
        if (key === 'commitModelConfiguration') return mockSecondaryConfig;
        return null;
      });

      // Act
      const result = await getCommitModel();

      // Assert
      expect(result).toEqual(mockPrimaryConfig);
      expect(getConfiguration).toHaveBeenCalledWith('useSecondaryModelForCommit');
      expect(getConfiguration).toHaveBeenCalledWith('apiConfiguration');
      expect(getConfiguration).not.toHaveBeenCalledWith('commitModelConfiguration');
    });

    it('should return the secondary model when useSecondaryModelForCommit is true', async () => {
      // Arrange
      const mockPrimaryConfig: ApiConfiguration = {
        apiProvider: 'anthropic',
        apiKey: 'primary-key',
      };
      const mockSecondaryConfig: ApiConfiguration = {
        apiProvider: 'openai',
        apiKey: 'secondary-key',
      };
      
      (getConfiguration as jest.Mock).mockImplementation((key: string) => {
        if (key === 'useSecondaryModelForCommit') return true;
        if (key === 'apiConfiguration') return mockPrimaryConfig;
        if (key === 'commitModelConfiguration') return mockSecondaryConfig;
        return null;
      });

      // Act
      const result = await getCommitModel();

      // Assert
      expect(result).toEqual(mockSecondaryConfig);
      expect(getConfiguration).toHaveBeenCalledWith('useSecondaryModelForCommit');
      expect(getConfiguration).not.toHaveBeenCalledWith('apiConfiguration');
      expect(getConfiguration).toHaveBeenCalledWith('commitModelConfiguration');
    });

    it('should fall back to primary model when secondary is enabled but not configured', async () => {
      // Arrange
      const mockPrimaryConfig: ApiConfiguration = {
        apiProvider: 'anthropic',
        apiKey: 'primary-key',
      };
      
      (getConfiguration as jest.Mock).mockImplementation((key: string) => {
        if (key === 'useSecondaryModelForCommit') return true;
        if (key === 'apiConfiguration') return mockPrimaryConfig;
        if (key === 'commitModelConfiguration') return undefined;
        return null;
      });

      // Act
      const result = await getCommitModel();

      // Assert
      expect(result).toEqual(mockPrimaryConfig);
      expect(getConfiguration).toHaveBeenCalledWith('useSecondaryModelForCommit');
      expect(getConfiguration).toHaveBeenCalledWith('commitModelConfiguration');
      expect(getConfiguration).toHaveBeenCalledWith('apiConfiguration');
    });
  });
});

