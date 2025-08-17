# Connectivity and Persistence Tests

This directory contains automated tests for validating connectivity and data persistence across all main routes of the StayFocus application.

## Setup

### 1. Environment Configuration

Copy the test environment template:
```bash
cp .env.test .env.test.local
```

Edit `.env.test.local` with your test credentials:
```env
# Test user credentials (create a dedicated test user in your Supabase auth)
TEST_USER_EMAIL=your-test-user@example.com
TEST_USER_PASSWORD=your-test-password

# Application URL (adjust if running on different port)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Test User Setup

Create a test user in your Supabase authentication:
1. Go to your Supabase dashboard
2. Navigate to Authentication > Users
3. Create a new user with the email/password from your `.env.test.local`
4. Ensure the user has access to all necessary tables

### 3. MCP Tools Configuration

The test setup includes MCP configuration for:
- **Supabase MCP**: For database validation
- **Playwright MCP**: For browser automation

Make sure you have `uv` and `uvx` installed:
```bash
# Install uv (Python package manager)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Or via pip
pip install uv
```

## Running Tests

### Validate Setup
```bash
npm run test:setup
```

### Run All Connectivity Tests
```bash
npm run test:connectivity
```

### Run Tests with UI (Interactive)
```bash
npm run test:connectivity:ui
```

### Debug Tests
```bash
npm run test:connectivity:debug
```

## Test Structure

```
tests/connectivity-persistence/
├── config/
│   └── test-config.ts          # Test configuration and data templates
├── setup/
│   ├── global-setup.ts         # Global test setup
│   └── global-teardown.ts      # Global test cleanup
├── tests/
│   └── setup-validation.spec.ts # Setup validation tests
├── utils/
│   └── test-utils.ts           # Common test utilities
├── playwright.config.ts        # Playwright configuration
├── .env.test                   # Environment template
└── README.md                   # This file
```

## Test Configuration

### Routes Tested
- `/sono` - Sleep tracking
- `/saude` - Health monitoring
- `/lazer` - Leisure activities
- `/hiperfocos` - Hyperfocus sessions
- `/receitas` - Recipes and meal planning
- `/autoconhecimento` - Self-knowledge notes

### Test Data
Each route has predefined test data templates that include unique identifiers to avoid conflicts with real data.

### Database Validation
Tests use Supabase MCP to validate that data is correctly inserted and persisted in the database.

## Troubleshooting

### Common Issues

1. **Application not accessible**
   - Ensure the Next.js dev server is running (`npm run dev`)
   - Check that the `NEXT_PUBLIC_APP_URL` is correct

2. **Authentication fails**
   - Verify test user exists in Supabase Auth
   - Check credentials in `.env.test.local`
   - Ensure user has necessary permissions

3. **Database validation fails**
   - Verify Supabase credentials are correct
   - Check that MCP tools are properly configured
   - Ensure test user has access to required tables

4. **MCP tools not working**
   - Install `uv` and `uvx`: `curl -LsSf https://astral.sh/uv/install.sh | sh`
   - Check MCP configuration in `.kiro/settings/mcp.json`
   - Restart Kiro to reload MCP servers

### Debug Mode

Run tests in debug mode to step through them:
```bash
npm run test:connectivity:debug
```

### Screenshots and Videos

Failed tests automatically capture:
- Screenshots on failure
- Videos of test execution
- Browser traces for debugging

Find these in `test-results/` directory.

## Test Reports

Tests generate multiple report formats:
- **HTML Report**: `test-results/html-report/index.html`
- **JSON Report**: `test-results/results.json`
- **Console Output**: Real-time test progress

## Data Cleanup

Tests are configured to:
1. Use clearly marked test data (with "Teste Auto" prefixes)
2. Clean up test data after execution (if `CLEANUP_AFTER_TESTS=true`)
3. Avoid interfering with real user data

## Performance Monitoring

Tests measure and report:
- Page load times
- Form submission times
- Database query performance
- Network request timing

## Next Steps

After validating the setup:
1. Run the setup validation tests
2. Proceed to implement individual route tests
3. Add data insertion and persistence validation
4. Implement synchronization tests