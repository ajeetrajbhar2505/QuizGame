import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserSetupPage } from './user-setup.page';

describe('UserSetupPage', () => {
  let component: UserSetupPage;
  let fixture: ComponentFixture<UserSetupPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(UserSetupPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
