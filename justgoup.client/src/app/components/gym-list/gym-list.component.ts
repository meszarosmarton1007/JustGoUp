import { Component, OnInit } from '@angular/core';
import { GymService } from '../../services/gym.service';
import { AuthService } from "../../services/auth.service";
import { jwtDecode } from "jwt-decode";

@Component({
  selector: 'app-gym-list',
  templateUrl: './gym-list.component.html',
  styleUrls: ['./gym-list.component.css']
})
export class GymListComponent implements OnInit {

  public gyms: any[] = [];
  public errorMessage: string = '';
  public successMessage: string = '';
 // public currentUserId: string | null = null;

  public currentUserId: number | null = null; // Átírtuk string-ről number-re!
  public gymModel = { id: 0, name: '', address: '', description: '' };
  public isEditMode: boolean = false;


  constructor(public gymService: GymService, public authService: AuthService) { }

  ngOnInit(): void {
    this.loadGyms();
    this.extrctUserId();
  }

  private extrctUserId() {
    const token = localStorage.getItem('justgoup_token');
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        this.currentUserId = parseInt(decoded.nameid || decoded['http://xmlsoap.org']);
      }
      catch (error) {
        this.currentUserId = null;
      }
    }
  }

  public loadGyms() {
    this.gymService.getGyms().subscribe({
      next: (data) => this.gyms = data,
      error: (err) => this.errorMessage = err.error || 'Hiba történt az mászóhelyek betöltése során.'
    });
  }

  public onSubmit() {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.isEditMode) {
      this.gymService.updateGym(this.gymModel.id, this.gymModel).subscribe({
        next: () => {
          this.successMessage = 'Mászóterem sikeresen frissítve!';
          this.resetForm();
          this.loadGyms();
        },
        error: (err) => this.errorMessage = err.error || 'Hiba a szerkesztés során.'
      });
    } else {
      this.gymService.createGym(this.gymModel).subscribe({
        next: () => {
          this.successMessage = 'Mászóterem sikeresen létrehozva!';
          this.resetForm();
          this.loadGyms();
        },
        error: (err) => {
          console.error('Szerver hiba:', err);
          // Ha a szerver validációs hibát ad vissza (C# BadRequest), azt a err.error.errors tartalmazza
          if (err.error && err.error.errors) {
            this.errorMessage = Object.values(err.error.errors).flat().join(' ');
          } else {
            this.errorMessage = err.error || 'Hiba a mentés során.';
          }
        }
      });
    }
  }

  public onEdit(gym: any) {
    this.isEditMode = true;
    this.gymModel = { ...gym };
  }

  public onDelete(id: number) {
    if (confirm('Biztosan törölni szeretnéd ezt a mászótermet?')) {
      this.gymService.deleteGym(id).subscribe({
        next: () => {
          this.successMessage = 'Mászóterem sikeresen törölve!';
          this.loadGyms();
        },
        error: (err) => this.errorMessage = err.error || 'Nincs jogosultságod a törléshez.'
      });
    }
  }

  public resetForm() {
    this.gymModel = { id: 0, name: '', address: '', description: '' };
    this.isEditMode = false;
  }


}
