import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserApiService } from '../../shared/api/user-api.service';
import { first, take } from 'rxjs';
import { UserLogin } from '../../model/user.models';
import { Router } from '@angular/router';
import { Store } from '@ngxs/store';
import { UserActions } from '../../store/user/userState.actions';

@Component({
  selector: 'app-user-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-login.component.html',
  styleUrl: './user-login.component.scss'
})
export class UserLoginComponent {
  loginForm = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(75)]],
    password: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(75)]]
  })

  constructor (
    private fb: FormBuilder,
    private userApi: UserApiService,
    private router: Router,
    private store: Store
  ) {}

  protected clearForm() {
    this.loginForm.setValue({ username:'',  password: '' });
  }

  protected onSubmit() {
    const values: any = this.loginForm.value;
    if (!values) {
      return;
    }
    else if(values.username && values.password) {
      const loginBody: UserLogin = {
        username: values.username,
        password: values.password
      }
      console.log(loginBody);
      this.userApi.authenticateUser(loginBody).pipe(take(1), first())
      .subscribe(
        {
          next: (value: any) => {
            // console.log('values');
            // console.log(value);
            this.store.dispatch(new UserActions.SetUserDataOnLogin(JSON.parse(value.data)));
            this.router.navigate(['home']);
            // console.log('platformId', localStorage);
            
          },
          error: (error: any) => {
            // todo: error handling
            console.error(error)
          }
        }
      )
    }
  }

  // protected attemptUserLogin(form: NgForm) {
  //   console.log(form.value);
  //   this.userApi.authenticateUser(form.value).pipe(take(1), first())
  //   .subscribe(
  //     {
  //       next: (value: any) => {
  //         console.log(value);

  //       },
  //       error: (error: any) => console.error(error),
  //       complete: () => console.log('Completed User Login'),
  //     }
  //   )
  // }
}
