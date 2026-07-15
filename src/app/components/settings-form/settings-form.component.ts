import { Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';

import {
  DEFAULT_FORM_VALUE,
  DEFAULT_SETTINGS,
  SettingsFormValue,
  USER_SETTINGS_STORAGE_KEY,
  UserSettings,
} from './settings-form.model';
import { emailTakenAsyncValidator, passwordStrengthValidator } from './settings-form.validators';

type SettingsFormControls = {
  displayName: FormControl<string>;
  email: FormControl<string>;
  password: FormControl<string>;
  emailNotifications: FormControl<boolean>;
  pushNotifications: FormControl<boolean>;
  marketingEmails: FormControl<boolean>;
};

@Component({
  selector: 'app-settings-form',
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    MatButtonModule,
  ],
  templateUrl: './settings-form.component.html',
})
export class SettingsFormComponent implements OnInit {
  private readonly snackBar = inject(MatSnackBar);

  protected lastSavedSettings: UserSettings = { ...DEFAULT_SETTINGS };

  protected readonly form = new FormGroup<SettingsFormControls>({
    displayName: new FormControl(DEFAULT_FORM_VALUE.displayName, {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3)],
    }),
    email: new FormControl(DEFAULT_FORM_VALUE.email, {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
      asyncValidators: [emailTakenAsyncValidator()],
      updateOn: 'blur',
    }),
    password: new FormControl(DEFAULT_FORM_VALUE.password, {
      nonNullable: true,
      validators: [passwordStrengthValidator()],
    }),
    emailNotifications: new FormControl(DEFAULT_FORM_VALUE.emailNotifications, {
      nonNullable: true,
    }),
    pushNotifications: new FormControl(DEFAULT_FORM_VALUE.pushNotifications, {
      nonNullable: true,
    }),
    marketingEmails: new FormControl(DEFAULT_FORM_VALUE.marketingEmails, {
      nonNullable: true,
    }),
  });

  ngOnInit(): void {
    this.loadSettings();
  }

  protected get saveDisabled(): boolean {
    return !this.form.dirty || this.form.invalid || this.form.pending;
  }

  protected onSave(): void {
    if (this.form.invalid || this.form.pending) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const settings = this.toPersistedSettings(value);

    localStorage.setItem(USER_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    this.lastSavedSettings = settings;
    this.form.patchValue({ password: '' });
    this.form.markAsPristine();

    this.snackBar.open('Settings saved successfully.', 'Close', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }

  protected onReset(): void {
    this.applySettings(this.lastSavedSettings);
    this.form.markAsPristine();
  }

  protected displayNameError(): string | null {
    const control = this.form.controls.displayName;

    if (!control.touched || !control.errors) {
      return null;
    }

    if (control.errors['required']) {
      return 'Display name is required.';
    }

    if (control.errors['minlength']) {
      return 'Display name must be at least 3 characters.';
    }

    return null;
  }

  protected emailError(): string | null {
    const control = this.form.controls.email;

    if (!control.touched || !control.errors) {
      return null;
    }

    if (control.errors['required']) {
      return 'Email is required.';
    }

    if (control.errors['email']) {
      return 'Enter a valid email address.';
    }

    if (control.errors['emailTaken']) {
      return 'This email is already taken.';
    }

    return null;
  }

  protected passwordError(): string | null {
    const control = this.form.controls.password;

    if (!control.touched || !control.errors) {
      return null;
    }

    const errors = control.errors;

    if (errors['minLength'] || errors['uppercase'] || errors['number']) {
      return 'Password must be at least 8 characters and include one uppercase letter and one number.';
    }

    return null;
  }

  private loadSettings(): void {
    const stored = localStorage.getItem(USER_SETTINGS_STORAGE_KEY);

    if (!stored) {
      this.lastSavedSettings = { ...DEFAULT_SETTINGS };
      this.applySettings(this.lastSavedSettings);
      return;
    }

    try {
      const parsed = JSON.parse(stored) as Partial<UserSettings>;
      this.lastSavedSettings = {
        ...DEFAULT_SETTINGS,
        ...parsed,
      };
    } catch {
      this.lastSavedSettings = { ...DEFAULT_SETTINGS };
    }

    this.applySettings(this.lastSavedSettings);
  }

  private applySettings(settings: UserSettings): void {
    this.form.reset({
      ...settings,
      password: '',
    });
  }

  private toPersistedSettings(value: SettingsFormValue): UserSettings {
    return {
      displayName: value.displayName.trim(),
      email: value.email.trim(),
      emailNotifications: value.emailNotifications,
      pushNotifications: value.pushNotifications,
      marketingEmails: value.marketingEmails,
    };
  }
}
