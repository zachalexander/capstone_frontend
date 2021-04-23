import { Component, OnInit, Input, Output, EventEmitter, ViewChild} from '@angular/core';
import {} from 'googlemaps';
import { FlaskConnectService } from './services/flask-connect.service'
import MeasureTool from 'measuretool-googlemaps-v3';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import { MatStepper } from '@angular/material/stepper';
import { CookieService } from 'ngx-cookie-service';

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
  isEditable = false;
  confirm = false;

  constructor(
    private flaskConnectService: FlaskConnectService,
    private _formBuilder: FormBuilder,
    private cookieService: CookieService
  ) {}
  

  @ViewChild('map', {static: true}) mapElement: any;
  map: google.maps.Map;

  @Output() setAddress: EventEmitter<any> = new EventEmitter();
  @ViewChild('addresstext') addresstext: any;

  @Input() addressType: string;
  @Input('aria-label') ariaLabel: string

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

  goForward(stepper: MatStepper){
    stepper.next();
    this.measureTool.end();
  }

  measureManually(){
    this.confirmSf = false;
    this.measureTool.start();
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
  }

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
        alert("Geocode was not successful for the following reason: " + status);
      }
    });
  }

  postCoords(lat, lng): void {
    this.userData = {
        "latitude": lat,
        "longitude": lng,
        "address": this.address
    }
    
    this.flaskConnectService.postCoords(this.userData).subscribe(data => {
      if(!data) {
        console.log('no data inputted!')
      } else {
        return 0;
      }
    })
  }

  getFootage(){
    let address = this.address;
    this.flaskConnectService.getFootage(address).subscribe(data => {
      if(!data) {
        console.log('Sorry, we could not find a Project Sunroof Estimate for this address')
      } else {
        console.log(data)
        this.recSq = data
      }
    })
  }
  
  getAddress(place: object) { 
    this.address = place['formatted_address']
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
        this.geocodeAddress(geocoder, map, this.address);
      }
    );
   
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
    this.postValues(this.roofArea, this.houseSquareFootage.secondCtrl, this.address, this.heading, this.year_built.firstCtrl)
  }

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
      } else {
        return 0;
      }
    })

    this.flaskConnectService.runModel(address).subscribe(data => {
      if(!data) {
        console.log('cannot run model!')
      } else {
        console.log('model response', data)
        this.modelRun = false;
      }
    })
  }

  findArea(){
    console.log(this.measureTool)
  }

  squareFootageSubmit(){
    console.log(this.secondFormGroup.value)
    this.houseSquareFootage = this.secondFormGroup.value;
  }

  yearBuiltSubmit(){
    console.log(this.firstFormGroup.value)
    this.year_built = this.firstFormGroup.value;
  }
 }
