import { Component, ViewChild, EventEmitter, Output, OnInit, AfterViewInit, Input } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { } from 'googlemaps';

@Component({
    selector: 'AutocompleteComponent',
    template: `
      <input class="input"
        type="text"
        [(ngModel)]="autocompleteInput"
        #addresstext style="padding: 12px 20px; border: 1px solid #ccc; width: 400px"
        >
    `,
})
export class AutocompleteComponent implements OnInit, AfterViewInit {
    @Input() addressType: string;
    @Output() setAddress: EventEmitter<any> = new EventEmitter();
    @ViewChild('addresstext') addresstext: any;

    autocompleteInput: string;
    queryWait: boolean;

    constructor() {
    }

    ngOnInit() {
    }

    ngAfterViewInit() {
        this.getPlaceAutocomplete();
    }

    private getPlaceAutocomplete() {

        let myLat= 42.6526;
        let myLng= -73.7562;
        let center = {lat:myLat, lng:myLng};

        // const defaultBounds = {
        //     north: center.lat + 0.1,
        //     south: center.lat - 0.1,
        //     east: center.lng + 0.1,
        //     west: center.lng - 0.1,
        //   };

        const input = document.getElementById("pac-input") as HTMLInputElement;

        const autocomplete = new google.maps.places.Autocomplete(this.addresstext.nativeElement,
            {
                // bounds: defaultBounds,
                componentRestrictions: { country: 'US' },
                types: [this.addressType]  // 'establishment' / 'address' / 'geocode'
                // strictBounds: true,
            });
            
        const southwest = { lat: 42.4, lng: -74.3 };
        const northeast = { lat: 42.8, lng: -73}

        const newBounds = new google.maps.LatLngBounds(southwest, northeast)
        autocomplete.setBounds(newBounds)
        google.maps.event.addListener(autocomplete, 'place_changed', () => {
            const place = autocomplete.getPlace();
            this.invokeEvent(place);
        });
    }

    invokeEvent(place: Object) {
        this.setAddress.emit(place);
    }


}