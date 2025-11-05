# Context Compression Control Enhancement

## Feature Summary

This feature enhances the existing context compression system by providing developers with fine-grained control over context management. Users can choose between manual context review and editing before compression, or continue using the existing intelligent automatic compression.

## Quick Links

### Core PRD Sections

- [Overview & Goals](PRD.md#1-title--overview) - Project summary and success metrics
- [Goals & Success Metrics](PRD.md#2-goals--success-metrics) - Business objectives and developer KPIs
- [User Personas](PRD.md#3-user-personas) - Target user profiles
- [Requirements Breakdown](PRD.md#4-requirements-breakdown) - Detailed user stories and acceptance criteria
- [Timeline & Sprints](PRD.md#5-timeline--sprints) - Development schedule and sprint planning
- [Risks & Assumptions](PRD.md#6-risks--assumptions) - Risk assessment and mitigation strategies
- [Success Metrics](PRD.md#7-success-metrics) - KPIs and measurement criteria
- [Dependencies](PRD.md#8-dependencies) - Technical prerequisites and integration points

### Technical Implementation

- [Dependencies](PRD.md#8-dependencies) - Technical prerequisites and integration points
- [Success Metrics](PRD.md#7-success-metrics) - KPIs and measurement criteria

## Quick API Links

### Backend Components

- **Context Compression Trigger**: `src/core/context-compression/trigger.ts` - Detects when compression is needed
- **Manual Review Handler**: `src/core/context-compression/manual-review.ts` - Manages manual review workflow
- **Context File Manager**: `src/core/context-compression/file-manager.ts` - Handles .md file creation and loading
- **Settings Integration**: `src/core/settings/context-settings.ts` - Manages feature enablement

### Frontend Components

- **Settings Panel**: `webview-ui/src/components/settings/ContextSettings.tsx` - Checkbox for manual review
- **Review Interface**: `webview-ui/src/components/context/ManualReview.tsx` - Manual review UI
- **Progress Indicators**: `webview-ui/src/components/context/ReviewProgress.tsx` - Status and progress display

### Key Workflows

- **Manual Review Flow**: `src/core/context-compression/workflows/manual-review.ts` - Complete manual review process
- **Intelligent Compression Fallback**: `src/core/context-compression/workflows/auto-compression.ts` - Existing compression logic

## Status

**Status**: Draft - Pending Validation

## Key Features

### Manual Context Review

- Optional checkbox in settings to enable manual review before compression
- Context dumped to markdown file for manual editing
- Chat waits for user to finish editing before continuing
- File watching and progress indicators

### Intelligent Compression Fallback

- Option to skip manual review and use existing compression
- Maintains backward compatibility
- Reliable fallback for edge cases

### Integration & Error Handling

- Seamless integration with existing context management
- Robust error handling for file operations
- Clear user feedback and guidance throughout process

## Implementation Phases

1. **Phase 1: Foundation** - Settings integration and manual review workflow
2. **Phase 2: Integration** - Context loading, validation, and error handling

## Development Notes

- Feature is optional and disabled by default for backward compatibility
- No LLM calls are made during context file creation
- Token counting is performed on edited context before loading
- Clear error messages guide users when limits are exceeded
