import { Component, OnInit } from '@angular/core';
import { EChartsOption } from 'echarts';
import { map, Observable, reduce, switchMap } from 'rxjs';
import { CollegeMajorsCubeService, Query } from './college-majors-cube.service';

interface ChartData {
  xAxisData: string[],
  seriesData: number[][],
  seriesLabels: string[]
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  selectedGroup = 'total';
  selectedCategory = 'Biology & Life Science';

  topGroupMajors$!: Observable<EChartsOption>;
  topCategoryMajors$!: Observable<EChartsOption>;

  majorsPerCategory$ = this.getChartOptions(
    {
      'measures': ['WomenStem.count'],
      'dimensions': ['WomenStem.majorCategory']
    },
    'Majors Per Category',
    'Major Categories',
    'Number of Majors'
  );

  majorCategoriesByGender$ = this.getChartOptions(
    {
      'measures': ['WomenStem.women', 'WomenStem.men', 'WomenStem.total'],
      'dimensions': ['WomenStem.majorCategory']
    },
    'Graduates per Major Category by Gender',
    'Major Categories',
    'Number of Graduates'
  );

  getTopMajorsInGroup() {
    this.topGroupMajors$ = this.getChartOptions(
      {
        'measures': [
          `WomenStem.${this.selectedGroup}`
        ],
        'order': {
          [`WomenStem.${this.selectedGroup}`]: 'desc'
        },
        'dimensions': [
          'WomenStem.major'
        ],
        'limit': 3
      },
      `Popular Majors in ${this.selectedGroup}`,
      'Major',
      'Number of Graduates'
    )
  }

  getTopMajorsInCategory() {
    this.topCategoryMajors$ = this.getChartOptions(
      {
        'measures': ['WomenStem.women', 'WomenStem.men', 'WomenStem.total'],
        'order': { 'WomenStem.total': 'desc' },
        'dimensions': ['WomenStem.major'],
        'filters': [
          {
            'member': 'WomenStem.majorCategory',
            'operator': 'equals',
            'values': [this.selectedCategory]
          }
        ],
        'limit': 3
      },
      `Graduates in Top 3 Popular Majors in ${this.selectedCategory}`,
      'Majors',
      'Number of Graduates'
    );
  }

  constructor(private cm: CollegeMajorsCubeService) { }

  ngOnInit() {
    this.getTopMajorsInGroup();
    this.getTopMajorsInCategory();
  }

  private formatBarChartData(title = '', xAxisLabel = '', yAxisLabel = ''): (source$: Observable<ChartData>) => Observable<EChartsOption> {
    return source$ => source$.pipe(
      map(chartData => {
        let options: EChartsOption = {
          tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
          grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
          title: { text: title, show: true },
          xAxis: { type: 'category', data: chartData.xAxisData, name: xAxisLabel, axisTick: { alignWithLabel: true } },
          series: [],
          yAxis: { type: 'value', name: yAxisLabel },
          legend: { data: chartData.seriesLabels }
        };

        chartData.seriesData.forEach((series, index) => {
          if (options.series && Array.isArray(options.series)) {
            options.series.push({
              type: 'bar',
              data: series,
              name: chartData.seriesLabels[index],
              label: { show: true, rotate: 90, align: 'left', verticalAlign: 'middle', position: 'insideBottom', distance: 15, formatter: '{a} → {c}', fontSize: 14 }
            });
          }
        });

        return options;
      })
    );
  }

  private getChartOptions(query: Query, title = '', xAxisLabel = '', yAxisLabel = '') {
    return this.cm.load(query).pipe(
      switchMap(data => data),
      reduce((ac: ChartData, cv: object, index: number) => {
        const vals = Object.values(cv);

        if (index == 0) {
          for (let i = 1; i < vals.length; i++) {
            ac.seriesData.push([]);
          }

          ac.seriesLabels = Object.keys(cv).slice(1).map(k => k.substring(k.lastIndexOf('.') + 1));
        }

        ac.xAxisData.push(vals[0]);

        for (let i = 1; i < vals.length; i++) {
          ac.seriesData[i - 1].push(vals[i]);
        }

        return ac;
      },
        { xAxisData: [], seriesData: [], seriesLabels: [] }
      ),
      this.formatBarChartData(title, xAxisLabel, yAxisLabel)
    )
  }
}