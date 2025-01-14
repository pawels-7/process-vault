import { CanActivateFn, Router, Routes } from '@angular/router';
import { ProjectsComponent } from './projects/projects.component';
import { NewProjectWizardComponent } from './projects/new-project-wizard/new-project-wizard.component';
import { HomeComponent } from './home/home.component';
import { NotFoundComponent } from './not-found/not-found.component';
import { AuthComponent } from './auth/auth.component';
import { inject } from '@angular/core';
import { AuthService } from './auth/auth.service';
import { ProjectComponent } from './projects/project/project.component';
import { OperationDetailComponent } from './projects/project/operation-detail/operation-detail.component';
import { ProjectResolver } from './projects/project/project.service';
import { ResourcesComponent } from './resources/resources.component';
import { NewProjectBasicComponent } from './projects/new-project-wizard/new-project-basic/new-project-basic.component';
import { NewProjectCalculationsComponent } from './projects/new-project-wizard/new-project-calculations/new-project-calculations.component';
import { NewProjectDrawingComponent } from './projects/new-project-wizard/new-project-drawing/new-project-drawing.component';
import { NewProjectOperationDetailComponent } from './projects/new-project-wizard/new-project-operation-detail/new-project-operation-detail.component';
import { NewProjectOperationsComponent } from './projects/new-project-wizard/new-project-operations/new-project-operations.component';
import { NewProjectProcessesComponent } from './projects/new-project-wizard/new-project-processes/new-project-processes.component';

const authCanActivate: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const isAuth = !!authService.user();
  if (isAuth) {
    return true;
  }
  return router.createUrlTree(['/auth']);
};

export const newProjectWizardRoutes: Routes = [
  { path: 'basic', component: NewProjectBasicComponent },
  { path: 'drawing', component: NewProjectDrawingComponent },
  {
    path: 'calculations',
    component: NewProjectCalculationsComponent,
  },
  { path: 'processes', component: NewProjectProcessesComponent },
  {
    path: 'operations/:processIndex',
    component: NewProjectOperationsComponent,
  },
  {
    path: 'operation-details/:processIndex/:operationIndex',
    component: NewProjectOperationDetailComponent,
  },
  { path: '', redirectTo: 'basic', pathMatch: 'full' },
];

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'projects',
    pathMatch: 'full',
  },
  {
    path: 'projects',
    component: ProjectsComponent,
    canActivate: [authCanActivate],
  },
  {
    path: 'new-project',
    component: NewProjectWizardComponent,
    canActivate: [authCanActivate],
    children: newProjectWizardRoutes,
  },
  { path: 'projects/:id', component: ProjectComponent },
  {
    path: 'projects/:id/:processId/:operationId',
    component: OperationDetailComponent,
    resolve: { projects: ProjectResolver },
  },
  { path: 'resources', component: ResourcesComponent },
  { path: 'auth', component: AuthComponent },
  { path: '**', component: NotFoundComponent, canActivate: [authCanActivate] },
];
