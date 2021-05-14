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

  finished = false;

  latitude;
  longitude;

  homeInputs;
  allValues = false;

  editTableSquare = false;
  editTableYear = false;
  editTableArea = false;
  editTableAz = false;

  panel_area;

  confirmDiv = false;

  drawMode = false;

  showConfirmButton = false;

  postingValues = false;
  ready = false;

  notReadyMessage = false;

  graphTest;
  requestData;

  constructor(
    private flaskConnectService: FlaskConnectService,
    private _formBuilder: FormBuilder,
    private cookieService: CookieService,
    private _sanitizer: DomSanitizer,
    public matDialog: MatDialog
  ) {}

  animal;
  name;

  scenario: Scenario[] = [
    {value: 'I=$15k, r=0.175', scenarioView: 'Initial Cost: $15,000; Panel Efficiency: 17.5%'},
    {value: 'I=$15k, r=0.2', scenarioView: 'Initial Cost: $15,000; Panel Efficiency: 20.0%'},
    {value: 'I=$25k, r=0.175', scenarioView: 'Initial Cost: $25,000; Panel Efficiency: 17.5%'},
    {value: 'I=$25k, r=0.2', scenarioView: 'Initial Cost: $25,000; Panel Efficiency: 20.0%'}
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
    // this.address = '23 High St, Rensselaer, NY 12144, USA'


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
    console.log(this.address)
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
              this.justRealtorDataScrape = false;
              this.justSunroofDataScrape = false;
              this.fullDataScrape = false;
            } else if (response.status == 'found realtor data but no sunroof data!') {
              console.log(response.status)
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
              console.log(response.status)
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
              console.log(response.status)
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

  reDraw() {
    this.confirmSf = false;
    this.measureTool.end();
    this.measureTool.start();
    console.log(this.measureTool._area)
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
    console.log(this.measureTool._area)
    this.roofArea = document.getElementById('square-feet').innerHTML;
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
    console.log(this.measureTool._area)
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
      console.log(this.values)
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

  tableCheck(): void {
    if(this.roofArea == "" || this.houseSquareFootage == "" || this.heading == "" || this.year_built == ""){
      this.ready = false;
      this.notReadyMessage = true;
    } else {
      this.ready = true;
      // $element.scrollIntoView({behavior: "smooth", block: "end", inline: "nearest"});
    }
  }


  postClick() {
    if (typeof(this.roofArea) == 'string' && this.roofArea.includes(",")) {
      this.roofArea = this.roofArea.replace(/,/g, '');
    }
    this.roofArea = parseInt(this.roofArea);
    this.modelRun = true;
    this.postValues(this.roofArea, this.houseSquareFootage, this.address, this.heading, this.year_built)
    this.runFinalModel(this.address)
  }

  // function to post values to the backend database and trigger the model run
  postValues(area, houseFootage, address, azimuth, yearBuilt): void {

    area = parseInt(area);
    houseFootage = parseInt(houseFootage)
    azimuth = parseInt(azimuth)
    yearBuilt = parseInt(yearBuilt)

    let values = {
        "panel_area": area,
        "house_footage": houseFootage,
        "address": address,
        "azimuth": azimuth,
        "year_built": yearBuilt
        }

    // KEEP FOR GRAPHIC TESTING

    // let values = {
    //   "panel_area": 856,
    //   "house_footage": 2343,
    //   "address": '23 High St, Rensselaer, NY 12144, USA',
    //   "azimuth": 0,
    //   "year_built": 1978
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

  // getModelResults(){
  //   this.modelRun = true;
  //   this.runFinalModel(this.address)
  // }

  runFinalModel(address){
    // triggering the model run and if successful, drawing our graph
    this.flaskConnectService.runModel(address).subscribe(data => {
      if(!data) {
        console.log('cannot run model!')
        this.postError = true;
      } else {
  
        const width = 700;
        const height = 400;
  
        if (width >= 600) {
          this.mobile = false;
        } else {
          this.mobile = true;
        }
        
        this.drawGraph(width, height, data, 'I=$15k, r=0.2')
        
        this.requestData = data;

        this.modelRun = false;
        this.finished = true;
      }
    })
  }




  // d3.js code to draw our initial projection graph
  drawGraph(width, height, datapull, scenario){

    d3.selectAll("svg").remove();

    console.log(datapull)

    const margin = { top: 80, right: 100, bottom: 80, left: 100};
    height = height - margin.top - margin.bottom;
    width = width - margin.right - margin.left;

     let yMax = d3.max(datapull, (d) => {return d['year']})

    if(d3.max(datapull, (d)=> { return d[scenario]; }) < 0){
      yMax = 0;
    }

    const x = d3.scaleLinear().range([0, width]);
    x.domain([0,d3.max(datapull, (d) => {return d['year']})]);

    const y = d3.scaleLinear().range([height, 0]);
    y.domain([-45000, yMax + 5000]);

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

          // svg.append('defs')
              // .append('pattern')
              //   .attr('id', 'diagonalHatch')
              //   .attr('patternUnits', 'userSpaceOnUse')
              //   .attr('width', 4)
              //   .attr('height', 4)
              // .append('path')
              //   .attr('d', 'M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2')
              //   .attr('stroke', '#000000')
              //   .attr('stroke-width', 1);

        // svg.append("rect")
        //   .attr("x", x(highlow[0] * 12))
        //   .attr("y", margin.top + 10)
        //   .attr("width", (x(highlow[1] * 12)) - (x(highlow[0] * 12)))
        //   .attr("height", yheight + 10)
        //   .style("fill", "url(#diagonalHatch)")
        //   .style("fill-opacity", 0.2)

        // svg.append("text")
        //   .attr("x", (x(highlow[0] * 12) - 30))
        //   .attr("y", yheight / 4)
        //   .text('Likely break even')
        //   .attr("font-size", "0.75em")
        //   .attr("font-weight", "700");
        
        // svg.append("text")
        //   .attr("x", (x(highlow[0] * 12) - 20))
        //   .attr("y", yheight / 4 + 15)
        //   .text('low: ' + parseInt(highlow[0]) + ' years')
        //   .attr("font-size", "0.75em")
        //   .attr("font-weight", "700");

        // svg.append("text")
        //   .attr("x", (x(highlow[1] * 12) - 30))
        //   .attr("y", yheight / 4)
        //   .text('Likely break even')
        //   .attr("font-size", "0.75em")
        //   .attr("font-weight", "700");
        
        // svg.append("text")
        //   .attr("x", (x(highlow[1] * 12) - 20))
        //   .attr("y", yheight / 4 + 15)
        //   .text('high: ' + parseInt(highlow[1]) + ' years')
        //   .attr("font-size", "0.75em")
        //   .attr("font-weight", "700");
        
        
        let bisectDate = d3.bisector(function(d){ return (d['year']); }).left;

        var left = document.getElementById("graph").offsetLeft;
        
        // Add the x-axis.
        svg.append('g')
        .attr("class", "y-axis")
            .call(d3.axisLeft(y).ticks(15).tickSizeOuter(0).tickFormat(d => (d/1000) + 'K'));
            
          svg.append('g')
            .attr("class", "x-axis")
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
        

       let path = svg.append('path')
          .datum(datapull)
          .attr('class', 'line')
          .attr('fill', 'none')
          .attr('stroke-width', '3px')
          .attr('stroke', '#525564')
          .attr('d', valueline)


        const totalLength = path.node().getTotalLength();

        let path2 = svg.append('path')
          .datum(datapull)
          .attr('class', 'line')
          .attr('fill', 'none')
          .attr('stroke-width', '3px')
          .attr('stroke', '#C25B56')
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
        

          let focus = svg.append("g")
          .attr('class', 'focus')                           
          .style("display", "none");  

          focus.append("circle")                                 
          .attr("class", "y")                              
          .style("fill", "#525564")                            
          .style("stroke", "#525564")
          .style("stroke-width", 2)
          .attr("r", 3);     
        
          focus.append("text")
          .attr("x", -50)
          .attr("dy", "-.95em")
          .attr('font-size', '0.75em')
          .attr('font-weight', '700')
          .attr('background-color', '#ffffff');
              

          svg.append("rect")                                   
              .attr("width", width)                          
              .attr("height", height + margin.top)                    
              .style("fill", "none")                           
              .style("pointer-events", "all")  
              .attr('transform', 'translate(0, -20)')               
              .on("mouseover", function() { focus.style("display", null); })
              .on("mouseout", function() { focus.style("display", "none"); })
              .on("mousemove", (event, d) => {

                var x0 = x.invert(d3.pointer(event,this)[0] - margin.right - left),
                i = bisectDate(datapull, x0, 1),
                d0 = datapull[i - 1],
                d1 = datapull[i],
                d = x0 - d0['year'] > d1['year'] - x0 ? d1 : d0;

              focus.attr("transform", "translate(" + x(d['year']) + "," + y(d[scenario]) + ")");
              focus.select("text").text('(Cost: ' + formatCurrency(d[scenario]) + ',' + '\r' + 'Year: ' + Math.round(d['year'] * 10) / 10 + ')');

             })
             .attr('cursor', 'crosshair');

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
             .style('fill', function (d, i) { return '#525564'; })
             .style('opacity', 0.8);

             legend.append('text')
             .attr('x', 45)
             .attr('y', height - 50)
             .attr('font-size', '10px')
             .attr('font-weight', '500')
             .attr('fill', '#525564')
             .text(scenario)
             
             legend.append('rect')
             .attr('x', 20)
             .attr('y', height - 35)
             .attr('width', ls_w)
             .attr('height', ls_h)
             .style('fill', function (d, i) { return '#C25B56'; })
             .style('opacity', 0.8);
             
             legend.append('text')
             .attr('x', 45)
             .attr('y', height - 30)
             .attr('font-size', '10px')
             .attr('font-weight', '500')
             .attr('fill', '#C25B56')
             .text('Regular grid service');
                    
  }

  changeScenario(value){
    console.log(value)
    this.drawGraphChange(value)
  }

  drawGraphChange(value){
        const width = 700;
        const height = 400;
        this.drawGraph(width, height, this.requestData, value)
  }
  
}

  




