import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  public userModel = {
    username: '',
    fullName: '',
    email: '',
    password: '',
    phoneNumber: '',
    birthDate: '',
    hasAcceptedTerms: false
  };

  public errorMessage: string = '';
  public successMessage: string = '';

  constructor(private authService: AuthService) { }

  public onSubmit() {
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.register(this.userModel).subscribe({
      next: (response) => {
        this.successMessage = 'Sikeres regisztráció és beléptetés!';
        console.log('Token elmentve:', response);
      },
      error: (err) => {
        this.errorMessage = err.error || 'Hiba történt a regisztráció során.';
      }
    });
  }
}
