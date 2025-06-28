# Pix3D Architecture Refinement

## Overview
This document outlines the refined architecture for better maintainability, testability, and scalability.

## Current Issues
1. **Tight Coupling**: Direct SceneManager singleton usage
2. **Mixed Concerns**: UI and 3D logic intertwined
3. **Scattered State**: No centralized state management
4. **Hard Dependencies**: Direct imports between layers
5. **Testing Challenges**: Singleton patterns make testing difficult

## Proposed Architecture

### 1. Layered Architecture
```
┌─────────────────────────────────────┐
│           Presentation Layer        │  (React Components)
├─────────────────────────────────────┤
│           Application Layer         │  (Hooks, Contexts, Services)
├─────────────────────────────────────┤
│              Domain Layer           │  (Core Business Logic)
├─────────────────────────────────────┤
│         Infrastructure Layer        │  (External APIs, Storage)
└─────────────────────────────────────┘
```

### 2. Key Principles
- **Dependency Inversion**: High-level modules don't depend on low-level modules
- **Single Responsibility**: Each module has one reason to change
- **Interface Segregation**: Small, focused interfaces
- **Composition over Inheritance**: Use composition for flexibility

### 3. Core Components

#### Application State Management
- Replace scattered React state with centralized store
- Use Context API or Zustand for state management
- Separate concerns: UI state vs. 3D scene state vs. File system state

#### 3D Engine Abstraction
- Abstract Three.js behind interfaces
- Dependency injection for 3D services
- Event-driven architecture for 3D scene changes

#### File System Service
- Abstract File System Access API
- Separate persistence layer
- Testable file operations

#### Component Architecture
- Smart/Dumb component pattern
- Custom hooks for business logic
- Minimal prop drilling

## Implementation Plan

### Phase 1: State Management
1. Create centralized stores
2. Replace direct SceneManager usage
3. Implement proper event handling

### Phase 2: Service Layer
1. Create service interfaces
2. Implement dependency injection
3. Abstract external dependencies

### Phase 3: Component Refactoring
1. Extract business logic to hooks
2. Simplify component props
3. Improve component composition

### Phase 4: Testing Infrastructure
1. Add unit tests for services
2. Component testing with mocked dependencies
3. Integration tests for critical paths
