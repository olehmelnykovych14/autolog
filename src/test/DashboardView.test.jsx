import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DashboardView } from '../components/views/DashboardView';
import React from 'react';

// Stub every Lucide icon as a no-op. Deriving the keys from the real module
// means new icons (e.g. Fuel) never break this mock like a hand-maintained list.
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal();
  return Object.fromEntries(Object.keys(actual).map((k) => [k, () => null]));
});

// Isolate from real Firebase init (which is env-dependent and leaves `auth`
// undefined when VITE_FIREBASE_* vars are absent, e.g. in CI). With no signed-in
// user the reminders effect bails out early.
vi.mock('../firebase', () => ({ auth: { currentUser: null }, db: {} }));

// Mock Recharts to avoid SVG rendering issues in jsdom
vi.mock('recharts', async (importOriginal) => {
  const actual = await importOriginal();
  const stubbed = Object.fromEntries(Object.keys(actual).map((k) => [k, () => null]));
  // Keep ResponsiveContainer rendering children so wrapped content still mounts.
  stubbed.ResponsiveContainer = ({ children }) => <div>{children}</div>;
  return stubbed;
});

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
