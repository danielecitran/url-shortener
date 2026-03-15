declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              theme?: "outline" | "filled_blue" | "filled_black";
              size?: "large" | "medium" | "small";
              type?: "standard" | "icon";
              shape?: "rectangular" | "pill" | "circle" | "square";
              text?: "signin_with" | "signup_with" | "continue_with" | "signin";
              width?: string | number;
            },
          ) => void;
          prompt: (
            callback?: (notification: {
              isNotDisplayed: () => boolean;
              isSkippedMoment: () => boolean;
            }) => void,
          ) => void;
        };
      };
    };
  }
}

let googleScriptPromise: Promise<void> | null = null;

function loadGoogleScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Auth ist nur im Browser verfügbar"));
  }

  if (window.google?.accounts?.id) {
    return Promise.resolve();
  }

  if (googleScriptPromise) {
    return googleScriptPromise;
  }

  googleScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://accounts.google.com/gsi/client"]',
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("Google Script konnte nicht geladen werden")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Google Script konnte nicht geladen werden"));
    document.head.appendChild(script);
  });

  return googleScriptPromise;
}

export async function getGoogleIdToken(clientId: string): Promise<string> {
  await loadGoogleScript();

  return new Promise((resolve, reject) => {
    const googleId = window.google?.accounts?.id;
    if (!googleId) {
      reject(new Error("Google Identity Services ist nicht verfügbar"));
      return;
    }

    let settled = false;
    let focusListenerAttached = false;
    let focusCheckTimeout: number | null = null;

    const cleanupFocusListener = () => {
      if (focusListenerAttached) {
        window.removeEventListener("focus", handleWindowFocus);
        focusListenerAttached = false;
      }
      if (focusCheckTimeout !== null) {
        window.clearTimeout(focusCheckTimeout);
        focusCheckTimeout = null;
      }
    };

    const settleWithReject = (message: string) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      cleanupFocusListener();
      reject(new Error(message));
    };

    const settleWithResolve = (token: string) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      cleanupFocusListener();
      resolve(token);
    };

    function handleWindowFocus() {
      if (settled) return;
      if (focusCheckTimeout !== null) {
        window.clearTimeout(focusCheckTimeout);
      }

      // If focus returns but no credential callback follows shortly,
      // user most likely closed/cancelled the Google popup.
      focusCheckTimeout = window.setTimeout(() => {
        if (settled) return;
        settleWithReject("Google-Anmeldung wurde abgebrochen");
      }, 450);
    }

    const attachFocusListener = () => {
      if (focusListenerAttached) return;
      window.addEventListener("focus", handleWindowFocus);
      focusListenerAttached = true;
    };

    const timeout = window.setTimeout(() => {
      settleWithReject(
        "Google-Anmeldung wurde nicht gestartet. Bitte Pop-up-Blocker prüfen.",
      );
    }, 20000);

    googleId.initialize({
      client_id: clientId,
      callback: (response) => {
        if (response.credential) {
          settleWithResolve(response.credential);
        } else {
          settleWithReject("Google-Anmeldung wurde abgebrochen");
        }
      },
    });

    const containerId = "shortr-google-hidden-button";
    let container = document.getElementById(containerId);
    if (!container) {
      container = document.createElement("div");
      container.id = containerId;
      container.style.position = "fixed";
      container.style.left = "-9999px";
      container.style.top = "-9999px";
      container.style.width = "1px";
      container.style.height = "1px";
      container.style.overflow = "hidden";
      document.body.appendChild(container);
    }

    container.innerHTML = "";
    googleId.renderButton(container, {
      type: "standard",
      text: "continue_with",
      theme: "outline",
      size: "large",
      shape: "pill",
      width: 260,
    });

    const clickable =
      container.querySelector<HTMLElement>('div[role="button"]') ??
      container.querySelector<HTMLElement>("div");

    if (clickable) {
      attachFocusListener();
      clickable.click();
      return;
    }

    // Fallback to One Tap if hidden rendered button couldn't be clicked.
    googleId.prompt((notification) => {
      if (settled) return;
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        settleWithReject("Google-Anmeldung ist aktuell nicht verfügbar");
      }
    });
  });
}

export function decodeGoogleTokenPayload(
  idToken: string,
): Record<string, unknown> {
  const parts = idToken.split(".");
  if (parts.length < 2) return {};
  const payload = parts[1]
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(parts[1].length / 4) * 4, "=");

  try {
    const decoded = atob(payload);
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return {};
  }
}
