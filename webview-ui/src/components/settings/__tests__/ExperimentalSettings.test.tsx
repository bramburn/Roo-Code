import React from 'react';
import { render, screen } from '@testing-library/react';
import { ExperimentalSettings } from '../ExperimentalSettings';
import { useAppTranslation } from '@/i18n/TranslationContext';
import { EXPERIMENT_IDS } from '../../../../../src/shared/experiments';

// Mock the lucide-react icons
jest.mock('lucide-react', () => ({
  FlaskConical: () => <div data-testid="flask-icon-mock" />,
}));

// Mock the hooks
jest.mock('@/i18n/TranslationContext', () => ({
  useAppTranslation: jest.fn(),
}));

// Mock the ExperimentalFeature component
jest.mock('../ExperimentalFeature', () => ({
  ExperimentalFeature: jest.fn(() => <div data-testid="experimental-feature-mock" />),
}));

// Mock the AiCommitSettings component
jest.mock('../AiCommitSettings', () => ({
  AiCommitSettings: jest.fn(() => <div data-testid="ai-commit-settings-mock" />),
}));

describe('ExperimentalSettings', () => {
  const mockSetCachedStateField = jest.fn();
  const mockSetExperimentEnabled = jest.fn();
  const mockSetChangeDetected = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock the translation hook
    (useAppTranslation as jest.Mock).mockReturnValue({
      t: (key: string) => key,
    });
  });

  it('renders the component with experiments and AI commit settings', () => {
    const mockExperiments = {
      [EXPERIMENT_IDS.INSERT_BLOCK]: true,
      [EXPERIMENT_IDS.SEARCH_AND_REPLACE]: false,
      [EXPERIMENT_IDS.POWER_STEERING]: true,
    };

    render(
      <ExperimentalSettings
        setCachedStateField={mockSetCachedStateField}
        setExperimentEnabled={mockSetExperimentEnabled}
        experiments={mockExperiments}
        useSecondaryModelForCommit={false}
        commitModelConfiguration={null}
        setChangeDetected={mockSetChangeDetected}
      />
    );

    // Check that the section header is rendered
    expect(screen.getByText('settings:sections.experimental')).toBeInTheDocument();

    // Check that the experimental features are rendered
    const experimentalFeatures = screen.getAllByTestId('experimental-feature-mock');
    expect(experimentalFeatures.length).toBeGreaterThan(0);

    // Check that the AI commit settings are rendered
    expect(screen.getByTestId('ai-commit-settings-mock')).toBeInTheDocument();
  });

  it('passes the correct props to AiCommitSettings', () => {
    const mockExperiments = {
      [EXPERIMENT_IDS.INSERT_BLOCK]: true,
      [EXPERIMENT_IDS.SEARCH_AND_REPLACE]: false,
      [EXPERIMENT_IDS.POWER_STEERING]: true,
    };

    render(
      <ExperimentalSettings
        setCachedStateField={mockSetCachedStateField}
        setExperimentEnabled={mockSetExperimentEnabled}
        experiments={mockExperiments}
        useSecondaryModelForCommit={true}
        commitModelConfiguration={{ apiProvider: 'anthropic' }}
        setChangeDetected={mockSetChangeDetected}
      />
    );

    // Get the AiCommitSettings component
    const AiCommitSettings = require('../AiCommitSettings').AiCommitSettings;

    // Check that AiCommitSettings was called with the correct props
    expect(AiCommitSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        useSecondaryModelForCommit: true,
        commitModelConfiguration: { apiProvider: 'anthropic' },
        setChangeDetected: mockSetChangeDetected,
      }),
      expect.anything()
    );
  });
});
