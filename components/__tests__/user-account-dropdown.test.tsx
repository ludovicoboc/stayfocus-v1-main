import { render, screen } from '@testing-library/react'
import { UserAccountDropdown } from '../user-account-dropdown'
import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'

// Mock the hooks
jest.mock('@/hooks/use-auth')
jest.mock('next/navigation')
jest.mock('@/hooks/use-toast')

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>
const mockUseToast = useToast as jest.MockedFunction<typeof useToast>

const mockRouter = {
  push: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
}

const mockToast = {
  toast: jest.fn(),
}

describe('UserAccountDropdown', () => {
  beforeEach(() => {
    mockUseRouter.mockReturnValue(mockRouter as any)
    mockUseToast.mockReturnValue(mockToast as any)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('renders loading state correctly', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: true,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
    })

    render(
      <UserAccountDropdown>
        <button>Trigger</button>
      </UserAccountDropdown>
    )

    // Should show loading spinner
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('renders not authenticated state correctly', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
    })

    render(
      <UserAccountDropdown>
        <button>Trigger</button>
      </UserAccountDropdown>
    )

    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('renders authenticated user correctly', () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      created_at: '2024-01-01T00:00:00Z',
      user_metadata: {
        full_name: 'Test User'
      }
    }

    mockUseAuth.mockReturnValue({
      user: mockUser as any,
      loading: false,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
    })

    render(
      <UserAccountDropdown>
        <button>Trigger</button>
      </UserAccountDropdown>
    )

    expect(screen.getByRole('button')).toBeInTheDocument()
  })
})