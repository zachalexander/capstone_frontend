import { Component, OnInit, Input, Output, EventEmitter, ViewChild, ɵgetDebugNode__POST_R3__} from '@angular/core';
import {} from 'googlemaps';
import { FlaskConnectService } from './services/flask-connect.service'
import MeasureTool from 'measuretool-googlemaps-v3';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import { MatStepper } from '@angular/material/stepper';
import { CookieService } from 'ngx-cookie-service';
import * as d3 from 'd3';
import { DomSanitizer, SafeResourceUrl, SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})

export class AppComponent implements OnInit {
  title = 'Solar Calculator';
  searchFormGroup: FormGroup;
  drawFormGroup: FormGroup;
  firstFormGroup: FormGroup;
  secondFormGroup: FormGroup;
  initialFormGroup: FormGroup;
  isEditable = false;
  confirm = false;
  mobile;
  postError = false;
  sunroofImg;
  autocompleteInput: string;
  queryWait: boolean;
  address: string;
  coordinates;
  sqrfeet;
  values;
  area;
  measureTool;
  measureEvent;
  heading;
  isLinear = true;
  draw: boolean;
  userData;
  recSq;
  roofArea;
  yes = false;
  no = false;
  hideQuestion = false;
  showConfirmHeading = false;
  modelRun = false;
  confirmSf = false;
  houseSquareFootage;
  year_built;
  graphData;
  map: google.maps.Map;
  scraping = false;
  scrapeSunroof = false;
  scrapeRealtor = false;
  loading = false;
  houseSqFt;
  yearBuilt;

  fullDataScrape = false;
  noDataScrape = false;
  justRealtorDataScrape = false;
  justSunroofDataScrape = false;

  noSquareFootage = false;
  noYearBuilt = false;

  constructor(
    private flaskConnectService: FlaskConnectService,
    private _formBuilder: FormBuilder,
    private cookieService: CookieService,
    private _sanitizer: DomSanitizer
  ) {}
  
  @ViewChild('map', {static: true}) mapElement: any;
  @Output() setAddress: EventEmitter<any> = new EventEmitter();
  @ViewChild('addresstext') addresstext: any;
  @Input() addressType: string;
  @Input('aria-label') ariaLabel: string;

  // Initialize page and google maps

  ngOnInit(): void {
    this.initMap(); 
    // this.getValues();

    this.searchFormGroup = this._formBuilder.group({
      initCtrl: ['', Validators.required]
    });

    this.drawFormGroup = this._formBuilder.group({
      drawCtrl: ['', Validators.required]
    });
  
    this.firstFormGroup = this._formBuilder.group({
      firstCtrl: ['', Validators.required]
    });
    this.secondFormGroup = this._formBuilder.group({
      secondCtrl: ['', Validators.required]
    });
    this.initialFormGroup = this._formBuilder.group({
      initialCtrl: ['', Validators.required]
    });
  }

  // function to retrieve the string version of address inputed into search
  getAddress(place: object) { 
    this.address = place['formatted_address']
  }

  // when address "search" selected, starts the postCoords function below to save address information to db
  postCoords(lat, lng): void {
    this.userData = {
        "latitude": lat,
        "longitude": lng,
        "address": this.address
    }
    
    this.flaskConnectService.postCoords(this.userData).subscribe(response => {
      if(response == 'success') {
        this.flaskConnectService.getScrapedData(this.address).subscribe(response => {
          if(response) {
            if(response.status == 'could not locate sunroof or realtor data!'){
              console.log(response.status)
              console.log(response)
              this.loading = false;
              this.scraping = false;
              this.noDataScrape = true;
            } else if (response.status == 'found realtor data but no sunroof data!') {
              console.log(response.status)
              console.log(response)              
              this.houseSqFt = response.square_footage;
              this.yearBuilt = response.year_built;
              this.loading = false;
              this.scraping = false;
              this.justRealtorDataScrape = true;
            } else if (response.status == 'found sunroof data but no realtor data!') {
              console.log(response.status)
              console.log(response)
              this.sunroofImg = this.getSafeUrl(response.screenshot);
              this.recSq = response.estimate;
              this.loading = false;
              this.scraping = false;
              this.justSunroofDataScrape = true;
            } else if (response.status == 'found both sunroof and realtor data!'){
              console.log(response.status)
              console.log(response)
              this.houseSqFt = response.square_footage;
              this.yearBuilt = response.year_built;
              this.sunroofImg = this.getSafeUrl(response.screenshot);
              this.recSq = response.estimate;
              this.loading = false;
              this.scraping = false;
              this.fullDataScrape = true;
            } else {
              console.log(response)
            }
          }
          else {
            console.log('a server error occurred, please refresh and try again.')
          }
          })
        } else {
          console.log('data was not scraped correctly')
        }
      }
    )
  }
  // in order to load the Project Sunroof image, we need to deem it safe for the browser
  getSafeUrl(base64) {
    return this._sanitizer.bypassSecurityTrustResourceUrl(base64);     
  } 


  initMap(): void {
    this.draw = true;
    let map: google.maps.Map;

    //set center coordinate
    let myLat= 42.6526;
    let myLng= -73.7562;
    let ALBANY = {lat:myLat, lng:myLng};

    const ALBANY_BOUNDS = {
      north: 42.8,
      south: 42.4,
      east: -73,
      west: -74.3
    };

    //create map
    map = new google.maps.Map(document.getElementById('map') as HTMLElement, {
        zoom: 14,
        center: ALBANY,
        mapTypeId: 'hybrid',
        // restriction: {
        //   latLngBounds: ALBANY_BOUNDS,
        //   strictBounds: false
        // },
        disableDefaultUI: true,
        heading: 90
    });

    map.setTilt(0)

    this.measureTool = new MeasureTool(map, {
      contextMenu: false,
      showSegmentLength: false,
      showTotalDistance: false,
      invertColor: true,
      unit: MeasureTool.UnitTypeId.IMPERIAL
    })

    const polygon = new google.maps.Polygon({
      clickable: true
    })

    this.measureTool.addListener('measure_start', function() {
      polygon.setOptions({clickable: false});
    })

    this.measureTool.addListener('measure_end', function() {
      polygon.setOptions({clickable: true});
    })

    const geocoder = new google.maps.Geocoder();

    (document.getElementById("submit") as HTMLButtonElement).addEventListener(
      "click",
      () => {
        this.scraping = true;
        this.scrapeSunroof = true;
        this.loading = true;
        this.geocodeAddress(geocoder, map, this.address);
      }
    );
   
  }


  // The latitude and longitude coordinates are processed to create the address posted to db
  geocodeAddress(
    geocoder: google.maps.Geocoder,
    resultsMap: google.maps.Map,
    addressType
  ) {
    geocoder.geocode({ address: addressType}, (results, status) => {
      if (status === "OK") {
        resultsMap.setCenter(results[0].geometry.location);
        let marker = new google.maps.Marker({
          map: resultsMap,
          position: results[0].geometry.location,
        });

        let lat = marker.getPosition().lat()
        let lng = marker.getPosition().lng()

        this.postCoords(lat, lng);

        resultsMap.setZoom(22)
      } else {
        alert("Something went wrong with your address search, please try again.");
      }
    });
  }

  findArea(){
    console.log(this.measureTool)
  }
  
  squareFootageSubmit(stepper: MatStepper){
    this.houseSquareFootage = this.secondFormGroup.value;
    this.houseSquareFootage = this.houseSquareFootage.secondCtrl;
    console.log(this.houseSquareFootage)
    stepper.next();
  }

  confirmHomeSqFt(){
    this.houseSquareFootage = this.houseSqFt;
    console.log(this.houseSquareFootage)
    this.noSquareFootage = false;
  }

  confirmYearBuilt(){
    this.year_built = this.yearBuilt;
    console.log(this.year_built)
    this.noYearBuilt = false;
  }


  yearBuiltSubmit(){
    this.year_built = this.firstFormGroup.value;
    this.year_built = this.year_built.firstCtrl;
    console.log(this.year_built)
  }

  reDraw() {
    this.confirmSf = false;
    this.measureTool.end();
  }

  confirmFootage(stepper: MatStepper){
    this.confirmSf = true;
    stepper.next()
    this.roofArea = document.getElementById('square-feet').innerHTML;
    this.measureTool.end()
  }

  goForward(stepper: MatStepper){
    stepper.next();
    this.measureTool.end();
  }

  measureManually(){
    this.confirmSf = false;
    this.measureTool.start();
  }

  yesConfirm(){
    this.yes = true;
    this.no = false;

    this.measureTool._area = this.recSq
  }

  noConfirm(){
    this.yes = false;
    this.no = true;
    this.hideQuestion = true;
  }

  noConfirmSquareFootage(){
    this.noSquareFootage = true;
  }

  noConfirmYearBuilt(){
    this.noYearBuilt = true;
  }

  calculateHeading(){
    this.confirm = true;
    let start_location = new google.maps.LatLng(this.measureTool._segments[0].start_location.lat, this.measureTool._segments[0].start_location.lng)
    let end_location = new google.maps.LatLng(this.measureTool._segments[0].end_location.lat, this.measureTool._segments[0].end_location.lng)
    this.heading = google.maps.geometry.spherical.computeHeading(start_location, end_location);

    if (this.heading <= -90 && this.heading >= -180) {
      this.heading = -(-180 - this.heading)
    } else if(this.heading >= 90 && this.heading <= 180) {
      this.heading = -180 + this.heading
    } else if(this.heading >= 0 && this.heading < 90) {
      this.heading = (-90 - (90-this.heading))
    } else if(this.heading >= -90 && this.heading <0) {
      this.heading = 90 + (180 - (90 - this.heading))
    }
  }


  getValues(): void {
    this.flaskConnectService.getValues().subscribe(values => {
      this.values = values
      console.log(this.values)
    })
  }

  postClick() {
    this.roofArea = this.roofArea.replace(/,/g, '');
    this.postValues(this.roofArea, this.houseSquareFootage, this.address, this.heading, this.year_built)
  }

  // function to post values to the backend database and trigger the model run
  postValues(area, houseFootage, address, azimuth, yearBuilt): void {

    this.modelRun = true;
    area = parseInt(area);
    houseFootage = parseInt(houseFootage)
    let values = {
        "panel_area": area,
        "house_footage": houseFootage,
        "address": address,
        "azimuth": azimuth,
        "year_built": yearBuilt
        }

    console.log(values)
    this.flaskConnectService.postValues(values).subscribe(data => {
      if(!data) {
        console.log('no data inputted!')
        this.postError = true;
      } else {
        return 0;
      }
    })

    // triggering the model run and if successful, drawing our graph
    this.flaskConnectService.runModel(address).subscribe(data => {
      if(!data) {
        console.log('cannot run model!')
        this.postError = true;
      } else {

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

        let maxvalues_array = []
        for(let i=0; i < data.length; i++){
          maxvalues_array.push(data[i]['I=$25k, r=.2'])
        }

        this.drawGraph(width, height, data, yheight, widthsvg, maxvalues_array)
        
        this.modelRun = false;
      }
    })
  }


  // d3.js code to draw our initial projection graph
  drawGraph(width, height, datapull, yheight, widthsvg, maxvalues_array){

    d3.selectAll("svg").remove();

    this.graphData = datapull;
    console.log(this.graphData)
    console.log('width', width)
    console.log('height', height)
    console.log('height of y', yheight)
    console.log('width of svg', widthsvg) 

    const margin = { top: 20, right: 60, bottom: 20, left: 60};
    height = height - margin.top - margin.bottom;
    width = width - margin.right - margin.left;

    let graphShift = margin.left / 2;

    if(width > 600){
      width = 600;
      graphShift = margin.left / 2;
    }

    let maxValue = d3.max(maxvalues_array)

    if(d3.max(maxvalues_array) < 0){
      maxValue = 0;
    }

    const x = d3.scaleTime().range([0, width - margin.right]);
    x.domain([0, datapull.length]);

    const y = d3.scaleLinear().range([yheight, 0]);
    y.domain([-45000, maxValue]);

    // const area = d3.area()
    // .x(function(d) { return x(parseTime(d.date)); })
    // .y0(height)
    // .y1(function(d) { return height - y(d.cases); })
    // .curve(d3.curveMonotoneX);

    const valueline = d3.line()
    .x(function(d, i) { return x(i); })
    .y(function(d) { return y(d['I=$15k, r=.175']); })
    .curve(d3.curveMonotoneX);

    const valueline2 = d3.line()
    .x(function(d, i) { return x(i); })
    .y(function(d) { return y(d['I=$15k, r=.2']); })
    .curve(d3.curveMonotoneX);

    const valueline3 = d3.line()
    .x(function(d, i) { return x(i); })
    .y(function(d) { return y(d['I=$25k, r=.2']); })
    .curve(d3.curveMonotoneX);

    const valueline4 = d3.line()
    .x(function(d, i) { return x(i); })
    .y(function(d) { return y(d['I=$25k, r=.175']); })
    .curve(d3.curveMonotoneX);

    const valueline5 = d3.line()
    .x(function(d, i) { return x(i); })
    .y(function(d) { return y(d['Regular Grid Service']); })
    .curve(d3.curveMonotoneX);

    const svg = d3.select('.top-wrapper')
                .append('svg')
                .attr('width',  width)
                .attr('height', height - margin.top - margin.bottom)
                .attr('x', 0)
                .attr('y', 0)
                .attr('class', 'projection')
                .append('g')
                .attr('transform', 'translate(' + graphShift + ', 0)')
                .attr('class', 'graph')

    //       svg.append('path')
    //           .datum(datapull)
    //           .attr('class', 'area')
    //           .attr('d', area);

            // Add the x-axis.
        svg.append('g')
            .attr("class", "y-axis")
            .attr("transform", "translate(0," + (margin.top + margin.bottom) + ")")
            .call(d3.axisLeft(y).ticks(8).tickSizeOuter(0).tickFormat(d => (d/1000) + 'K'));

        svg.append('g')
            .attr("class", "x-axis")
            .attr("transform", "translate(0," + (yheight + margin.top + margin.bottom) + ")")
            .call(d3.axisBottom(x).ticks(10).tickSizeOuter(1).tickFormat(d => (d * 100)/100));

        svg.append('path')
          .datum(datapull)
          .attr('class', 'line')
          .attr('fill', 'none')
          .attr('stroke-width', '3px')
          .attr('stroke', '#525564')
          .attr('d', valueline)
          .attr("transform", "translate(0," + (margin.top + margin.bottom) + ")")

        svg.append('path')
          .datum(datapull)
          .attr('class', 'line')
          .attr('fill', 'none')
          .attr('stroke-width', '3px')
          .attr('stroke', '#74828F')
          .attr('d', valueline2)
          .attr("transform", "translate(0," + (margin.top + margin.bottom) + ")")

        svg.append('path')
          .datum(datapull)
          .attr('class', 'line')
          .attr('fill', 'none')
          .attr('stroke-width', '3px')
          .attr('stroke', '#96C0CE')
          .attr('d', valueline3)
          .attr("transform", "translate(0," + (margin.top + margin.bottom) + ")")

        svg.append('path')
          .datum(datapull)
          .attr('class', 'line')
          .attr('fill', 'none')
          .attr('stroke-width', '3px')
          .attr('stroke', '#BEB9B5')
          .attr('d', valueline4)
          .attr("transform", "translate(0," + (margin.top + margin.bottom) + ")")

        svg.append('path')
          .datum(datapull)
          .attr('class', 'line')
          .attr('fill', 'none')
          .attr('stroke-width', '3px')
          .attr('stroke', '#C25B56')
          .attr('d', valueline5)
          .attr("transform", "translate(0," + (margin.top + margin.bottom) + ")")

        const ext_color_domain = [25, 35, 45, 55, 65];

        const ls_w = 20, ls_h = 3;

        const legend = svg.append('g')
        .data(ext_color_domain)
        .attr('class', 'legend');

        legend.append('rect')
        .attr('x', 20)
        .attr('y', yheight - 55)
        .attr('width', ls_w)
        .attr('height', ls_h)
        .style('fill', function (d, i) { return '#525564'; })
        .style('opacity', 0.8);

        legend.append('rect')
          .attr('x', 20)
          .attr('y', yheight - 40)
          .attr('width', ls_w)
          .attr('height', ls_h)
          .style('fill', function (d, i) { return '#74828F'; })
          .style('opacity', 0.8);
          
        legend.append('rect')
        .attr('x', 20)
        .attr('y', yheight - 25)
        .attr('width', ls_w)
        .attr('height', ls_h)
        .style('fill', function (d, i) { return '#96C0CE'; })
        .style('opacity', 0.8);

        legend.append('rect')
        .attr('x', 20)
        .attr('y', yheight - 10)
        .attr('width', ls_w)
        .attr('height', ls_h)
        .style('fill', function (d, i) { return '#BEB9B5'; })
        .style('opacity', 0.8);

        legend.append('rect')
        .attr('x', 20)
        .attr('y', yheight + 5)
        .attr('width', ls_w)
        .attr('height', ls_h)
        .style('fill', function (d, i) { return '#C25B56'; })
        .style('opacity', 0.8);

        legend.append('text')
        .attr('x', 45)
        .attr('y', yheight - 50)
        .attr('font-size', '10px')
        .attr('font-weight', '500')
        .attr('fill', '#525564')
        .text('$15K initial cost, 17.5% efficiency')

        legend.append('text')
          .attr('x', 45)
          .attr('y', yheight - 35)
          .attr('font-size', '10px')
          .attr('font-weight', '500')
          .attr('fill', '#74828F')
          .text('$15K initial cost, 20.0% efficiency');

        legend.append('text')
          .attr('x', 45)
          .attr('y', yheight - 20)
          .attr('font-size', '10px')
          .attr('font-weight', '500')
          .attr('fill', '#96C0CE')
          .text('$25K initial cost, 20% efficiency');

        legend.append('text')
          .attr('x', 45)
          .attr('y', yheight - 5)
          .attr('font-size', '10px')
          .attr('font-weight', '500')
          .attr('fill', '#BEB9B5')
          .text('$25K initial cost, 17.5% efficiency');

        legend.append('text')
          .attr('x', 45)
          .attr('y', yheight + 10)
          .attr('font-size', '10px')
          .attr('font-weight', '500')
          .attr('fill', '#C25B56')
          .text('Regular grid service');
                    
  }
}

  





