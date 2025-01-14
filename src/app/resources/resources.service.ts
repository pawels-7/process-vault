import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import {
  Department,
  WorkHoldingDevice,
  CuttingTool,
  MeasuringTool,
} from '../projects/project/project.model';

@Injectable({
  providedIn: 'root',
})
export class ResourcesService {
  constructor(private http: HttpClient) {}

  getDepartments(): Observable<Department[]> {
    return this.http
      .get<{ data: Department[] }>(`api/departments`)
      .pipe(map((resData) => resData.data));
  }

  getWorkHoldingDevices(): Observable<WorkHoldingDevice[]> {
    return this.http
      .get<{ data: WorkHoldingDevice[] }>(`api/work-holding-devices`)
      .pipe(map((resData) => resData.data));
  }

  getCuttingTools(): Observable<CuttingTool[]> {
    return this.http
      .get<{ data: CuttingTool[] }>(`api/cutting-tools`)
      .pipe(map((resData) => resData.data));
  }

  getMeasuringTools(): Observable<MeasuringTool[]> {
    return this.http
      .get<{ data: MeasuringTool[] }>(`api/measuring-tools`)
      .pipe(map((resData) => resData.data));
  }

  addNewItem(type: string, data: any): Observable<any> {
    return this.http.post(`api/${type}`, data);
  }

  updateItem(type: string, data: any): Observable<any> {
    return this.http.put(`api/${type}`, data);
  }

  deleteItem(type: string, data: any): Observable<any> {
    return this.http.delete(`api/${type}`, { body: data.id });
  }
}
