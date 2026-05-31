import { FirebaseError } from 'firebase/app'

const CODE_TO_KEY: Record<string, string> = {
  'auth/invalid-credential':        'firebaseInvalidCredential',
  'auth/invalid-login-credentials': 'firebaseInvalidCredential',
  'auth/email-already-in-use':      'firebaseEmailInUse',
  'auth/user-not-found':            'firebaseUserNotFound',
  'auth/wrong-password':            'firebaseWrongPassword',
  'auth/weak-password':             'firebaseWeakPassword',
  'auth/invalid-email':             'firebaseInvalidEmail',
  'auth/too-many-requests':         'firebaseTooManyRequests',
  'auth/network-request-failed':    'firebaseNetworkFailed',
  'auth/user-disabled':             'firebaseUserDisabled',
  'permission-denied':              'firebasePermissionDenied',
  'unavailable':                    'firebaseUnavailable',
  'not-found':                      'firebaseNotFound',
}

export function getFirebaseErrorKey(
  err: unknown,
  overrides?: Partial<Record<string, string>>,
): string {
  if (err instanceof FirebaseError) {
    return overrides?.[err.code] ?? CODE_TO_KEY[err.code] ?? 'firebaseUnknown'
  }
  return 'firebaseUnknown'
}
