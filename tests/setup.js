// Test setup - mock express-jwt to bypass Entra validation in tests
// This keeps production code clean while allowing tests to run

// Mock express-jwt to inject test auth data
jest.mock('express-jwt', () => ({
  expressjwt: () => {
    return (req, res, next) => {
      // Inject mock Entra auth claims for tests
      req.auth = {
        sub: 'test-user-id',
        email: 'admin@example.com',
        name: 'Test Admin',
        roles: ['admin'],
      };
      next();
    };
  }
}));

// Mock jwks-rsa since we're not using real Entra tokens in tests
jest.mock('jwks-rsa', () => ({
  expressJwtSecret: () => 'mocked-secret'
}));

// Mock uuid to avoid ESM import issues in Jest
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-v4')
}));
