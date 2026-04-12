import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Topbar } from '../components/layout/Topbar';
import React from 'react';

// Full static mock for Lucide icons used in the app
vi.mock('lucide-react', () => ({
  Bell: ({ children }) => <div data-testid="bell-icon">{children}</div>,
  Menu: () => null,
  AlertCircle: () => null,
  Sun: () => null,
  Moon: () => null,
  ChevronDown: () => null,
  Check: () => null,
  X: () => null,
  ShieldCheck: () => null,
  Clock: () => null,
  LayoutDashboard: () => null,
  Car: () => null,
  Calendar: () => null,
  ClipboardList: () => null,
  Bot: () => null,
  Users: () => null,
  PlusCircle: () => null,
  LogOut: () => null,
  CreditCard: () => null,
  BarChart: () => null,
  MapPin: () => null,
  Settings: () => null,
  TrendingUp: () => null,
  Activity: () => null,
  Wrench: () => null,
  ArrowUpRight: () => null,
  ArrowDownRight: () => null,
}));

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
    render(<Topbar 
      incomingInvites={mockInvites} 
      onAcceptInvite={onAccept} 
      pendingApprovals={[]} 
      bookingNotifications={[]}
      userProfile={{}}
      currentUser={{}}
    />);

    // Open the dropdown first to see notifications
    const bellButton = screen.getByTestId('bell-icon').parentElement;
    fireEvent.click(bellButton);

    // Find the ПРИЙНЯТИ button and click it
    const acceptBtn = screen.getByText('ПРИЙНЯТИ');
    fireEvent.click(acceptBtn);

    expect(onAccept).toHaveBeenCalledWith('inv1');
  });

  it('calls onRejectInvite when Reject button is clicked', () => {
    const onReject = vi.fn();
    render(<Topbar 
      incomingInvites={mockInvites} 
      onRejectInvite={onReject} 
      pendingApprovals={[]} 
      bookingNotifications={[]}
      userProfile={{}}
      currentUser={{}}
    />);

    // Open dropdown
    const bellButton = screen.getByTestId('bell-icon').parentElement;
    fireEvent.click(bellButton);

    // Find the ВІДХИЛИТИ button and click it
    const rejectBtn = screen.getByText('ВІДХИЛИТИ');
    fireEvent.click(rejectBtn);

    expect(onReject).toHaveBeenCalledWith('inv1');
  });
});
