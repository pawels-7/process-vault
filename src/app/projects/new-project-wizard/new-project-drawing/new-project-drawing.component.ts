import {
  Component,
  inject,
  output,
  OnInit,
  OnDestroy,
  HostListener,
  ElementRef,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { NewProjectWizardService } from '../new-project-wizard.service';
import { Project } from '../../project/project.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-new-project-drawing',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './new-project-drawing.component.html',
  styleUrl: './new-project-drawing.component.scss',
})
export class NewProjectDrawingComponent implements OnInit, OnDestroy {
  showDrawing = false;
  drawingPreviewUrl: string = '';
  isDragOver = false;
  private projectSubscription: Subscription | undefined;
  constructor(private projectService: NewProjectWizardService) {}

  ngOnInit(): void {
    this.projectSubscription = this.projectService.currentProject$.subscribe(
      (project) => {
        if (project?.workpiece?.drawing) {
          this.drawingPreviewUrl = project?.workpiece?.drawing;
          this.showDrawing = true;
        } else {
          this.showDrawing = false;
        }
      }
    );
    if (this.projectService.getProject()?.workpiece?.drawing) {
      this.drawingPreviewUrl =
        this.projectService.getProject()?.workpiece?.drawing;
      this.showDrawing = true;
    }
  }

  ngOnDestroy() {
    if (this.projectSubscription) {
      this.projectSubscription.unsubscribe();
    }
  }
  @HostListener('dragover', ['$event'])
  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }
  @HostListener('dragleave', ['$event'])
  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }
  @HostListener('drop', ['$event'])
  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
    const file = event.dataTransfer?.files[0];
    this.handleFile(file);
  }

  onFileClick(event: MouseEvent) {
    event.preventDefault();
    const fileInput = document.getElementById('drawing') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }
  onFileChange(event: any) {
    const file = event.target.files[0];
    this.handleFile(file);
  }

  onChangeDrawing() {
    this.showDrawing = false;
    this.drawingPreviewUrl = '';
    // Zresetuj input file
    const fileInput = document.getElementById('drawing') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  handleFile(file: any) {
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.drawingPreviewUrl = e.target.result;
        this.showDrawing = true;
        this.updateDrawingInProject();
      };
      reader.readAsDataURL(file);
    }
  }

  updateDrawingInProject() {
    const updatedProject: Project = {
      ...this.projectService.getProject(),
      workpiece: {
        ...this.projectService.getProject()?.workpiece,
        drawing: this.drawingPreviewUrl,
      },
    };
    this.projectService.setCurrentProject(updatedProject);
  }
}
