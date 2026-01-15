import { vi, beforeEach } from 'vitest';

// Mock IndexedDB for LightningFS
// happy-dom provides a basic IndexedDB implementation, but we may need
// to add more sophisticated mocking as tests are developed

// Global test utilities
beforeEach(() => {
  vi.clearAllMocks();
});
