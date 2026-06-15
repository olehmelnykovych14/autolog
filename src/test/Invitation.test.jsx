import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { Topbar } from '../components/layout/Topbar';
import React from 'react';

// Bell renders a testid div (the test opens the dropdown via it); every other
// icon is auto-stubbed as a no-op, derived from the real module so new icons
// never break this mock.
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal();
  const stubbed = Object.fromEntries(Object.keys(actual).map((k) => [k, () => null]));
  stubbed.Bell = ({ children }) => <div data-testid="bell-icon">{children}</div>;
  return stubbed;
});

// Mock C constant
vi.mock('../../constants', () => ({
  C: '#5C3EFE'
}));

describe('Invitation Notifications', () => {
  const mockInvites = [
    { id: 'inv1', fromName: 'Oleh', email: 'test@user.com', status: 'pending' }
  ];

  it('calls onAcceptInvite when Accept button is clicked', () => {
    const onAccept = vi.fn();
    render(<MemoryRouter><Topbar
      incomingInvites={mockInvites}
      onAcceptInvite={onAccept}
      pendingApprovals={[]}
      bookingNotifications={[]}
      userProfile={{}}
      currentUser={{}}
    /></MemoryRouter>);

    // Open the dropdown first to see notifications
    const bellButton = screen.getByTestId('bell-icon').parentElement;
    fireEvent.click(bellButton);

    // Find the Прийняти button and click it
    const acceptBtn = screen.getByText('Прийняти');
    fireEvent.click(acceptBtn);

    expect(onAccept).toHaveBeenCalledWith('inv1');
  });

  it('calls onRejectInvite when Reject button is clicked', () => {
    const onReject = vi.fn();
    render(<MemoryRouter><Topbar
      incomingInvites={mockInvites}
      onRejectInvite={onReject}
      pendingApprovals={[]}
      bookingNotifications={[]}
      userProfile={{}}
      currentUser={{}}
    /></MemoryRouter>);

    // Open dropdown
    const bellButton = screen.getByTestId('bell-icon').parentElement;
    fireEvent.click(bellButton);

    // Find the Відхилити button and click it
    const rejectBtn = screen.getByText('Відхилити');
    fireEvent.click(rejectBtn);

    expect(onReject).toHaveBeenCalledWith('inv1');
  });
});
