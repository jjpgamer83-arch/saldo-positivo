/**
 * Native WebAuthn Biometric Authentication Helper
 * Provides seamless Touch ID, Face ID, and Windows Hello integration
 */

export async function isBiometricsAvailable(): Promise<boolean> {
  if (typeof window === 'undefined' || !window.PublicKeyCredential) {
    return false;
  }
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

export async function authenticateWithBiometrics(userId: string = 'user'): Promise<boolean> {
  if (typeof window === 'undefined' || !window.PublicKeyCredential) {
    return false;
  }

  try {
    const challenge = new Uint8Array(32);
    if (window.crypto && window.crypto.getRandomValues) {
      window.crypto.getRandomValues(challenge);
    }

    const options: CredentialCreationOptions = {
      publicKey: {
        challenge,
        rp: {
          name: 'Saldo - Gestão Financeira',
        },
        user: {
          id: Uint8Array.from(userId, c => c.charCodeAt(0)),
          name: 'usuario@saldo.app',
          displayName: 'Usuário Saldo',
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' },  // ES256
          { alg: -257, type: 'public-key' }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
        },
        timeout: 60000,
      },
    };

    const credential = await navigator.credentials.create(options);
    return credential !== null;
  } catch (err: any) {
    // If user cancelled, or platform error, fail gracefully
    console.warn('Biometric authentication cancelled or not completed:', err?.message || err);
    return false;
  }
}
