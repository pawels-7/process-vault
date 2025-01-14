import { Component, inject } from '@angular/core';

import { RouterLink } from '@angular/router';
import { ProjectCardComponent } from '../projects/project-card/project-card.component';
import { ProjectService } from '../projects/project/project.service';
import { Project } from '../projects/project/project.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, ProjectCardComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  private projectService = inject(ProjectService);
  // processes: Process[] = [];
  recentProjects: Project[] = [];

  projects: Project[] = [
    // { name: 'Wał', description: 'Jakiś wał' },
    // { name: 'Wał 2', description: 'Jakiś wał' },
    // { name: 'Coś innego', description: 'Nie wnikam' },
    // { name: 'Coś innego 2', description: 'Nie wnikam' },
  ];

  ngOnInit() {
    this.projectService.getProjects().subscribe((projects) => {
      this.recentProjects = projects;
    });
  }
}
