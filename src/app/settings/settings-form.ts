import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

export interface AppSettings {
  displayName: string;
  email: string;
  language: string;
  theme: 'light' | 'dark' | 'system';
  emailNotifications: boolean;
  pushNotifications: boolean;
  marketingEmails: boolean;
}

const SETTINGS_STORAGE_KEY = 'app-settings';

const DEFAULT_SETTINGS: AppSettings = {
  displayName: '',
  email: '',
  language: 'en',
  theme: 'system',
  emailNotifications: true,
  pushNotifications: false,
  marketingEmails: false,
};

@Component({
  selector: 'app-settings-form',
  imports: [ReactiveFormsModule],
  templateUrl: './settings-form.html',
  styleUrl: './settings-form.css',
})
export class SettingsForm implements OnInit {
  private readonly fb = inject(FormBuilder);

  protected readonly languages = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
  ];

  protected readonly themes = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'system', label: 'System' },
  ];

  protected readonly saveMessage = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    displayName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    language: ['en', Validators.required],
    theme: ['system' as AppSettings['theme'], Validators.required],
    emailNotifications: [true],
    pushNotifications: [false],
    marketingEmails: [false],
  });

  ngOnInit(): void {
    const saved = this.loadSettings();
    if (saved) {
      this.form.patchValue(saved);
    }
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(this.form.getRawValue()));
    this.saveMessage.set('Settings saved successfully.');
    setTimeout(() => this.saveMessage.set(null), 3000);
  }

  protected reset(): void {
    this.form.reset(DEFAULT_SETTINGS);
    localStorage.removeItem(SETTINGS_STORAGE_KEY);
    this.saveMessage.set('Settings reset to defaults.');
    setTimeout(() => this.saveMessage.set(null), 3000);
  }

  protected isInvalid(controlName: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && control.touched;
  }

  private loadSettings(): AppSettings | null {
    try {
      const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as AppSettings) : null;
    } catch {
      return null;
    }
  }
}
