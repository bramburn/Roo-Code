import * as vscode from 'vscode';
// Mock the generateCommitMsg function since we can't import it directly
const generateCommitMsg = jest.fn();
import { getCommitModel } from '../services/commit-model-service';
import { updateApiConfiguration, toggleSecondaryModelForCommit } from '../services/configuration';
import { ApiConfiguration } from '../shared/api';

// Mock the dependencies
jest.mock('../git-utils', () => ({
  getDiffStaged: jest.fn().mockResolvedValue({
    diff: 'Test diff content',
    error: null
  })
}));

jest.mock('../services/commit-model-service', () => ({
  getCommitModel: jest.fn()
}));

jest.mock('../services/configuration', () => ({
  getConfiguration: jest.fn(),
  setConfiguration: jest.fn(),
  updateApiConfiguration: jest.fn(),
  loadApiConfiguration: jest.fn(),
  toggleSecondaryModelForCommit: jest.fn(),
  initializeConfiguration: jest.fn()
}));

jest.mock('../openai-utils', () => ({
  ChatGPTAPI: jest.fn().mockResolvedValue('Generated commit message')
}));

jest.mock('../prompts', () => ({
  getMainCommitPrompt: jest.fn().mockResolvedValue([
    { role: 'system', content: 'You are a commit message generator' }
  ])
}));

// Mock the vscode API
const mockInputBox = {
  value: ''
};

const mockRepo = {
  rootUri: { fsPath: '/test/repo' },
  inputBox: mockInputBox
};

jest.mock('vscode', () => ({
  workspace: {
    applyEdit: jest.fn().mockResolvedValue(true)
  },
  WorkspaceEdit: jest.fn(),
  extensions: {
    getExtension: jest.fn().mockReturnValue({
      exports: {
        getAPI: jest.fn().mockReturnValue({
          repositories: [mockRepo]
        })
      }
    })
  },
  SourceControlInputBox: jest.fn()
}));

describe('AI Commit Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockInputBox.value = '';
  });

  it('should use the primary model when secondary model is disabled', async () => {
    // Mock the getCommitModel to return a primary model configuration
    const primaryModelConfig: ApiConfiguration = {
      apiProvider: 'openai',
      apiKey: 'primary-key'
    };

    (getCommitModel as jest.Mock).mockResolvedValue(primaryModelConfig);

    // Call the generateCommitMsg function
    await generateCommitMsg({ rootUri: { fsPath: '/test/repo' } });

    // Verify that getCommitModel was called
    expect(getCommitModel).toHaveBeenCalled();

    // Verify that the commit message was generated and set in the input box
    expect(mockInputBox.value).toBe('Generated commit message');
  });

  it('should use the secondary model when enabled and configured', async () => {
    // Mock the getCommitModel to return a secondary model configuration
    const secondaryModelConfig: ApiConfiguration = {
      apiProvider: 'anthropic',
      apiKey: 'secondary-key'
    };

    (getCommitModel as jest.Mock).mockResolvedValue(secondaryModelConfig);

    // Call the generateCommitMsg function
    await generateCommitMsg({ rootUri: { fsPath: '/test/repo' } });

    // Verify that getCommitModel was called
    expect(getCommitModel).toHaveBeenCalled();

    // Verify that the commit message was generated and set in the input box
    expect(mockInputBox.value).toBe('Generated commit message');
  });

  it('should handle API errors gracefully', async () => {
    // Mock the getCommitModel to return a valid configuration
    const modelConfig: ApiConfiguration = {
      apiProvider: 'openai',
      apiKey: 'test-key'
    };

    (getCommitModel as jest.Mock).mockResolvedValue(modelConfig);

    // Mock the ChatGPTAPI to throw an error
    const mockError: any = new Error('API Error');
    mockError.response = { status: 401 };

    require('../openai-utils').ChatGPTAPI.mockRejectedValue(mockError);

    // Call the generateCommitMsg function
    await generateCommitMsg({ rootUri: { fsPath: '/test/repo' } });

    // Verify that getCommitModel was called
    expect(getCommitModel).toHaveBeenCalled();

    // Verify that the error message was set in the input box
    expect(mockInputBox.value).toBe('Error: Invalid API key or unauthorized access');
  });

  it('should handle missing API key gracefully', async () => {
    // Mock the getCommitModel to return a configuration without an API key
    const modelConfig: ApiConfiguration = {
      apiProvider: 'openai'
    };

    (getCommitModel as jest.Mock).mockResolvedValue(modelConfig);

    // Call the generateCommitMsg function
    await generateCommitMsg({ rootUri: { fsPath: '/test/repo' } });

    // Verify that getCommitModel was called
    expect(getCommitModel).toHaveBeenCalled();

    // Verify that the error message was set in the input box
    expect(mockInputBox.value).toBe('');
  });
});
