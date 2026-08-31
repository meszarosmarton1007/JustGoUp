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

  public activeModalRoute: any = null;

  public isDataLoaded: boolean = true;

  private stokliPoints: any[] = [];

  // Facebook-stílusú paralel komment tárolók (Út ID alapú kulcsokkal)
  public commentsByRoute: { [routeId: number]: any[] } = {};
  public rootCommentsByRoute: { [routeId: number]: any[] } = {};
  public newCommentTexts: { [routeId: number]: string } = {};
  public replyTexts: { [routeId: number]: string } = {};
  public activeReplyCommentIds: { [routeId: number]: number | null } = {};
  // Eltárolja, hogy pontosan melyik hozzászólásra (legyen az fő vagy al) válaszolunk éppen
  public actualTargetCommentIds: { [routeId: number]: number | null } = {};

  // Nyomon követi, hogy melyik útnál hány darab főkomment látható jelenleg (alapértelmezetten 1)
  public visibleCommentsCount: { [routeId: number]: number } = {};

  // Nyomon követi, hogy egy adott komment alatt hány al-válasz látható jelenleg (alapértelmezetten 2)
  public visibleRepliesCount: { [commentId: number]: number } = {};

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

        if (this.routes && this.routes.length > 0) {
          this.gymId = this.routes[0].gymId;
        }

        this.routes.forEach(route => {
          this.commentsByRoute[route.id] = [];
          this.rootCommentsByRoute[route.id] = [];

          // ALAPÉRTELMEZETT LIMIT: Minden kártya alatt kezdetben szigorúan csak 1 főkomment látható
          if (this.visibleCommentsCount[route.id] === undefined) {
            this.visibleCommentsCount[route.id] = 1;
          }

          this.newCommentTexts[route.id] = '';
          this.replyTexts[route.id] = '';
          this.activeReplyCommentIds[route.id] = null;

          this.loadCommentsForRoute(route.id);
        });

        this.cdr.detectChanges();
        setTimeout(() => this.renderAllSavedCanvases(), 300);
      }
    });
  }


  // Automatikusan felépíti és ráfeszíti a mentett rajzokat az összes hírfolyam kártyára külön-külön
  /*private renderAllSavedCanvases(): void {
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
  }*/

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

      // Ha szabadkézi módban vagyunk, elindítjuk a klasszikus ecsetvonal-húzást
      if (this.brushMode === 'freehand') {
        this.isDrawing = true;
        this.redoStack = [];
        this.currentLine = new Konva.default.Line({
          stroke: this.currentBrushColor,
          strokeWidth: 4,
          points: [pos.x, pos.y],
          tension: 0.5,
          lineCap: 'round',
          lineJoin: 'round'
        });
        this.layer.add(this.currentLine);
      }
      // Ha Stökli módban vagyunk, letesszük az okos matricát a kattintás pontjára
      else if (this.brushMode === 'ai-click') {
        this.redoStack = [];
        this.runAiHoldDetection(pos.x, pos.y);
      }
    });

    this.stage.on('mousemove touchmove', () => {
      if (!this.isDrawing || this.brushMode !== 'freehand') return;
      const pos = this.stage.getPointerPosition();
      if (!pos) return;

      // Folyamatosan fűzzük hozzá a pontokat a szabadkézi rajzhoz
      this.currentLine.points(this.currentLine.points().concat([pos.x, pos.y]));
      this.layer.draw();
    });

    this.stage.on('mouseup touchend', () => {
      if (this.isDrawing) {
        this.isDrawing = false;
        this.saveHistoryState();
      }
    });
  }


  private runAiHoldDetection(clickX: number, clickY: number): void {
    try {
      let labelText = 'HOLD';
      let labelBgColor = '#ffc107'; // Alapértelmezett sárga a sima fogásnak

      if (this.currentBrushColor === '#00ff00') {
        labelText = 'START';
        labelBgColor = '#28a745';
      } else if (this.currentBrushColor === '#dc3545') {
        labelText = 'FINISH';
        labelBgColor = '#dc3545';
      } else if (this.currentBrushColor === '#007bff') {
        labelText = 'FOOT';
        labelBgColor = '#17a2b8';
      } else if (this.currentBrushColor === '#ffc107') {
        labelText = 'GENERAL'; // Az új, sárga általános fogás azonosítója
        labelBgColor = '#ffc107';
      }

      const holdGroup = new Konva.default.Group({
        x: clickX, y: clickY, draggable: true, name: 'stokli-hold',
        meta: { labelText: labelText, color: this.currentBrushColor }
      });

      const holdHalo = new Konva.default.Circle({
        x: 0, y: 0, radius: 20, stroke: this.currentBrushColor, strokeWidth: 4
      });
      holdGroup.add(holdHalo);

      // FIX: Csak a START, FOOT és FINISH kap szöveges matricát! Az új GENERAL (sárga) szigorúan címke nélkül marad!
      if (labelText === 'START' || labelText === 'FOOT' || labelText === 'FINISH') {
        const rectLabel = new Konva.default.Rect({
          x: -25,
          y: -38,
          width: 50,
          height: 16,
          fill: labelBgColor,
          borderRadius: 3
        });
        const textLabel = new Konva.default.Text({
          x: -25,
          y: -35,
          text: labelText,
          fontSize: 10,
          fontFamily: 'Calibri, Arial',
          fontStyle: 'bold',
          ill: '#ffffff',
          width: 50,
          align: 'center'
        });
        holdGroup.add(rectLabel); holdGroup.add(textLabel);
      }

      holdGroup.on('dragmove', () => this.rebuildStokliRouteLines());
      holdGroup.on('dragend', () => this.saveHistoryState());
      this.layer.add(holdGroup); this.rebuildStokliRouteLines(); this.layer.draw(); this.saveHistoryState();
    } catch (error) { console.error("Stökli matrica hiba:", error); }
  }

  // AUTOMATIKUS ÚTVONAL-ÖSSZEKÖTŐ MOTOR: Megkeresi az összes lerakott fogást, és a mászás logikai sorrendjében összeköti őket!
  private rebuildStokliRouteLines(): void {
    // Elsőként letakarítjuk a korábbi összekötő vonalakat a rétegről, hogy ne duplázódjanak
    this.layer.getChildren((node: any) => node.name() === 'stokli-link').forEach((n: any) => n.destroy());

    // Kiszedjük a rétegről az összes aktív Stökli fogás-kört
    const holds = this.layer.getChildren((node: any) => node.name() === 'stokli-hold');

    // Ha van legalább 2 fogás, Stökli-stílusban összekötjük őket folyamatos vonalakkal
    for (let i = 0; i < holds.length - 1; i++) {
      const startHold = holds[i];
      const endHold = holds[i + 1];

      // Összekötő vonal generálása a két fogás középpontja között
      const routeLine = new Konva.default.Line({
        points: [startHold.x(), startHold.y(), endHold.x(), endHold.y()],
        stroke: '#ffffff',
        strokeWidth: 3,
        dash: [10, 5], // <--- EZT A PONTOS TÖMBÖT ÍRD BE IDE!
        opacity: 0.65,
        name: 'stokli-link'
      });

      this.layer.add(routeLine);
      routeLine.moveToBottom(); // A vonalat a fogásgyűrűk alá küldjük, hogy ne takarja el őket
    }
    this.layer.draw();
  }


  private saveHistoryState(): void {
    // 1. Kiszedjük az összes szabadkézi vonalat a rétegről
    const lines = this.layer.getChildren((node: any) => node.getClassName() === 'Line' && node.name() !== 'stokli-link');
    const exportedLines = lines.map((line: any) => ({
      type: 'freehand-line',
      points: line.points(),
      stroke: line.stroke(),
      strokeWidth: line.strokeWidth(),
      closed: line.closed(),
      tension: line.tension()
    }));

    // 2. Kiszedjük az összes Stökli-stílusú fogásgyűrűt vagy matricát
    const holds = this.layer.getChildren((node: any) => node.name() === 'stokli-hold');
    const exportedHolds = holds.map((hold: any) => ({
      type: 'stokli-hold',
      x: hold.x(),
      y: hold.y(),
      radius: hold.radius ? hold.radius() : 18,
      stroke: hold.stroke ? hold.stroke() : '#ff0000',
      strokeWidth: hold.strokeWidth ? hold.strokeWidth() : 4,
      meta: hold.attrs.meta // Itt tároljuk, hogy START, FOOT, vagy FINISH-e a matrica!
    }));

    // Összefésüljük a kettőt egyetlen közös JSON tömbbe
    const combinedData = [...exportedLines, ...exportedHolds];
    const stateString = JSON.stringify(combinedData);

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
    // Teljesen letakarítjuk a rajzfelületet az újraépítés előtt
    this.layer.getChildren().forEach((n: any) => {
      if (n.getClassName() === 'Line' || n.name() === 'stokli-hold' || n.name() === 'stokli-link') {
        n.destroy();
      }
    });

    if (jsonString && jsonString !== '[]' && jsonString !== '{}') {
      const savedElements = JSON.parse(jsonString);

      savedElements.forEach((elData: any) => {
        // A, Szabadkézi vonalak visszaállítása
        if (elData.type === 'freehand-line') {
          const freehandLine = new Konva.default.Line({
            points: elData.points,
            stroke: elData.stroke,
            strokeWidth: elData.strokeWidth,
            closed: elData.closed,
            tension: elData.tension
          });
          this.layer.add(freehandLine);
        }
        // B, Stökli-stílusú fogások/matricák visszaállítása
        else if (elData.type === 'stokli-hold' || elData.name === 'stokli-hold') {
          const holdHalo = new Konva.default.Circle({
            x: elData.x,
            y: elData.y,
            radius: elData.radius || 18,
            stroke: elData.stroke,
            strokeWidth: elData.strokeWidth || 4,
            draggable: true, // Megtartjuk a mozgathatóságot!
            name: 'stokli-hold',
            meta: elData.meta
          });

          holdHalo.on('dragmove', () => this.rebuildStokliRouteLines());
          holdHalo.on('dragend', () => this.saveHistoryState());

          this.layer.add(holdHalo);
        }
      });
    }

    // Újrageneráljuk a Stökli összekötő vonalakat a körök között
    this.rebuildStokliRouteLines();
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
        this.commentsByRoute[routeId] = data;
        this.rootCommentsByRoute[routeId] = data.filter(c => c.parentCommentId === null);

        // ALAPÉRTELMEZETT LIMIT: Minden szálon belül kezdetben csak 2 al-válasz jelenik meg
        data.forEach(comment => {
          if (this.visibleRepliesCount[comment.id] === undefined) {
            this.visibleRepliesCount[comment.id] = 2;
          }
        });

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

  // GOMB NYOMÁSRA: Betölti a következő adag (pl. 3 darab) főkommentet az adott úthoz
  public onLoadMoreComments(routeId: number): void {
    const currentCount = this.visibleCommentsCount[routeId] || 1;
    this.visibleCommentsCount[routeId] = currentCount + 3; // Növeljük a látható adagot 3-mal
    this.cdr.detectChanges(); // Azonnal frissítjük a HTML felületet
  }

  // GOMB NYOMÁSRA: Betölti a következő adag al-választ egy konkrét komment szálon belül
  public onLoadMoreReplies(commentId: number): void {
    const currentCount = this.visibleRepliesCount[commentId] || 2;
    this.visibleRepliesCount[commentId] = currentCount + 3; // Növeljük az al-válaszok számát 3-mal
    this.cdr.detectChanges();
  }

  // MODAL MEGNYITÁSA: Rákattintáskor elmentjük az utat, kinyitjuk az ablakot, és felépítjük a rajzot
  public onOpenRouteModal(route: any): void {
    this.activeModalRoute = route;

    // Inicializáljuk a lapozó limiteket ehhez a konkrét úthoz, ha még nem léteznek
    if (this.visibleCommentsCount[route.id] === undefined) {
      this.visibleCommentsCount[route.id] = 3; // Modalon belül kezdhetünk pl. 3 főkommenttel
    }

    this.cdr.detectChanges(); // Kényszerítjük az Angulart a modal HTML elemeinek létrehozására a DOM-ban

    // Egy apró időzítéssel kirajzoljuk a Konva vásznat a modal bal oldalán
    setTimeout(() => this.renderModalCanvas(route), 150);
  }

  // MODAL BEZÁRÁSA: Kiürítjük a változót, így a felugró ablak azonnal eltűnik a képernyőről
  public onCloseRouteModal(): void {
    this.activeModalRoute = null;
    this.cdr.detectChanges();
  }
  // --- 3. RÉSZ: STÖKLI FOGÁSOK ÉS SZAGGATOTT NYOMVONALAK RENDELÉSE ---

  // HÍRFOLYAM KIS KÉPEI: Kirajzolja a Stökli köröket és a szaggatott vonalakat 0.5-ös skálázással (350x300)
  private renderAllSavedCanvases(): void {
    this.routes.forEach(route => {
      const containerId = 'feed-canvas-route-' + route.id; const el = document.getElementById(containerId); if (!el) return;
      const stage = new Konva.default.Stage({ container: containerId, width: 350, height: 300 });
      const layer = new Konva.default.Layer(); stage.add(layer);
      const img = new Image(); img.crossOrigin = 'Anonymous'; img.src = route.imageUrl;
      img.onload = () => {
        const kImg = new Konva.default.Image({ x: 0, y: 0, image: img, width: 350, height: 300 });
        layer.add(kImg); kImg.moveToBottom();
        if (route.canvasDataJson && route.canvasDataJson !== '{}' && route.canvasDataJson !== '[]') {
          const savedElements = JSON.parse(route.canvasDataJson); const holdPositions: { x: number; y: number }[] = [];
          savedElements.forEach((elData: any) => {
            if (elData.points || elData.type === 'freehand-line') {
              const scaledPoints = elData.points.map((p: number) => p * 0.5);
              const freehandLine = new Konva.default.Line({ points: scaledPoints, stroke: elData.stroke || '#00ff00', strokeWidth: (elData.strokeWidth || 4) * 0.5, closed: elData.closed || false, tension: elData.tension || 0.5 });
              layer.add(freehandLine);
            }
            else if (elData.type === 'stokli-hold' || elData.name === 'stokli-hold') {
              const scaledX = elData.x * 0.5; const scaledY = elData.y * 0.5; holdPositions.push({ x: scaledX, y: scaledY });
              const holdGroup = new Konva.default.Group({ x: scaledX, y: scaledY });
              const holdHalo = new Konva.default.Circle({ x: 0, y: 0, radius: (elData.radius || 20) * 0.5, stroke: elData.stroke || (elData.meta ? elData.meta.color : '#ff0000'), strokeWidth: 2 });
              holdGroup.add(holdHalo);
              let labelText = elData.meta ? elData.meta.labelText : 'GENERAL';
              let labelBgColor = labelText === 'START' ? '#28a745' : (labelText === 'FINISH' ? '#dc3545' : '#17a2b8');
              // KIS KÉP FIX: Csak a 3 fő típus kap feliratot, a GENERAL (sárga) nem!
              if (labelText === 'START' || labelText === 'FOOT' || labelText === 'FINISH') {
                const rectLabel = new Konva.default.Rect({
                  x: -15,
                  y: -24,
                  width: 30,
                  height: 10,
                  fill: labelBgColor,
                  borderRadius: 2
                });
                const textLabel = new Konva.default.Text({
                  x: -15,
                  y: -22,
                  text: labelText,
                  fontSize: 6,
                  fontStyle: 'bold',
                  fill: '#ffffff',
                  width: 30,
                  align: 'center'
                });
                holdGroup.add(rectLabel); holdGroup.add(textLabel);
              }
              layer.add(holdGroup);
            }
          });
          for (let i = 0; i < holdPositions.length - 1; i++) {
            const line = new Konva.default.Line({
              points: [holdPositions[i].x,
                holdPositions[i].y,
                holdPositions[i + 1].x,
                holdPositions[i + 1].y],
              stroke: '#ffffff',
              strokeWidth: 1.5,
              dash: [10, 5],
              opacity: 0.65,
              name: 'stokli-link'
            });
            layer.add(line); line.moveToBottom();
          }
        }
        layer.draw();
      };
    });
  }

  // MODAL NAGY KÉPE: Kirajzolja a Stökli köröket és a szaggatott vonalakat 1:1 arányban (700x600)
  private renderModalCanvas(route: any): void {
    const containerId = 'modal-canvas-route-' + route.id; const el = document.getElementById(containerId); if (!el) return;
    const stage = new Konva.default.Stage({ container: containerId, width: 700, height: 600 });
    const layer = new Konva.default.Layer(); stage.add(layer);
    const img = new Image(); img.crossOrigin = 'Anonymous'; img.src = route.imageUrl;
    img.onload = () => {
      const kImg = new Konva.default.Image({ x: 0, y: 0, image: img, width: 700, height: 600 });
      layer.add(kImg); kImg.moveToBottom();
      if (route.canvasDataJson && route.canvasDataJson !== '{}' && route.canvasDataJson !== '[]') {
        const savedElements = JSON.parse(route.canvasDataJson); const holdPositions: { x: number; y: number }[] = [];
        savedElements.forEach((elData: any) => {
          if (elData.points || elData.type === 'freehand-line') {
            const freehandLine = new Konva.default.Line({ points: elData.points, stroke: elData.stroke || '#00ff00', strokeWidth: elData.strokeWidth || 4, closed: elData.closed || false, tension: elData.tension || 0.5 });
            layer.add(freehandLine);
          }
          else if (elData.type === 'stokli-hold' || elData.name === 'stokli-hold') {
            holdPositions.push({ x: elData.x, y: elData.y });
            const holdGroup = new Konva.default.Group({ x: elData.x, y: elData.y });
            const holdHalo = new Konva.default.Circle({ x: 0, y: 0, radius: elData.radius || 20, stroke: elData.stroke || (elData.meta ? elData.meta.color : '#ff0000'), strokeWidth: 4 });
            holdGroup.add(holdHalo);
            let labelText = elData.meta ? elData.meta.labelText : 'GENERAL';
            let labelBgColor = labelText === 'START' ? '#28a745' : (labelText === 'FINISH' ? '#dc3545' : '#17a2b8');
            // MODAL FIX: Csak a 3 fő típus kap feliratot, a sárga általános tiszta marad!
            if (labelText === 'START' || labelText === 'FOOT' || labelText === 'FINISH') {
              const rectLabel = new Konva.default.Rect({ x: -25, y: -38, width: 50, height: 16, fill: labelBgColor, borderRadius: 3 });
              const textLabel = new Konva.default.Text({ x: -25, y: -35, text: labelText, fontSize: 10, fontStyle: 'bold', fill: '#ffffff', width: 50, align: 'center' });
              holdGroup.add(rectLabel); holdGroup.add(textLabel);
            }
            layer.add(holdGroup);
          }
        });
        for (let i = 0; i < holdPositions.length - 1; i++) {
          const line = new Konva.default.Line({ points: [holdPositions[i].x, holdPositions[i].y, holdPositions[i + 1].x, holdPositions[i + 1].y], stroke: '#ffffff', strokeWidth: 3, dash: [10, 5], opacity: 0.65, name: 'stokli-link' });
          layer.add(line); line.moveToBottom();
        }
      }
      layer.draw();
    };
  }

}

