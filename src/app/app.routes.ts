import { Routes } from '@angular/router';

import { SettingsForm } from './settings/settings-form';

export const routes: Routes = [
  { path: '', component: SettingsForm },
  { path: 'settings', redirectTo: '', pathMatch: 'full' },
];
