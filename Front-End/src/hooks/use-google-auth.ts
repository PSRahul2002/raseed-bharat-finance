import { useEffect, useCallback } from 'react';

// TypeScript declarations for Google Identity Services
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: GoogleIdentityConfig) => void;
          renderButton: (parent: HTMLElement, options: GoogleButtonConfig) => void;
          prompt: () => void;
        };
      };
    };
  }
}

interface GoogleIdentityConfig {
  client_id: string;
  callback: (response: CredentialResponse) => void;
  auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
  use_fedcm_for_prompt?: boolean;
}

interface GoogleButtonConfig {
  theme?: 'outline' | 'filled_blue' | 'filled_black';
  size?: 'large' | 'medium' | 'small';
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  shape?: 'rectangular' | 'pill' | 'circle' | 'square';
  logo_alignment?: 'left' | 'center';
  width?: string;
  locale?: string;
}

interface CredentialResponse {
  credential: string;
  select_by?: string;
}

interface GoogleUser {
  sub: string; // Google user ID
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  email: string;
  email_verified: boolean;
}

interface UseGoogleAuthOptions {
  onSuccess: (user: GoogleUser) => void;
  onError?: (error: string) => void;
  autoSelect?: boolean;
}

export const useGoogleAuth = ({ onSuccess, onError, autoSelect = false }: UseGoogleAuthOptions) => {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  // Function to decode JWT token
  const decodeJwtResponse = (token: string): GoogleUser => {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  };

  const handleCredentialResponse = useCallback((response: CredentialResponse) => {
    try {
      const userObject = decodeJwtResponse(response.credential);
      onSuccess(userObject);
    } catch (error) {
      console.error('Error decoding Google response:', error);
      onError?.('Failed to process Google login response');
    }
  }, [onSuccess, onError]);

  const initializeGoogleAuth = useCallback(() => {
    if (!window.google || !clientId) {
      console.warn('Google Identity Services not loaded or client ID not configured');
      return;
    }

    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
        auto_select: autoSelect,
        cancel_on_tap_outside: false,
        use_fedcm_for_prompt: true, // Enable FedCM for better COOP handling
      });
    } catch (error) {
      console.error('Error initializing Google Auth:', error);
    }
  }, [clientId, handleCredentialResponse, autoSelect]);

  const renderGoogleButton = useCallback((elementId: string, options?: GoogleButtonConfig) => {
    if (!window.google) {
      console.warn('Google Identity Services not loaded');
      return;
    }

    const element = document.getElementById(elementId);
    if (!element) {
      console.warn(`Element with ID ${elementId} not found`);
      return;
    }

    // Clear existing content
    element.innerHTML = '';

    const defaultOptions: GoogleButtonConfig = {
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      shape: 'rectangular',
      width: '320', // Use pixel value instead of percentage
      ...options,
    };

    try {
      window.google.accounts.id.renderButton(element, defaultOptions);
    } catch (error) {
      console.error('Error rendering Google button:', error);
    }
  }, []);

  const showOneTapPrompt = useCallback(() => {
    if (!window.google) {
      console.warn('Google Identity Services not loaded');
      return;
    }
    window.google.accounts.id.prompt();
  }, []);

  useEffect(() => {
    // Initialize when Google script loads
    const checkGoogleLoaded = () => {
      if (window.google && window.google.accounts && window.google.accounts.id) {
        initializeGoogleAuth();
      } else {
        // Check again after a short delay
        setTimeout(checkGoogleLoaded, 100);
      }
    };

    // Initial check
    checkGoogleLoaded();

    // Also listen for the Google script load event
    const handleGoogleLoad = () => {
      if (window.google && window.google.accounts && window.google.accounts.id) {
        initializeGoogleAuth();
      }
    };

    // Add event listener for when Google script loads
    window.addEventListener('google-loaded', handleGoogleLoad);

    return () => {
      window.removeEventListener('google-loaded', handleGoogleLoad);
    };
  }, [initializeGoogleAuth]);

  return {
    renderGoogleButton,
    showOneTapPrompt,
    isGoogleLoaded: !!(window.google && window.google.accounts && window.google.accounts.id),
  };
};

export type { GoogleUser, GoogleButtonConfig };
