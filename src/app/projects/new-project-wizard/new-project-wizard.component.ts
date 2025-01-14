import {
  AfterViewInit,
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { NewProjectBasicComponent } from './new-project-basic/new-project-basic.component';
import { NewProjectWizardService } from './new-project-wizard.service';
import { Subscription } from 'rxjs';

import { Project } from '../project/project.model';
@Component({
  selector: 'app-new-project',
  templateUrl: './new-project-wizard.component.html',
  styleUrls: ['./new-project-wizard.component.scss'],
  standalone: true,
  imports: [RouterOutlet],
})
export class NewProjectWizardComponent
  implements OnInit, OnDestroy, AfterViewInit
{
  currentStep = 1;
  showNavigation = false;
  currentProject!: Project;
  private projectSubscription!: Subscription;
  private routeSubscription!: Subscription;
  @ViewChild(NewProjectBasicComponent, { static: false })
  basicComponent!: NewProjectBasicComponent;

  constructor(
    public projectService: NewProjectWizardService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.projectSubscription = this.projectService.currentProject$.subscribe(
      (project) => {
        this.currentProject = project;
      }
    );
    this.currentProject = this.projectService.getProject();
    this.routeSubscription = this.route.params.subscribe((params) => {
      const processIndex = params['processIndex']
        ? parseInt(params['processIndex'])
        : null;
      const operationIndex = params['operationIndex']
        ? parseInt(params['operationIndex'])
        : null;

      if (processIndex !== null && operationIndex !== null) {
        this.projectService['currentProcessIndex'] = processIndex;
        this.projectService['currentOperationIndex'] = operationIndex;
        this.currentStep = 6;
      } else if (processIndex !== null) {
        this.projectService['currentProcessIndex'] = processIndex;
        this.projectService.resetIndexes();
        this.currentStep = 5;
      } else {
        this.router.navigate(['/new-project/basic']);
      }
    });
  }
  ngAfterViewInit(): void {}
  ngOnDestroy(): void {
    this.projectSubscription.unsubscribe();
    this.routeSubscription.unsubscribe();
  }

  toggleNavigation() {
    this.showNavigation = !this.showNavigation;
  }

  closeNavigation() {
    this.showNavigation = false;
  }
  getCurrentProcessName(): string {
    // const processIndex = parseInt(
    //   this.route.snapshot.params['processIndex'] || 0
    // );
    const processIndex = this.projectService.getCurrentProcessIndex();
    const currentProcess = this.projectService.getProcessByIndex(processIndex);
    if (currentProcess && currentProcess.blank) {
      return `${currentProcess.blank.name}`;
    }
    return `${processIndex + 1}`;
  }

  get currentOperationIndex(): number {
    return this.projectService.getCurrentOperationIndex();
  }

  getCurrentOperationName(): string {
    const processIndex = this.projectService.getCurrentProcessIndex();
    const operationIndex = this.projectService.getCurrentOperationIndex();

    const currentOperation = this.projectService.getOperationByIndex(
      processIndex,
      operationIndex
    );
    return currentOperation?.operationName || 'brak nazwy operacji';
  }
  handleNavigation(
    step: number,
    processIndex?: number,
    operationIndex?: number
  ) {
    this.currentStep = step;
    this.closeNavigation();
    if (processIndex !== undefined) {
      this.projectService['currentProcessIndex'] = processIndex;
      if (operationIndex !== undefined) {
        this.projectService['currentOperationIndex'] = operationIndex;
      } else {
        this.projectService.resetIndexes();
      }
    }

    if (step === 4) {
      this.router.navigate(['/new-project/operations', processIndex]);
    }
    if (step === 5) {
      this.router.navigate([
        '/new-project/operation-details',
        processIndex,
        operationIndex,
      ]);
    }
    if (step === 3) {
      this.router.navigate(['/new-project/processes']);
    }
    // if (step === 3) {
    //   this.router.navigate(['/new-project/calculations']);
    // }
    if (step === 2) {
      this.router.navigate(['/new-project/drawing']);
    }
    if (step === 1) {
      this.router.navigate(['/new-project/basic']);
    }
  }
  goToNextStep() {
    if (this.currentStep === 1) {
      this.currentStep = 2;
      this.router.navigate(['/new-project/drawing']);
      // }
    } else if (this.currentStep === 2) {
      this.currentStep = 3;
      this.router.navigate(['/new-project/processes']);
    }
    //  else if (this.currentStep === 3) {
    //   this.currentStep = 4;
    //   this.router.navigate(['/new-project/processes']);
    // }
    else if (this.currentStep === 3) {
      this.currentStep = 4;
      const processIndex = this.projectService.getCurrentProcessIndex();
      this.router.navigate(['/new-project/operations', processIndex]);
      this.projectService.resetIndexes();
    } else if (this.currentStep === 4) {
      const processIndex = this.projectService.getCurrentProcessIndex();

      if (this.projectService.getCurrentOperationIndex() === 0) {
        this.currentStep = 5;
        this.router.navigate([
          '/new-project/operation-details',
          processIndex,
          this.projectService.getCurrentOperationIndex(),
        ]);
      }
    } else if (this.currentStep === 5) {
      if (this.projectService.canNextOperation()) {
        this.currentStep = 5;
        this.projectService.nextOperation();
        this.router.navigate([
          '/new-project/operation-details',
          this.projectService.getCurrentProcessIndex(),
          this.projectService.getCurrentOperationIndex(),
        ]);
      } else if (this.projectService.canNextProcess()) {
        this.projectService.resetIndexes();
        this.projectService.nextProcess();
        this.currentStep = 4;
        this.router.navigate([
          '/new-project/operations',
          this.projectService.getCurrentProcessIndex(),
        ]);
      } else {
        this.projectService.saveProject();
      }
    }
  }
  goToPreviousStep() {
    if (this.currentStep === 2) {
      this.currentStep = 1;
      this.router.navigate(['/new-project/basic']);
    } else if (this.currentStep === 3) {
      this.currentStep = 2;
      this.router.navigate(['/new-project/drawing']);
    }
    // else if (this.currentStep === 4) {
    //   this.currentStep = 3;
    //   this.router.navigate(['/new-project/processes']);
    // }
    else if (this.currentStep === 4) {
      if (this.projectService.getCurrentProcessIndex() === 0) {
        this.currentStep = 3;
        this.router.navigate(['/new-project/processes']);
      } else {
        if (
          this.projectService.canPreviousProcess() &&
          !this.projectService.canPreviousOperation()
        ) {
          this.currentStep = 5;
          this.projectService.previousProcess();
          this.projectService['currentOperationIndex'] =
            this.projectService.getCurrentProcess()!.operations.length - 1;
          console.log('last operation of previous process');
          this.router.navigate([
            '/new-project/operation-details/',
            this.projectService.getCurrentProcessIndex(),
            this.projectService.getCurrentOperationIndex(),
          ]);
        } else {
          this.currentStep = 5;
          this.projectService.previousOperation();
          this.router.navigate([
            '/new-project/operation-details/',
            this.projectService.getCurrentProcessIndex(),
            this.projectService.getCurrentOperationIndex(),
          ]);
        }
      }
    } else if (this.currentStep === 5) {
      if (this.projectService.canPreviousOperation()) {
        this.currentStep = 5;
        this.projectService.previousOperation();
        this.router.navigate([
          '/new-project/operation-details',
          this.projectService.getCurrentProcessIndex(),
          this.projectService.getCurrentOperationIndex(),
        ]);
      } else if (
        this.projectService.canPreviousProcess() &&
        this.projectService.getCurrentOperationIndex() === 0
      ) {
        this.currentStep = 4;
        this.projectService.resetIndexes();
        this.router.navigate([
          '/new-project/operations',
          this.projectService.getCurrentProcessIndex(),
        ]);
      } else {
        this.currentStep = 3;
        this.router.navigate(['/new-project/processes']);
      }
    }
  }
  getButtonText(): string {
    const processIndex = parseInt(
      this.route.snapshot.params['processIndex'] || 0
    );
    const operationIndex = parseInt(
      this.route.snapshot.params['operationIndex'] || 0
    );

    if (this.currentStep === 5) {
      const currentOperation = this.projectService.getOperationByIndex(
        processIndex,
        operationIndex
      );
      if (!currentOperation) return 'Dalej';
      const nextOperation = this.projectService.getOperationByIndex(
        processIndex,
        operationIndex + 1
      );
      if (nextOperation) return 'Dalej';
      const nextProcess = this.projectService.getProcessByIndex(
        processIndex + 1
      );
      if (!nextProcess) return 'Zakończ';
      return 'Dalej';
    }
    return 'Dalej';
  }
}
