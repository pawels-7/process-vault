import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProjectService } from './project.service';
import { Observable, Subscription } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { AsyncPipe, DatePipe } from '@angular/common';
import { Project } from './project.model';
import { LoadingSpinnerComponent } from '../../shared/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-project',
  standalone: true,
  imports: [RouterLink, AsyncPipe, DatePipe, LoadingSpinnerComponent],
  templateUrl: './project.component.html',
  styleUrls: ['./project.component.scss'],
})
export class ProjectComponent implements OnInit, OnDestroy {
  projectId = '';
  project$: Observable<Project | undefined> = new Observable();

  private processService = inject(ProjectService);
  private route = inject(ActivatedRoute);
  private subscriptions = new Subscription();

  showModal = false;
  selectedOperation = 0;
  page = 0;

  isProcessOpen: { [key: number]: boolean } = {};
  isOperationOpen: { [key: number]: boolean } = {};
  isSetupOpen: { [key: number]: boolean } = {};

  constructor() {}

  ngOnInit(): void {
    // Subskrypcja parametrów i pobieranie projektu
    this.project$ = this.route.params.pipe(
      map((params) => params['id']), // Pobieranie projectId z trasy
      switchMap((projectId) => {
        this.projectId = projectId;
        return this.processService.projects$.pipe(
          map((projects) => projects.find((p) => p.projectId === +projectId))
        );
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  showOperationModal(): void {
    this.showModal = true;
  }

  toggleProcess(processId: number): void {
    this.isProcessOpen[processId] = !this.isProcessOpen[processId];
  }

  toggleOperation(operationId: number): void {
    this.isOperationOpen[operationId] = !this.isOperationOpen[operationId];
  }

  toggleSetup(setupId: number): void {
    this.isSetupOpen[setupId] = !this.isSetupOpen[setupId];
  }

  onTechCardClick(processId: number): void {
    this.processService
      .getTechCard(processId.toString())
      .subscribe((pdfBlob) => {
        console.log(pdfBlob); // Sprawdź typ i rozmiar Blob
        const blob = new Blob([pdfBlob], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'karta_tech.pdf';
        a.click();
      });
  }

  onInstructionCardClick(operationId: number): void {
    this.processService
      .getInstructionCard(operationId.toString())
      .subscribe((pdfBlob) => {
        console.log(pdfBlob); // Sprawdź typ i rozmiar Blob
        const blob = new Blob([pdfBlob], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'instrukcja.pdf';
        a.click();
      });
  }
}
