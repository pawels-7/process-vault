import { Component, OnInit } from '@angular/core';
import { ResourcesService } from './resources.service';
import {
  Department,
  WorkStation,
  WorkHoldingDevice,
  CuttingTool,
  MeasuringTool,
} from '../projects/project/project.model';
import { FormsModule } from '@angular/forms';
import { NgFor, NgIf, TitleCasePipe } from '@angular/common';

@Component({
  selector: 'app-resources',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule, TitleCasePipe],
  templateUrl: './resources.component.html',
  styleUrls: ['./resources.component.scss'],
})
export class ResourcesComponent implements OnInit {
  departments: Department[] = [];
  workstations: WorkStation[] = [];
  workHoldingDevices: WorkHoldingDevice[] = [];
  cuttingTools: CuttingTool[] = [];
  measuringTools: MeasuringTool[] = [];

  selectedDepartment: Department | null = null;

  // Pola wyszukiwania
  departmentSearchTerm: string = '';
  workstationSearchTerm: string = '';
  deviceSearchTerm: string = '';
  toolSearchTerm: string = '';

  // Typ narzędzi tnących
  selectedToolType: 'insert' | 'holder' | 'other' | '' = '';
  isEditing: boolean = false;

  // Modal i nowy element
  showModal: boolean = false;
  newItemType:
    | 'department'
    | 'workstation'
    | 'workholdingdevice'
    | 'cuttingtool'
    | 'measuringtool' = 'department';
  newItemData: any = {};

  constructor(private resourcesService: ResourcesService) {}

  ngOnInit(): void {
    this.loadResources();
  }

  private loadResources(): void {
    this.resourcesService.getDepartments().subscribe({
      next: (data) => (this.departments = data),
      error: (err) => console.error('Failed to load departments', err),
    });

    this.resourcesService.getWorkHoldingDevices().subscribe({
      next: (data) => (this.workHoldingDevices = data),
      error: (err) => console.error('Failed to load work holding devices', err),
    });

    this.resourcesService.getCuttingTools().subscribe({
      next: (data) => (this.cuttingTools = data),
      error: (err) => console.error('Failed to load cutting tools', err),
    });

    this.resourcesService.getMeasuringTools().subscribe({
      next: (data) => (this.measuringTools = data),
      error: (err) => console.error('Failed to load measuring tools', err),
    });
  }

  selectDepartment(department: Department): void {
    this.selectedDepartment = department;
    this.workstations = department.workstations;
  }

  openAddNewModal(
    type:
      | 'department'
      | 'workstation'
      | 'workholdingdevice'
      | 'cuttingtool'
      | 'measuringtool'
  ): void {
    this.showModal = true;
    this.newItemType = type;
    this.newItemData = {};
  }

  filterList<T>(items: T[], term: string, key: keyof T): T[] {
    if (!term || !items) return items || [];
    return items.filter((item) =>
      String(item[key]).toLowerCase().includes(term.toLowerCase())
    );
  }

  editItem(
    itemType:
      | 'department'
      | 'workstation'
      | 'workholdingdevice'
      | 'cuttingtool'
      | 'measuringtool',
    item: any
  ): void {
    if (item.userId !== null) {
      this.newItemType = itemType;
      this.newItemData = { ...item }; // Kopiujemy dane elementu do edycji
      this.showModal = true;
      this.isEditing = true;
    } else {
      console.error('Cannot edit items with null userId');
    }
  }

  deleteItem(
    itemType:
      | 'department'
      | 'workstation'
      | 'workholdingdevice'
      | 'cuttingtool'
      | 'measuringtool',
    item: any
  ) {
    if (item.userId !== null) {
      this.resourcesService.deleteItem(itemType, item).subscribe({
        next: (response) => {
          console.log(`${itemType} deleted successfully`, response);
          this.loadResources();
        },
        error: (err) => console.error(`Failed to delete ${itemType}`, err),
      });
    } else {
      console.error('Cannot delete items with null userId');
    }
  }

  saveNewItem(): void {
    if (this.isEditing) {
      this.resourcesService
        .updateItem(this.newItemType, this.newItemData)
        .subscribe({
          next: (response) => {
            console.log(`${this.newItemType} updated successfully`, response);
            this.loadResources();
            this.closeModal();
            this.isEditing = false;
          },
          error: (err) =>
            console.error(`Failed to update ${this.newItemType}`, err),
        });
    } else {
      this.resourcesService
        .addNewItem(this.newItemType, this.newItemData)
        .subscribe({
          next: (response) => {
            console.log(`${this.newItemType} added successfully`, response);
            this.loadResources();
            this.closeModal();
          },
          error: (err) =>
            console.error(`Failed to add new ${this.newItemType}`, err),
        });
    }
  }

  getDisplayItemName(
    item:
      | 'department'
      | 'workstation'
      | 'workholdingdevice'
      | 'cuttingtool'
      | 'measuringtool'
  ): string {
    switch (item) {
      case 'department':
        return 'Wydziału';
      case 'workstation':
        return 'Stacji roboczej';
      case 'workholdingdevice':
        return 'Przyrządu/uchwytu obróbkowego';
      case 'cuttingtool':
        return 'Narzędzia/uchwytu narzędziowego';
      case 'measuringtool':
        return 'Narzędzia pomiarowego';
      default:
        return '';
    }
  }

  closeModal(): void {
    this.showModal = false;
    this.isEditing = false;
    this.newItemData = {};
  }

  filterCuttingTools(): CuttingTool[] {
    let filtered = this.filterList(
      this.cuttingTools,
      this.toolSearchTerm,
      'name'
    );
    if (this.selectedToolType) {
      filtered = filtered.filter((tool) => tool.type === this.selectedToolType);
    }
    return filtered;
  }
}
