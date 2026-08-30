import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RouteService } from '../../services/route.service';
import { CommentService } from '../../services/comment.service';
import { AuthService } from '../../services/auth.service';
import { jwtDecode } from 'jwt-decode';
import * as Konva from 'konva';

declare var cv: any;

@Component({
  selector: 'app-route-manager',
  templateUrl: './route-manager.component.html',
  styleUrls: ['./route-manager.component.css']
})
export class RouteManagerComponent implements OnInit {
  public wallId!: number;
  public gymId!: number; // Tisztán a backendről jövő adatbázis-érték tárolója
  public currentUserId: number | null = null;
  public routes: any[] = [];
  public selectedRoute: any = null;

  public isDataLoaded: boolean = true; 

  // Facebook-stílusú paralel komment tárolók (Út ID alapú kulcsokkal)
  public commentsByRoute: { [routeId: number]: any[] } = {};
  public rootCommentsByRoute: { [routeId: number]: any[] } = {};
  public newCommentTexts: { [routeId: number]: string } = {};
  public replyTexts: { [routeId: number]: string } = {};
  public activeReplyCommentIds: { [routeId: number]: number | null } = {};
  // ÚJ: Eltárolja, hogy pontosan melyik hozzászólásra (legyen az fő vagy al) válaszolunk éppen
  public actualTargetCommentIds: { [routeId: number]: number | null } = {};


  // Űrlap adatkötések (ngModel)
  public routeName: string = '';
  public routeGrade: string = '6A';
  public routeDescription: string = '';
  public isRouteEditMode: boolean = false;
  public editingRouteId: number = 0;

  // Tervezői ecset és lokális fájl konfigurációk
  public brushMode: 'ai-click' | 'freehand' = 'ai-click';
  public currentBrushColor: string = '#00ff00';
  public localSelectedFile: any = null;
  public localImageBase64: string = '';

  // Konva Canvas grafikus motor elemei
  private stage!: any;
  private layer!: any;
  private isDrawing: boolean = false;
  private currentLine!: any;
  private wallImageElement!: HTMLImageElement;
  private undoStack: string[] = [];
  private redoStack: string[] = [];

  constructor(
    private route: ActivatedRoute,
    private routeService: RouteService,
    private commentService: CommentService,
    public authService: AuthService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.wallId = Number(this.route.snapshot.paramMap.get('wallId'));
    this.extractCurrentUserId();
    this.loadRoutes();
  }

  private extractCurrentUserId(): void {
    const token = localStorage.getItem('justgoup_token');
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        this.currentUserId = parseInt(decoded.nameid || decoded['http://xmlsoap.org']);
      } catch (e) { this.currentUserId = null; }
    }
  }

  public loadRoutes(): void {
    this.routeService.getRoutesByWall(this.wallId).subscribe({
      next: (data: any[]) => {
        this.routes = data;

        // Ellenőrizzük, hogy a háttérből jövő lista nem üres-e
        if (this.routes && this.routes.length > 0) {

          // --- EZT A SORT JAVÍTSD KI PONTOSAN ERRE A [0]-S INDEXELÉSSEL ---
          this.gymId = this.routes[0].gymId;

        } else {
          // Ha még nincs út a falon, biztonsági mentsvárként az adatbázisodból kiindulva 2-re állítjuk
          this.gymId = 2;
        }

        // Inicializáljuk a Facebook-stílusú paralel szövegmezőket minden úthoz
        this.routes.forEach(route => {
          this.loadCommentsForRoute(route.id);
          this.newCommentTexts[route.id] = '';
          this.replyTexts[route.id] = '';
          this.activeReplyCommentIds[route.id] = null;
        });

        // Kényszerítjük az Angulart a HTML és a DOM azonnali újrafrissítésére
        this.cdr.detectChanges();

        // Kirajzoljuk a mentett Konva vásznakat
        this.renderAllSavedCanvases();
      }
    });
  }

  // Automatikusan felépíti és ráfeszíti a mentett rajzokat az összes hírfolyam kártyára külön-külön
  private renderAllSavedCanvases(): void {
    this.routes.forEach(route => {
      const containerId = 'canvas-route-' + route.id;
      const el = document.getElementById(containerId);
      if (!el) return;

      const stage = new Konva.default.Stage({ container: containerId, width: 700, height: 600 });
      const layer = new Konva.default.Layer();
      stage.add(layer);

      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.src = route.imageUrl || this.localImageBase64;
      img.onload = () => {
        const kImg = new Konva.default.Image({ x: 0, y: 0, image: img, width: 700, height: 600 });
        layer.add(kImg);
        kImg.moveToBottom();

        if (route.canvasDataJson && route.canvasDataJson !== '{}' && route.canvasDataJson !== '[]') {
          const lines = JSON.parse(route.canvasDataJson);
          lines.forEach((lineData: any) => layer.add(new Konva.default.Line(lineData)));
        }
        layer.draw();
      };
    });
  }

  // Típusbiztos helyi fájlbeolvasó a saját eszközről történő feltöltéshez
  public onLocalFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.localSelectedFile = input.files[0]; // Kijelöljük az első fizikai fájlt a listából
      const reader = new FileReader();
      reader.onload = () => { this.localImageBase64 = reader.result as string; };
      reader.readAsDataURL(this.localSelectedFile);
    }
  }

  public onStartDrawingSession(): void {
    if (!this.routeName.trim()) {
      alert('Kérjük, adj meg egy nevet az út indításához!');
      return;
    }
    if (!this.localImageBase64 && !this.isRouteEditMode) {
      alert('Kérjük, válassz ki egy fotót a saját eszközödről a tervezéshez!');
      return;
    }

    this.selectedRoute = {
      id: this.isRouteEditMode ? this.editingRouteId : 0,
      name: this.routeName,
      grade: this.routeGrade,
      canvasDataJson: this.isRouteEditMode ? this.selectedRoute.canvasDataJson : '[]'
    };

    setTimeout(() => this.initActiveCanvas(), 150);
  }

  private initActiveCanvas(): void {
    this.stage = new Konva.default.Stage({ container: 'canvas-container', width: 700, height: 600 });
    this.layer = new Konva.default.Layer();
    this.stage.add(this.layer);

    this.wallImageElement = new Image();
    this.wallImageElement.crossOrigin = 'Anonymous';
    this.wallImageElement.src = this.localImageBase64;
    this.wallImageElement.onload = () => {
      const konvaImage = new Konva.default.Image({ x: 0, y: 0, image: this.wallImageElement, width: 700, height: 600 });
      this.layer.add(konvaImage);
      konvaImage.moveToBottom();
      this.renderActiveLines(this.selectedRoute.canvasDataJson);
      this.saveHistoryState();
    };

    this.setupCanvasEvents();
  }

  private setupCanvasEvents(): void {
    this.stage.on('mousedown touchstart', () => {
      const pos = this.stage.getPointerPosition();
      if (!pos) return;

      if (this.brushMode === 'freehand') {
        this.isDrawing = true;
        this.redoStack = [];
        this.currentLine = new Konva.default.Line({
          stroke: this.currentBrushColor, strokeWidth: 4, points: [pos.x, pos.y], tension: 0.5, lineCap: 'round', lineJoin: 'round'
        });
        this.layer.add(this.currentLine);
      } else if (this.brushMode === 'ai-click') {
        this.redoStack = [];
        this.runAiHoldDetection(pos.x, pos.y);
      }
    });

    this.stage.on('mousemove touchmove', () => {
      if (!this.isDrawing || this.brushMode !== 'freehand') return;
      const pos = this.stage.getPointerPosition();
      if (!pos) return;
      this.currentLine.points(this.currentLine.points().concat([pos.x, pos.y]));
      this.layer.draw();
    });

    this.stage.on('mouseup touchend', () => {
      if (this.isDrawing) { this.isDrawing = false; this.saveHistoryState(); }
    });
  }

  private runAiHoldDetection(clickX: number, clickY: number): void {
    try {
      let src = cv.imread(this.wallImageElement);
      let dst = new cv.Mat();
      let gray = new cv.Mat();
      cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);
      cv.Canny(gray, dst, 50, 150, 3, false);

      let contours = new cv.MatVector();
      let hierarchy = new cv.Mat();
      cv.findContours(dst, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
      let foundPoints: number[] = [];

      for (let i = 0; i < contours.size(); ++i) {
        let cnt = contours.get(i);
        let rect = cv.boundingRect(cnt);
        if (clickX >= rect.x && clickX <= (rect.x + rect.width) && clickY >= rect.y && clickY <= (rect.y + rect.height)) {
          for (let j = 0; j < cnt.data32S.length; j += 2) {
            foundPoints.push(cnt.data32S[j], cnt.data32S[j + 1]);
          }
          cnt.delete();
          break;
        }
        cnt.delete();
      }

      if (foundPoints.length > 0) {
        this.layer.add(new Konva.default.Line({ points: foundPoints, stroke: this.currentBrushColor, strokeWidth: 4, closed: true, tension: 0.2, lineJoin: 'round' }));
      } else {
        this.layer.add(new Konva.default.Line({ points: [clickX - 15, clickY - 15, clickX + 15, clickY - 15, clickX + 15, clickY + 15, clickX - 15, clickY + 15], stroke: this.currentBrushColor, strokeWidth: 4, closed: true }));
      }
      this.layer.draw();
      this.saveHistoryState();

      src.delete(); dst.delete(); gray.delete(); contours.delete(); hierarchy.delete();
    } catch (error) { console.error("AI hiba:", error); }
  }

  private saveHistoryState(): void {
    const lines = this.layer.getChildren((node: any) => node.getClassName() === 'Line');
    const exportData = lines.map((line: any) => ({
      points: line.points(), stroke: line.stroke(), strokeWidth: line.strokeWidth(), closed: line.closed(), tension: line.tension()
    }));
    const stateString = JSON.stringify(exportData);
    this.undoStack.push(stateString);
    this.selectedRoute.canvasDataJson = stateString;
  }

  public onUndo(): void {
    if (this.undoStack.length <= 1) return;
    const currentState = this.undoStack.pop()!;
    this.redoStack.push(currentState);
    const previousState = this.undoStack[this.undoStack.length - 1];
    this.selectedRoute.canvasDataJson = previousState;
    this.renderActiveLines(previousState);
  }

  public onRedo(): void {
    if (this.redoStack.length === 0) return;
    const nextState = this.redoStack.pop()!;
    this.undoStack.push(nextState);
    this.selectedRoute.canvasDataJson = nextState;
    this.renderActiveLines(nextState);
  }

  private renderActiveLines(jsonString: string): void {
    this.layer.getChildren((node: any) => node.getClassName() === 'Line').forEach((n: any) => n.destroy());
    if (jsonString && jsonString !== '[]') {
      JSON.parse(jsonString).forEach((lineData: any) => this.layer.add(new Konva.default.Line(lineData)));
    }
    this.layer.draw();
    this.selectedRoute.canvasDataJson = jsonString;
  }

  public onSaveRouteProgress(): void {
    const formData = new FormData();
    formData.append('name', this.selectedRoute.name);
    formData.append('grade', this.routeGrade);
    formData.append('description', this.routeDescription);
    formData.append('canvasDataJson', this.selectedRoute.canvasDataJson);

    if (this.isRouteEditMode) {
      if (this.localSelectedFile) {
        formData.append('file', this.localSelectedFile);
      }
      this.routeService.updateRoute(this.editingRouteId, formData).subscribe({
        next: () => {
          alert('Mászóút sikeresen frissítve!');
          this.resetRouteForm();
          this.loadRoutes();
          this.selectedRoute = null;
        }
      });
    } else {
      if (!this.localSelectedFile) {
        alert('Új út létrehozásához kötelező fotót választani!');
        return;
      }
      formData.append('climbingWallId', this.wallId.toString());
      formData.append('file', this.localSelectedFile);

      this.routeService.createRoute(formData).subscribe({
        next: () => {
          alert('Új mászóút elmentve!');
          this.resetRouteForm();
          this.loadRoutes();
          this.selectedRoute = null;
        }
      });
    }
  }

  public onEditRouteMode(route: any, event: Event): void {
    event.stopPropagation();
    this.isRouteEditMode = true;
    this.editingRouteId = route.id;
    this.routeName = route.name;
    this.routeGrade = route.grade;
    this.routeDescription = route.description || '';
    this.localImageBase64 = route.imageUrl;
    this.selectedRoute = route;

    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => this.initActiveCanvas(), 150);
  }

  public resetRouteForm(): void {
    this.isRouteEditMode = false;
    this.editingRouteId = 0;
    this.routeName = ''; this.routeGrade = '6A'; this.routeDescription = '';
    this.localSelectedFile = null; this.localImageBase64 = '';
  }

  public onDeleteRoute(id: number, event: Event): void {
    event.stopPropagation();
    if (confirm('Biztosan törölni szeretnéd ezt a mászóútat?')) {
      this.routeService.deleteRoute(id).subscribe({ next: () => this.loadRoutes() });
    }
  }

  public loadCommentsForRoute(routeId: number): void {
    this.commentService.getCommentsByRoute(routeId).subscribe({
      next: (data: any[]) => {
        // camelCase formátumban mentjük el a backendről érkező tömböt
        this.commentsByRoute[routeId] = data;

        // Kiszűrjük a főkommenteket (ahol a szülő ID null)
        this.rootCommentsByRoute[routeId] = data.filter(c => c.parentCommentId === null);

        // --- EZ A KULCS: Azonnal kényszerítjük az Angulart, hogy rajzolja ki a buborékokat a HTML-ben! ---
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error(`Nem sikerült betölteni a kommenteket a(z) ${routeId} úthoz:`, err);
      }
    });
  }

  public getRepliesForRoute(routeId: number, commentId: number): any[] {
    const allComments = this.commentsByRoute[routeId] || [];
    return allComments.filter(c => c.parentCommentId === commentId);
  }

  public onAddCommentForRoute(routeId: number): void {
    const text = this.newCommentTexts[routeId];
    if (!text || !text.trim()) return;

    this.commentService.addComment(<any>{
      CommentText: text,
      ClimbingRouteId: routeId,
      ParentCommentId: null
    }).subscribe({
      next: () => {
        this.newCommentTexts[routeId] = '';
        this.loadCommentsForRoute(routeId);
      }
    });
  }


  public onAddReplyForRoute(routeId: number, parentCommentId: number): void {
    const text = this.replyTexts[routeId];
    if (!text || !text.trim()) return;

    // Kinyerjük a pontos célpontot (ha valamiért üres, akkor az eredeti főkomment marad a mentsvár)
    const exactParentId = this.actualTargetCommentIds[routeId] || parentCommentId;

    this.commentService.addComment(<any>{
      CommentText: text,
      ClimbingRouteId: routeId,
      ParentCommentId: exactParentId // <-- ITT KÜLDJÜK BE A TŰPONTOS REAKCIÓ ID-T!
    }).subscribe({
      next: () => {
        this.replyTexts[routeId] = '';
        this.activeReplyCommentIds[routeId] = null;
        this.actualTargetCommentIds[routeId] = null;
        this.loadCommentsForRoute(routeId);
      },
      error: (err: any) => {
        console.error('Hiba történt a válasz beküldése során:', err);
      }
    });
  }

  public onOpenReplyInput(routeId: number, mainCommentId: number, targetCommentId: number): void {
    this.activeReplyCommentIds[routeId] = mainCommentId; // Ez nyitja meg a HTML input dobozt
    this.actualTargetCommentIds[routeId] = targetCommentId; // Ez lesz a tényleges ParentCommentId a mentéskor
    this.cdr.detectChanges();
  }

}

