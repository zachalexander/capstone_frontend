import { Component, OnInit, Inject, Input, Output, EventEmitter, ViewChild, ɵgetDebugNode__POST_R3__} from '@angular/core';
import {} from 'googlemaps';
import { FlaskConnectService } from './services/flask-connect.service'
import MeasureTool from 'measuretool-googlemaps-v3';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import { MatStepper } from '@angular/material/stepper';
import { CookieService } from 'ngx-cookie-service';
import * as d3 from 'd3';
import { DomSanitizer, SafeResourceUrl, SafeUrl } from '@angular/platform-browser';
import { mapToMapExpression } from '@angular/compiler/src/render3/util';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import { ModalComponent } from './components/modal/modal.component';
import { ModalSunroofComponent } from './components/modal-sunroof/modal-sunroof.component';
import { MAT_RIPPLE_GLOBAL_OPTIONS } from '@angular/material/core';
import { MatPaginatorIntl } from '@angular/material/paginator';

import * as dummyData from '../assets/dummy.json';


interface Scenario {
  value: string;
  scenarioView: string;
}


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
  thirdFormGroup: FormGroup;
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
  household_members;

  fullDataScrape = false;
  noDataScrape = false;
  justRealtorDataScrape = false;
  justSunroofDataScrape = false;

  noSquareFootage = false;
  noYearBuilt = false;

  finished = false;

  latitude;
  longitude;

  homeInputs;
  allValues = false;

  editTableSquare = false;
  editTableYear = false;
  editTableArea = false;
  editTableAz = false;
  editTableMembers = false;
  editTableBill = false;

  panel_area;

  confirmDiv = false;

  drawMode = false;

  showConfirmButton = false;

  postingValues = false;
  ready = false;

  notReadyMessage = false;

  graphTest;
  requestData;

  chartError = false;
  scrapingError = false;

  dummyData = dummyData['default']

  formFinished = false;

  breakEvenHigh;
  breakEvenLow;

  testValue;

  installationCost;

  breakEvenLowViz;
  breakEvenHighViz;

  ratio;
  monthly_bill;
  monthly_bill_update;
  keep_update = false;
  ratio_update;

  firstScenario = false;

  constructor(
    private flaskConnectService: FlaskConnectService,
    private _formBuilder: FormBuilder,
    private cookieService: CookieService,
    private _sanitizer: DomSanitizer,
    public matDialog: MatDialog
  ) {}

  selected = 'I=$12k, r=0.19';
  
  scenario: Scenario[] = [
    {value: 'I=$12k, r=0.15', scenarioView: 'Initial Cost: $12,000; Panel Efficiency: 15.0%'},
    {value: 'I=$12k, r=0.19', scenarioView: 'Initial Cost: $12,000; Panel Efficiency: 19.0%'},
    {value: 'I=$20k, r=0.15', scenarioView: 'Initial Cost: $20,000; Panel Efficiency: 15.0%'},
    {value: 'I=$20k, r=0.19', scenarioView: 'Initial Cost: $20,000; Panel Efficiency: 19.0%'}
  ];

  
  
  @ViewChild('map', {static: true}) mapElement: any;
  @Output() setAddress: EventEmitter<any> = new EventEmitter();
  @ViewChild('addresstext') addresstext: any;
  @Input() addressType: string;
  @Input('aria-label') ariaLabel: string;


  openModal() {
    const dialogConfig = new MatDialogConfig();
    // The user can't close the dialog by clicking outside its body
    dialogConfig.disableClose = true;
    dialogConfig.height = "350px";
    dialogConfig.width = "600px";
    // https://material.angular.io/components/dialog/overview
    const modalDialog = this.matDialog.open(ModalComponent, dialogConfig);
  }

  openModalSunroof() {
    const dialogConfig = new MatDialogConfig();
    // The user can't close the dialog by clicking outside its body
    dialogConfig.disableClose = true;
    dialogConfig.height = "350px";
    dialogConfig.width = "600px";
    // https://material.angular.io/components/dialog/overview
    const modalDialog = this.matDialog.open(ModalSunroofComponent, dialogConfig);
  }


  // Initialize page and google maps

  ngOnInit(): void {

    this.initMap(); 

    // KEEP FOR GRAPH TESTING 
    // this.ready = true;
    // this.formFinished = true;
    // this.address = '57 Tamarack Dr, Delmar, NY 12054, USA'
    // this.tableCheck();

    // this.roofArea = 595;
    // this.houseSquareFootage = 1200;
    // this.heading =  0;
    // this.year_built = 2001;


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
    this.thirdFormGroup = this._formBuilder.group({
     thirdCtrl: ['', Validators.required]
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
              console.log(response)
              this.loading = false;
              this.scraping = false;
              this.noDataScrape = true;
              this.justRealtorDataScrape = false;
              this.justSunroofDataScrape = false;
              this.fullDataScrape = false;
            } else if (response.status == 'found realtor data but no sunroof data!') {
              console.log(response)         
              this.houseSqFt = response.square_footage;
              this.yearBuilt = response.year_built;
              this.loading = false;
              this.scraping = false;
              this.noDataScrape = false;
              this.justRealtorDataScrape = true;
              this.justSunroofDataScrape = false;
              this.fullDataScrape = false;
            } else if (response.status == 'found sunroof data but no realtor data!') {
              console.log(response)
              this.sunroofImg = this.getSafeUrl(response.screenshot);
              this.recSq = response.estimate;
              this.loading = false;
              this.scraping = false;
              this.noDataScrape = false;
              this.justRealtorDataScrape = false;
              this.justSunroofDataScrape = true;
              this.fullDataScrape = false;
            } else if (response.status == 'found both sunroof and realtor data!'){
              console.log(response)
              this.houseSqFt = response.square_footage;
              this.yearBuilt = response.year_built;
              this.sunroofImg = this.getSafeUrl(response.screenshot);
              this.recSq = response.estimate;
              this.loading = false;
              this.scraping = false;
              this.noDataScrape = false;
              this.justRealtorDataScrape = false;
              this.justSunroofDataScrape = false;
              this.fullDataScrape = true;
            } else {
              console.log(response)
            }
          }
          else {
            console.log('a server error occurred, please refresh and try again.')
          }
          }, 
            err => {
              this.scrapingError = true;
              this.noDataScrape = true;
              this.loading = false;
              this.scraping = false;
              console.log(err)
            })
        } else {
          console.log('data was not scraped correctly')
        }
      }, 
        err => {
          this.scrapingError = true;
          this.noDataScrape = true;
          this.loading = false;
          this.scraping = false;
          console.log(err)
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

    //create map
    map = new google.maps.Map(document.getElementById('map') as HTMLElement, {
        zoom: 14,
        center: {lat:42, lng:-73},
        mapTypeId: 'hybrid',
        disableDefaultUI: true,
        heading: 90
    });

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
    

    // UNCOMMENT WHEN TESTING!

    // this.geocodeAddress(geocoder, map, this.address)

    // UNCOMMENT WHEN LIVE!


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

  initMapAddress(address, id_element): void {
    this.draw = true;
    let map: google.maps.Map;
    let ADDRESS = {lat:this.latitude, lng:this.longitude};

    //create map
    map = new google.maps.Map(document.getElementById(id_element), {
        center: ADDRESS,
        mapTypeId: 'hybrid',
        disableDefaultUI: true,
        heading: 90
    });

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

    geocoder.geocode({ address: address}, (results, status) => {
      if (status === "OK") {
        map.setCenter(results[0].geometry.location);
        let marker = new google.maps.Marker({
          map: map,
          position: results[0].geometry.location,
        });

        this.latitude = marker.getPosition().lat()
        this.longitude = marker.getPosition().lng()
        map.setZoom(22)
        map.setTilt(0)
        google.maps.event.trigger(map, 'resize');

      } else {
        alert("Something went wrong with your address search, please try again.");
      }
    })
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

        this.latitude = marker.getPosition().lat()
        this.longitude = marker.getPosition().lng()

        this.postCoords(this.latitude, this.longitude);

        resultsMap.setZoom(22)

      } else {
        alert("Something went wrong with your address search, please try again.");
      }
    });
  }
  
  squareFootageSubmit(stepper: MatStepper){
    this.houseSquareFootage = this.secondFormGroup.value;
    this.houseSquareFootage = this.houseSquareFootage.secondCtrl;
    stepper.next();
    this.initMapAddress(this.address, 'mapMove')
    document.getElementById('mapMove').style.height = '0px'

    if(this.justRealtorDataScrape == true || this.noDataScrape == true){
      document.getElementById('mapMove').style.height = '400px'
    }

  }
  confirmHomeSqFt(){
    this.initMapAddress(this.address, 'mapMove')
    document.getElementById('mapMove').style.height = '0px'

    if(this.justRealtorDataScrape == true){
      document.getElementById('mapMove').style.height = '400px'
    }

    this.houseSquareFootage = this.houseSqFt;
    this.noSquareFootage = false;
  }

  confirmYearBuilt(){
    this.year_built = this.yearBuilt;
    this.noYearBuilt = false;
  }

  yearBuiltSubmit(){
    this.year_built = this.firstFormGroup.value;
    this.year_built = this.year_built.firstCtrl;
  }

  householdMemberSubmit(){
    this.household_members = this.thirdFormGroup.value;
    this.household_members = this.household_members.thirdCtrl;
  }

  reDraw() {
    this.confirmSf = false;
    this.measureTool.end();
    this.measureTool.start();
  }

  confirmFootage(stepper: MatStepper){
    stepper.next()
    this.measureTool.start();
    if (this.confirmSf = true){
      this.measureTool.start();
      this.roofArea = document.getElementById('sunroof-square-feet').innerHTML;
      this.initMapAddress(this.address, "mapMoveOrient")
      document.getElementById('mapMoveOrient').style.height = '400px'
    }
    this.drawMode = false;
  }

  confirmMeasureFootage(stepper: MatStepper){
    stepper.next()
    this.measureTool.start();
    this.roofArea = document.getElementById('square-feet').innerHTML;
    console.log(this.roofArea)
    this.initMapAddress(this.address, "mapMoveOrient")
    document.getElementById('mapMoveOrient').style.height = '400px';
    this.confirm = false;
    this.drawMode = false;
  }

  confirmMeasure(){
    if(this.measureTool._area !== 0){
      this.area = true;
    } else {
      this.area = false;
    }
    this.roofArea = this.measureTool._area;
    this.confirm = true;
  }

  backToEstimate(){
    this.hideQuestion = false;
    this.no = false;
    this.yes = true;
    this.confirmSf = true;
    document.getElementById('mapMove').style.height = '0px'
  }

  goForward(stepper: MatStepper){
    stepper.next();
    this.measureTool.end();
    this.homeProfile();
  }

  measureManually(){
    this.confirmSf = false;
    this.measureTool.end();
    this.measureTool.start();
    this.drawMode = true;
    this.draw = true;
    this.measureTool.start();
  }

  yesConfirm(){
    this.yes = true;
    this.no = false;
    this.confirmDiv = true;
    this.confirmSf = true;

    this.measureTool._area = this.recSq
    this.roofArea = this.recSq
  }

  noConfirm(){
    this.yes = false;
    this.no = true;
    this.hideQuestion = true;
    this.draw = true;
    document.getElementById('mapMove').style.height = '400px'
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
    })
  }

  homeProfile(){
    this.allValues = true;
  }


  editTableSqr(){
    this.editTableSquare = true;
  }

  editTableSqrUpdate(){
    this.editTableSquare = false;
    let square = (<HTMLInputElement>document.getElementById("squareFootage")).value
    this.houseSquareFootage= square;
  }

  editTableYr(){
    this.editTableYear = true;
  }

  editTableYrUpdate(){
    this.editTableYear = false;
    let yearbuilt = (<HTMLInputElement>document.getElementById("yearHouse")).value
    this.year_built = yearbuilt
  }

  editTableMemb(){
    this.editTableMembers = true;
  }

  editTableMembUpdate(){
    this.editTableMembers = false;
    let householdmem = (<HTMLInputElement>document.getElementById("membersHouse")).value
    this.household_members = householdmem
  }

  editTablePanel(){
    this.editTableArea = true;
  }

  editTablePanelUpdate(){
    this.editTableArea = false;
    let areaPanel = (<HTMLInputElement>document.getElementById("panelArea")).value
    this.roofArea = areaPanel
  }

  editTableAzimuth(){
    this.editTableAz = true;
  }

  editTableAzimuthUpdate(){
    this.editTableAz = false;
    let azimuthUpdate = (<HTMLInputElement>document.getElementById("azimuthTotal")).value;
    this.heading = azimuthUpdate;
  }

  editTableBillFun(){
    this.editTableBill = true;
  }

  editTableBillUpdate(){
    this.editTableBill = false;
    this.keep_update = true;
    let billUpdate = (<HTMLInputElement>document.getElementById("billTable")).value;
    this.monthly_bill_update = parseInt(billUpdate);
    console.log('initial ratio', this.ratio)
    console.log('updated value for monthly bill', this.monthly_bill_update)
    console.log('original monthly bill estimate', this.monthly_bill)
    this.ratio_update = this.monthly_bill_update / this.monthly_bill
    console.log('update to ratio to feed to backend?', this.ratio_update)
  }

  tableCheck(): void {
    if(this.roofArea == "" || this.houseSquareFootage == "" || this.heading == "" || this.year_built == "" || this.household_members == ""){
      this.ready = false;
      this.notReadyMessage = true;
    } else {
      this.ready = true;
      this.formFinished = true;
      
      let ratio = this.find_ratio(this.houseSquareFootage, this.year_built, this.household_members)

      // MULTIPLY BY AVERAGE KWH USAGE IN ALBANY AND DIVIDE BY 12?
      this.monthly_bill = ((ratio * 946.93) *  0.1174)

      document.getElementById('search-wrapper').style.visibility = 'hidden';
      document.getElementById('searchDiv').style.visibility = 'hidden';
      document.getElementById('search-wrapper').style.height = '0px';
      document.getElementById('searchDiv').style.height = '0px';
      const width = 700;
      const height = 400;
      this.drawDummyGraph(width, height, this.dummyData)
      this.postClick()




      // $element.scrollIntoView({behavior: "smooth", block: "end", inline: "nearest"});
    }
  }


  postClick() {
    if (typeof(this.roofArea) == 'string' && this.roofArea.includes(",")) {
      this.roofArea = this.roofArea.replace(/,/g, '');
    }
    this.roofArea = parseInt(this.roofArea);
    this.postValues(this.roofArea, this.houseSquareFootage, this.address, this.heading, this.year_built, this.household_members)
  }

  // function to post values to the backend database and trigger the model run
  postValues(area, houseFootage, address, azimuth, yearBuilt, householdMembers): void {

    area = parseInt(area);
    houseFootage = parseInt(houseFootage)
    azimuth = parseInt(azimuth)
    yearBuilt = parseInt(yearBuilt)
    householdMembers = parseInt(householdMembers)

    // UNCOMMENT WHEN LIVE

    let values = {
        "panel_area": area,
        "house_footage": houseFootage,
        "address": address,
        "azimuth": azimuth,
        "year_built": yearBuilt,
        "household_members": householdMembers
        }

    // KEEP FOR GRAPHIC TESTING

    // let values = {
    //   "panel_area": 595,
    //   "house_footage": 1200,
    //   "address": '57 Tamarack Dr, Delmar, NY 12054, USA',
    //   "azimuth": 0,
    //   "year_built": 2000,
    //   "household_members": 3
    // }

    this.flaskConnectService.postValues(values).subscribe(data => {
      if(!data) {
        console.log('no data inputted!')
        this.postError = true;
      } else {
        return 0;
      }
    })
    this.postingValues = false;
  }


  runFinalModel(){
    this.modelRun = true;
    // triggering the model run and if successful, drawing our graph
    this.flaskConnectService.runModel(this.address).subscribe(data => {
      if(!data) {
        console.log('cannot run model!')
        this.postError = true;
      } else {
        const width = 500;
        const height = 400;

        const heightBar = 400;
        const widthBar = 500;

        this.breakEvenHigh = data['high']
        this.breakEvenLow = data['low']

        console.log('scenario value', this.scenario['value'])
        
        this.drawGraph(width, height, data, 'I=$12k, r=0.19')
        this.drawBarGraph(widthBar, heightBar, data, 'I=$12k, r=0.19')
        this.drawEnergyChart(widthBar, heightBar, data, 'I=$12k, r=0.19')
        
        this.requestData = data;

        this.firstScenario = true;
        this.modelRun = false;
        this.finished = true;
      }
    },
      err => {
        console.log(err)
        this.chartError = true;
        if(err.code == 500){
          this.chartError = true;
          console.log('this is a 500 error!')
        }
      }
    
    
    )
  }

  runFinalModelRerun(){
    this.modelRun = true;
    this.postValues(this.roofArea, this.houseSquareFootage, this.address, this.heading, this.year_built, this.household_members)
    this.runFinalModel();
  }

  drawDummyGraph(width, height, datapull){

    const margin = { top: 80, right: 100, bottom: 80, left: 100};
    height = height - margin.top - margin.bottom;
    width = width - margin.right - margin.left;

    console.log(datapull)

     let yMax = d3.max(datapull, (d) => {return d['year']})

    if(d3.max(datapull, (d)=> { return d['I=$12k, r=0.19']; }) < 0){
      yMax = 0;
    }

    const x = d3.scaleLinear().range([0, width]);
    x.domain([0,d3.max(datapull, (d) => {return d['year']})]);

    const y = d3.scaleLinear().range([height, 0]);
    y.domain([-55000, yMax + 5000]);

    let formatValue = d3.format(",.2f")
    let formatCurrency = function(d) { return "$" + formatValue(d); };

    const valueline = d3.line()
    .x(function(d) { return x(d['year']); })
    .y(function(d) { return y(d['I=$12k, r=0.19']); })
    .curve(d3.curveMonotoneX);

    const valueline2 = d3.line()
    .x(function(d) { return x(d['year']); })
    .y(function(d) { return y(d['Regular Grid Service']); })
    .curve(d3.curveMonotoneX);

    const svg = d3.select('.dummy-wrapper')
                .append('svg')
                .attr('width',  width + margin.right + margin.left)
                .attr('height', height + margin.top + margin.bottom)
                .attr('x', 0)
                .attr('y', 0)
                .attr('class', 'projection')
                .append('g')
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
                .attr('class', 'graph-dummy')

    // Add the x-axis.
    svg.append('g')
    .attr("class", "y-axis-dummy")
        .call(d3.axisLeft(y).ticks(15).tickSizeOuter(0).tickFormat(d => (d/1000) + 'K'));
        
      svg.append('g')
        .attr("class", "x-axis-dummy")
        .attr("transform", "translate(0," + (height) + ")")
        .call(d3.axisBottom(x).ticks(15).tickSizeOuter(0))

        svg.append("text")             
        .attr("transform", "translate(" + (width/2) + " ," + (height + margin.top - 30) + ")")
        .style("text-anchor", "middle")
        .text("Number of Years After Solar Investment");

        svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left + 30)
        .attr("x",0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Projected Cost ($)");   
    

      svg.append('path')
      .datum(datapull)
      .attr('class', 'line')
      .attr('fill', 'none')
      .attr('stroke-width', '3px')
      .attr('stroke', 'rgba(0,0,0,0.1)')
      .attr('d', valueline)

     svg.append('path')
      .datum(datapull)
      .attr('class', 'line')
      .attr('fill', 'none')
      .attr('stroke-width', '3px')
      .attr('stroke', 'rgba(0,0,0,0.2)')
      .attr('d', valueline2)


  }


  // d3.js code to draw our initial projection graph
  drawGraph(width, height, datapull, scenario){

    d3.selectAll("svg").remove();


    console.log(datapull)
    
    let break_even_hi = datapull['high']
    let break_even_lo = datapull['low']

    this.breakEvenHighViz = Math.floor(break_even_hi * .6)
    this.breakEvenLowViz = Math.floor(break_even_lo * .6)

    datapull = datapull['model_data']


    const margin = { top: 40, right: 60, bottom: 40, left: 60};
    height = height - margin.top - margin.bottom;
    width = width - margin.right - margin.left;

     let yMax = d3.max(datapull, (d) => {return d[scenario]})

    if(d3.max(datapull, (d)=> { return d[scenario]; }) < 0){
      yMax = 0;
    }

    const x = d3.scaleLinear().range([0, width]);
    x.domain([0,d3.max(datapull, (d) => {return d['year']})]);

    const y = d3.scaleLinear().range([height, 0]);
    y.domain([d3.min(datapull, function(d){return d['Regular Grid Service']}), yMax + 5000]);

    let formatValue = d3.format(",.2f")
    let formatCurrency = function(d) { return "$" + formatValue(d); };

    const valueline = d3.line()
    .x(function(d) { return x(d['year']); })
    .y(function(d) { return y(d[scenario]); })
    .curve(d3.curveMonotoneX);

    const valueline2 = d3.line()
    .x(function(d) { return x(d['year']); })
    .y(function(d) { return y(d['Regular Grid Service']); })
    .curve(d3.curveMonotoneX);

    const svg = d3.select('.top-wrapper')
                .append('svg')
                .attr('width',  width + margin.right + margin.left)
                .attr('height', height + margin.top + margin.bottom)
                .attr('x', 0)
                .attr('y', 0)
                .attr('class', 'projection')
                .append('g')
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
                .attr('class', 'graph')


        svg.append("rect")
          .attr("x", x(break_even_lo))
          .attr("y", 0)
          .attr("width", (x(break_even_hi)) - (x(break_even_lo)))
          .attr("height", height)
          .style("fill", "rgba(255, 166, 0, 0.3)")
          .style("fill-opacity", 0.4)


        svg.append("text")
          .attr("x", (x((break_even_lo + break_even_hi)/2) - 55))
          .attr("y", height / 9)
          .text('Likely break even range')
          .attr("font-size", "0.75em")
          .attr("fill", "rgba(255, 166, 0, 1)");
        
        
        let bisectDate = d3.bisector(function(d){ return (d['year']); }).left;

        var left = (document.getElementById("graph").offsetLeft);
        
        // Add the x-axis.
        svg.append('g')
        .attr("class", "y-axis")
            .call(d3.axisLeft(y).ticks(15).tickSizeOuter(0).tickFormat(d => (d/1000) + 'K'));
            
          svg.append('g')
            .attr("class", "x-axis")
            .attr("transform", "translate(0," + (height) + ")")
            .call(d3.axisBottom(x).ticks(15).tickSizeOuter(0))

            svg.append("text")             
            .attr("transform", "translate(" + (width/2) + " ," + (height + margin.top) + ")")
            .style("text-anchor", "middle")
            .text("Number of Years After Solar Investment")
            .attr('class', 'x-axis-label');

            svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - margin.left)
            .attr("x",0 - (height / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text("Projected Cost ($)")
            .attr('class', 'y-axis-label');   
        

       let path = svg.append('path')
          .datum(datapull)
          .attr('class', 'line')
          .attr('fill', 'none')
          .attr('stroke-width', '4px')
          .attr('stroke', '#003f5c')
          .attr('d', valueline)

        
        let check = d3.selectAll("line").empty()
        
        if(check){
          this.chartError = true;
        } else {
          this.chartError = false;
        }


        const totalLength = path.node().getTotalLength();

        let path2 = svg.append('path')
          .datum(datapull)
          .attr('class', 'line')
          .attr('fill', 'none')
          .attr('stroke-width', '4px')
          .attr('stroke', '#bc5090')
          .attr('d', valueline2)

        path.attr('stroke-dasharray', totalLength + ' ' + totalLength)
        .attr('stroke-dashoffset', totalLength)
        .transition()
        .on('start', function repeat() {
            d3.active(this)
                .duration(1000)
                .ease(d3.easeLinear)
                .attr('stroke-dashoffset', 0);
        });

        path2.attr('stroke-dasharray', totalLength + ' ' + totalLength)
        .attr('stroke-dashoffset', totalLength)
        .transition()
        .on('start', function repeat() {
            d3.active(this)
                .duration(1000)
                .ease(d3.easeLinear)
                .attr('stroke-dashoffset', 0);
        });
               
        
        // WORKING MOUSEOVER EFFECT (BASIC)

        let focus = svg.append("g")
        .attr('class', 'focus')                           
        .style("display", "none");  

        focus.append("line")
        .attr("class", "x")
        .style("stroke", "#003f5c")
        .style("stroke-dasharray", "3,3")
        .style("opacity", 0.5)
        .attr("y1", 0)
        .attr("y2", height);

        // append the y line
        focus.append("line")
            .attr("class", "y")
            .style("stroke", "#003f5c")
            .style("stroke-dasharray", "3,3")
            .style("opacity", 0.5)
            .attr("x1", 0)
            .attr("x2", width);
        
        focus.append("circle")                                 
        .attr("class", "y")                              
        .style("fill", "#003f5c")                            
        .style("stroke", "#003f5c")
        .style("stroke-width", 2)
        .attr("r", 3);  
          
          focus.append('rect')
          .attr('width', "150px")
          .attr('height', '20px')
          .style("fill", 'rgba(255,255,255,0.8)')
          .style("pointer-events", "all")  
          .attr('transform', 'translate(-60, -25)')  
          .attr('padding', '0.25em')             
          .attr('cursor', 'crosshair');
        
          focus.append("text")
          .attr("x", -50)
          .attr("dy", "-.95em")
          .attr('font-size', '0.75em')
          .attr('font-weight', '700')
          .attr('fill', '#003f5c')
              

          // svg.append("rect")                                   
          //     .attr("width", width)                          
          //     .attr("height", height)                    
          //     .style("fill", "none")                           
          //     .style("pointer-events", "all")             
          //     .on("mouseover", function() { focus.style("display", null); })
          //     .on("mouseout", function() { focus.style("display", "none"); })
          //     .on("mousemove", (event, d) => {

          //       var x0 = x.invert(d3.pointer(event,this)[0] - margin.right - left),
          //       i = bisectDate(datapull, x0, 1),
          //       d0 = datapull[i - 1],
          //       d1 = datapull[i],
          //       d = x0 - d0['year'] > d1['year'] - x0 ? d1 : d0;

          //     focus.attr("transform", "translate(" + x(d['year']) + "," + y(d[scenario]) + ")");
          //     focus.select("text").text('(Cost: ' + formatCurrency(d[scenario]) + ',' + ' Year: ' + Math.round(d['year'] * 10) / 10 + ')');
        
          //     focus.select(".x")
          //     .attr("y2", height - y(d[scenario]))
      
          //     focus.select(".y")
          //         .attr("transform", "translate(" + (width * -1) + ",0)")
          //         .attr("x2", (width + width));

          //    })
          //    .attr('cursor', 'crosshair');

             const ext_color_domain = [25, 35, 45, 55, 65];

             const ls_w = 20, ls_h = 3;
     
             const legend = svg.append('g')
             .data(ext_color_domain)
             .attr('class', 'legend');

             legend.append('rect')
             .attr('x', 20)
             .attr('y', height - 55)
             .attr('width', ls_w)
             .attr('height', ls_h)
             .style('fill', function (d, i) { return '#003f5c'; })
             .style('opacity', 0.8);

             legend.append('text')
             .attr('x', 45)
             .attr('y', height - 50)
             .attr('font-size', '10px')
             .attr('font-weight', '500')
             .attr('fill', '#003f5c')
             .text(scenario)
             
             legend.append('rect')
             .attr('x', 20)
             .attr('y', height - 35)
             .attr('width', ls_w)
             .attr('height', ls_h)
             .style('fill', function (d, i) { return '#bc5090'; })
             .style('opacity', 0.8);
             
             legend.append('text')
             .attr('x', 45)
             .attr('y', height - 30)
             .attr('font-size', '10px')
             .attr('font-weight', '500')
             .attr('fill', '#bc5090')
             .text('Regular grid service');
                    
  }

  drawBarGraph(width, height, datapull, scenario){

   
    datapull = datapull['value_data']

    let yMax = d3.max(datapull, function(d) { return d[scenario + '_value']; })

    if(yMax < 0){
      yMax = 1000;
    } else {
      yMax = d3.max(datapull, function(d) { return d[scenario + '_value']; })
    }

    d3.select('.toolTip').remove();

    if(scenario == 'I=$12k, r=0.175' || scenario == 'I=$12k, r=0.19'){
      this.installationCost = '$12,000';
    } else {
      this.installationCost = '$20,000'
    }

    let tooltip = d3.select('.bar').append('div').attr('class', "toolTip")

    const margin = { top: 40, right: 60, bottom: 40, left: 60};
    height = height - margin.top - margin.bottom;
    width = width - margin.right - margin.left;

    const xBar = d3.scaleBand().range([0, width]).padding(0.05);
    const yBar = d3.scaleLinear().range([height, 0]);

    xBar.domain(datapull.map(function(d) { return d['year']; }));
    yBar.domain([d3.min(datapull, function(d) { return d[scenario + '_value'];}), yMax]);


    let formatValue = d3.format(",.2f")
    let formatCurrency = function(d) { return "$" + formatValue(d); };

    const svgBar = d3.select('.bar-wrapper').append('svg')
                .attr('width',  width + margin.left + margin.right)
                .attr('height', height + margin.top + margin.bottom)
                .attr('x', 0)
                .attr('y', 0)
                .attr('class', 'jumbobar')
                .append('g')
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")")

      svgBar.selectAll('.bar')
            .data(datapull)
            .enter().append('rect')
            .attr('x', function(d) { return xBar(d['year']); })
            .attr('width', xBar.bandwidth())
            .attr('y', function(d) { return d[scenario + '_value'] > 0 ? yBar(d[scenario + '_value']) : yBar(0); })
            .attr('height', function(d) { return d[scenario + '_value'] > 0 ? yBar(d[scenario + '_value'] * -1) - yBar(0) : yBar(d[scenario + '_value']) - yBar(0); })
            .attr('fill', function(d){
              if(d[scenario + '_value'] < 0){
                return '#de425b';
              } else {
                return '#488f31';
              }
            })
            .call(function(){
                tooltip.html('<div class="tooltip-text"> <p class="tooltip-p"> Year: ' 
                + '---'
                + '</p> <p class="tooltip-p"> Loss/Profit: ' 
                + '---' 
                + '</p></div>')
            })
            .on('mouseover', function (event, d) {


              const yPosition = parseFloat(d3.select(this).attr('y'));
              const xPosition = parseFloat(d3.select(this).attr('x'));
              const barWidth = parseFloat(d3.select(this).attr('width'));
              const barHeight = parseFloat(d3.select(this).attr('height'));
            
              d3.select(this)
                .attr('stroke', '#111')
                .attr('stroke-width', '2')
                .style('cursor', 'crosshair');

                let red;

                if(d[scenario + '_value'] < 0){
                  red = "neg"
                } else {
                  red = "pos"
                }

                tooltip.html('<div class="tooltip-text"> <p class="tooltip-p"> Year: <strong class=' + red + '>' 
                + (d['year']) 
                + '</strong></p> <p class="tooltip-p"> Loss/Profit: <strong class=' + red + '>' 
                + formatCurrency((d[scenario + '_value'])) 
                + '</strong></p></div>')
        
            })
            .on('mouseout', function (d) {
              d3.select(this)
                .attr('stroke', 'none')
                .attr('fill', function(d){
                  if(d[scenario + '_value'] < 0){
                    return '#de425b';
                  } else {
                    return '#488f31';
                  }
                });
            })


        // Add the x-axis.
        svgBar.append('g')
        .attr("class", "y-axis")
            .call(d3.axisLeft(yBar).ticks(15).tickSizeOuter(0).tickFormat(d => (d/1000) + 'K'));
            
        svgBar.append('g')
          .attr("class", "x-axis")
          .attr("transform", "translate(0," + yBar(0) + ")")
          .call(d3.axisBottom(xBar).tickFormat("").tickSizeOuter(0))

          // svgBar.append("text")             
          // .attr("transform", "translate(" + (width/2) + " ," + (height - 80) + ")")
          // .text("* The difference between the cost")
          // .attr('class', 'x-axis-label')
          // .attr('font-size', '0.85em');

          // svgBar.append("text")             
          // .attr("transform", "translate(" + (width/2 + 5) + " ," + (height - 65) + ")")
          // .text("of regular grid service and your ")
          // .attr('class', 'x-axis-label')
          // .attr('font-size', '0.85em');

          // svgBar.append("text")             
          // .attr("transform", "translate(" + (width/2 + 5) + " ," + (height - 50) + ")")
          // .text("projected savings with solar (per year)")
          // .attr('class', 'x-axis-label')
          // .attr('font-size', '0.85em');

          svgBar.append("text")
          .attr("x", (width / 2))             
          .attr("y", 0 - (margin.top / 2))
          .attr("text-anchor", "middle")  
          .style("font-size", "16px") 
          .text("Profit Margin of Solar Panels on Your Home");


  }


  drawEnergyChart(width, height, datapull, scenario){
    datapull = datapull['energy_data']

    console.log('energy data', datapull)

    datapull.map((element) => {
      element.cost = element.usage * 0.1174;
    })

    console.log(datapull)

    let highMax = d3.max(datapull, function(d){return d['High']})
    let usageMax = d3.max(datapull, function(d){return d['usage']})
    let maxValue;

    if(highMax > usageMax){
      maxValue = highMax;
    } else {
      maxValue = usageMax;
    }

    const margin = { top: 40, right: 60, bottom: 40, left: 60};
    height = height - margin.top - margin.bottom;
    width = width - margin.right - margin.left;

    const xBar = d3.scaleBand().range([0, width]).padding(0.10);
    const yBar = d3.scaleLinear().range([height, 0]);
    const yLine = d3.scaleLinear().range([height, 0]);

    xBar.domain(datapull.map(function(d) { return d['Month']; }));
    yBar.domain([0, maxValue + 300]);
    yLine.domain([0, d3.max(datapull, function(d){return d['cost']}) + 40])

    const valueline = d3.line()
    .x(function(d) { return xBar(d['Month']) + (xBar.bandwidth() / 2); })
    .y(function(d) { return yLine(d['cost']); })
    .curve(d3.curveMonotoneX);

    const svgBarEnergy = d3.select('.bar-energy-wrapper').append('svg')
                .attr('width',  width + margin.left + margin.right)
                .attr('height', height + margin.top + margin.bottom)
                .attr('x', 0)
                .attr('y', 0)
                .attr('class', 'jumbobar-energy')
                .append('g')
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")")


          let highEnergy = svgBarEnergy.selectAll('.barEnergyHigh')
            .data(datapull)
            .enter().append('rect')
            .attr('x', function(d) { return xBar(d['Month']); })
            .attr('width', xBar.bandwidth())
            .attr('y', function(d) { return yBar(d['High'])})
            .attr('height', function(d) { return height - yBar(d['High'])})
            .attr('fill', 'rgba(0, 63, 92, 0.9')
            .on('mouseover', function (event, d) {

              d3.selectAll(highEnergy)
                .attr('fill', 'rgba(0, 63, 92, 1')
                .style('cursor', 'crosshair')

              d3.selectAll(lowEnergy)
                .attr('fill', 'rgba(188, 80, 144, 0.1)')
            
        
            })
            .on('mouseout', function (d) {
              d3.select(this)
                .attr('stroke', 'none')
              
              d3.selectAll(highEnergy)
                .attr('fill', 'rgba(0, 63, 92, 0.9')

              d3.selectAll(lowEnergy)
                .attr('fill', 'rgba(188, 80, 144, 0.9)')

            })

          


          let lowEnergy = svgBarEnergy.selectAll('.barEnergyLow')
            .data(datapull)
            .enter().append('rect')
            .attr('x', function(d) { return xBar(d['Month']); })
            .attr('width', xBar.bandwidth())
            .attr('y', function(d) { return yBar(d['Low'])})
            .attr('height', function(d) { return height - yBar(d['Low'])})
            .attr('fill', 'rgba(188, 80, 144, 0.9)')
            .on('mouseover', function (event, d) {

              d3.selectAll(highEnergy)
                .attr('fill', 'rgba(0, 63, 92, 0.1')

              d3.selectAll(lowEnergy)
                .attr('fill', 'rgba(188, 80, 144, 1)')
                .style('cursor', 'crosshair')

        
            })
            .on('mouseout', function (d) {
              d3.select(this)
                .attr('stroke', 'none')
              
              d3.selectAll(highEnergy)
                .attr('fill', 'rgba(0, 63, 92, 0.9')

              d3.selectAll(lowEnergy)
                .attr('fill', 'rgba(188, 80, 144, 0.9)')

            })

        // Add the x-axis.
        svgBarEnergy.append('g')
        .attr("class", "y-axis")
            .call(d3.axisLeft(yBar).ticks(15).tickSizeOuter(0).tickFormat(d => d));

        let months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
            
        svgBarEnergy.append('g')
          .attr("class", "x-axis")
          .attr("transform", "translate(0," + yBar(0) + ")")
          .call(d3.axisBottom(xBar).tickSizeOuter(0).tickFormat((d, i) => months[i]))

        svgBarEnergy.append("g")
          .attr("class", "y-axis")
          .attr("transform", "translate( " + width + ", 0 )")
          .call(d3.axisRight(yLine).tickSizeOuter(0).tickFormat(d => '$' + d))

          
       let path = svgBarEnergy.append('path')
       .datum(datapull)
       .attr('class', 'line')
       .attr('fill', 'none')
       .attr('stroke-width', '3px')
       .attr('stroke', '#ffa600')
       .attr('d', valueline)
       .on('mouseover', function (event, d) {

        d3.selectAll(path)
          .attr('stroke-width', '5px')

        d3.selectAll('circle')
          .attr('r', '5')

  
      })
      .on('mouseout', function (d) {
        d3.selectAll(path)
          .attr('stroke-width', '3px')

        d3.selectAll('circle')
          .attr('r', '3')

      })

       svgBarEnergy.selectAll("myCircles")
       .data(datapull)
       .enter()
       .append("circle")
         .attr("fill", "#ffa600")
         .attr("stroke", "none")
         .attr("cx", function(d) { return xBar(d['Month']) + (xBar.bandwidth() / 2) })
         .attr("cy", function(d) { return yLine(d['cost']) })
         .attr("r", 3)

        svgBarEnergy.append("text")
         .attr("transform", "rotate(-90)")
         .attr("y", 0 - margin.left)
         .attr("x",0 - (height / 2))
         .attr("dy", "1em")
         .style("text-anchor", "middle")
         .text("Projected Yield (kWh)")
         .attr('class', 'y-axis-label');   



         svgBarEnergy.append("text")
         .attr("x", (width / 2))             
         .attr("y", 0 - (margin.top / 2))
         .attr("text-anchor", "middle")  
         .style("font-size", "16px") 
         .text("Average Monthly Energy Yield");

         const ls_w = 10, ls_h = 15;
     
         const legend = svgBarEnergy.append('g')
         .attr('class', 'legend');

         legend.append('rect')
         .attr('x', 50)
         .attr('y', -2)
         .attr('width', ls_w)
         .attr('height', ls_h)
         .style('fill', function (d, i) { return 'rgba(0, 63, 92, 0.9)'; })
         .style('opacity', 0.8);
         
         legend.append('text')
         .attr('x', 65)
         .attr('y', 10)
         .attr('font-size', '10px')
         .attr('font-weight', '500')
         .attr('fill', 'rgba(0, 63, 92, 0.9)')
         .text('High Efficiency Yield');

         legend.append('rect')
         .attr('x', 50)
         .attr('y', 15)
         .attr('width', ls_w)
         .attr('height', ls_h)
         .style('fill', function (d, i) { return 'rgba(188, 80, 144, 0.9)'; })
         .style('opacity', 0.8);
         
         legend.append('text')
         .attr('x', 65)
         .attr('y', 27)
         .attr('font-size', '10px')
         .attr('font-weight', '500')
         .attr('fill', 'rgba(188, 80, 144, 0.9)')
         .text('Low Efficiency Yield');

         legend.append('rect')
         .attr('x', 200)
         .attr('y', 15)
         .attr('width', 20)
         .attr('height', 3)
         .style('fill', function (d, i) { return '#ffa600'; })
         .style('opacity', 0.8);
         
         legend.append('text')
         .attr('x', 225)
         .attr('y', 20)
         .attr('font-size', '10px')
         .attr('font-weight', '500')
         .attr('fill', '#ffa600')
         .text('Projected Monthly Energy Cost');

  }


  changeScenario(value){
    this.drawGraphChange(value)
    this.firstScenario = false;
  }

  drawGraphChange(value){
        const width = 500;
        const height = 400;
        const heightBar = 400;
        const widthBar = 500;
        this.drawGraph(width, height, this.requestData, value)
        this.drawBarGraph(widthBar, heightBar, this.requestData, value)
        this.drawEnergyChart(widthBar, heightBar, this.requestData, value)
  }

  restartInputs(){
    window.location.reload();
  }

  find_ratio(sqft, year_blt, HHM){

    let sqft_col: number;
    let year_col: number;
    let hhm_col: number;

    let SQFT_Ratio = [['Base', 1], [1000, 0.47], [1499, 0.78], [1999, 1.1], [2499, 1.11], [2999, 1.26], [10000, 1.52]]
    
    let YearBuilt_Ratio = [['Base', 1], [1950, 0.99], [1959, 1.15], [1969, 1.07], [1979, 0.89], [1989, 0.82], [1999, 1.12], [2009, 1.04], [2015, 0.7]]
    
    let HHM_Ratio = [['Base', 1], [1, 0.63], [2, 0.97], [3, 1.15], [4, 1.37], [5, 1.33], [6, 1.5]]

    if(sqft == 0){
      sqft_col = 0;
    } else if(sqft > 3499){
      sqft_col = 6;
    } else {
      sqft_col = Math.floor((sqft-1000)/500+2)
    }

    let sqft_rat = SQFT_Ratio[sqft_col][1]

    if(year_blt == 0){
      year_col = 0;
    } else {
      if(year_blt < 1940){
        year_col = 1;
      } else {
        year_col = Math.floor((year_blt-1950)/10+2)
      }
    }
    let year_rat = YearBuilt_Ratio[year_col][1]

    if (HHM == 0){
      hhm_col = 0;
    } else if (HHM > 6){
      hhm_col = 6;
    } else {
      hhm_col = HHM;
    }
    let hhm_rat = HHM_Ratio[hhm_col][1]

    this.ratio = (+sqft_rat*+year_rat*+hhm_rat);

    return this.ratio;

  }
    


  
}

  




