import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-modal-sunroof',
  templateUrl: './modal-sunroof.component.html',
  styleUrls: ['./modal-sunroof.component.scss']
})
export class ModalSunroofComponent implements OnInit {

  constructor(public dialogRef: MatDialogRef<ModalSunroofComponent>) { }

  ngOnInit(): void {
  }

     // When the user clicks the action button a.k.a. the logout button in the\
  // modal, show an alert and followed by the closing of the modal
  actionFunction() {
    alert("You have logged out.");
    this.closeModal();
  }

  // If the user clicks the cancel button a.k.a. the go back button, then\
  // just close the modal
  closeModal() {
    this.dialogRef.close();
  }

}
