
/**
 * Initialize the Google Map and add our custom layer overlay.
 * @param  {string} mapId
 * @param  {string} token
 */


// The Google Map feature for the currently drawn polygon, if any.


// The scale to use for reduce regions.
const REDUCTION_SCALE = 200;
const initialize = (mapId, token) => {
var currentPolygon;
    // The Google Maps API calls getTileUrl() when it tries to display a map
    // tile. This is a good place to swap in the MapID and token we got from
    // the Node.js script. The other values describe other properties of the
    // custom map type.
    const eeMapOptions = {
      getTileUrl: (tile, zoom) => {
        const baseUrl = 'https://earthengine.googleapis.com/map';
        const url = [baseUrl, mapId, zoom, tile.x, tile.y].join('/');
        return `${url}?token=${token}`;
      },
      tileSize: new google.maps.Size(256, 256)
    };
  
    // Create the map type.
    const mapType = new google.maps.ImageMapType(eeMapOptions);
  
    const myLatLng = new google.maps.LatLng(35.8574,-78.7159);
    const mapOptions = {
      center: myLatLng,
      zoom: 10,
      maxZoom: 17,
      streetViewControl: true
    };
  
    // Create the base Google Map.
    const map = new google.maps.Map(document.getElementById('map'), mapOptions);

    const drawingManager = new google.maps.drawing.DrawingManager({
        drawingMode: google.maps.drawing.OverlayType.POLYGON,
        drawingControl: true,
        polygonOptions: {
          fillColor: '#ff0000',
          strokeColor: '#ff0000'
        }
    });


      // Extract an array of coordinates for the given polygon.
      var getCoordinates = function(polygon) {
        var points = currentPolygon.getPath().getArray();
        return points.map(function(point) {
          return [point.lng(), point.lat()];
        });
      };
  
      // Respond when a new polygon is drawn.
    google.maps.event.addListener(drawingManager, 'overlaycomplete', function(event) {
        console.log(getCoordinates(event.overlay));
        
        postData('/api/calc/impervious', event.overlay)
            .then(function(response) {
                return response.json();
            })
            .then(function(myJson) {
                console.log(JSON.stringify(myJson));
            });
    });
  
      // Clear the current polygon when the user clicks the "Draw new" button.
    //   $('.polygon-details .draw-new').click(clearPolygon);
  
      drawingManager.setMap(map);
  
    // Add the EE layer to the map.
    map.overlayMapTypes.push(mapType);
  };

  function postData(url = ``, data = {}) {
    // Default options are marked with *
      return fetch(url, {
          method: "POST", // *GET, POST, PUT, DELETE, etc.
          mode: "cors", // no-cors, cors, *same-origin
          cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
          credentials: "same-origin", // include, *same-origin, omit
          headers: {
              "Content-Type": "application/json; charset=utf-8",
              // "Content-Type": "application/x-www-form-urlencoded",
          },
          referrer: "no-referrer", // no-referrer, *client
          body: data
        //   body: JSON.stringify(data) // body data type must match "Content-Type" header
      })
      .then(response => response.json()); // parses response to JSON
  }

  