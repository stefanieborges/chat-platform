import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { AuthService } from '../services/auth-service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiResponse } from '../models/api-response';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true, 
  imports: [MatSlideToggleModule, FormsModule, MatInputModule, MatButtonModule, MatIconModule, RouterLink ],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
email!: string;
password!: string;
hide = signal(true);

private authService = inject(AuthService);
private snackBar = inject(MatSnackBar); 
private route = inject(Router);

  togglePassword(event: MouseEvent) {  
    this.hide.set(!this.hide());
    event.stopPropagation();
  }

  login() {
    this.authService.login(this.email, this.password).subscribe({
      next: (response) => { 
        this.authService.me().subscribe();
        this.snackBar.open('Login realizado com sucesso!', 'Fechar', { duration: 3000 });
      },
      error: (error:HttpErrorResponse) => {
        let erro = error.error as ApiResponse<string>;
        this.snackBar.open(`Erro ao realizar login: ${erro.message}`, 'Fechar', { duration: 5000 });
      },
      complete: () => { 
        this.route.navigate(['/']);
      }
    });
  } 
}
 