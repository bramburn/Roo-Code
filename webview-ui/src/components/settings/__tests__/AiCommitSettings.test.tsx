import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AiCommitSettings } from '../AiCommitSettings';
import { useExtensionState } from '@/context/ExtensionStateContext';
import { useAppTranslation } from '@/i18n/TranslationContext';

// Mock the hooks
jest.mock('@/context/ExtensionStateContext', () => ({
  useExtensionState: jest.fn(),
}));

jest.mock('@/i18n/TranslationContext', () => ({
  useAppTranslation: jest.fn(),
}));

// Mock the ApiOptions component
jest.mock('../ApiOptions', () => ({
  __esModule: true,
  default: jest.fn(() => <div data-testid="api-options-mock" />),
}));

describe('AiCommitSettings', () => {
  const mockOnUseSecondaryModelChange = jest.fn();
  const mockOnCommitModelConfigChange = jest.fn();
  const mockSetChangeDetected = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock the translation hook
    (useAppTranslation as jest.Mock).mockReturnValue({
      t: (key: string) => key,
    });

    // Default mock for useExtensionState
    (useExtensionState as jest.Mock).mockReturnValue({
      apiConfiguration: { apiProvider: 'openai' },
    });
  });

  it('renders the component with checkbox unchecked by default', () => {
    render(
      <AiCommitSettings
        useSecondaryModelForCommit={false}
        commitModelConfiguration={null}
        onUseSecondaryModelChange={mockOnUseSecondaryModelChange}
        onCommitModelConfigChange={mockOnCommitModelConfigChange}
        setChangeDetected={mockSetChangeDetected}
      />
    );

    // Check that the section header is rendered
    expect(screen.getByText('settings:sections.aiCommit')).toBeInTheDocument();

    // Check that the checkbox is rendered and unchecked
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();

    // Check that the description is rendered
    expect(screen.getByText('settings:aiCommit.description')).toBeInTheDocument();

    // Check that the API options are not rendered
    expect(screen.queryByTestId('api-options-mock')).not.toBeInTheDocument();
  });

  it('shows API options when checkbox is checked', () => {
    render(
      <AiCommitSettings
        useSecondaryModelForCommit={true}
        commitModelConfiguration={{ apiProvider: 'anthropic' }}
        onUseSecondaryModelChange={mockOnUseSecondaryModelChange}
        onCommitModelConfigChange={mockOnCommitModelConfigChange}
        setChangeDetected={mockSetChangeDetected}
      />
    );

    // Check that the checkbox is checked
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();

    // Check that the API options are rendered
    expect(screen.getByTestId('api-options-mock')).toBeInTheDocument();
  });

  it('calls onUseSecondaryModelChange when checkbox is toggled', () => {
    render(
      <AiCommitSettings
        useSecondaryModelForCommit={false}
        commitModelConfiguration={null}
        onUseSecondaryModelChange={mockOnUseSecondaryModelChange}
        onCommitModelConfigChange={mockOnCommitModelConfigChange}
        setChangeDetected={mockSetChangeDetected}
      />
    );

    // Get the checkbox and click it
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    // Check that onUseSecondaryModelChange was called with the correct arguments
    expect(mockOnUseSecondaryModelChange).toHaveBeenCalledWith(true);
    expect(mockSetChangeDetected).toHaveBeenCalledWith(true);
  });

  it('uses commitModelConfiguration if available, otherwise falls back to apiConfiguration', () => {
    // Test with commitModelConfiguration as null
    render(
      <AiCommitSettings
        useSecondaryModelForCommit={true}
        commitModelConfiguration={null}
        onUseSecondaryModelChange={mockOnUseSecondaryModelChange}
        onCommitModelConfigChange={mockOnCommitModelConfigChange}
        setChangeDetected={mockSetChangeDetected}
      />
    );

    // Check that ApiOptions is rendered with apiConfiguration
    const ApiOptions = require('../ApiOptions').default;
    expect(ApiOptions).toHaveBeenCalledWith(
      expect.objectContaining({
        apiConfiguration: { apiProvider: 'openai' },
      }),
      expect.anything()
    );

    // Clear mocks for the next test
    jest.clearAllMocks();

    // Test with commitModelConfiguration available
    render(
      <AiCommitSettings
        useSecondaryModelForCommit={true}
        commitModelConfiguration={{ apiProvider: 'anthropic' }}
        onUseSecondaryModelChange={mockOnUseSecondaryModelChange}
        onCommitModelConfigChange={mockOnCommitModelConfigChange}
        setChangeDetected={mockSetChangeDetected}
      />
    );

    // Check that ApiOptions is rendered with commitModelConfiguration
    expect(ApiOptions).toHaveBeenCalledWith(
      expect.objectContaining({
        apiConfiguration: { apiProvider: 'anthropic' },
      }),
      expect.anything()
    );
  });

  it('calls onCommitModelConfigChange when API configuration changes', () => {
    render(
      <AiCommitSettings
        useSecondaryModelForCommit={true}
        commitModelConfiguration={{ apiProvider: 'anthropic' }}
        onUseSecondaryModelChange={mockOnUseSecondaryModelChange}
        onCommitModelConfigChange={mockOnCommitModelConfigChange}
        setChangeDetected={mockSetChangeDetected}
      />
    );

    // Get the ApiOptions component and simulate a change
    const ApiOptions = require('../ApiOptions').default;
    const setApiConfigurationField = ApiOptions.mock.calls[0][0].setApiConfigurationField;

    // Call the setApiConfigurationField function with a field and value
    setApiConfigurationField('apiModelId', 'claude-3-opus-20240229');

    // Check that onCommitModelConfigChange was called with the correct arguments
    expect(mockOnCommitModelConfigChange).toHaveBeenCalledWith({
      apiProvider: 'anthropic',
      apiModelId: 'claude-3-opus-20240229'
    });
    expect(mockSetChangeDetected).toHaveBeenCalledWith(true);
  });
});
