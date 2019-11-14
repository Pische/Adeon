var World = {

    /*  Truse se i dati sono già stati caricati */
    initiallyLoadedData: false,

    /*  POI-Marker assets. */
    markerDrawableIdle: null,
    markerDrawableSelected:null,

    /*  Contiene la categoria selezionata (art, architecture, secret_spots */
    selectedCategory: null,

    /*  Lista di AR.GeoObjects che sono attualmente mostrati nella scena / World. */
    markerList: [],

    /*  Ultimo marker selezionato. */
    currentMarker: null,

    /*  True se è la prima volta che avvia l'app */
    firstTime: true,

    maxRange: 3000,

    locationUpdateCounter: 0,
    updatePlacemarkDistancesEveryXLocationUpdates: 10,

    loadMarkerDrawable: function loadMarkerDrawableFn() {

        /* Carico immagini marker in base alla categoria scelta */
        if (World.selectedCategory == "art") {
            World.markerDrawableIdle = new AR.ImageResource("assets/box/BoxArt.png", {
                onError: World.onError
            });

            World.markerDrawableSelected = new AR.ImageResource("assets/box/BoxArtSelected.png", {
                onError: World.onError
            });
        }
        else if (World.selectedCategory == "architecture") {
            World.markerDrawableIdle = new AR.ImageResource("assets/box/BoxArchitettura.png", {
                onError: World.onError
            });

            World.markerDrawableSelected = new AR.ImageResource("assets/box/BoxArchitetturaSelected.png", {
                onError: World.onError
            });
        }
        else {
            World.markerDrawableIdle = new AR.ImageResource("assets/box/BoxSecretSpots.png", {
                onError: World.onError
            });

            World.markerDrawableSelected = new AR.ImageResource("assets/box/BoxSpotsSelected.png", {
                onError: World.onError
            });
        }
    },

        /*  Chiamata per inserire i dati dei luoghi (POI) attorno all'utente*/
    loadPoisFromJsonData: function loadPoisFromJsonDataFn(poiData) {

        /*  Cancella tutti gli AR-Objects esistenti (markers & radar). */
        AR.context.destroyAll();

        /*  Lista vuota dei marker visibili*/
        World.markerList = [];

        /*  Carico le immagini dei box visualizzati sui POI */
        World.loadMarkerDrawable();

        /*  Ciclo dentro le informazioni dei luoghi (POI) e creo un AR.GeoObject
            (=Marker) per ogni POI solo se è della categoria selezionata
            dall'utente
        */
        for (var currentPlaceNr = 0; currentPlaceNr < poiData.length; currentPlaceNr++) {
            if (poiData[currentPlaceNr].category == World.selectedCategory) {
                //alert("SinglePOI creato");
                var singlePoi = {
                    "id": poiData[currentPlaceNr].id,
                    "latitude": parseFloat(poiData[currentPlaceNr].latitude),
                    "longitude": parseFloat(poiData[currentPlaceNr].longitude),
                    "altitude": parseFloat(poiData[currentPlaceNr].altitude),
                    "title": poiData[currentPlaceNr].name,
                    "description": poiData[currentPlaceNr].description,
                    "url": poiData[currentPlaceNr].src
                };

                World.markerList.push(new Marker(singlePoi));
            }
        }

        /* Aggiorna le informazioni sulla distanza dell'utente da ogni POI*/
        World.updateDistanceToUserValues();

        /* Imposto il range massimo (3km) */
        AR.context.scene.cullingDistance = World.maxRange;

        /* Set distance slider to 3km. 
        $("#slider-12").val(3);
        $("#slider-12").slider("refresh");*/
    },

    /*
        Setta/aggiorna le distanze di tutti i marker per renderli accessibili
        più velocemente
     */
    updateDistanceToUserValues: function updateDistanceToUserValuesFn() {
        for (var i = 0; i < World.markerList.length; i++) {
            World.markerList[i].distanceToUser = World.markerList[i].markerObject.locations[0].distanceToUser();
        }
    },

    /*
       Aggiorna posizione, chiamato ogni volta che viene chiamata
       architectView.setLocation() nel codice nativo
    */
    locationChanged: function locationChangedFn(lat, lon, alt, acc) {
        /*
            Salvo la posizione dell'utente in World.userLocation per sapere
            sempre dove si trova
        */
        World.userLocation = {
            'latitude': lat,
            'longitude': lon,
            'altitude': alt,
            'accuracy': acc
        };

        /* Se firstTime=true -> nessuna categoria selezionata quindi non faccio
         nulla*/
        if (World.firstTime != true) {
            /*
                Carico il database se non è già stato fatto altrimenti, ogni 10
                aggiornamenti di posizione, aggiorno la distanza tra l'utente
                e i vari marker
            */
            if (!World.initiallyLoadedData) {
                alert("carico dati first time location changed");
                World.initiallyLoadedData = true;
                World.requestDataFromLocal(lat, lon);
            } else if (World.locationUpdateCounter === 0) {
                /*
                    Aggiorna frequentemente le informazioni sulla distanza
                    dell'utente. You max also update distances only every 10m with
                    some more effort.
                 */
                World.updateDistanceToUserValues();
            }

            /* Helper used to update placemark information every now and then
             * (e.g. every 10 location upadtes fired).
             *
             * Counter per aggiornare le informazioni sulla distanza
             * dell'utente ogni 10m*/
            World.locationUpdateCounter =
                (++World.locationUpdateCounter % World.updatePlacemarkDistancesEveryXLocationUpdates);
        }   
    },

    /*
        POIs usually have a name and sometimes a quite long description.
        Depending on your content type you may e.g. display a marker with its name and cropped description but
        allow the user to get more information after selecting it.
    */

    /* Fired when user pressed maker in cam. */
    onMarkerSelected: function onMarkerSelectedFn(marker) {
        World.currentMarker = marker;

        /*
            In this sample a POI detail panel appears when pressing a cam-marker (the blue box with title &
            description), compare index.html in the sample's directory.
        */
        /* Update panel values. */
        $("#poi-detail-title").html(marker.poiData.title);
        $("#poi-detail-description").html(marker.poiData.description);


        /*
            It's ok for AR.Location subclass objects to return a distance of `undefined`. In case such a distance
            was calculated when all distances were queried in `updateDistanceToUserValues`, we recalculate this
            specific distance before we update the UI.
         */
        if (undefined === marker.distanceToUser) {
            marker.distanceToUser = marker.markerObject.locations[0].distanceToUser();
        }

        /*
            Distance and altitude are measured in meters by the SDK. You may convert them to miles / feet if
            required.
        */
        var distanceToUserValue = (marker.distanceToUser > 999) ?
            ((marker.distanceToUser / 1000).toFixed(2) + " km") :
            (Math.round(marker.distanceToUser) + " m");

        $("#poi-detail-distance").html(distanceToUserValue);

        /* Show panel. */
        $("#panel-poidetail").panel("open", 123);

        $(".ui-panel-dismiss").unbind("mousedown");

        /* Deselect AR-marker when user exits detail screen div. */
        $("#panel-poidetail").on("panelbeforeclose", function (event, ui) {
            World.currentMarker.setDeselected(World.currentMarker);
        });
    },

    /* Screen was clicked but no geo-object was hit. */
    onScreenClick: function onScreenClickFn() {
        /* You may handle clicks on empty AR space too. */
    },

    refreshPoi: function refreshPoiFn() {
        World.requestDataFromLocal(World.userLocation.latitude,
            World.userLocation.longitude);
        World.initiallyLoadedData = true;
    },

    /* Updates values show in "range panel". */
    updateRangeValues: function updateRangeValuesFn() {

        if (World.firstTime == true) {
            $("#range-popup").fadeOut(600);
            $("#footer").show();
            $("#swipeup").fadeIn(600);
            $("#range").fadeIn(600);
            $("#settings").fadeIn(600);
            $("#help").fadeIn(600);

            World.firstTime = false;
        }
        $("#swipeup").fadeIn(600);
        $('#range-box').animate({ 'bottom': '-140px' }, 300);

        /* Salvo il valore dello slider (1.0 - 3.0)*/
        var slider_value = $("#slider-12").val();

        /* Max range relative to the maximum distance of all visible places.*/
        var RangeUserValue = slider_value * 1000;

        /* Numero di posti mostrati all'interno del range */
        var placesInRange = World.getNumberOfVisiblePlacesInRange(RangeUserValue);

        if (placesInRange == 0) {
            $("#error-popup").show();
            $("#error-button").click(function () {
                $("#error-popup").hide();
            });
        }

        /*
            Aggiorno la distanza di abbattimento (culling distance) così solo i
            luoghi all'interno del range scelto vengono renderizzati
            *   scene.cullingDistance - int
                La distanza massima alla quale i marker sono visibili nella
                scena, in metri. Se la distanza di un oggetto è maggiore
                rispetto alla distanza di abbattimento (culling distance),
                l'oggetto non sarà visibile nella scena
                Default Value: 50000
        */
        AR.context.scene.cullingDistance = RangeUserValue;
        
    },

    /*
        Ritorna il numero di posti con una distanza minore o uguale a
        quella scelta dall'utente
    */
    getNumberOfVisiblePlacesInRange: function getNumberOfVisiblePlacesInRangeFn(RangeUserValue) {

        /*  Ordina i markers in base alla distanza dall'utente*/

        World.markerList.sort(World.sortByDistanceSorting);

        /*
            Ciclo all'interno dell'array contenente i markers e mi stoppo
            quando trovo un luogo con distanza maggiore rispetto al range
        */
        for (var i = 0; i < World.markerList.length; i++) {
            if (World.markerList[i].distanceToUser > RangeUserValue) {
                return i;
            }
        }

        /*  In caso nessun luogo si trovi oltre il range -> tutti sono visibili */
        return World.markerList.length;
    },

    /* Request POI data. */
    requestDataFromLocal: function requestDataFromLocalFn(lat, lon) {
        World.loadPoisFromJsonData(myJsonData);
    },

    /*  Funzione di appoggio per ordinare i posti in base alla distanza*/
    sortByDistanceSorting: function sortByDistanceSortingFn(a, b) {
        return a.distanceToUser - b.distanceToUser;
    },

    /* Helper to sort places by distance, descending. 
    sortByDistanceSortingDescending: function sortByDistanceSortingDescendingFn(a, b) {
        return b.distanceToUser - a.distanceToUser;
    },*/

    onError: function onErrorFn(error) {
        alert(error);
    },


    /* Display range slider. */
    showRange: function showRangeFn() {
        $('#range-box').animate({ 'bottom': '0' }, 600);
        $("#swipeup").hide();
    },

    /* WELCOME PAGE */
    welcomeToAdeon: function welcomeToAdeonFn() {
        if (World.firstTime == true) {
            $("#welcome-popup").fadeIn(600);

            $("#welcome-popup").click(function () {
                $("#welcome-popup").fadeOut(600);
                $("#swipe-box").animate({ 'bottom': '0' }, 600);
                $("#category-popup").fadeIn(600);

                $("#hand-choose").removeAttr('style'); //reset css property
                $("#hand-choose").fadeIn(600);
                $("#hand-choose").animate({
                    left: '+=65%'
                }, 2400, function () {
                        $("#hand-choose").fadeOut(600);
                    });
            });
        }

    },

    /* Categoria Selezionata (art, architecture, secret_spots) */
    onArt: function onArtFn() {
        World.selectArt();
        World.closeCategory();
        World.ctrlFirstTime();
        World.refreshPoi();
    },

    onArchitecture: function onArchitectureFn() {
        World.selectArchitecture();
        World.closeCategory();
        World.ctrlFirstTime();
        World.refreshPoi();
    },

    onSecret: function onSecretFn() {
        World.selectSecret();
        World.closeCategory();
        World.ctrlFirstTime();
        World.refreshPoi();
    },

    ctrlFirstTime: function ctrlFirstTime() {
        if (World.firstTime == true) {
            $("#category-popup").fadeOut(600);
            $("#range-popup").fadeIn(600);

            $("#hand-choose").css("left","10%");
            $("#hand-choose").fadeIn(600);
            $("#hand-choose").animate({
                left: "+=60%"
            }, 2400,
                function () {
                    $("#hand-choose").animate({
                        left: "-=60%"
                    }, 2400, function () {
                            $("#hand-choose").fadeOut(600);
                        });
                    
            });
        }
    },

    closeCategory: function closeCategoryFn() {
        $('#swipe-box').animate({ 'bottom': '-140px' }, 600);
        World.showRange();
    },

    selectArt: function selectArtFn() {
        $("#art").attr("src", "assets/icons/art_selected.png");
        $("#architecture").attr("src", "assets/icons/architecture.png");
        $("#secret_spots").attr("src", "assets/icons/spots.png");
        World.selectedCategory = "art";
    },

    selectArchitecture: function selectArchitectureFn() {
        $("#art").attr("src", "assets/icons/art.png");
        $("#architecture").attr("src", "assets/icons/architecture_selected.png");
        $("#secret_spots").attr("src", "assets/icons/spots.png");
        World.selectedCategory = "architecture";
    },

    selectSecret: function selectSecretFn() {
        $("#art").attr("src", "assets/icons/art.png");
        $("#architecture").attr("src", "assets/icons/architecture.png");
        $("#secret_spots").attr("src", "assets/icons/spots_selected.png");
        World.selectedCategory = "secret_spots";
    }
};

$(document).ready(function () {

    /* WELCOME PAGE */

    /* Carico immagine aneddoto */
    $("#img-aneddoti").attr("src", "assets/POI/1_Duomo/img/1.png");
    $("#img-aneddoti").css({ "height": "auto", "width": "100%" });

    /* Nascondo finestre popup */
    $("#welcome-popup").hide();
    $("#category-popup").hide();
    $("#range-popup").hide();
    $("#error-popup").hide();
    $("#hand-choose").hide();

    /* Nascondo le main icons*/
    $("#range").hide();
    $("#settings").hide();
    $("#help").hide();
    $("#footer").hide();

    World.welcomeToAdeon();

    /* Funzioni di swipe up e swipe down dei pannelli */
    $('#footer').on('swipeup', function () {
        $('#swipe-box').animate({ 'bottom': '0' }, 500);
        $("#swipeup").hide();
    });

    $('#swipe-box').on('swipedown', function () {
        if (!World.firstTime) {
            $('#swipe-box').animate({ 'bottom': '-140px' }, 500);
            $("#swipeup").show();
        }
    });
    
    $('#range-box').on('swipedown', function () {
        if (!World.firstTime) {
            $('#range-box').animate({ 'bottom': '-140px' }, 300);
            $("#swipeup").show();
        }
    });


    /* Aggiorna il valore del range quando lo slider viene aggiornato*/
    $("#slider-12").on("slidestop", function (e) {
        World.updateRangeValues();
    });
    
});

/* Forward locationChanges to custom function.
   Chiama la funzione locationChanged personalizzata */
AR.context.onLocationChanged = World.locationChanged;

/* Forward clicks in empty area to World.
   Chiama la funzione personalizzata onScreenClick quando l'utente clicca su
   un'area vuota
   */
AR.context.onScreenClick = World.onScreenClick;