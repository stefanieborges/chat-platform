import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MiniChat } from './mini-chat';

describe('MiniChat', () => {
  let component: MiniChat;
  let fixture: ComponentFixture<MiniChat>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MiniChat]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MiniChat);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
