var World = {

    /*  Truse se i dati sono già stati caricati */
    initiallyLoadedData: false,

    /*  POI-Marker assets. */
    markerDrawableIdle: null,
    markerDrawableSelected: null,
    markerDrawableScopri: null,

    /*  Contiene la categoria selezionata (art, architecture, secret_spots */
    selectedCategory: null,

    /*  Lista di AR.GeoObjects che sono attualmente mostrati nella scena / World. */
    markerList: [],

    /*  Ultimo marker selezionato. */
    currentMarker: null,
    currentAneddoto: null,

    /*  True se è la prima volta che avvia l'app */
    firstTime: true,
    firstAneddoto: true,
    audio: null,

    maxRange: 3000,
    minDistance: 100,
    velFadeOutIn: 600,

    locationUpdateCounter: 0,
    updatePlacemarkDistancesEveryXLocationUpdates: 5,

    setFirstTime: function setFirstTimeFn(ft) {
        //alert(""+ft);
        if (ft == true) {
            World.firstTime = true;
            World.welcomeToAdeon();
        }
        else {
            
            World.firstTime = false;
            $("#swipe-box").animate({ 'bottom': '0' }, World.velFadeOutIn);
        }
    },

    loadMarkerDrawable: function loadMarkerDrawableFn() {

        /* Carico immagini marker in base alla categoria scelta */
        if (World.selectedCategory == "art") {
            World.markerDrawableIdle = new AR.ImageResource("assets/box/BoxArt.png", {
                onError: World.onError
            });

            World.markerDrawableSelected = new AR.ImageResource("assets/box/BoxArtSelected.png", {
                onError: World.onError
            });

            World.markerDrawableScopri = new AR.ImageResource("assets/box/BoxArtScopri.png", {
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
            World.markerDrawableScopri = new AR.ImageResource("assets/box/BoxArchitetturaScopri.png", {
                onError: World.onError
            });
        }
        else if (World.selectedCategory == "secret_spots"){
            World.markerDrawableIdle = new AR.ImageResource("assets/box/BoxSecretSpots.png", {
                onError: World.onError
            });

            World.markerDrawableSelected = new AR.ImageResource("assets/box/BoxSpotsSelected.png", {
                onError: World.onError
            });
            World.markerDrawableScopri = new AR.ImageResource("assets/box/BoxSpotsScopri.png", {
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
                    "distanceToUser": null
                };

                World.markerList.push(new Marker(singlePoi));
            }
        }

        /* Aggiorna le informazioni sulla distanza dell'utente da ogni POI*/
        World.updateDistanceToUserValues();

        /* Imposto il range massimo (3km) */
        AR.context.scene.cullingDistance = World.maxRange;
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
            if (World.locationUpdateCounter === 0) {
                /*
                    Aggiorna frequentemente le informazioni sulla distanza
                    dell'utente. You max also update distances only every 10m with
                    some more effort.
                */
                World.updateDistanceToUserValues();

                
                for (var i = 0; i < World.markerList.length; i++) {
                    var distance = World.chooseUnit(World.markerList[i]);

                    World.markerList[i].descriptionLabel.text = distance;

                    /*  Se l'utente si trova a 50m dal POI, avvio animazione
                        SCOPRI */
                    if (World.markerList[i].distanceToUser <= World.minDistance) {
                        World.markerList[i].titleLabel.text = "SCOPRI";
                        World.markerList[i].markerDrawableIdle.imageResource = World.markerDrawableScopri;
                    }
                    else if (World.markerList[i].titleLabel.text=="SCOPRI"){
                        World.markerList[i].titleLabel.text = World.markerList[i].title;
                        World.markerList[i].markerDrawableIdle.imageResource = World.markerDrawableIdle;
                    }
                }
            }

            /*
                Counter usato per aggiornare le informazioni sulla distanza
                dell'utente ogni 10m
            */
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
        if (marker.distanceToUser != undefined &&
            marker.distanceToUser <= World.minDistance) {

            World.currentMarker = marker;
            $("#footer").fadeOut(World.velFadeOutIn);

            World.showAneddoto();

            /*
                It's ok for AR.Location subclass objects to return a distance of `undefined`. In case such a distance
                was calculated when all distances were queried in `updateDistanceToUserValues`, we recalculate this
                specific distance before we update the UI.
             */
            if (undefined === marker.distanceToUser) {
                marker.distanceToUser = marker.markerObject.locations[0].distanceToUser();
            }
        }
    },

    showAneddoto: function showAneddotoFn() {
        var i = 0;
        var exit = false;

        while (i < DB_Aneddoti.length && exit == false) {
            /*
                Se l'aneddoto appartiene al Marker selezionato ed è diverso
                dall'aneddoto visualizzato, mostro aneddoto
            */
            if (DB_Aneddoti[i].id_POI == World.currentMarker.poiData.id &&
                DB_Aneddoti[i].id > World.currentAneddoto)
            {
                exit = true;
                World.currentAneddoto = DB_Aneddoti[i].id; /*salvo id aneddoto*/
                $("#img-aneddoto").attr("src", DB_Aneddoti[i].img);
                $("#txt-aneddoto").html(DB_Aneddoti[i].txt);

                $("#aneddoto-pause").hide();

                /*  Carico audio */
                World.audio = new AR.Sound(DB_Aneddoti[i].audio, {
                    onFinishedPlaying: function () {
                        $("#aneddoto-pause").hide();
                        $("#aneddoto-play").show();
                    },
                    onError: function () {
                        alert("ERRORE!");
                    },
                });

                World.audio.load();

                $("#aneddoto-play").click(function () {
                    if (World.audio.state == AR.CONST.STATE.PAUSED) {
                        World.audio.resume();
                        $("#aneddoto-play").hide();
                        $("#aneddoto-pause").show();
                    }
                    else if (World.audio.state == AR.CONST.STATE.PLAYING) {
                        //non faccio niente
                    }
                    else {
                        World.audio.play();
                        $("#aneddoto-play").hide();
                        $("#aneddoto-pause").show();
                    }
                });

                $("#aneddoto-pause").click(function () {
                    if (World.audio.state == AR.CONST.STATE.PLAYING) {
                        World.audio.pause();
                        $("#aneddoto-pause").hide();
                        $("#aneddoto-play").show();
                    }
                });
            }
            i++;
        }

        if (World.firstAneddoto == true) {
            i = 0;
            while (i < 2) {
                $("#hand-scroll").fadeIn(World.velFadeOutIn);
                $("#hand-scroll").animate({
                    top: '-=10%'
                }, 2000);
                $("#hand-scroll").fadeOut(World.velFadeOutIn);
                $("#hand-scroll").animate({
                    top: '+=10%'
                }, 1);
                i++;
            }
            i = 0;

            $("#hand-scroll").promise().done(function () {
                while (i < 2) {
                    $("#hand-next").fadeIn(World.velFadeOutIn);
                    $("#hand-next").animate({
                        right: '+=45%'
                    }, 2000);
                    $("#hand-next").fadeOut(World.velFadeOutIn);
                    $("#hand-next").animate({
                        right: '-=45%'
                    }, 1);
                    i++;
                }

                i = 0;
                $("#hand-next").promise().done(function () {
                    while (i < 2) {
                        $("#hand-close").fadeIn(World.velFadeOutIn);
                        $("#hand-close").animate({
                            top: '+=45%'
                        }, 2000);
                        $("#hand-close").fadeOut(World.velFadeOutIn);
                        $("#hand-close").animate({
                            top: '-=45%'
                        }, 1);
                        i++;
                    }
                });
            });

            World.firstAneddoto = false;
        }

        /* Mostro box aneddoti*/
        $("#box-aneddoti").fadeIn(World.velFadeOutIn);

        /* Swipe down e swipe left sul box aneddoti */
        $('#img-aneddoto').on('swipedown', function () {
            World.currentMarker.setDeselected(World.currentMarker);
            World.currentAneddoto = null;
            $("#aneddoto-pause").hide();
            $("#aneddoto-play").show();
            World.audio.stop();
            World.audio.destroy();
            $("#box-aneddoti").fadeOut(World.velFadeOutIn);
            $("#footer").fadeIn(World.velFadeOutIn);
        });

        var exit2 = false;
        i = 0;
        $('#img-aneddoto').on('swipeleft', function () {
            while (i < DB_Aneddoti.length && exit2 == false) {
                /*
                    Controllo se ci sono altri aneddoti
                 */
                if (DB_Aneddoti[i].id_POI == World.currentMarker.poiData.id &&
                    DB_Aneddoti[i].id > World.currentAneddoto) {
                    exit2 = true;
                    $("#aneddoto-pause").hide();
                    $("#aneddoto-play").show();
                    World.audio.stop();
                    World.audio.destroy();
                    $("#box-aneddoti").fadeOut(World.velFadeOutIn);
                    $("#box-aneddoti").promise().done(function () {
                        World.showAneddoto();
                    });
                }
                i++;
            }
        });

        var exit3= false;
        i = 0;
        /* FUNZIONE MOMENTANEA PER TORNARE INDIETRO NEGLI ANEDDOTI */
        $('#img-aneddoto').on('swiperight', function () {
            while (i < DB_Aneddoti.length && exit3 == false) {
                /*
                    Controllo se ci sono altri aneddoti prima
                 */
                if (DB_Aneddoti[i].id_POI == World.currentMarker.poiData.id &&
                    DB_Aneddoti[i].id < World.currentAneddoto) {
                    exit3 = true;
                    $("#aneddoto-pause").hide();
                    $("#aneddoto-play").show();
                    World.audio.stop();
                    World.audio.destroy();
                    $("#box-aneddoti").fadeOut(World.velFadeOutIn);

                    //momentaneo per tornare indietro
                    World.currentAneddoto = null;

                    $("#box-aneddoti").promise().done(function () {
                        World.showAneddoto();
                    });
                }
                i++;
            }
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
            $("#hand-choose").stop(true).fadeOut(World.velFadeOutIn);
            $("#range-popup").fadeOut(World.velFadeOutIn);

            /*l'avevo commentata*/
            $("#footer").show();
            $("#swipeup").fadeIn(World.velFadeOutIn);
            $("#range").fadeIn(World.velFadeOutIn);
            $("#rangeValue").fadeIn(World.velFadeOutIn);
            $("#settings").fadeIn(World.velFadeOutIn);
            $("#help").fadeIn(World.velFadeOutIn);

            World.firstTime = false;
        }
        else {
            $("#footer").show();
            $("#range").fadeIn(World.velFadeOutIn);
            $("#rangeValue").fadeIn(World.velFadeOutIn);
            $("#settings").fadeIn(World.velFadeOutIn);
            $("#help").fadeIn(World.velFadeOutIn);
        }

        $("#swipeup").fadeIn(World.velFadeOutIn);
        $('#range-box').animate({ 'bottom': '-15vh' }, 300);

        /* Salvo il valore dello slider (1.0 - 3.0)*/
        var slider_value = $("#sliderAdeon").val();

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
        World.loadPoisFromJsonData(DB_Milan);
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
        World.checkPopupVisible("#range-box");
    },

    showSettings: function showSettingsFn() {
        $("#footer").fadeOut(World.velFadeOutIn);

        World.checkPopupVisible("#settings-popup");

        $("#close-settings").on("click", function () {
            $("#settings-popup").fadeOut(World.velFadeOutIn);
            $("#footer").fadeIn(World.velFadeOutIn);
        });
    },

    showHelp: function showHelpFn() {
        $("#footer").fadeOut(World.velFadeOutIn);

        World.checkPopupVisible("#help-popup");

        $("#close-help").on("click", function () {
            $("#help-popup").fadeOut(World.velFadeOutIn);
            $("#footer").fadeIn(World.velFadeOutIn);
        });
    },

    chooseUnit: function chooseUnitFn(marker) {
        var distanceToUserValue= (marker.distanceToUser > 999) ?
            ((marker.distanceToUser / 1000).toFixed(2) + " km") :
            (Math.round(marker.distanceToUser) + " m");

        return distanceToUserValue;
    },

    checkPopupVisible: function checkPopupVisibleFn(popupToOpen) {
        var error = "#error-popup";
        var settings = "#settings-popup";
        var help = "#help-popup";
        var category = "#swipe-box";
        var range = "#range-box";

        if (error != popupToOpen && $(error).is(":visible")) {
            $(error).fadeOut(World.velFadeOutIn);
        }

        if (settings != popupToOpen && $(settings).is(":visible")) {
            $(settings).fadeOut(World.velFadeOutIn);
        }

        if (help != popupToOpen && $(help).is(":visible")) {
            $(help).fadeOut(World.velFadeOutIn);
        }

        if (category != popupToOpen && $(category).css("bottom") == "0px") {
            $(category).animate({ 'bottom': '-15vh' }, World.velFadeOutIn);
            $("#footer").show();
            $("#swipeup").show();
        }

        if (range != popupToOpen && $(range).css("bottom") == "0px") {
            $(range).animate({ 'bottom': '-15vh' }, World.velFadeOutIn);
            $("#footer").show();
            $("#swipeup").show();
        }

        if (popupToOpen != category && popupToOpen != range) {
            if (!$(popupToOpen).is(":visible")){
                $(popupToOpen).fadeIn(World.velFadeOutIn);
            }
        }
        else {
            if ($(popupToOpen).css("bottom") != "0px") {
                $(popupToOpen).animate({ 'bottom': '0' }, World.velFadeOutIn);
                $("#swipeup").hide();
            }
        }
    },

    /* WELCOME PAGE */
    welcomeToAdeon: function welcomeToAdeonFn() {
        if (World.firstTime == true) {
            $("#welcome-popup").fadeIn(World.velFadeOutIn);

            $("#welcome-popup").click(function () {
                $("#welcome-popup").fadeOut(World.velFadeOutIn);
                $("#swipe-box").animate({ 'bottom': '0' }, World.velFadeOutIn);
                $("#category-popup").fadeIn(World.velFadeOutIn);

                /* Animazione mano */
                $("#hand-choose").fadeIn(World.velFadeOutIn);

                $("#hand-choose").animate({
                    left: '+=65%'
                }, 2400);
                $("#hand-choose").fadeOut(World.velFadeOutIn);
                $("#hand-choose").animate({
                    left: '-=65%'
                }, 1);
            });
        }

    },

    /* Categoria Selezionata (art, architecture, secret_spots) */
    onArt: function onArtFn() {
        World.selectArt();
        World.ctrlFirstTime();
        World.closeCategory();
        World.refreshPoi();
    },

    onArchitecture: function onArchitectureFn() {
        World.selectArchitecture();
        World.ctrlFirstTime();
        World.closeCategory();
        World.refreshPoi();
    },

    onSecret: function onSecretFn() {
        World.selectSecret();
        World.ctrlFirstTime();
        World.closeCategory();
        World.refreshPoi();
    },

    ctrlFirstTime: function ctrlFirstTime() {
        if (World.firstTime == true) {
            $("#category-popup").fadeOut(World.velFadeOutIn);
            $("#range-popup").fadeIn(World.velFadeOutIn);

            /* Animazione mano */
            $("#hand-choose").stop(true).hide();
            $("#hand-choose").css("left", "10%");
            $("#hand-choose").fadeIn(World.velFadeOutIn);
            $("#hand-choose").animate({
                left: "+=60%"
            }, 2400);
            $("#hand-choose").animate({
                left: "-=60%"
            }, 2400);
            $("#hand-choose").fadeOut(World.velFadeOutIn);
        }
    },

    closeCategory: function closeCategoryFn() {
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

    /* Nascondo finestre popup */
    $("#welcome-popup").hide();
    $("#category-popup").hide();
    $("#range-popup").hide();
    $("#error-popup").hide();
    $("#settings-popup").hide();
    $("#help-popup").hide();

    /* Nascondo le main icons*/
    $("#range").hide();
    $("#rangeValue").hide();
    $("#settings").hide();
    $("#help").hide();
    $("#footer").hide();

    /* Nascondo le mani dei tutorial */
    $("#hand-choose").hide();
    $("#hand-close").hide();
    $("#hand-next").hide();
    //$("#hand-scroll").hide();

    /* Nascondo box aneddoti */
    $("#box-aneddoti").hide();

    //World.welcomeToAdeon();

    /* Funzioni di swipe up e swipe down dei pannelli */

    /* CATEGORIE */
    $('#footer').on('swipeup', function () {
        $('#swipe-box').animate({'bottom': '0'}, World.velFadeOutIn);
        $("#swipeup").hide();
    });

    $('#swipe-box').on('swipedown', function () {
        if (!World.firstTime) {
            $('#swipe-box').animate({'bottom': '-15vh'}, World.velFadeOutIn);
            $("#swipeup").show();
        }
    });

    /* RANGE */
    $('#range-box').on('swipedown', function () {
        if (!World.firstTime) {
            $('#range-box').animate({ 'bottom': '-15vh' }, World.velFadeOutIn);
            $("#footer").show();
            $("#swipeup").show();
        }
    });

    /* Aggiorna il valore del range quando lo slider viene aggiornato*/
    $("#sliderAdeon").on("slidestop", function (e) {
        World.updateRangeValues();
    });

    $("#sliderAdeon").change(function () {
        $("#rangeValue").text($("#sliderAdeon").val());
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