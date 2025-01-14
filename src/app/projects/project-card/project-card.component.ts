import { Component, inject, input, output } from '@angular/core';
import { Project } from '../project/project.model';
import { HttpClient } from '@angular/common/http';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-project-card',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './project-card.component.html',
  styleUrl: './project-card.component.scss',
})
export class ProjectCardComponent {
  private http = inject(HttpClient);
  project = input.required<Project>();
  delete = output<number>();
  select = output<number>();

  onDelete() {
    this.delete.emit(this.project().projectId);
  }

  onClick() {
    this.select.emit(this.project().projectId);
  }
}
