import { describe, it, expect } from 'vitest'
import { decideScreen } from '../authScreen'

const base = {
  currentUser: undefined, userProfile: null,
  authTimedOut: false, wasLoggedIn: false, showAuthFlag: false, mode: 'landing',
}

describe('decideScreen', () => {
  it('shows loading while auth is resolving', () => {
    expect(decideScreen(base)).toBe('loading')
  })

  it('shows landing after timeout if user was never logged in', () => {
    expect(decideScreen({ ...base, authTimedOut: true })).toBe('landing')
  })

  it('shows auth after timeout if user was previously logged in', () => {
    expect(decideScreen({ ...base, authTimedOut: true, wasLoggedIn: true })).toBe('auth')
  })

  it('shows auth after timeout if explicit show-auth flag is set', () => {
    expect(decideScreen({ ...base, authTimedOut: true, showAuthFlag: true })).toBe('auth')
  })

  it('shows landing when not logged in and mode=landing', () => {
    expect(decideScreen({ ...base, currentUser: null })).toBe('landing')
  })

  it('shows auth when not logged in and mode=auth', () => {
    expect(decideScreen({ ...base, currentUser: null, mode: 'auth' })).toBe('auth')
  })

  it('shows auth right after logout via show-auth flag', () => {
    // simulating: user just hit logout, currentUser becomes null, flag set
    expect(decideScreen({ ...base, currentUser: null, showAuthFlag: true })).toBe('auth')
  })

  it('shows app when user and profile are loaded', () => {
    expect(decideScreen({
      ...base,
      currentUser: { uid: 'x' },
      userProfile: { accountType: 'owner' },
    })).toBe('app')
  })

  it('still loading if user present but profile null and not timed out', () => {
    expect(decideScreen({
      ...base,
      currentUser: { uid: 'x' },
    })).toBe('loading')
  })
})
