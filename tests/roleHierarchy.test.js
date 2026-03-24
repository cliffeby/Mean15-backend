const { requireMinRole} = require('../middleware/roleHierarchy');

// Mock Express req, res, next
// roleHierarchy.js uses req.user.role (single string) set by local JWT auth
function mockReq(role) {
  return { user: { role } };
}
function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('requireMinRole middleware', () => {
  it('allows access for exact role', () => {
    const req = mockReq('admin');
    const res = mockRes();
    const next = jest.fn();
    requireMinRole('admin')(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('allows access for higher role', () => {
    const req = mockReq('developer');
    const res = mockRes();
    const next = jest.fn();
    requireMinRole('admin')(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('denies access for lower role', () => {
    const req = mockReq('user');
    const res = mockRes();
    const next = jest.fn();
    requireMinRole('admin')(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Requires at least admin role',
      role: 'user'
    });
  });

  it('denies access for no role', () => {
    const req = { user: {} };
    const res = mockRes();
    const next = jest.fn();
    requireMinRole('user')(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('allows access for admin role when fieldhand is required', () => {
    const req = mockReq('admin');
    const res = mockRes();
    const next = jest.fn();
    requireMinRole('fieldhand')(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
