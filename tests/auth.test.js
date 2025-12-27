

// mockUser must be defined before any require or jest.mock calls that use it
const mockUser = { _id: '123', name: 'Test User', email: 'test@example.com' };

jest.mock('jsonwebtoken', () => ({
  verify: jest.fn()
}));

jest.mock('../models/User', () => ({
  findById: jest.fn()
}));

const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const User = require('../models/User');

describe('auth middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = { header: jest.fn() };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
    process.env.JWT_SECRET = 'testsecret';
    jest.clearAllMocks();
  });

  it('should call next if token is valid and user exists', async () => {
    req.header.mockImplementation((name) => {
      if (name === 'Authorization') return 'Bearer validtoken';
      return undefined;
    });
    jwt.verify.mockReturnValue({ id: '123' });
    
    const mockSelect = jest.fn().mockResolvedValue(mockUser);
    User.findById.mockReturnValue({ select: mockSelect });
    
    await auth(req, res, next);
    
    expect(jwt.verify).toHaveBeenCalledWith('validtoken', 'testsecret');
    expect(User.findById).toHaveBeenCalledWith('123');
    expect(mockSelect).toHaveBeenCalledWith('-password');
    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual(mockUser);
  });

  it('should return 401 if no token is provided', async () => {
    req.header.mockReturnValue(undefined);
    await auth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Access denied. No token provided.' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 if token is invalid', async () => {
    req.header.mockReturnValue('Bearer invalidtoken');
    jwt.verify.mockImplementation(() => { throw new Error('invalid'); });
    await auth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Invalid token.' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 if user not found', async () => {
    req.header.mockReturnValue('Bearer validtoken');
    jwt.verify.mockReturnValue({ id: 'notfound' });
    User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });
    await auth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Invalid token.' });
    expect(next).not.toHaveBeenCalled();
  });
});
