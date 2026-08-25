import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WallListComponent } from './wall-list.component';

describe('WallListComponent', () => {
  let component: WallListComponent;
  let fixture: ComponentFixture<WallListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WallListComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WallListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
