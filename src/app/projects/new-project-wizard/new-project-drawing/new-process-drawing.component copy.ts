import { Component, inject, output } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';
import { NewProjectWizardService } from '../new-project-wizard.service';

@Component({
  selector: 'app-new-process-drawing',
  standalone: true,
  imports: [ReactiveFormsModule, NgxExtendedPdfViewerModule],
  templateUrl: './new-process-drawing.component.html',
  styleUrl: './new-process-drawing.component.scss',
})
export class NewProjectDrawingComponent {
  next = output();
  previous = output();
  private dataService = inject(NewProjectWizardService);

  form: FormGroup;

  constructor() {
    const project = this.dataService.getProjectData();
    this.form = new FormGroup({
      drawing: new FormControl(project.workpiece.drawing, [
        Validators.required,
      ]),
    });
  }

  ngOnInit() {
    const project = this.dataService.getProjectData();
    this.drawingPreviewUrl = project.workpiece.drawing || null;
  }

  private readImage(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      this.drawingPreviewUrl = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  showDrawing = false;
  showPdf = false;
  showChangeBtn = false;
  drawingPreviewUrl: string | ArrayBuffer | null = null;
  pdfPreviewUrl: string | ArrayBuffer | null = null;
  drawingInput!: HTMLInputElement;

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];
    const fileReader = new FileReader();

    fileReader.onload = () => {
      if (file.type === 'image/png' || file.type === 'image/jpeg') {
        this.drawingPreviewUrl = fileReader.result;
        this.showDrawing = true;
        this.showPdf = false;
        this.showChangeBtn = true;
      } else if (file.type === 'application/pdf') {
        this.pdfPreviewUrl = fileReader.result;
        this.showDrawing = false;
        this.showPdf = true;
        this.showChangeBtn = true;
      }
    };

    fileReader.readAsDataURL(file);

    input.value = '';
  }

  ngAfterViewInit() {
    this.drawingInput = document.getElementById('drawing') as HTMLInputElement;
    console.log(this.drawingInput);
  }

  onChangeDrawing() {
    this.drawingInput.click();
  }

  submit() {
    if (this.form.valid) {
      this.dataService.setProjectData({
        workpiece: {
          drawing: this.form.value,
        },
      });
      this.next.emit();
    }
  }
}
