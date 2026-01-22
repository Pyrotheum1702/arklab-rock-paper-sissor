// Mock for openapi-fetch to avoid MetaMask SDK analytics errors
function createClient() {
  return {
    GET: () => Promise.resolve({ data: null, error: null }),
    POST: () => Promise.resolve({ data: null, error: null }),
    PUT: () => Promise.resolve({ data: null, error: null }),
    DELETE: () => Promise.resolve({ data: null, error: null }),
    PATCH: () => Promise.resolve({ data: null, error: null }),
  };
}

// Export as both default and named export
module.exports = createClient;
module.exports.default = createClient;
