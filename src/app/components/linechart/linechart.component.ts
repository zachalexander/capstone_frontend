import { Component, OnInit, Input} from '@angular/core';
import * as d3 from 'd3';
import { partition } from 'rxjs';

@Component({
  selector: 'app-linechart',
  templateUrl: './linechart.component.html',
  styleUrls: ['./linechart.component.scss']
})
export class LinechartComponent implements OnInit {

  @Input() private data: Array<any>;
  mobile;

  constructor() { }

  ngOnInit() {
    const width = window.innerWidth;
    const height = 500;
    const widthsvg = 450;

    if (width >= 600) {
      this.mobile = false;
    } else {
      this.mobile = true;
    }

    let yheight = 250;

    if (width <= 600) {
      yheight = 200;
    }

    this.drawfakeCases(width, height, this.data, yheight, widthsvg);
  }

  drawfakeCases(width, height, datapull, yheight, widthsvg) {

    datapull = datapull.fakedata;

    if (width >= 450) {
      width = widthsvg;
    }

    const parseTime = d3.timeParse('%m/%d/%Y');

    console.log(datapull);


    // const x = d3.scaleTime().range([0, width]);
    // x.domain(d3.extent(datapull, function(d) { return parseTime(d.date); }));

    // const y = d3.scaleLinear().range([0, yheight]);
    // y.domain([0, d3.max(datapull, function(d) { return d.cases; })]);

    // const area = d3.area()
    // .x(function(d) { return x(parseTime(d.date)); })
    // .y0(height)
    // .y1(function(d) { return height - y(d.cases); })
    // .curve(d3.curveMonotoneX);

    // const valueline = d3.line()
    // .x(function(d) { return x(parseTime(d.date)); })
    // .y(function(d) { return height - y(d.cases); })
    // .curve(d3.curveMonotoneX);

    // const svg = d3.select('.top-wrapper').append('svg')
    //             .attr('width',  width)
    //             .attr('height', height)
    //             .attr('x', 0)
    //             .attr('y', 0)
    //             .attr('class', 'jumbo')
    //             .append('g')
    //             .attr('transform', 'translate(0, 0)')
    //             .append('svg')
    //             .attr('id', 'annotate')
    //             .attr('width', width)
    //             .attr('height', height)
    //             .append('a');

    //       svg.append('path')
    //           .datum(datapull)
    //           .attr('class', 'area')
    //           .attr('d', area);

    //       svg.append('path')
    //           .datum(datapull)
    //           .attr('class', 'line')
    //           .attr('fill', 'none')
    //           .attr('stroke-width', '3px')
    //           .attr('stroke', '#f2f2f2')
    //           .attr('d', valueline);

                    
  }

}
