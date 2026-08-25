import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { WallService } from '../../services/wall.service';
import { GymService } from '../../services/gym.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-wall-list',
  templateUrl: './wall-list.component.html',
  styleUrls: ['./wall-list.component.css']
})
export class WallListComponent implements OnInit {
  public gymId!: number;
  public gymName: string = 'Mászóterem';
  public gymOwnerId: number | null = null;
  public walls: any[] = [];

  public errorMessage: string = '';
  public successMessage: string = '';
  public isUploading: boolean = false;

  // Űrlap adatok az új falhoz
  public wallName: string = '';
  public wallType: string = 'Boulder';
  public selectedFile: File | null = null;

  constructor(
    private route: ActivatedRoute,
    private wallService: WallService,
    private gymService: GymService,
    public authService: AuthService
  ) { }

  ngOnInit(): void {
    // Kiolvassuk az URL-ből a terem ID-ját
    this.gymId = Number(this.route.snapshot.paramMap.get('gymId'));

    this.loadGymDetails();
    this.loadWalls();
  }

  private loadGymDetails(): void {
    this.gymService.getGymById(this.gymId).subscribe({
      next: (gym: any) => {
        this.gymName = gym.name;
        this.gymOwnerId = gym.createdByUserId;
      },
      error: (err: any) => {
        console.error('Nem sikerült betölteni a terem részleteit:', err);
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

  // Típusbiztos fájlválasztás kezelő a TS7006 hiba ellen
  public onFileSelected(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    if (inputElement.files && inputElement.files.length > 0) {
      this.selectedFile = inputElement.files[0];
    }
  }

  public onSubmit(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.wallName || !this.selectedFile) {
      this.errorMessage = 'A fal neve és a fénykép kiválasztása kötelező!';
      return;
    }

    this.isUploading = true;
    const formData = new FormData();
    formData.append('name', this.wallName);
    formData.append('wallType', this.wallType);
    formData.append('climbingGymId', this.gymId.toString());
    formData.append('file', this.selectedFile);

    this.wallService.createWall(formData).subscribe({
      next: () => {
        this.successMessage = 'A mászófal és a fotó sikeresen feltöltve a felhőbe!';
        this.wallName = '';
        this.selectedFile = null;
        this.isUploading = false;

        // Reseteljük a fájl-beviteli mezőt a HTML-ben
        const fileInput = document.getElementById('fileInput') as HTMLInputElement;
        if (fileInput) fileInput.value = '';

        this.loadWalls();
      },
      error: (err: any) => {
        this.errorMessage = err.error || 'Hiba történt a feltöltés során.';
        this.isUploading = false;
      }
    });
  }

  public onDeleteWall(id: number): void {
    if (confirm('Biztosan törölni szeretnéd ezt a szektort és a hozzá tartozó képet a felhőből?')) {
      this.wallService.deleteWall(id).subscribe({
        next: () => {
          this.successMessage = 'Szektor sikeresen törölve!';
          this.loadWalls();
        },
        error: (err: any) => {
          this.errorMessage = err.error || 'Nincs jogosultságod a törléshez.';
        }
      });
    }
  }
}
