import { inject, Injectable, Type } from '@angular/core';
import { ProjectService } from './project.service';
import { Operation, Project } from './project.model';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API } from '../../app.config';

declare const pdfMake: any;

type TechCardData = {
  partName: string;
  productName: string;
  unitsPerProduct: number;
  unitsInOrder: number;
  unitsPerBatch: number;
  completionDate: Date;
  material: string;
  blank: string;
  operations: {
    sequence: number;
    operationName: string;
    tj: number;
    tpz: number;
  }[];
  Twc: number;
};

type InstCardData = {
  sequence: number;
  operationName: string;
  setups: {
    drawing: string;
    activities: {
      sequence: number;
      activityName: string;
      Dp: number | undefined;
      Dk: number | undefined;
      L: number | undefined;
      Ap: number | undefined;
      f: number | undefined;
      Vc: number | undefined;
      n: number | undefined;
      tg: number;
      toolSymbol?: string;
    }[];
  }[];
  tools: { symbol: string; name: string }[];
};

@Injectable({
  providedIn: 'root',
})
export class PdfService {
  private processService = inject(ProjectService);
  private http = inject(HttpClient);

  generatePdf(documentDefinition: any) {
    return pdfMake.createPdf(documentDefinition);
  }

  generateTechCard(data: TechCardData) {
    const documentDefinition = {
      pageMargins: [30, 30, 30, 30],
      content: [
        {
          text: 'Karta Technologiczna KT - Plan Operacyjny',
          style: 'header',
          margin: [0, 0, 0, 10],
        },
        {
          table: {
            headerRows: 1,
            widths: [85, 90, 80, 90, 75, 108],
            body: [
              [
                {
                  text: 'Wyrób',
                  style: 'tableHeader',
                  valign: 'middle',
                  alignment: 'center',
                },
                {
                  text: 'Nazwa części',
                  style: 'tableHeader',
                  valign: 'middle',
                  alignment: 'center',
                },
                {
                  text: 'Sztuk na wyrób',
                  style: 'tableHeader',
                  valign: 'middle',
                  alignment: 'center',
                },
                {
                  text: 'Sztuk na zlecenie',
                  style: 'tableHeader',
                  valign: 'middle',
                  alignment: 'center',
                },
                {
                  text: 'Sztuk na partię',
                  style: 'tableHeader',
                  valign: 'middle',
                  alignment: 'center',
                },
                {
                  text: 'Data realizacji zlecenia',
                  style: 'tableHeader',
                  valign: 'middle',
                  alignment: 'center',
                },
              ],
              [
                { text: data.productName ?? '', style: 'tableCell' },
                { text: data.partName ?? '', style: 'tableCell' },
                { text: data.unitsPerProduct ?? '', style: 'tableCell' },
                { text: data.unitsInOrder ?? '', style: 'tableCell' },
                { text: data.unitsPerBatch ?? '', style: 'tableCell' },
                {
                  text: data.completionDate ?? '',
                  style: 'tableCell',
                },
              ],
            ],
          },
          layout: {
            hLineWidth: function (i: number, node: any) {
              return 1;
            },
            vLineWidth: function (i: number, node: any) {
              return 1;
            },
            hLineColor: function (i: number, node: any) {
              return '#ddd';
            },
            vLineColor: function (i: number, node: any) {
              return '#ddd';
            },
            paddingLeft: function (i: number, node: any) {
              return 0;
            },
            paddingRight: function (i: number, node: any) {
              return 0;
            },
            paddingTop: function (i: number, node: any) {
              return 4;
            },
            paddingBottom: function (i: number, node: any) {
              return 4;
            },
          },
          margin: [0, 0, 0, 0],
        },
        {
          table: {
            headerRows: 1,
            widths: ['*', '*', '*', '*', '*', '*'],
            body: [
              [
                { text: 'Materiał', style: 'tableHeader' },
                { text: 'Półfabrykat', style: 'tableHeader' },
                { text: 'Masa 1 sztuki', style: 'tableHeader' },
                { text: 'Norma materiału', style: 'tableHeader' },
                { text: 'Materiał na partię', style: 'tableHeader' },
                { text: 'Koszt materiału', style: 'tableHeader' },
              ],
              [
                { text: data.material ?? '', style: 'tableCell' },
                {
                  text: data.blank ?? '',
                  style: 'tableCell',
                },
                { text: data.unitsPerBatch ?? '', style: 'tableCell' },
                { text: data.unitsPerBatch ?? '', style: 'tableCell' },
                {
                  text: data.unitsInOrder ?? '',
                  style: 'tableCell',
                },
                { text: data.unitsInOrder ?? '', style: 'tableCell' },
              ],
            ],
          },
          layout: {
            hLineWidth: function (i: number, node: any) {
              return 1;
            },
            vLineWidth: function (i: number, node: any) {
              return 1;
            },
            hLineColor: function (i: number, node: any) {
              return '#ddd';
            },
            vLineColor: function (i: number, node: any) {
              return '#ddd';
            },
            paddingLeft: function (i: number, node: any) {
              return 4;
            },
            paddingRight: function (i: number, node: any) {
              return 4;
            },
            paddingTop: function (i: number, node: any) {
              return 4;
            },
            paddingBottom: function (i: number, node: any) {
              return 4;
            },
          },
          margin: [0, 0, 0, 0],
        },
        {
          table: {
            headerRows: 1,
            widths: ['auto', 'auto', 'auto', '*', 'auto', 'auto', 'auto'],
            body: [
              [
                { text: 'Nr OP', style: 'tableHeader' },
                { text: 'Wydział', style: 'tableHeader' },
                { text: 'Stanowisko', style: 'tableHeader' },
                { text: 'Opis operacji', style: 'tableHeader' },
                { text: 'tpz [h]', style: 'tableHeader' },
                { text: 'tj [h]', style: 'tableHeader' },
                { text: 'T [h]', style: 'tableHeader' },
              ],
              ...data.operations.map((op: any) => [
                { text: op?.sequence ?? '', style: 'tableCell' },
                { text: op?.operationName ?? '', style: 'tableCell' },
                { text: op?.operationName ?? '', style: 'tableCell' },
                { text: op?.operationName ?? '', style: 'tableCell' },
                { text: op?.tpz ?? '', style: 'tableCell' },
                { text: op?.tj ?? '', style: 'tableCell' },
                {
                  text: op?.tj * data.unitsPerBatch + op?.tpz,
                  style: 'tableCell',
                },
              ]),
            ],
          },
          layout: {
            hLineWidth: function (i: number, node: any) {
              return 1;
            },
            vLineWidth: function (i: number, node: any) {
              return 1;
            },
            hLineColor: function (i: number, node: any) {
              return '#ddd';
            },
            vLineColor: function (i: number, node: any) {
              return '#ddd';
            },
            paddingLeft: function (i: number, node: any) {
              return 4;
            },
            paddingRight: function (i: number, node: any) {
              return 4;
            },
            paddingTop: function (i: number, node: any) {
              return 4;
            },
            paddingBottom: function (i: number, node: any) {
              return 4;
            },
          },
          margin: [0, 0, 0, 0],
        },
        {
          table: {
            headerRows: 1,
            widths: ['*', '*', '*', '*'],
            body: [
              [
                { text: 'Opracował:', style: 'tableHeader' },
                { text: 'Sprawdził:', style: 'tableHeader' },
                { text: 'Zatwierdził:', style: 'tableHeader' },
                { text: 'Twc [h]', style: 'tableHeader' },
              ],
              [
                {
                  text: data.blank ?? '',
                  style: 'tableCell',
                },
                {
                  text: data.blank ?? '',
                  style: 'tableCell',
                },
                {
                  text: data.blank ?? '',
                  style: 'tableCell',
                },
                {
                  text: data.Twc ?? '',
                  style: 'tableCell',
                },
              ],
            ],
          },
          layout: {
            hLineWidth: function (i: number, node: any) {
              return 1;
            },
            vLineWidth: function (i: number, node: any) {
              return 1;
            },
            hLineColor: function (i: number, node: any) {
              return '#ddd';
            },
            vLineColor: function (i: number, node: any) {
              return '#ddd';
            },
            paddingLeft: function (i: number, node: any) {
              return 4;
            },
            paddingRight: function (i: number, node: any) {
              return 4;
            },
            paddingTop: function (i: number, node: any) {
              return 4;
            },
            paddingBottom: function (i: number, node: any) {
              return 4;
            },
          },
        },
      ],
      styles: {
        header: {
          fontSize: 18,
          bold: true,
          alignment: 'center',
        },
        tableHeader: {
          bold: true,
          fontSize: 10,
          color: 'black',
          fillColor: '#f2f2f2',
          alignment: 'center',
        },
        tableCell: {
          fontSize: 10,
          alignment: 'center',
        },
      },
      defaultStyle: {
        font: 'Roboto',
      },
    };

    return pdfMake.createPdf(documentDefinition);
  }

  generateInstCard(data: InstCardData) {
    const tableLayout = {
      hLineWidth: () => 1,
      vLineWidth: () => 1,
      hLineColor: () => '#ddd',
      vLineColor: () => '#ddd',
      paddingLeft: () => 4, // Zmniejszono padding
      paddingRight: () => 4, // Zmniejszono padding
      paddingTop: () => 2, // Zmniejszono padding
      paddingBottom: () => 2, // Zmniejszono padding
    };
    const documentDefinition = {
      pageSize: 'A4',
      pageOrientation: 'portrait',
      pageMargins: [15, 40, 15, 40], // Zmniejszono marginesy
      content: [
        {
          text: 'Karta Instrukcyjna Obróbki',
          style: 'header',
          margin: [0, 0, 0, 10],
        },
        {
          table: {
            headerRows: 1,
            widths: ['*', '*', '*'],
            body: [
              [
                { text: 'Treść operacji:', style: 'tableHeaderMain' },
                { text: 'Stanowisko robocze', style: 'tableHeaderMain' },
                { text: 'Nr operacji', style: 'tableHeaderMain' },
              ],
              [
                'Planowanie powierzchni czołowych i wykonanie nakiełków',
                data.sequence ?? '',
                data.sequence ?? '',
              ],
            ],
          },
          layout: tableLayout,
          margin: [0, 0, 0, 0],
        },
        {
          table: {
            headerRows: 2,
            widths: [15, 30, 30, 15, '*', '*', 25, 25, 25, 25, 25, 25, 25, 30], // Zmniejszono szerokość kolumn
            body: [
              [
                {
                  image: writeRotatedText('Ustaw.'),
                  rowSpan: 2,
                  style: 'tableHeader',
                },
                {
                  image: writeRotatedText('Pozycja'),
                  rowSpan: 2,
                  style: 'tableHeader',
                }, // Skrócono tekst nagłówka
                {
                  image: writeRotatedText('Zabieg'),
                  rowSpan: 2,
                  style: 'tableHeader',
                }, // Skrócono tekst nagłówka
                {
                  image: writeRotatedText('Przejść'),
                  rowSpan: 2,
                  style: 'tableHeader',
                }, // Skrócono tekst nagłówka
                {
                  text: 'Opis zabiegu',
                  rowSpan: 2,
                  style: 'tableHeader',
                  alignment: 'center',
                },
                { text: 'Narzędzie', rowSpan: 2, style: 'tableHeader' },
                { text: 'Warunki Skrawania', colSpan: 7, style: 'tableHeader' },
                {},
                {},
                {},
                {},
                {},
                {},
                { text: 'czas tg [min]', rowSpan: 2, style: 'tableHeader' },
              ],
              [
                {},
                {},
                {},
                {},
                {},
                {},

                { text: 'Dp [mm]', style: 'tableHeader' },
                { text: 'Dk [mm]', style: 'tableHeader' },
                { text: 'L [mm]', style: 'tableHeader' },
                { text: 'Ap [mm]', style: 'tableHeader' },
                { text: 'f [mm/obr]', style: 'tableHeader' },
                { text: 'Vc [m/min]', style: 'tableHeader' },
                { text: 'n [obr]', style: 'tableHeader' },
                {},
              ],
              ...data.setups?.flatMap(
                (setup) =>
                  setup.activities?.map((activity) => [
                    activity.sequence ?? '',
                    activity.sequence ?? '',
                    activity.sequence ?? '',
                    activity.sequence ?? '',
                    activity.activityName ?? '',
                    activity.toolSymbol ?? '',
                    activity.Dp ?? '',
                    activity.Dk ?? '',
                    activity.L ?? '',
                    activity.Ap ?? '',
                    activity.f ?? '',
                    activity.Vc ?? '',
                    activity.n ?? '',
                    activity.tg.toFixed(3) ?? '',
                  ]) || []
              ),
            ],
          },
          layout: tableLayout,
          margin: [0, 0, 0, 0],
        },
        {
          columns: [
            {
              width: '70%',
              stack: [
                {
                  table: {
                    widths: ['*'],
                    body: [
                      [
                        {
                          text: 'Szkic operacyjny, uwagi:',
                          style: 'tableHeaderMain',
                        },
                      ],
                      ...data.setups.map((setup) => [
                        { image: setup.drawing, width: 300 },
                      ]),
                    ],
                  },
                  layout: tableLayout,
                },
              ],
            },
            {
              width: '30%',
              stack: [
                {
                  table: {
                    widths: ['*'],
                    body: [
                      [
                        {
                          text: 'Przyrządy i uchwyty obróbkowe',
                          style: 'tableHeaderMain',
                        },
                      ],
                      [''],
                    ],
                  },
                  layout: tableLayout,
                  margin: [0, 0, 0, 0],
                },
                {
                  table: {
                    widths: ['*'],
                    body: [
                      [
                        {
                          text: 'Narzędzia i uchwyty narzędziowe',
                          style: 'tableHeaderMain',
                        },
                      ],
                      ...data.tools.map((tool) => [
                        {
                          text: `${tool.symbol}: ${tool.name}`,
                          alignment: 'left',
                          style: 'defaultText',
                        },
                      ]),
                    ],
                  },
                  layout: tableLayout,
                  margin: [0, 0, 0, 10],
                },
                {
                  table: {
                    widths: ['*'],
                    body: [
                      [
                        {
                          text: 'Narzędzia pomiarowe',
                          style: 'tableHeaderMain',
                        },
                      ],
                      [''],
                    ],
                  },
                  layout: tableLayout,
                },
              ],
            },
          ],
          margin: [0, 0, 0, 0],
        },
        {
          table: {
            widths: ['*', '*', '*'],
            body: [
              [
                { text: 'Opracował:', style: 'tableHeader' },
                { text: 'Sprawdził:', style: 'tableHeader' },
                { text: 'Zatwierdził:', style: 'tableHeader' },
              ],
              [data.sequence ?? '', data.sequence ?? '', data.sequence ?? ''],
            ],
          },
          layout: tableLayout,
        },
      ],
      styles: {
        header: {
          fontSize: 16, // Nieco mniejsza czcionka nagłówka
          bold: true,
          alignment: 'center',
        },
        tableHeaderMain: {
          bold: true,
          fontSize: 10, // Zmniejszono rozmiar czcionki
          color: 'black',
          fillColor: '#f0f0f0',
          alignment: 'center',
        },
        tableHeader: {
          bold: true,
          fontSize: 8, // Zmniejszono rozmiar czcionki
          color: 'black',
          fillColor: '#e0e0e0',
          alignment: 'center',
        },
        rotatedHeader: {
          fontSize: 8,
          bold: true,
          alignment: 'center',
        },
        defaultText: {
          fontSize: 7, // Jeszcze mniejsza czcionka domyślna
        },
      },
      defaultStyle: {
        font: 'Roboto',
        alignment: 'center',
      },
    };

    return pdfMake.createPdf(documentDefinition);
  }

  getTechCard(id: string): Observable<Blob> {
    return this.http.get(`${API}/reports/process/${id}`, {
      responseType: 'blob', // Odbiór jako binary Blob
      headers: {
        Accept: 'application/pdf',
      },
    });
  }

  getInstCard(id: string): Observable<Blob> {
    return this.http.get(`${API}/reports/operation/${id}`, {
      responseType: 'blob', // Odbiór jako binary Blob
      headers: {
        Accept: 'application/pdf',
      },
    });
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

function writeRotatedText(text: string) {
  var ctx,
    canvas = document.createElement('canvas');
  canvas.width = 15;
  canvas.height = 50;
  ctx = canvas.getContext('2d');
  ctx!.font = '36pt Arial';
  ctx!.save();
  ctx!.translate(36, 270);
  ctx!.rotate(-0.5 * Math.PI);
  ctx!.fillStyle = '#000';
  ctx!.fillText(text, 0, 0);
  ctx!.restore();
  return canvas.toDataURL();
}
