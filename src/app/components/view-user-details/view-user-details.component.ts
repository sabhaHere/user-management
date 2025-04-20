import { Component, EventEmitter, Input, input, Output, output, signal, SimpleChanges, TemplateRef, ViewChild } from '@angular/core';
import { User } from '../../models/user';
import { CommonModule } from '@angular/common';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-view-user-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './view-user-details.component.html',
  styleUrl: './view-user-details.component.css'
})
export class ViewUserDetailsComponent {
  @Input() user: User | null = null;
  @Output() closeModal = new EventEmitter<void>();
  @ViewChild('userModal') userModal!: TemplateRef<any>;
  
  private modalRef: NgbModalRef | null = null;
  
  constructor(private modalService: NgbModal) {}
  
  ngOnChanges(changes: SimpleChanges): void {
    // If user input changes and is not null, open the modal
    if (changes['user'] && this.user) {
      this.openModal();
    }
  }
  
  openModal(): void {
    if (this.user && this.userModal) {
      this.modalRef = this.modalService.open(this.userModal, {
        centered: true,
        backdrop: 'static',
        size: 'lg'
      });
      
      // When modal is closed or dismissed
      this.modalRef.result.finally(() => {
        this.onClose();
      });
    }
  }
  
  onClose(): void {
    if (this.modalRef) {
      this.modalRef.close();
      this.modalRef = null;
    }
    this.closeModal.emit();
  }

  
}
