import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DashboardView } from '../components/views/DashboardView';
import React from 'react';

// Mock Lucide icons statically to avoid any Proxy/Hoisting issues
vi.mock('lucide-react', () => ({
  TrendingUp: () => null,
  Activity: () => null,
  Wrench: () => null,
  ShieldCheck: () => null,
  Clock: () => null,
  LayoutDashboard: () => null,
  Car: () => null,
  Calendar: () => null,
  Settings: () => null,
  User: () => null,
  ChevronRight: () => null,
  ClipboardList: () => null,
  Bot: () => null,
  Users: () => null,
  CreditCard: () => null,
  BarChart: () => null,
  MapPin: () => null,
  PlusCircle: () => null,
  LogOut: () => null,
  Menu: () => null,
  X: () => null,
  Bell: () => null,
  Sun: () => null,
  Moon: () => null,
  ChevronDown: () => null,
  Check: () => null,
  AlertCircle: () => null,
}));

// Mock Recharts to avoid SVG rendering issues in jsdom
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  LineChart: () => <div />,
  Line: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
}));

describe('DashboardView', () => {
  const mockCars = [
    { id: 'car1', brand: 'Audi', model: 'Q5', plate: 'BC4554EP' }
  ];

  const mockHistory = [
    { id: 'h1', title: 'Oil change', cost: 5000, date: '2026-04-12', carId: 'car1', category: 'maintenance' }
  ];

  it('renders correctly and shows car brand', () => {
    render(<DashboardView carList={mockCars} historyList={mockHistory} />);

    // Check if stats are rendered
    expect(screen.getByText(/ВИТРАТИ ЗА МІСЯЦЬ/i)).toBeInTheDocument();

    // Check if the car name is displayed in the activity table
    expect(screen.getByText('Audi Q5')).toBeInTheDocument();
    expect(screen.getByText('Oil change')).toBeInTheDocument();
  });

  it('handles orphaned records with fallback', () => {
    const orphanedHistory = [
      { id: 'h2', title: 'Unknown task', cost: 1000, date: '2026-04-12', carId: 'non-existent', plate: 'XYZ' }
    ];

    render(<DashboardView carList={mockCars} historyList={orphanedHistory} />);

    // Should show carList[0] as fallback (per our logic in DashboardView) or 'Авто не вказано'
    // In our latest logic in DashboardView: || carList[0] then fallback to 'Авто не вказано'
    expect(screen.getByText('Audi Q5')).toBeInTheDocument();
  });
});
