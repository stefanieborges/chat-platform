import { Component, inject, signal } from '@angular/core';
import { AuthService } from '../services/auth-service';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiResponse } from '../models/api-response';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-register',
  imports: [MatSlideToggleModule, FormsModule, MatInputModule, MatButtonModule ,MatIconModule, RouterLink ],
  templateUrl: './register.html',
  styleUrl: './register.css'
})

export class Register {
  email!: string;
  password!: string;
  fullname!: string;
  userName!: string;
  profileImageFile: File | null = null;
  profilePicture: string = 'https://randomuser.me/api/portraits/lego/5.jpg';

  authservice = inject(AuthService);
  snackBar = inject(MatSnackBar);
  router = inject(Router);
  hide = signal(true);

  togglePassword(event: MouseEvent){
    this.hide.set(!this.hide());    
  }

  onFileSelected($event: any) {
    const file: File = $event.target.files[0];
    this.profileImageFile = file;
    if(file){ 

      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.profilePicture = e.target.result as string;
      }

      reader.readAsDataURL(file);
    }
  }

  register() {
    let formData = new FormData();
    formData.append('email', this.email);
    formData.append('password', this.password);
    formData.append('fullName', this.fullname);
    formData.append('userName', this.userName);
    formData.append('profileImage', this.profileImageFile!);
    this.authservice.register(formData).subscribe({
      next: (response) => {
        this.snackBar.open('Registro realizado com sucesso!', 'Fechar', { duration: 3000 }); 
      },
      error: (error:HttpErrorResponse) => {
        let erro = error.error as ApiResponse<string>;
        this.snackBar.open(`Erro ao registrar: ${erro.error}`, 'Fechar', { duration: 3000 });
      },
      complete: () => {
        this.router.navigate(['/']);
      }
    });
  }
}
