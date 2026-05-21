// Pure decision function: which screen to render given auth state.
// Output: 'loading' | 'auth' | 'landing' | 'app'
export function decideScreen({ currentUser, userProfile, authTimedOut, wasLoggedIn, showAuthFlag, mode }) {
  // Still resolving — show loading unless we've timed out
  if (currentUser === undefined && userProfile === null) {
    if (authTimedOut) {
      return (mode === 'auth' || wasLoggedIn || showAuthFlag) ? 'auth' : 'landing'
    }
    return 'loading'
  }
  if (currentUser === undefined && userProfile !== null && !authTimedOut) {
    return 'loading'
  }
  if (currentUser === null || (authTimedOut && currentUser === undefined)) {
    return (mode === 'auth' || wasLoggedIn || showAuthFlag) ? 'auth' : 'landing'
  }
  if (currentUser && userProfile) return 'app'
  return 'loading'
}
