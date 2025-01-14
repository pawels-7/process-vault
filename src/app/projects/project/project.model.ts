export interface Operation {
  operationId: number; // `int` -> `number`
  operationName: string; // `string` -> `string`
  sequence: number; // `int` -> `number`
  position: number;
  setups: Setup[]; // Tablica `Fixture`
  normalizationTasks: NormalizationTask[];
  timeComponents: TimeComponent[];
  workHoldingDevices: WorkHoldingDevice[];
  measuringTools: MeasuringTool[];
  workstation: WorkStation;
  developedBy: string;
  checkedBy: string;
  approvedBy: string;
}

export interface Setup {
  setupId: number; // `int` -> `number`
  drawing: string; // `string` pozostaje `string`, puste wartości mogą być obsługiwane jako ""
  activities: Activity[];
}

export interface Activity {
  activityId: number; // `int` -> `number`
  activityName: string; // `string` -> `string`
  sequence: number; // `int` -> `number`
  passes: number;
  conditions: CuttingCondition; // Typ `CuttingCodition`
  activityTimeComponents: ActivityTimeComponent[];
  tool?: CuttingTool | null;
  toolAssembly?: ToolAssembly | null;
}

export interface CuttingTool {
  id: number;
  name: string;
  type: 'insert' | 'holder' | 'other';
  userId?: number;
}

export interface ToolAssembly {
  id: number;
  insert: CuttingTool;
  holder: CuttingTool;
}

export interface CuttingCondition {
  Dp: number;
  Dk: number;
  L: number;
  Ap: number;
  f: number;
  Vc: number;
  n: number;
}

export interface Workpiece {
  workpieceId: number; // `int` -> `number`
  drawing: string; // `string` -> `string`
}

export interface Process {
  processId: number; // `int` -> `number`
  blank: Blank; // Typ `Blank`
  operations: Operation[]; // Tablica `Operation`
  developedBy: string;
  checkedBy: string;
  approvedBy: string;
}

export interface Blank {
  blankId: number; // `int` -> `number`
  name: string; // `string` -> `string`
}

export interface Project {
  projectId: number; // `int` -> `number`
  partName: string; // `string` -> `string`
  productName: string; // `string` -> `string`
  unitsPerProduct: number; // `int` -> `number`
  workpiece: Workpiece; // Typ `Workpiece`
  processes: Process[]; // Tablica `Process`
  order: Order;
  material: string;
  unitMass: number;
  materialStandard: number;
  materialCost: number;
}

export interface Order {
  orderId: number; // `int` -> `number`
  unitsInOrder: number; // `int` -> `number`
  unitsPerBatch: number; // `int` -> `number`
  completionDate: Date;
}

export interface TimeComponent {
  id: number;
  name: string;
  operationId: number;
}

export interface ActivityTimeComponent {
  id: number;
  activityId: number;
  timeComponentId: number;
  timeMinutes: number;
}

export interface NormalizationTask {
  id: number;
  name: string;
  operationId: number;
  timeMinutes: number;
}

export interface Department {
  departmentId: number; // `int` -> `number`
  name: string; // `string` -> `string`
  workstations: WorkStation[]; // Tablica `Machine`
  userId?: number;
}

export interface WorkStation {
  workstationId: number; // `int` -> `number`
  machineType: string; // `string` -> `string`
  type: string; // `string` -> `string`
  symbol: string; // `string` -> `string`
}

export interface WorkHoldingDevice {
  id: number;
  name: string;
  userId?: number;
}

export interface MeasuringTool {
  id: number;
  name: string;
  userId?: number;
}

export function getMachiningTime(activity: Activity): number {
  if (!activity.conditions) return 0;
  if (
    !activity.conditions.Dk &&
    !activity.conditions.Dp &&
    !activity.conditions.L &&
    !activity.conditions.Vc &&
    !activity.conditions.f &&
    !activity.conditions.n &&
    !activity.conditions.Ap
  )
    return 0;
  return (
    (activity.conditions.Dk * activity.conditions.L) /
    (318 * activity.conditions.Vc * activity.conditions.f)
  );
}

export function getOperationTpz(operation: Operation): number {
  return operation.normalizationTasks.reduce(
    (sum, task) => sum + task.timeMinutes,
    0
  );
}

export function getOperationTg(operation: Operation): number {
  return operation.setups
    .flatMap((setup) => setup.activities)
    .reduce((sum, activity) => sum + getMachiningTime(activity), 0);
}

export function getActivityTp(activity: Activity): number {
  return activity.activityTimeComponents.reduce(
    (sum, component) => sum + component.timeMinutes,
    0
  );
}

export function getOperationTp(operation: Operation): number {
  return operation.setups
    .flatMap((setup) => setup.activities)
    .reduce((sum, activity) => sum + getActivityTp(activity), 0);
}

export function getOperationTw(operation: Operation): number {
  return getOperationTg(operation) + getOperationTp(operation);
}

export function getOperationTj(operation: Operation): number {
  const tw = getOperationTw(operation);
  return tw + 0.2 * tw;
}
