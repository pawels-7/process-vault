import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';

import { Project } from './project.model';
import { BehaviorSubject, map, Observable, tap } from 'rxjs';
import { Resolve } from '@angular/router';
import { API } from '../../app.config';

interface ProjectsPayload {
  projects: Project[];
}

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private http = inject(HttpClient);

  // BehaviorSubject do przechowywania procesów
  private projectsSubject = new BehaviorSubject<Project[]>([]);
  projects$ = this.projectsSubject.asObservable(); // Publiczny dostęp jako Observable

  constructor() {
    this.loadProjects();
  }

  // Metoda do ładowania procesów
  private loadProjects(): void {
    this.http
      .get<ProjectsPayload>(`${API}/projects`)
      .pipe(map((resData) => resData.projects || [])) // Mapowanie wyników API
      .subscribe((projects) => {
        this.projectsSubject.next(projects); // Aktualizacja wartości
        console.log('Załadowane procesy:', projects);
      });
  }

  refreshProjects(): void {
    this.loadProjects();
  }

  // Metoda do pobierania listy procesów (Observable)
  getProjects(): Observable<Project[]> {
    return this.projects$;
  }

  // Pobieranie pojedynczego procesu na podstawie ID
  getProject(id: string): Observable<Project | undefined> {
    return this.projects$.pipe(
      map((processes) => processes.find((p) => p.projectId.toString() === id))
    );
  }

  deleteProject(projectId: number): Observable<void> {
    return this.http.delete<void>(`/${API}/projects/${projectId}`).pipe(
      tap(() => {
        this.loadProjects(); // Odświeżanie listy projektów po usunięciu
      })
    );
  }

  // Metoda do pobrania karty technologicznej procesu w pdf z API
  getTechCard(id: string): Observable<Blob> {
    return this.http.get(`${API}/reports/process/${id}`, {
      responseType: 'blob', // Odbiór jako binary Blob
      headers: {
        Accept: 'application/pdf',
      },
    });
  }

  getInstructionCard(operationId: string): Observable<Blob> {
    return this.http.get(`${API}/reports/operation/${operationId}`, {
      responseType: 'blob', // Odbiór jako binary Blob
      headers: {
        Accept: 'application/pdf',
      },
    });
  }
}

@Injectable({ providedIn: 'root' })
export class ProjectResolver implements Resolve<Project[]> {
  constructor(private projectService: ProjectService) {}

  resolve(): Observable<Project[]> {
    return this.projectService.getProjects();
  }
}
