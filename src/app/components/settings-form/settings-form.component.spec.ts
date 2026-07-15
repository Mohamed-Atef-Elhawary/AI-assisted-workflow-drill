import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MatSnackBar } from '@angular/material/snack-bar';

import { SettingsFormComponent } from './settings-form.component';
import {
  DEFAULT_SETTINGS,
  USER_SETTINGS_STORAGE_KEY,
  UserSettings,
} from './settings-form.model';

describe('SettingsFormComponent', () => {
  const snackBarMock = {
    open: vi.fn(),
  };

  beforeEach(async () => {
    localStorage.clear();
    snackBarMock.open.mockReset();

    await TestBed.configureTestingModule({
      imports: [SettingsFormComponent],
      providers: [
        provideNoopAnimations(),
        { provide: MatSnackBar, useValue: snackBarMock },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  function createFixture(): ComponentFixture<SettingsFormComponent> {
    const fixture = TestBed.createComponent(SettingsFormComponent);
    fixture.detectChanges();
    return fixture;
  }

  async function fillValidForm(fixture: ComponentFixture<SettingsFormComponent>): Promise<void> {
    const component = fixture.componentInstance;

    component['form'].patchValue({
      displayName: 'Jane Doe',
      email: 'jane@example.com',
      password: '',
      emailNotifications: true,
      pushNotifications: false,
      marketingEmails: false,
    });
    component['form'].markAsDirty();

    await fixture.whenStable();
    await vi.waitFor(
      () => {
        expect(component['form'].pending).toBe(false);
        expect(component['form'].valid).toBe(true);
      },
      { timeout: 1000 },
    );
  }

  it('should create', () => {
    expect(createFixture().componentInstance).toBeTruthy();
  });

  describe('required field validation', () => {
    it('should be invalid when required fields are empty', () => {
      const component = createFixture().componentInstance;

      expect(component['form'].invalid).toBe(true);
      expect(component['form'].controls.displayName.errors?.['required']).toBe(true);
      expect(component['form'].controls.email.errors?.['required']).toBe(true);
    });

    it('should be invalid when display name is shorter than 3 characters', () => {
      const component = createFixture().componentInstance;

      component['form'].controls.displayName.setValue('Jo');
      component['form'].controls.displayName.markAsTouched();

      expect(component['form'].controls.displayName.invalid).toBe(true);
      expect(component['form'].controls.displayName.errors?.['minlength']).toBeTruthy();
    });

    it('should be invalid when email format is invalid', () => {
      const component = createFixture().componentInstance;

      component['form'].controls.email.setValue('not-an-email');
      component['form'].controls.email.markAsTouched();

      expect(component['form'].controls.email.invalid).toBe(true);
      expect(component['form'].controls.email.errors?.['email']).toBe(true);
    });

    it('should not show error messages until fields are touched', () => {
      const component = createFixture().componentInstance;

      expect(component['displayNameError']()).toBeNull();
      expect(component['emailError']()).toBeNull();

      component['form'].controls.displayName.markAsTouched();

      expect(component['displayNameError']()).toBe('Display name is required.');
    });
  });

  describe('password strength validation', () => {
    it('should allow an empty password because it is optional', () => {
      const component = createFixture().componentInstance;

      component['form'].controls.password.setValue('');
      component['form'].controls.password.markAsTouched();

      expect(component['form'].controls.password.valid).toBe(true);
      expect(component['passwordError']()).toBeNull();
    });

    it('should reject passwords shorter than 8 characters', () => {
      const component = createFixture().componentInstance;

      component['form'].controls.password.setValue('Ab1');
      component['form'].controls.password.markAsTouched();

      expect(component['form'].controls.password.invalid).toBe(true);
      expect(component['form'].controls.password.errors?.['minLength']).toBe(true);
      expect(component['passwordError']()).toContain('at least 8 characters');
    });

    it('should reject passwords without an uppercase letter', () => {
      const component = createFixture().componentInstance;

      component['form'].controls.password.setValue('password1');
      component['form'].controls.password.markAsTouched();

      expect(component['form'].controls.password.invalid).toBe(true);
      expect(component['form'].controls.password.errors?.['uppercase']).toBe(true);
    });

    it('should reject passwords without a number', () => {
      const component = createFixture().componentInstance;

      component['form'].controls.password.setValue('Password');
      component['form'].controls.password.markAsTouched();

      expect(component['form'].controls.password.invalid).toBe(true);
      expect(component['form'].controls.password.errors?.['number']).toBe(true);
    });

    it('should accept a strong password', () => {
      const component = createFixture().componentInstance;

      component['form'].controls.password.setValue('Password1');
      component['form'].controls.password.markAsTouched();

      expect(component['form'].controls.password.valid).toBe(true);
      expect(component['passwordError']()).toBeNull();
    });
  });

  describe('async email validation', () => {
    it('should mark taken@example.com as invalid after async validation', async () => {
      const fixture = createFixture();
      const component = fixture.componentInstance;

      component['form'].controls.email.setValue('taken@example.com');
      component['form'].controls.email.markAsTouched();

      await vi.waitFor(
        () => {
          expect(component['form'].controls.email.errors?.['emailTaken']).toBe(true);
        },
        { timeout: 1000 },
      );

      expect(component['emailError']()).toBe('This email is already taken.');
    });
  });

  describe('save and localStorage integration', () => {
    it('should disable save when the form is pristine', async () => {
      const fixture = createFixture();
      await fillValidForm(fixture);
      fixture.componentInstance['form'].markAsPristine();

      expect(fixture.componentInstance['saveDisabled']).toBe(true);
    });

    it('should disable save when the form is invalid', () => {
      const component = createFixture().componentInstance;
      component['form'].markAsDirty();

      expect(component['saveDisabled']).toBe(true);
    });

    it('should persist settings to localStorage and show a snackbar on save', async () => {
      const fixture = createFixture();
      const component = fixture.componentInstance;
      await fillValidForm(fixture);

      component['onSave']();

      const stored = JSON.parse(
        localStorage.getItem(USER_SETTINGS_STORAGE_KEY) ?? '{}',
      ) as UserSettings;

      expect(stored).toEqual({
        displayName: 'Jane Doe',
        email: 'jane@example.com',
        emailNotifications: true,
        pushNotifications: false,
        marketingEmails: false,
      });
      expect(snackBarMock.open).toHaveBeenCalledWith(
        'Settings saved successfully.',
        'Close',
        expect.objectContaining({ duration: 3000 }),
      );
      expect(component['form'].pristine).toBe(true);
      expect(component['form'].controls.password.value).toBe('');
    });

    it('should not persist invalid forms', () => {
      const component = createFixture().componentInstance;
      component['form'].markAsDirty();
      component['onSave']();

      expect(localStorage.getItem(USER_SETTINGS_STORAGE_KEY)).toBeNull();
      expect(snackBarMock.open).not.toHaveBeenCalled();
    });

    it('should load saved settings from localStorage on init', () => {
      const saved: UserSettings = {
        displayName: 'Stored User',
        email: 'stored@example.com',
        emailNotifications: false,
        pushNotifications: true,
        marketingEmails: true,
      };
      localStorage.setItem(USER_SETTINGS_STORAGE_KEY, JSON.stringify(saved));

      const component = createFixture().componentInstance;

      expect(component['form'].getRawValue()).toEqual({
        ...saved,
        password: '',
      });
      expect(component['form'].pristine).toBe(true);
    });
  });

  describe('reset behavior', () => {
    it('should revert to last saved state and mark the form pristine', async () => {
      const fixture = createFixture();
      const component = fixture.componentInstance;
      await fillValidForm(fixture);
      component['onSave']();

      component['form'].patchValue({
        displayName: 'Changed Name',
        emailNotifications: false,
      });
      component['form'].markAsDirty();

      component['onReset']();

      expect(component['form'].getRawValue()).toEqual({
        displayName: 'Jane Doe',
        email: 'jane@example.com',
        password: '',
        emailNotifications: true,
        pushNotifications: false,
        marketingEmails: false,
      });
      expect(component['form'].pristine).toBe(true);
    });

    it('should revert to defaults when nothing has been saved', () => {
      const component = createFixture().componentInstance;

      component['form'].patchValue({
        displayName: 'Temporary',
        email: 'temp@example.com',
      });
      component['form'].markAsDirty();

      component['onReset']();

      expect(component['form'].getRawValue()).toEqual({
        ...DEFAULT_SETTINGS,
        password: '',
      });
      expect(component['form'].pristine).toBe(true);
    });
  });
});
