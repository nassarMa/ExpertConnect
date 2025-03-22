import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CreditProvider } from '../../src/context/CreditContext';
import { AuthProvider } from '../../src/context/AuthContext';
import Credits from '../../src/pages/credits/index';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';

// Mock the API calls
jest.mock('../../src/api', () => ({
  creditAPI: {
    getBalance: jest.fn().mockResolvedValue({ data: { balance: 5 } }),
    getTransactions: jest.fn().mockResolvedValue({ 
      data: [
        { 
          id: 1, 
          transaction_type: 'initial', 
          amount: 1, 
          description: 'Initial free credit', 
          created_at: '2025-03-20T10:00:00Z' 
        },
        { 
          id: 2, 
          transaction_type: 'purchased', 
          amount: 4, 
          description: 'Purchased 4 credits for $4', 
          created_at: '2025-03-20T11:00:00Z' 
        }
      ] 
    }),
    purchaseCredits: jest.fn().mockResolvedValue({ 
      data: { 
        success: true, 
        new_balance: 10,
        transaction: {
          id: 3,
          transaction_type: 'purchased',
          amount: 5,
          description: 'Purchased 5 credits for $5'
        }
      } 
    })
  }
}));

// Mock the AuthContext
const mockUser = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  first_name: 'Test',
  last_name: 'User'
};

jest.mock('../../src/context/AuthContext', () => ({
  ...jest.requireActual('../../src/context/AuthContext'),
  useAuth: () => ({
    user: mockUser,
    isAuthenticated: true
  })
}));

// Mock router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    query: {}
  })
}));

describe('Credits Page', () => {
  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <AuthProvider>
          <CreditProvider>
            <Credits />
          </CreditProvider>
        </AuthProvider>
      </BrowserRouter>
    );
  };

  test('renders credit balance correctly', async () => {
    renderComponent();
    
    // Check if the balance is displayed
    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('Available Credits')).toBeInTheDocument();
    });
  });

  test('renders transaction history correctly', async () => {
    renderComponent();
    
    // Check if transactions are displayed
    await waitFor(() => {
      expect(screen.getByText('Initial free credit')).toBeInTheDocument();
      expect(screen.getByText('Purchased 4 credits for $4')).toBeInTheDocument();
    });
  });

  test('handles credit purchase correctly', async () => {
    renderComponent();
    
    // Fill in purchase form
    const amountInput = screen.getByLabelText('Amount of Credits');
    fireEvent.change(amountInput, { target: { value: '5' } });
    
    // Submit purchase
    const purchaseButton = screen.getByText('Purchase');
    fireEvent.click(purchaseButton);
    
    // Check if purchase was successful
    await waitFor(() => {
      expect(screen.getByText('Credits purchased successfully!')).toBeInTheDocument();
    });
  });
});
