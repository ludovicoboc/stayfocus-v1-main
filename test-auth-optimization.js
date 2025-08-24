// Simple test to verify auth cache functionality
const { authCache } = require('./lib/auth-cache.ts');

async function testAuthCache() {
  console.log('🧪 Testing auth cache optimization...');
  
  // Test 1: Cache should be empty initially
  const initialCache = authCache.getCachedAuth();
  console.log('Initial cache:', initialCache === null ? 'Empty ✅' : 'Not empty ❌');
  
  // Test 2: Set mock auth data
  const mockUser = { id: 'test-123', email: 'test@example.com' };
  const mockSession = { user: mockUser, expires_at: Math.floor(Date.now() / 1000) + 3600 };
  
  authCache.setCachedAuth(mockUser, mockSession);
  console.log('Set cache data ✅');
  
  // Test 3: Retrieve cached data
  const cachedData = authCache.getCachedAuth();
  if (cachedData && cachedData.user && cachedData.user.id === 'test-123') {
    console.log('Cache retrieval works ✅');
  } else {
    console.log('Cache retrieval failed ❌');
  }
  
  // Test 4: Check if session is valid
  const isValid = authCache.isSessionStillValid(mockSession);
  console.log('Session validity check:', isValid ? '✅' : '❌');
  
  // Test 5: Get stats
  const stats = authCache.getStats();
  console.log('Cache stats:', stats);
  
  // Test 6: Clear cache
  authCache.clearCache();
  const clearedCache = authCache.getCachedAuth();
  console.log('Cache clear:', clearedCache === null ? 'Works ✅' : 'Failed ❌');
  
  console.log('🎉 Auth cache optimization test completed!');
}

// Only run if this is the main module
if (require.main === module) {
  testAuthCache().catch(console.error);
}

module.exports = { testAuthCache };