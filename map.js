// api key to access JotForm, switch my key for yours
JF.initialize({ apiKey: "8ae1a9cbfe5470129d1af524cc098f4c" }); //PUT YOUR OWN KEY HERE

// get form submissions from JotForm Format: (formID, callback)
JF.getFormSubmissions("223124226628047", function (response) {
  console.log(response);

  // array to store all the submissions: we will use this to create the map
 const submissions = [];
  // for each response
  for (var i = 0; i < response.length; i++) {
    // create an object to store the submissions and structure as a json
    const submissionProps = {};

    // add all fields of response.answers to our object
    const keys = Object.keys(response[i].answers);
    keys.forEach((answer) => {
      const lookup = response[i].answers[answer].cfname ? "cfname" : "name";
      submissionProps[response[i].answers[answer][lookup]] =
        response[i].answers[answer].answer;
    });

    console.log(submissionProps);

    // convert location coordinates string to float array
    submissionProps["Location Coordinates"] = submissionProps[
     "Location Coordinates"
    ]
     .split(/\r?\n/)
     .map((x) => parseFloat(x.replace(/[^\d.-]/g, "")))

    console.log("Hello")
    console.log(submissionProps);

    // add submission to submissions array
    submissions.push(submissionProps);
  }

  // Import Layers from DeckGL
 const { MapboxLayer, ScatterplotLayer } = deck;

// YOUR MAPBOX TOKEN HERE
  mapboxgl.accessToken = "pk.eyJ1Ijoic3Bsb2htYXIiLCJhIjoiY2syaHVxdml5MHpsbzNtbzF1NXE1ZHYxeiJ9.R73K7V9poI3Muj84Wuw_YA";

  const map = new mapboxgl.Map({
    container: document.body,
    style: "mapbox://styles/splohmar/cl9wu1yx3002q15s5ndaa0sms", // Your style URL
    center: [-71.093772,42.358839], // starting position [lng, lat]
    zoom: 16, // starting zoom
    projection: "globe", // display the map as a 3D globe
    pitch: 60, // pitch in degrees
    bearing: -60, // bearing in degrees
  });

  map.on("load", () => {
    const firstLabelLayerId = map
      .getStyle()
      .layers.find((layer) => layer.type === "symbol").id;

    map.addLayer(
      new MapboxLayer({
        id: "deckgl-circle",
        type: ScatterplotLayer,
        data: submissions,
        getPosition: (d) => {
          return d["Location Coordinates"];
        },
        // Styles
        radiusUnits: "pixels",
        getRadius: 10,
        opacity: 0.7,
        stroked: false,
        filled: true,
        radiusScale: 3,
        getFillColor: [255, 0, 0],
        pickable: true,
        autoHighlight: true,
        highlightColor: [255, 255, 255, 255],
        parameters: {
          depthTest: false,
        },
        onClick: (info) => {
          //ADD NEW INPUT TO GETIMAGE GALLERY:
          getImageGallery(info.object.fileUpload, info.object.whatDid);

          flyToClick(info.object["Location Coordinates"]);
        },

      }),
      firstLabelLayerId


    );


    function getImageGallery(images, text) {
      const imageGallery = document.createElement("div");
      imageGallery.id = "image-gallery";

      for (var i = 0; i < images.length; i++) {
        const image = document.createElement("img");
        image.src = images[i];

        imageGallery.appendChild(image);
      }

      //   add exit button to image gallery
      const exitButton = document.createElement("button");
      exitButton.id = "exit-button";
      exitButton.innerHTML = "X";
      exitButton.addEventListener("click", () => {
        document.getElementById("image-gallery").remove();
      });

      //   stylize the exit button to look good: this can also be a css class
      exitButton.style.position = "fixed";
      exitButton.style.top = "0";
      exitButton.style.right = "0";
      exitButton.style.borderRadius = "0";
      exitButton.style.padding = "1rem";
      exitButton.style.fontSize = "2rem";
      exitButton.style.fontWeight = "bold";
      exitButton.style.backgroundColor = "white";
      exitButton.style.border = "none";
      exitButton.style.cursor = "pointer";
      exitButton.style.zIndex = "1";


      imageGallery.appendChild(exitButton);

      // add text to image gallery
      const textDiv = document.createElement("div");
      textDiv.id = "image-gallery-text";
      textDiv.innerHTML = text;

      // add fixed styling if in modal view
      textDiv.style.position = "fixed";
      textDiv.style.top = "0";
      textDiv.style.left = "0";
      textDiv.style.right = "0";
      textDiv.style.borderRadius = "0";
      textDiv.style.padding = "2rem";
      textDiv.style.fontSize = "2rem";

      imageGallery.appendChild(textDiv);

      // append the image gallery to the body
      document.body.appendChild(imageGallery);
    }


    function flyToClick(coords) {
      map.flyTo({
        center: [coords[0], coords[1]],
        zoom: 17,
        essential: true, // this animation is considered essential with respect to prefers-reduced-motion
      });
    }

    // create “current location” function, which doesn’t trigger until called upon.
    function addUserLocation(latitude, longitude) {
      return map.addLayer(
        new MapboxLayer({
          id: "user-location",
          type: ScatterplotLayer,
          data: [{ longitude, latitude }],
          getPosition: (d) => [d.longitude, d.latitude],
          getSourceColor: [0, 255, 0],
          sizeScale: 15,
          getSize: 10,
          radiusUnits: "pixels",
          getRadius: 5,
          opacity: 0.7,
          stroked: false,
          filled: true,
          radiusScale: 3,
          getFillColor: [3, 202, 252],
          parameters: {
            depthTest: false,
          },
        })
      );
    }

    // get current location
    const successCallback = (position) => {
      // add new point layer of current location to deck gl
      const { latitude, longitude } = position.coords;
      addUserLocation(latitude, longitude);
    };

    const errorCallback = (error) => {
      console.log(error);
    };

// create async function to await for current location and then return the promise as lat long coordinates then resolve the promise
    function getCurrentLocation() {
      const currentLocation = navigator.geolocation.getCurrentPosition(
        successCallback,
        errorCallback
      );
      return currentLocation;
    }
    if (navigator.geolocation) {
      getCurrentLocation();
    }
    const locationButton = document.createElement("div");
    // create a button that will request the users location
    locationButton.textContent = "Where am I?";
    locationButton.id = "location-button";
    locationButton.addEventListener("click", () => {
      // when clicked, get the users location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
          const { latitude, longitude } = position.coords;

          locationButton.textContent =
            "Where am I? " +
            position.coords.latitude.toFixed(3) +
            ", " +
            position.coords.longitude.toFixed(3);

          addUserLocation(latitude, longitude);
          flyToClick([longitude, latitude]);
        });
      }
    });

    // append the button
    document.body.appendChild(locationButton);

  });
});


// });
