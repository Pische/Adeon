var changeAnimationDuration = 500;
var resizeAnimationDuration = 1000;

function Marker(poiData) {

    this.poiData = poiData;
    this.isSelected = false;

    /*
        Con AR.PropertyAnimations sei in grado di animare quasi tutte le
        proprietà degli oggetti ARchitect. In questo caso animerà l'opacità
        di entrambi i box dei marker in background in modo che uno svanisca
        mentre l'altro si dissolve. Anche il ridimensionamento è animato.
        Le dimensioni del marker cambiano nel tempo, quindi anche le etichette
        devono essere animate per mantenerle relative al disegno di sfondo.
        AR.AnimationGroups sono usati per sincronizzare tutte le animazioni in
        parallelo o in sequenza.
    */
    this.animationGroupIdle = null;
    this.animationGroupSelected = null;

    /*  Creo AR.GeoLocation dalle coordinate del POI */
    var markerLocation = new AR.GeoLocation(poiData.latitude, poiData.longitude, poiData.altitude);

    /*  Creo un AR.ImageDrawable per il marker in stato "inattivo" */
    this.markerDrawableIdle = new AR.ImageDrawable(World.markerDrawableIdle, 2.5, {
        zOrder: 0,
        opacity: 1.0,
        /*
            Per reagire alle interazioni utente, viene settata la proprietà
            onClick per ogni AR.Drawable. La proprietà è una funzione che viene
            chiamata ogni volta che l'utente clicca sul box. La funzione
            chiamata su ogni tocco viene restituita dalla seguente funzione di
            supporto definita in marker.js. La funzione restituisce una funzione
            che controlla lo stato selezionato con l'aiuto della variabile
            isSelected ed esegue la funzione appropriata.
            Il marcatore cliccato viene passato come argomento.
        */
        onClick: Marker.prototype.getOnClickTrigger(this)
    });

    /*  Creo un AR.ImageDrawable per il marker in stato "selezionato" */
    this.markerDrawableSelected = new AR.ImageDrawable(World.markerDrawableSelected, 2.5, {
        zOrder: 0,
        opacity: 0.0,
        onClick: null
    });

    /*
        Funzione d'appoggio usata per mostrare la giusta unità di misura
        (m o km) all'interno della label
    */
    var distance = (markerLocation.distanceToUser() > 999) ?
        ((markerLocation.distanceToUser() / 1000).toFixed(2) + " km") : (Math.round(markerLocation.distanceToUser()) + " m");

    /* Creo un AR.Label per il titolo del marker. */
    this.titleLabel = new AR.Label(poiData.title, 0.4, {
        zOrder: 1,
        translate: {
            y: -0.20
        },
        style: {
            textColor: '#FFFFFF',
            fontStyle: AR.CONST.FONT_STYLE.BOLD
        }
    });

    /* Creo un AR.Label per la distanza mostrata sul marker. */
    this.descriptionLabel = new AR.Label(distance, 0.4, {
        zOrder: 1,
        translate: {
            y: -0.75
        },
        style: {
            textColor: '#CE4257',
            fontStyle: AR.CONST.FONT_STYLE.BOLD
        }
    });

    
    /*
        Create the AR.GeoObject with the drawable objects and define the AR.ImageDrawable as an indicator target on
        the marker AR.GeoObject. The direction indicator is displayed automatically when necessary. AR.Drawable
        subclasses (e.g. AR.Circle) can be used as direction indicators.

        Creo l'AR.GeoObject con gli oggetti disegnabili (box).
    */
    this.markerObject = new AR.GeoObject(markerLocation, {
        drawables: {
            cam: [this.markerDrawableIdle, this.markerDrawableSelected, this.titleLabel, this.descriptionLabel]
        }
    });

    return this;
}

Marker.prototype.getOnClickTrigger = function(marker) {

    /*
        The setSelected and setDeselected functions are prototype Marker functions.

        Both functions perform the same steps but inverted, hence only one function (setSelected) is covered in
        detail. Three steps are necessary to select the marker. First the state will be set appropriately. Second
        the background drawable will be enabled and the standard background disabled. This is done by setting the
        opacity property to 1.0 for the visible state and to 0.0 for an invisible state. Third the onClick function
        is set only for the background drawable of the selected marker.

        Le funzioni setSelected e setDeselected sono funzioni protype del Marker

        Entrambe le funzioni eseguono gli stessi passaggi ma sono invertite,
        quindi solo una funzione (setSelected) è trattata in dettaglio.
        Sono necessari tre passaggi per selezionare il marker.
        Innanzitutto lo stato verrà impostato in modo appropriato. In secondo
        luogo verrà abilitato il disegno di sfondo e lo sfondo standard
        disabilitato. Questo viene fatto impostando la proprietà di opacità su
        1.0 per lo stato visibile e su 0.0 per uno stato invisibile. Terzo, la
        funzione onClick è impostata solo per il disegno di sfondo del marker
        selezionato.
    */

    return function () {
        if (!Marker.prototype.isAnyAnimationRunning(marker)) {
            if (marker.isSelected) {

                Marker.prototype.setDeselected(marker);

            } else {
                Marker.prototype.setSelected(marker);
                try {
                    World.onMarkerSelected(marker);
                } catch (err) {
                    alert(err);
                }

            }
        } else {
            AR.logger.debug('a animation is already running');
        }

        return true;
    };
};

/*
    Property Animations allow constant changes to a numeric value/property of an object, dependent on start-value,
    end-value and the duration of the animation. Animations can be seen as functions defining the progress of the
    change on the value. The Animation can be parametrized via easing curves.
*/
Marker.prototype.setSelected = function(marker) {

    marker.isSelected = true;

    /* New: . */
    if (marker.animationGroupSelected === null) {
        var easingCurve = new AR.EasingCurve(AR.CONST.EASING_CURVE_TYPE.EASE_OUT_ELASTIC, {
            amplitude: 2.0
        });

        /* Create AR.PropertyAnimation that animates the opacity to 0.0 in order to hide the idle-state-drawable. */
        var hideIdleDrawableAnimation = new AR.PropertyAnimation(
            marker.markerDrawableIdle, "opacity", null, 0.0, changeAnimationDuration);
        /* Create AR.PropertyAnimation that animates the opacity to 1.0 in order to show the selected-state-drawable. */
        var showSelectedDrawableAnimation = new AR.PropertyAnimation(
            marker.markerDrawableSelected, "opacity", null, 1.0, changeAnimationDuration);

        /* Create AR.PropertyAnimation that animates the scaling of the idle-state-drawable to 1.2. */
        var idleDrawableResizeAnimationX = new AR.PropertyAnimation(
            marker.markerDrawableIdle, 'scale.x', null, 1.2, resizeAnimationDuration, easingCurve);
        /* Create AR.PropertyAnimation that animates the scaling of the selected-state-drawable to 1.2. */
        var selectedDrawableResizeAnimationX = new AR.PropertyAnimation(
            marker.markerDrawableSelected, 'scale.x', null, 1.2, resizeAnimationDuration, easingCurve);
        /* Create AR.PropertyAnimation that animates the scaling of the title label to 1.2. */
        var titleLabelResizeAnimationX = new AR.PropertyAnimation(
            marker.titleLabel, 'scale.x', null, 1.2, resizeAnimationDuration, easingCurve);
        /* Create AR.PropertyAnimation that animates the scaling of the description label to 1.2. */
        var descriptionLabelResizeAnimationX = new AR.PropertyAnimation(
            marker.descriptionLabel, 'scale.x', null, 1.2, resizeAnimationDuration, easingCurve);

        /* Create AR.PropertyAnimation that animates the scaling of the idle-state-drawable to 1.2. */
        var idleDrawableResizeAnimationY = new AR.PropertyAnimation(
            marker.markerDrawableIdle, 'scale.y', null, 1.2, resizeAnimationDuration, easingCurve);
        /* Create AR.PropertyAnimation that animates the scaling of the selected-state-drawable to 1.2. */
        var selectedDrawableResizeAnimationY = new AR.PropertyAnimation(
            marker.markerDrawableSelected, 'scale.y', null, 1.2, resizeAnimationDuration, easingCurve);
        /* Create AR.PropertyAnimation that animates the scaling of the title label to 1.2. */
        var titleLabelResizeAnimationY = new AR.PropertyAnimation(
            marker.titleLabel, 'scale.y', null, 1.2, resizeAnimationDuration, easingCurve);
        /* Create AR.PropertyAnimation that animates the scaling of the description label to 1.2. */
        var descriptionLabelResizeAnimationY = new AR.PropertyAnimation(
            marker.descriptionLabel, 'scale.y', null, 1.2, resizeAnimationDuration, easingCurve);

        /*
            There are two types of AR.AnimationGroups. Parallel animations are running at the same time,
            sequentials are played one after another. This example uses a parallel AR.AnimationGroup.
        */
        marker.animationGroupSelected = new AR.AnimationGroup(AR.CONST.ANIMATION_GROUP_TYPE.PARALLEL, [
            hideIdleDrawableAnimation,
            showSelectedDrawableAnimation,
            idleDrawableResizeAnimationX,
            selectedDrawableResizeAnimationX,
            titleLabelResizeAnimationX,
            descriptionLabelResizeAnimationX,
            idleDrawableResizeAnimationY,
            selectedDrawableResizeAnimationY,
            titleLabelResizeAnimationY,
            descriptionLabelResizeAnimationY
        ]);
    }

    /* Removes function that is set on the onClick trigger of the idle-state marker. */
    marker.markerDrawableIdle.onClick = null;
    /* Sets the click trigger function for the selected state marker. */
    marker.markerDrawableSelected.onClick = Marker.prototype.getOnClickTrigger(marker);

    /* Starts the selected-state animation. */
    marker.animationGroupSelected.start();
};

Marker.prototype.setDeselected = function(marker) {

    marker.isSelected = false;

    if (marker.animationGroupIdle === null) {
        var easingCurve = new AR.EasingCurve(AR.CONST.EASING_CURVE_TYPE.EASE_OUT_ELASTIC, {
            amplitude: 2.0
        });

        /* Create AR.PropertyAnimation that animates the opacity to 1.0 in order to show the idle-state-drawable. */
        var showIdleDrawableAnimation = new AR.PropertyAnimation(
            marker.markerDrawableIdle, "opacity", null, 1.0, changeAnimationDuration);
        /* Create AR.PropertyAnimation that animates the opacity to 0.0 in order to hide the selected-state-drawable. */
        var hideSelectedDrawableAnimation = new AR.PropertyAnimation(
            marker.markerDrawableSelected, "opacity", null, 0, changeAnimationDuration);
        /* Create AR.PropertyAnimation that animates the scaling of the idle-state-drawable to 1.0. */
        var idleDrawableResizeAnimationX = new AR.PropertyAnimation(
            marker.markerDrawableIdle, 'scale.x', null, 1.0, resizeAnimationDuration, easingCurve);
        /* Create AR.PropertyAnimation that animates the scaling of the selected-state-drawable to 1.0. */
        var selectedDrawableResizeAnimationX = new AR.PropertyAnimation(
            marker.markerDrawableSelected, 'scale.x', null, 1.0, resizeAnimationDuration, easingCurve);
        /* Create AR.PropertyAnimation that animates the scaling of the title label to 1.0. */
        var titleLabelResizeAnimationX = new AR.PropertyAnimation(
            marker.titleLabel, 'scale.x', null, 1.0, resizeAnimationDuration, easingCurve);
        /* Create AR.PropertyAnimation that animates the scaling of the description label to 1.0. */
        var descriptionLabelResizeAnimationX = new AR.PropertyAnimation(
            marker.descriptionLabel, 'scale.x', null, 1.0, resizeAnimationDuration, easingCurve);
        /* Create AR.PropertyAnimation that animates the scaling of the idle-state-drawable to 1.0. */
        var idleDrawableResizeAnimationY = new AR.PropertyAnimation(
            marker.markerDrawableIdle, 'scale.y', null, 1.0, resizeAnimationDuration, easingCurve);
        /* Create AR.PropertyAnimation that animates the scaling of the selected-state-drawable to 1.0. */
        var selectedDrawableResizeAnimationY = new AR.PropertyAnimation(
            marker.markerDrawableSelected, 'scale.y', null, 1.0, resizeAnimationDuration, easingCurve);
        /* Create AR.PropertyAnimation that animates the scaling of the title label to 1.0. */
        var titleLabelResizeAnimationY = new AR.PropertyAnimation(
            marker.titleLabel, 'scale.y', null, 1.0, resizeAnimationDuration, easingCurve);
        /* Create AR.PropertyAnimation that animates the scaling of the description label to 1.0. */
        var descriptionLabelResizeAnimationY = new AR.PropertyAnimation(
            marker.descriptionLabel, 'scale.y', null, 1.0, resizeAnimationDuration, easingCurve);

        /*
            There are two types of AR.AnimationGroups. Parallel animations are running at the same time,
            sequentials are played one after another. This example uses a parallel AR.AnimationGroup.
        */
        marker.animationGroupIdle = new AR.AnimationGroup(AR.CONST.ANIMATION_GROUP_TYPE.PARALLEL, [
            showIdleDrawableAnimation,
            hideSelectedDrawableAnimation,
            idleDrawableResizeAnimationX,
            selectedDrawableResizeAnimationX,
            titleLabelResizeAnimationX,
            descriptionLabelResizeAnimationX,
            idleDrawableResizeAnimationY,
            selectedDrawableResizeAnimationY,
            titleLabelResizeAnimationY,
            descriptionLabelResizeAnimationY
        ]);
    }

    /* Sets the click trigger function for the idle state marker. */
    marker.markerDrawableIdle.onClick = Marker.prototype.getOnClickTrigger(marker);
    /* Removes function that is set on the onClick trigger of the selected-state marker. */
    marker.markerDrawableSelected.onClick = null;

    /* Starts the idle-state animation. */
    marker.animationGroupIdle.start();
};

Marker.prototype.isAnyAnimationRunning = function(marker) {

    if (marker.animationGroupIdle === null || marker.animationGroupSelected === null) {
        return false;
    } else {
        return marker.animationGroupIdle.isRunning() === true || marker.animationGroupSelected.isRunning() === true;
    }
};

/* Will truncate all strings longer than given max-length "n". e.g. "foobar".trunc(3) -> "foo...". */
String.prototype.trunc = function(n) {
    return this.substr(0, n - 1) + (this.length > n ? '...' : '');
};