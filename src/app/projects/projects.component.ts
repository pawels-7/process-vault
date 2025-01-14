import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { ProjectCardComponent } from './project-card/project-card.component';
import { ProjectService } from './project/project.service';
import { Project } from './project/project.model';
import { LoadingSpinnerComponent } from '../shared/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [RouterLink, ProjectCardComponent, LoadingSpinnerComponent],
  templateUrl: './projects.component.html',
  styleUrl: './projects.component.scss',
})
export class ProjectsComponent implements OnInit {
  private projectService = inject(ProjectService);
  private router = inject(Router);
  projects = signal<Project[] | null>(null);
  isLoading = signal(true);

  ngOnInit() {
    this.projectService.getProjects().subscribe({
      next: (projects) => {
        console.log(projects);
        this.projects.set(projects);
        this.isLoading.set(false); //  Ustaw na false po załadowaniu danych
      },
      error: (err) => {
        console.error('Failed to load projects', err);
        this.isLoading.set(false); //  Ustaw na false również w przypadku błędu
      },
    });
  }

  onSelectProject(projectId: number) {
    this.router.navigateByUrl(`/projects/${projectId}`);
  }

  onDeleteProject(projectId: number) {
    if (!confirm('Czy na pewno chcesz usunąć projekt?')) return;

    // 1. Pobierz obecne projekty
    const currentProjects = this.projects() || [];
    const projectToDeleteIndex = currentProjects.findIndex(
      (p) => p.projectId === projectId
    );

    if (projectToDeleteIndex === -1) {
      return; // Projekt nie istnieje - nie rób nic
    }
    // 2. Optymistycznie usuń projekt z UI
    const projectToDelete = currentProjects[projectToDeleteIndex];
    const updatedProjects = [...currentProjects];
    updatedProjects.splice(projectToDeleteIndex, 1);
    this.projects.set(updatedProjects);

    // 3. Wyślij żądanie usunięcia do backendu
    this.projectService.deleteProject(projectId).subscribe({
      next: () => {
        console.log('Projekt usunięty z backendu pomyślnie');
        // Jeśli usunięcie z backendu powiodło się, nie rób nic więcej.
      },
      error: (err) => {
        console.error('Błąd podczas usuwania projektu z backendu:', err);
        // 4. Przywróć projekt w UI, jeśli wystąpił błąd
        const currentProjectsAfterDelete = this.projects() || []; // Odczytaj aktualną wartość

        const restoredProjects = [...currentProjectsAfterDelete];
        restoredProjects.splice(projectToDeleteIndex, 0, projectToDelete); // Przywróć usunięty projekt
        this.projects.set(restoredProjects);

        alert('Nie udało się usunąć projektu, przywrócono.');
      },
    });
  }
}
