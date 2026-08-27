import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { WallService } from '../../services/wall.service';
import { GymService } from '../../services/gym.service';
import { AuthService } from '../../services/auth.service';
import { jwtDecode } from 'jwt-decode';

@Component({
  selector: 'app-wall-list',
  templateUrl: './wall-list.component.html',
  styleUrls: ['./wall-list.component.css']
})
export class WallListComponent implements OnInit {
  public gymId!: number;
  public gymName: string = 'Mászóterem';
  public gymOwnerId: number | null = null;
  public currentUserId: number | null = null;
  public walls: any[] = [];

  public errorMessage: string = '';
  public successMessage: string = '';
  public isUploading: boolean = false;

  // Űrlap mezők kétirányú adatkötéshez (ngModel)
  public wallId: number = 0;
  public wallName: string = '';
  public wallType: string = 'Boulder';
  public selectedFile: FileList | null = null; // A fájlbeviteli mező natív típusa FileList
  public isEditMode: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private wallService: WallService,
    private gymService: GymService,
    public authService: AuthService
  ) { }

  ngOnInit(): void {
    this.gymId = Number(this.route.snapshot.paramMap.get('gymId'));
    this.extractCurrentUserId();
    this.loadGymDetails();
    this.loadWalls();
  }

  // Kiolvassuk a tokenből, hogy ki jelentkezett be a gép előtt
  private extractCurrentUserId(): void {
    const token = localStorage.getItem('justgoup_token');
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        this.currentUserId = parseInt(decoded.nameid || decoded['http://xmlsoap.org']);
      } catch (e) {
        this.currentUserId = null;
      }
    }
  }

  private loadGymDetails(): void {
    this.gymService.getGymById(this.gymId).subscribe({
      next: (gym: any) => {
        this.gymName = gym.name;
        this.gymOwnerId = gym.createdByUserId;
      },
      error: (err: any) => {
        console.error('Nem sikerült lekérni a terem részleteit:', err);
      }
    });
  }

  public loadWalls(): void {
    this.wallService.getWallsByGym(this.gymId).subscribe({
      next: (data: any[]) => {
        this.walls = data;
      },
      error: () => {
        this.errorMessage = 'Nem sikerült betölteni a falakat.';
      }
    });
  }

  // Típusbiztos fájlválasztó eseménykezelő
  public onFileSelected(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    if (inputElement.files && inputElement.files.length > 0) {
      this.selectedFile = inputElement.files;
    }
  }

  // Szerkesztés gomb: Átveszi a kártya adatait és feltölti az űrlapba
  public onEditWall(wall: any): void {
    this.isEditMode = true;
    this.wallId = wall.id;
    this.wallName = wall.name;
    this.wallType = wall.wallType;
    this.selectedFile = null; // A kép lecserélése alapból opcionális szerkesztésnél

    // Kitakarítjuk a fájl-input mező kijelzését a képernyőn
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }

  public onSubmit(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.wallName) {
      this.errorMessage = 'A szektor neve kötelező!';
      return;
    }

    this.isUploading = true;

    // Összeállítjuk a FormData-t a backend C# DTO struktúrája szerint
    const formData = new FormData();
    formData.append('name', this.wallName);
    formData.append('wallType', this.wallType);

    // Ha tallóztak be fájlt, hozzáadjuk a küldéshez
    if (this.selectedFile && this.selectedFile.length > 0) {
      formData.append('file', this.selectedFile[0]);
    }

    if (this.isEditMode) {
      // --- MODAL / ŰRLAP SZERKESZTÉS MENTÉSE (PUT) ---
      this.wallService.updateWall(this.wallId, formData).subscribe({
        next: () => {
          this.successMessage = 'Mászófal sikeresen frissítve!';
          this.resetForm();
          this.loadWalls();
        },
        error: (err: any) => {
          this.errorMessage = err.error || 'Hiba történt a szerkesztés során.';
          this.isUploading = false;
        }
      });
    } else {
      // --- ÚJ SZEKTOR HOZZÁADÁSA (POST) ---
      if (!this.selectedFile || this.selectedFile.length === 0) {
        this.errorMessage = 'Új szektor hozzáadásához a fénykép kötelező!';
        this.isUploading = false;
        return;
      }

      formData.append('climbingGymId', this.gymId.toString());

      this.wallService.createWall(formData).subscribe({
        next: () => {
          this.successMessage = 'Új mászófal sikeresen létrehozva és feltöltve!';
          this.resetForm();
          this.loadWalls();
        },
        error: (err: any) => {
          this.errorMessage = err.error || 'Hiba történt a feltöltés során.';
          this.isUploading = false;
        }
      });
    }
  }

  public onDeleteWall(id: number): void {
    if (confirm('Biztosan törölni szeretnéd ezt a szektort és a fotóját a felhőből?')) {
      this.wallService.deleteWall(id).subscribe({
        next: () => {
          this.successMessage = 'Szektor sikeresen törölve!';
          this.loadWalls();
        },
        error: (err: any) => {
          this.errorMessage = err.error || 'Nincs jogosultságod a szektor törléséhez.';
        }
      });
    }
  }

  // Űrlap visszaállítása alaphelyzetbe
  public resetForm(): void {
    this.wallId = 0;
    this.wallName = '';
    this.wallType = 'Boulder';
    this.selectedFile = null;
    this.isEditMode = false;

    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }
}
