import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  Department,
  MeasuringTool,
  CuttingTool,
  WorkHoldingDevice,
  WorkStation,
} from '../project/project.model';
import { Observable } from 'rxjs';

export interface Activity {
  name: string;
  sequence: number;
  D_p: number; // `float` -> `number`
  D_k: number; // `float` -> `number`
  L: number; // `float` -> `number`
  A_p: number; // `float` -> `number`
  f: number; // `float` -> `number`
  V_c: number; // `float` -> `number`
  n: number; // `float` -> `number`
  t_g: number; // `float` -> `number`
}

export interface Setup {
  drawing: string;
  positionNumber: number;
  activities: Activity[];
}

export interface Operation {
  id: number;
  name: string;
  sequence: number;
  setups: Setup[];
}

export interface Process {
  // id: number;
  blank: string;
  operations: Operation[];
}

export interface Project {
  name: string;
  workpiece: {
    drawing: string | null;
  };
  processes: Process[];
}

@Injectable({
  providedIn: 'root',
})
export class NewProjectWizardService {
  // private projectData: any = {};
  private projectData: Project = {
    name: '',
    workpiece: {
      drawing: null,
    },
    processes: [
      {
        blank: '',
        operations: [
          {
            id: 0,
            name: '',
            sequence: 0,
            setups: [
              {
                drawing: '',
                positionNumber: 0,
                activities: [
                  {
                    name: '',
                    sequence: 0,
                    D_p: 0,
                    D_k: 0,
                    L: 0,
                    A_p: 0,
                    f: 0,
                    V_c: 0,
                    n: 0,
                    t_g: 0,
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  };
  drawingPreview: string | null = null;

  private http = inject(HttpClient);

  getProjectData() {
    return this.projectData;
  }

  setProjectData(data: Partial<Project>) {
    this.projectData = { ...this.projectData, ...data };
  }

  saveProjectData(data: any) {
    return this.http.post('/api/projects', data);
  }

  addProcess(process: Process) {
    this.projectData.processes.push(process);
  }

  addOperation(processIndex: number, operation: Operation) {
    this.projectData.processes[processIndex].operations.push(operation);
  }

  addFixture(processIndex: number, operationIndex: number, fixture: Setup) {
    this.projectData.processes[processIndex].operations[
      operationIndex
    ].setups.push(fixture);
  }

  setDrawingPreview(url: string | null) {
    this.drawingPreview = url;
  }

  getDrawingPreview(): string | null {
    return this.drawingPreview;
  }

  getWorkHoldingDevices() {
    return this.http.get<{ workholdingdevices: WorkHoldingDevice[] }>(
      '/api/work-holding-devices'
    );
    //return dummy data
    // return new Observable<ProcessingFixture[]>((observer) => {
    //   observer.next([
    //     {
    //       name: 'Fixture 1',
    //     },
    //   ]);
    // });
  }

  getCuttingTools() {
    return this.http.get<{ cuttingtools: CuttingTool[] }>('/api/cutting-tools');
  }

  getMeasuringTools() {
    return this.http.get<MeasuringTool[]>('/api/measuring-tools');
  }

  getDepartments() {
    return this.http.get<Department[]>('/api/departments');
  }

  getWorkStations() {
    return this.http.get<WorkStation[]>('/api/resources/workstations');
  }

  addWorkHoldingDevice(
    workHoldingDevice: WorkHoldingDevice
  ): Observable<WorkHoldingDevice> {
    return this.http.post<WorkHoldingDevice>(
      '/api/work-holding-devices',
      workHoldingDevice
    );
  }

  addToolHolder(cuttingTool: CuttingTool): Observable<CuttingTool> {
    return this.http.post<CuttingTool>('/api/cutting-tools', cuttingTool);
  }

  addMeasuringTool(tool: MeasuringTool): Observable<MeasuringTool> {
    return this.http.post<MeasuringTool>('/api/measuring-tools', tool);
  }

  addWorkStation(station: WorkStation): Observable<WorkStation> {
    return this.http.post<WorkStation>('/api/work-stations', station);
  }
}
