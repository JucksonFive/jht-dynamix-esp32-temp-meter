// Simple localization strings. Extend or swap based on selected language.
// You can later add a language switcher that swaps this export.
export interface LocaleStrings {
  appTitle: string;
  logout: string;
  sidePanelTitle: string;
  noDevices: string;
  selectDeviceHelp: string;
  fromLabel: string;
  toLabel: string;
  tooltipSelectSingle: string;
  tooltipToggleMulti: string;
  sidePanelSelectionHelp: string;
  authWelcome: string;
  authSubtitle: string;
  authSignIn: string;
  authSignUp: string;
  authSigningIn: string;
  authSigningUp: string;
  authSigningInEllipsis: string;
  authSigningUpEllipsis: string;
  authCreateAccount: string;
  authAlreadyAccount: string;
  dateRange: string;
  temperatureHistory: string;
  loading: string;
  heroTagline: string; // Landing hero descriptive text
  deleteDevice: string;
  deleteAction: string;
}

// Default language bundle.
export const strings: LocaleStrings = {
  appTitle: "JT-DYNAMIX Dashboard",
  logout: "Logout",
  sidePanelTitle: "Devices",
  noDevices: "No devices yet.",
  selectDeviceHelp: "Select a device from the left to view data.",
  fromLabel: "From",
  toLabel: "To",
  tooltipSelectSingle: "Click to select only this device",
  tooltipToggleMulti:
    "Toggle multi-select (check to add or remove this device)",
  sidePanelSelectionHelp:
    "Click a device name to show only that device. Use the checkbox to add or remove devices for multi-selection.",
  authWelcome: "Welcome",
  authSubtitle: "Enter your credentials to access your dashboard",
  authSignIn: "Sign In",
  authSignUp: "Sign Up",
  authSigningIn: "Signing In",
  authSigningUp: "Signing Up",
  authSigningInEllipsis: "Signing In...",
  authSigningUpEllipsis: "Signing Up...",
  authCreateAccount: "Create an account",
  authAlreadyAccount: "Already have an account?",
  dateRange: "Date Range",
  temperatureHistory: "Temperature History",
  loading: "Loading...",
  heroTagline:
    "JT-DYNAMIX IoT telemetry platform — secure smart data collection with real-time analytics.",
  deleteDevice: "Delete Device",
  deleteAction:
    "Are you sure you want to delete this device? This action cannot be undone.",
};

export default strings;
