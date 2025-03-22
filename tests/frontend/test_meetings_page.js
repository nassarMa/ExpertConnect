import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MeetingProvider } from '../../src/context/MeetingContext';
import { AuthProvider } from '../../src/context/AuthContext';
import Meetings from '../../src/pages/meetings/index';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';

// Mock the API calls
jest.mock('../../src/api', () => ({
  meetingAPI: {
    getMeetings: jest.fn().mockResolvedValue({ 
      data: [
        {
          id: 1,
          title: 'Upcoming Meeting',
          requester_id: 1,
          expert_id: 2,
          requester_name: 'Test User',
          expert_name: 'Expert User',
          status: 'confirmed',
          scheduled_start: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
          scheduled_end: new Date(Date.now() + 90000000).toISOString(),
          description: 'Upcoming meeting description'
        },
        {
          id: 2,
          title: 'Pending Meeting',
          requester_id: 1,
          expert_id: 3,
          requester_name: 'Test User',
          expert_name: 'Another Expert',
          status: 'pending',
          scheduled_start: new Date(Date.now() + 172800000).toISOString(), // Day after tomorrow
          scheduled_end: new Date(Date.now() + 176400000).toISOString(),
          description: 'Pending meeting description'
        },
        {
          id: 3,
          title: 'Past Meeting',
          requester_id: 1,
          expert_id: 2,
          requester_name: 'Test User',
          expert_name: 'Expert User',
          status: 'completed',
          scheduled_start: new Date(Date.now() - 86400000).toISOString(), // Yesterday
          scheduled_end: new Date(Date.now() - 82800000).toISOString(),
          description: 'Past meeting description'
        }
      ] 
    }),
    updateMeetingStatus: jest.fn().mockResolvedValue({ 
      data: { 
        id: 2,
        status: 'cancelled'
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

describe('Meetings Page', () => {
  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <AuthProvider>
          <MeetingProvider>
            <Meetings />
          </MeetingProvider>
        </AuthProvider>
      </BrowserRouter>
    );
  };

  test('renders meetings tabs correctly', async () => {
    renderComponent();
    
    // Check if tabs are displayed
    await waitFor(() => {
      expect(screen.getByText('Upcoming (1)')).toBeInTheDocument();
      expect(screen.getByText('Pending (1)')).toBeInTheDocument();
      expect(screen.getByText('Past (1)')).toBeInTheDocument();
    });
  });

  test('displays upcoming meetings correctly', async () => {
    renderComponent();
    
    // Check if upcoming meeting is displayed
    await waitFor(() => {
      expect(screen.getByText('Upcoming Meeting')).toBeInTheDocument();
      expect(screen.getByText('With: Expert User')).toBeInTheDocument();
    });
  });

  test('switches to pending tab correctly', async () => {
    renderComponent();
    
    // Click on pending tab
    const pendingTab = screen.getByText('Pending (1)');
    fireEvent.click(pendingTab);
    
    // Check if pending meeting is displayed
    await waitFor(() => {
      expect(screen.getByText('Pending Meeting')).toBeInTheDocument();
      expect(screen.getByText('With: Another Expert')).toBeInTheDocument();
    });
  });

  test('switches to past tab correctly', async () => {
    renderComponent();
    
    // Click on past tab
    const pastTab = screen.getByText('Past (1)');
    fireEvent.click(pastTab);
    
    // Check if past meeting is displayed
    await waitFor(() => {
      expect(screen.getByText('Past Meeting')).toBeInTheDocument();
      expect(screen.getByText('With: Expert User')).toBeInTheDocument();
    });
  });

  test('cancels a pending meeting correctly', async () => {
    renderComponent();
    
    // Click on pending tab
    const pendingTab = screen.getByText('Pending (1)');
    fireEvent.click(pendingTab);
    
    // Wait for pending meeting to be displayed
    await waitFor(() => {
      expect(screen.getByText('Pending Meeting')).toBeInTheDocument();
    });
    
    // Find and click the cancel button
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    // Check if the meeting status was updated
    expect(require('../../src/api').meetingAPI.updateMeetingStatus).toHaveBeenCalledWith(2, { status: 'cancelled' });
  });
});
