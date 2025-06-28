# Testing Strategy for Refined Architecture

## Overview
The new architecture enables comprehensive testing through dependency injection and proper separation of concerns.

## Testing Levels

### 1. Unit Tests
- **Services**: Test business logic in isolation
- **Stores**: Test state management with mock dependencies
- **Hooks**: Test custom hooks with mock services
- **Components**: Test UI components with mock dependencies

### 2. Integration Tests
- **Service Integration**: Test services working together
- **Store Integration**: Test state synchronization
- **Component Integration**: Test component interactions

### 3. End-to-End Tests
- **User Workflows**: Test complete user scenarios
- **3D Scene Operations**: Test 3D model loading and manipulation
- **File System Operations**: Test project management workflows

## Mock Implementation Examples

### Mock 3D Engine Service
```typescript
export class Mock3DEngineService implements I3DEngineService {
  private scene: GameScene | null = null;
  private selectedObject: THREE.Object3D | null = null;
  private sceneCallbacks: ((scene: GameScene | null) => void)[] = [];
  private selectionCallbacks: ((object: THREE.Object3D | null) => void)[] = [];

  createDefaultScene(): GameScene {
    const mockScene = new GameScene();
    this.setScene(mockScene);
    return mockScene;
  }

  setScene(scene: GameScene): void {
    this.scene = scene;
    this.sceneCallbacks.forEach(cb => cb(scene));
  }

  // ... other mock implementations
}
```

### Component Testing with Mocks
```typescript
describe('FileDetailsPanel', () => {
  it('should add model to scene when button clicked', async () => {
    const mockEngineService = new Mock3DEngineService();
    const mockFile = createMockFileEntry('test.glb');
    
    render(
      <ServiceProvider services={{ engineService: mockEngineService }}>
        <FileDetailsPanel file={mockFile} />
      </ServiceProvider>
    );
    
    // Test implementation
  });
});
```

## Test Setup Requirements

1. Install testing dependencies:
   ```bash
   npm install --save-dev @testing-library/react @testing-library/jest-dom
   ```

2. Create mock services for each interface

3. Set up test utilities for common scenarios

4. Configure Jest for TypeScript and React

## Benefits of New Architecture for Testing

1. **Isolation**: Components can be tested without real 3D engine
2. **Predictability**: Mock services provide consistent behavior
3. **Coverage**: Business logic in services can be thoroughly tested
4. **Reliability**: Tests are not affected by external dependencies
5. **Speed**: Mock implementations are faster than real services
