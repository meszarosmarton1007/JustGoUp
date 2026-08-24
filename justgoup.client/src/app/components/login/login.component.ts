import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {

  public loginModel = {
    email: '',
    password: ''
  };

  public errorMessage: string = '';
  public successMessage: string = '';

  constructor(private authService: AuthService, private router: Router) { }

  public onSubmit() {
    this.errorMessage = '';
    this.successMessage = '';

    // Call the login method from AuthService
    this.authService.login(this.loginModel).subscribe({
      next: (response) => {
        this.successMessage = 'Sikeres belépés!';
        console.log('Token elmentve:', response.username);

        // Redirect to the gym page after a short delay
        setTimeout(() => {
          this.router.navigate(['/gym']);
        }, 1000);
      },
      error: (error) => {
        // Handle error response
        this.errorMessage =  error.error || 'Hibás email vagy jelszó';
        console.error('Belépés hiba:', error);
      }
    });
  }
}
