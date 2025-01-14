import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProjectService } from '../project.service';
import { Subscription } from 'rxjs';

import {
  Operation,
  Project,
  Process,
  getMachiningTime,
  Activity,
  getOperationTj,
  getOperationTpz,
  CuttingTool,
  ToolAssembly,
} from '../project.model';
import { PdfService } from '../pdf-service';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-operation-detail',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './operation-detail.component.html',
  styleUrls: ['./operation-detail.component.scss'],
})
export class OperationDetailComponent implements OnInit, OnDestroy {
  projectId = '';
  processId = '';
  operationId = '';
  operation: Operation | undefined;
  project: Project | undefined;
  currentFixtureIndex = 0;
  showConditions = true;
  private toolSymbols = new Map<string, string>();

  private route = inject(ActivatedRoute);
  private processService = inject(ProjectService);
  private pdfService = inject(PdfService);
  private routeSubscription: Subscription | null = null;

  constructor() {}

  getActivityMachiningTime(activity: Activity) {
    return getMachiningTime(activity);
  }
  getActivitySymbol(activity: Activity) {
    if (!activity) return undefined;
    if (activity.tool) {
      return this.toolSymbols.get(activity.tool.name);
    }
    if (activity.toolAssembly) {
      return this.toolSymbols.get(
        activity.toolAssembly.holder.name +
          '/' +
          activity.toolAssembly.insert.name
      );
    }
    return undefined;
  }

  goBack(): void {
    window.history.back();
  }

  ngOnInit(): void {
    this.routeSubscription = this.route.params.subscribe((params) => {
      this.projectId = params['id'];
      this.processId = params['processId'];
      this.operationId = params['operationId'];

      this.processService.projects$.subscribe((projects) => {
        const project = projects.find(
          (p: Project) => p.projectId.toString() === this.projectId
        );
        if (!project) {
          console.error(`Nie znaleziono projektu o id: ${this.projectId}`);
          return;
        }

        const process = project.processes?.find(
          (process: Process) => process.processId === +this.processId
        );
        if (!process) {
          console.error(`Nie znaleziono procesu o id: ${this.processId}`);
          return;
        }

        const operation = process.operations?.find(
          (operation: Operation) => operation.operationId === +this.operationId
        );
        if (!operation) {
          console.error(`Nie znaleziono operacji o id: ${this.operationId}`);
          return;
        }

        this.operation = operation;
        this.project = project;
        console.log('Operation with data', this.operation);
      });
    });
  }

  ngOnDestroy(): void {
    this.routeSubscription?.unsubscribe();
  }

  previousFixture(): void {
    if (this.currentFixtureIndex > 0) {
      this.currentFixtureIndex -= 1;
    }
  }

  nextFixture(): void {
    if (
      this.operation &&
      this.currentFixtureIndex < this.operation.setups.length - 1
    ) {
      this.currentFixtureIndex += 1;
    }
  }

  downloadTechCard(): void {
    // if (!this.project) return;
    // this.generateTechPdf(this.project);
    this.pdfService.getTechCard(this.processId).subscribe((pdfBlob) => {
      console.log(pdfBlob); // Sprawdź typ i rozmiar Blob
      const blob = new Blob([pdfBlob], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'karta_tech.pdf';
      a.click();
    });
  }
  downloadInstCard(): void {
    // if (!this.project) return;
    // this.generateInstPdf(this.project);
    this.pdfService.getInstCard(this.operationId).subscribe((pdfBlob) => {
      console.log(pdfBlob); // Sprawdź typ i rozmiar Blob
      const blob = new Blob([pdfBlob], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'instrukcja.pdf';
      a.click();
    });
  }

  getUniqueToolsAndAssemblies() {
    const tools = new Map<string, { symbol: string; name: string }>();
    this.toolSymbols.clear();
    let counter = 1;
    if (!this.operation) {
      console.log('Brak operacji');
      return [];
    }

    this.operation.setups.forEach((setup) => {
      setup.activities.forEach((activity) => {
        if (activity?.tool) {
          const toolName = activity.tool.name;
          if (!tools.has(toolName)) {
            const symbol = `N${counter++}`;
            this.toolSymbols.set(toolName, symbol);
            tools.set(toolName, { symbol, name: toolName });
          }
        }
        if (activity?.toolAssembly) {
          const assemblyName =
            activity.toolAssembly.holder.name +
            '/' +
            activity.toolAssembly.insert.name;
          if (!tools.has(assemblyName)) {
            const symbol = `N${counter++}`;
            this.toolSymbols.set(assemblyName, symbol);
            tools.set(assemblyName, { symbol, name: assemblyName });
          }
        }
      });
    });
    const result = Array.from(tools.values());
    console.log('Unique tools and assemblies', result);
    return result;
  }

  generateTechPdf(project: Project): void {
    const techData = {
      productName: project.productName,
      partName: project.partName,
      unitsPerProduct: project.unitsPerProduct,
      unitsInOrder: project.order.unitsInOrder,
      unitsPerBatch: project.order.unitsPerBatch,
      completionDate: project.order.completionDate,
      material: project.material,
      blank: project.processes[0].blank.name,
      operations: project.processes[0].operations.map((operation) => ({
        sequence: operation.sequence,
        operationName: operation.operationName,
        tj: getOperationTj(operation),
        tpz: getOperationTpz(operation),
      })),
      Twc: 0,
    };

    techData.Twc = techData.operations.reduce(
      (acc, operation) =>
        acc + (operation.tj * project.order.unitsPerBatch + operation.tpz),
      0
    );

    this.pdfService.generateTechCard(techData).download('karta-techniczna.pdf');
  }

  async generateInstPdf(project: Project) {
    const operation = project.processes[0].operations.find(
      (op) => op.operationId === +this.operationId
    );
    const setupsWithImages = await Promise.all(
      operation!.setups.map(async (setup) => {
        const imageDataUrl = await getImageDataUrl(setup.drawing);
        return {
          drawing: imageDataUrl,
          activities: setup.activities.map((activity) => ({
            sequence: activity.sequence,
            activityName: activity.activityName,
            Dp: activity.conditions?.Dp,
            Dk: activity.conditions?.Dk,
            L: activity.conditions?.L,
            Ap: activity.conditions?.Ap,
            f: activity.conditions?.f,
            Vc: activity.conditions?.Vc,
            n: activity.conditions?.n,
            tg: this.getActivityMachiningTime(activity),
            toolSymbol: this.getActivitySymbol(activity),
          })),
        };
      })
    );
    console.log('setupsWithImages', setupsWithImages);
    const instData = {
      sequence: operation!.sequence,
      operationName: operation!.operationName,
      setups: setupsWithImages,
      tools: this.getUniqueToolsAndAssemblies(),
    };

    this.pdfService.generateInstCard(instData).download('instrukcja.pdf');
  }
}

async function getImageDataUrl(imagePath: string): Promise<string> {
  const response = await fetch(imagePath);
  const blob = await response.blob();
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}
