import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalSunroofComponent } from './modal-sunroof.component';

describe('ModalSunroofComponent', () => {
  let component: ModalSunroofComponent;
  let fixture: ComponentFixture<ModalSunroofComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ModalSunroofComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ModalSunroofComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
