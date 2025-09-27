// Jest setup file for Progress Knight tests
// This file runs before each test file

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock console methods to avoid noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

// Mock DOM methods that might be called
global.document = {
  getElementById: jest.fn(),
  getElementsByClassName: jest.fn(),
  createElement: jest.fn(),
  querySelector: jest.fn(),
  querySelectorAll: jest.fn(),
};

// Mock window object
global.window = {
  ...window,
  localStorage: localStorageMock,
  atob: jest.fn(),
  btoa: jest.fn(),
  URL: {
    createObjectURL: jest.fn(),
    revokeObjectURL: jest.fn(),
  },
};

// Mock navigator
global.navigator = {
  userAgent: 'Mozilla/5.0 (compatible; Test)',
};
