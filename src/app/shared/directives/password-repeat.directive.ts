import { Directive } from '@angular/core';
import {AbstractControl, NG_VALIDATORS, ValidationErrors, Validators} from "@angular/forms";

@Directive({
  selector: '[passwordRepeat]',
  providers: [{provide: NG_VALIDATORS, useExisting: PasswordRepeatDirective, multi: true}],
})
export class PasswordRepeatDirective implements Validators{
  validate(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password') as AbstractControl;
    const passwordRepeat = control.get('passwordRepeat') as AbstractControl;

    if (password?.value !== passwordRepeat?.value) {
      passwordRepeat.setErrors({passwordRepeat: true});
      return {passwordRepeat: true};
    }
    return null;
  }
}
