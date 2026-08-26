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
  public gymOwnerId: number | null = null; // A terem tulajdonosának ID-ja
  public currentUserId: number | null = null; // A most bejelentkezett mászó ID-ja
  public walls: any[] = [];

  public errorMessage: string = '';
  public successMessage: string = '';
  public isUploading: boolean = false;

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
    this.gymId = Number(this.route.snapshot.paramMap.get('gymId'));
    this.extractCurrentUserId();
    this.loadGymDetails();
    this.loadWalls();
  }

  // Kiolvassuk, ki ül a gép előtt
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
        this.gymOwnerId = gym.createdByUserId; // Elmentjük, kié a terem
      }
    });
  }

  public loadWalls(): void {
    this.wallService.getWallsByGym(this.gymId).subscribe({
      next: (data: any[]) => this.walls = data,
      error: () => this.errorMessage = 'Nem sikerült betölteni a falakat.'
    });
  }

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
      this.errorMessage = 'Minden mező kitöltése kötelező!';
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
        this.successMessage = 'Mászófal feltöltve!';
        this.wallName = '';
        this.selectedFile = null;
        this.isUploading = false;
        this.loadWalls();
      },
      error: (err: any) => {
        this.errorMessage = err.error || 'Hiba a feltöltés során.';
        this.isUploading = false;
      }
    });
  }

  public onDeleteWall(id: number): void {
    if (confirm('Biztosan törölni szeretnéd a szektort?')) {
      this.wallService.deleteWall(id).subscribe({
        next: () => {
          this.successMessage = 'Szektor sikeresen törölve!';
          this.loadWalls();
        },
        error: (err: any) => this.errorMessage = err.error || 'Nincs jogosultságod.'
      });
    }
  }
}
