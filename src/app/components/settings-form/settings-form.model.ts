export const USER_SETTINGS_STORAGE_KEY = 'user-settings';

export interface UserSettings {
  displayName: string;
  email: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  marketingEmails: boolean;
}

export interface SettingsFormValue {
  displayName: string;
  email: string;
  password: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  marketingEmails: boolean;
}

export const DEFAULT_SETTINGS: UserSettings = {
  displayName: '',
  email: '',
  emailNotifications: true,
  pushNotifications: false,
  marketingEmails: false,
};

export const DEFAULT_FORM_VALUE: SettingsFormValue = {
  ...DEFAULT_SETTINGS,
  password: '',
};
