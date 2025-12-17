const { requireMinRole} = require('../middleware/roleHierarchy');

// Mock Express req, res, next
function mockReq(roles) {
  return { auth: { roles } };
}
function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('requireMinRole middleware', () => {
  it('allows access for exact role', () => {
    const req = mockReq(['admin']);
    const res = mockRes();
    const next = jest.fn();
    requireMinRole('admin')(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('allows access for higher role', () => {
    const req = mockReq(['developer']);
    const res = mockRes();
    const next = jest.fn();
    requireMinRole('admin')(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('denies access for lower role', () => {
    const req = mockReq(['user']);
    const res = mockRes();
    const next = jest.fn();
    requireMinRole('admin')(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Requires at least admin role' });
  });

  it('denies access for no roles', () => {
    const req = mockReq([]);
    const res = mockRes();
    const next = jest.fn();
    requireMinRole('user')(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('handles multiple roles, uses highest', () => {
    const req = mockReq(['user', 'admin']);
    const res = mockRes();
    const next = jest.fn();
    requireMinRole('fieldhand')(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
