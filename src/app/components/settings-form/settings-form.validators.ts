import { AbstractControl, AsyncValidatorFn, ValidationErrors, ValidatorFn } from '@angular/forms';
import { delay, map, Observable, of } from 'rxjs';

const TAKEN_EMAIL = 'taken@example.com';

export function passwordStrengthValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as string;

    if (!value) {
      return null;
    }

    const errors: ValidationErrors = {};

    if (value.length < 8) {
      errors['minLength'] = true;
    }

    if (!/[A-Z]/.test(value)) {
      errors['uppercase'] = true;
    }

    if (!/[0-9]/.test(value)) {
      errors['number'] = true;
    }

    return Object.keys(errors).length ? errors : null;
  };
}

export function emailTakenAsyncValidator(): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    const email = (control.value as string)?.trim();

    if (!email) {
      return of(null);
    }

    return of(email).pipe(
      delay(300),
      map((value) => (value === TAKEN_EMAIL ? { emailTaken: true } : null)),
    );
  };
}
