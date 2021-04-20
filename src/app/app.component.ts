import { Component, OnInit, Input, Output, EventEmitter, ViewChild, AfterViewInit} from '@angular/core';
import {} from 'googlemaps';
import { FlaskConnectService } from './services/flask-connect.service'
import MeasureTool from 'measuretool-googlemaps-v3';
import {FormBuilder, FormControl, FormGroup, SelectMultipleControlValueAccessor, Validators} from '@angular/forms';
import { StepperSelectionEvent } from '@angular/cdk/stepper';
import { MatStepper } from '@angular/material/stepper';

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
    private _formBuilder: FormBuilder
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
    console.log(addressType)
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
        "longitude": lng
    }

    console.log(this.userData)
    
    this.flaskConnectService.postCoords(this.userData).subscribe(data => {
      if(!data) {
        console.log('no data inputted!')
      } else {
        return 0;
      }
    })

    this.flaskConnectService.getFootage().subscribe(data => {
      if(!data) {
        console.log('no data inputted!')
      } else {
        console.log(data['sqr_ft'])
        this.recSq = data['sqr_ft']
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

    // let points = [];
    // this.measureTool.addListener('click', function(mouseEvent) {
    //   // Close the current InfoWindow.

    //   console.log(mouseEvent.latLng)
    //   // infoWindow.close();
    //   // console.log(mapsMouseEvent.latLng)
    //   // points.push(mapsMouseEvent.latLng)
    //   // let coords = points.push(new google.maps.LatLng(mapsMouseEvent.latLng))
  
    //   // Create a new InfoWindow.
    //   // infoWindow = new google.maps.InfoWindow({
    //   //   position: mapsMouseEvent.latLng,
    //   // });
    //   // infoWindow.setContent(
    //   //   JSON.stringify(mapsMouseEvent.latLng.toJSON(), null, 2)
    //   // );
    //   // console.log(points)
    //   // var distance = google.maps.geometry.spherical.computeDistanceBetween(new google.maps.LatLng(latitude1, longitude1), new google.maps.LatLng(latitude2, longitude2));  
    //   // console.log(google.maps.geometry.spherical.computeDistanceBetween(points[0], points[1]))
    // });
   
  }

  yesConfirm(){
    this.yes = true;
    this.no = false;

    this.measureTool._area = '450'
  }

  noConfirm(){
    this.yes = false;
    this.no = true;
    this.hideQuestion = true;
  }

  costBreakdown(){
    this.modelRun = true;
  }

  calculateHeading(){
    this.confirm = true;
    let start_location = new google.maps.LatLng(this.measureTool._segments[0].start_location.lat, this.measureTool._segments[0].start_location.lng)
    let end_location = new google.maps.LatLng(this.measureTool._segments[0].end_location.lat, this.measureTool._segments[0].end_location.lng)
    this.heading = google.maps.geometry.spherical.computeHeading(start_location, end_location);
  }

//   addDrawingControl(map){
//       //add drawing control
//       var drawingControl = new google.maps.drawing.DrawingManager(
//       {
//           drawingMode : null,
//           drawingControl : true,
//           drawingControlOptions :{
//               position : google.maps.ControlPosition.TOP_CENTER,
//               drawingModes : [
//               google.maps.drawing.OverlayType.POLYLINE
//               ]
//           },
//           polylineOptions : {
//               editable:true,
//               draggable:true,
//               geodesic:true
//           }
//       });
//       drawingControl.setMap(map);
//       //end of add drawing control

      // //add event listener
      // let polylines = [];
      // let area = []
      // google.maps.event.addListener(drawingControl, 'polylinecomplete', function(polyline){
      //         area = [];
      //         polylines.push(polyline);
      //         this.area = google.maps.geometry.spherical.computeArea(polyline.getPath());
      //         this.area = parseInt(this.area.toFixed(2)) * 10.7639

      //         let s = document.getElementById('square-feet');
      //         let t = document.getElementById('square-feet-text');
      //         let v = document.getElementById('square-feet-label');
      //         s.innerHTML = this.area.toFixed(2);
      //         t.innerHTML = "Estimated Roof Area: "
      //         v.innerHTML = " square ft"
      //         area.push(this.area)
      // });
      // this.area = google.maps.geometry.spherical.computeArea(polygon);

//       
      
//       let azimuth = [];
//       google.maps.event.addListener(drawingControl, 'polylinecomplete', function(polyline){
//         azimuth = [];
//         polylines.push(polyline);
//         this.area = google.maps.geometry.spherical.computeArea(polyline.getPath());
//         this.area = parseInt(this.area.toFixed(2)) * 10.7639

//         let s = document.getElementById('square-feet');
//         let t = document.getElementById('square-feet-text');
//         let v = document.getElementById('square-feet-label');
//         s.innerHTML = this.area.toFixed(2);
//         t.innerHTML = "Estimated Roof Area: "
//         v.innerHTML = " square ft"
//         area.push(this.area)
// });
//   }

  getValues(): void {
    this.flaskConnectService.getValues().subscribe(values => {
      this.values = values
      console.log(this.values)
    })
  }

  postClick() {
    // this.roof_area = document.getElementById('square-feet').innerHTML;
    console.log(this.roofArea)
    this.postValues(this.roofArea, this.address)
  }

  postValues(area, address): void {
    area = parseInt(area);
    let values = {
        "area": area,
        "address": address
        }

        console.log(values)
    this.flaskConnectService.postValues(values).subscribe(data => {
      if(!data) {
        console.log('no data inputted!')
      } else {
        return 0;
      }
    })
  }

  findArea(){
    console.log(this.measureTool)
  }
 }
