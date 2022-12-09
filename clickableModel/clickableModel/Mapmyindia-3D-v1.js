document.write(
  '<script src="https://unpkg.com/three@0.126.0/build/three.min.js"></script>'
);
document.write(
  '<script src="https://unpkg.com/three@0.126.0/examples/js/loaders/GLTFLoader.js"></script>'
);

/* 3DModel call */
var mrk = "",
  Uurl = "",
  burl = "";

mappls.model_call = function (parms, mapObj) {
  if (mrk) {
    mappls.remove({ map: mapObj, layer: mrk });
    mark = "";
  }
  var modelOrigin = parms.lnglat;
  var modelAltitude = 0;
  var modelRotate = [Math.PI / 2, 0, 0];
  var modelAsMercatorCoordinate = mapplsgl.MercatorCoordinate.fromLngLat(
    modelOrigin,
    modelAltitude
  );
  /* transformation parameters to position, rotate and scale the 3D model onto the map */
  var modelTransform = {
    translateX: modelAsMercatorCoordinate.x,
    translateY: modelAsMercatorCoordinate.y,
    translateZ: modelAsMercatorCoordinate.z,
    rotateX: modelRotate[0],
    rotateY: modelRotate[1],
    rotateZ: modelRotate[2],
    scale: modelAsMercatorCoordinate.meterInMercatorCoordinateUnits(),
    // scale: 3.11843220338983e-8
  };
  var THREE = window.THREE;
  var INTERSECTED;
  /* configuration of the custom layer for a 3D model per the CustomLayerInterface */
  var lyr = null;
  lyr = mapObj.addLayer({
    id: parms.modelId,
    type: "custom",
    renderingMode: "3d",
    onAdd: function (map, gl) {
      this.camera = new THREE.Camera();
      this.scene = new THREE.Scene();
      var mouse = new THREE.Vector2();
      // console.log("this.mouse", this.mouse);
      var raycaster = new THREE.Raycaster();

      var al = new THREE.AmbientLight("0xffffff", 1.2);
      this.scene.add(al);

      var loader = new THREE.GLTFLoader();
      // console.log(parms.gltf);
      loader.load(parms.gltf, (gltf) => {
        INTERSECTED = gltf;
        console.log("gltf", INTERSECTED);
        this.scene.add(gltf.scene);
        this.renderer.render(this.scene, this.camera);
      });
      this.map = map;
      // use the Mapbox GL JS map canvas for three.js
      this.renderer = new THREE.WebGLRenderer({
        canvas: map.getCanvas(),
        context: gl,
        antialias: true,
      });
      this.renderer.autoClear = false;

      var raycaster = new THREE.Raycaster();
      this.renderer.domElement.addEventListener("click", onClick, false);
      const that = this;
      function onClick(event) {
        event.preventDefault();

        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        console.log(mouse);
        if (mouse.x < 0) {
          alert("1");
        }
        raycaster.setFromCamera(this.THREE.Vector2(), this.THREE.Camera());

        var intersects = raycaster.intersectObjects(this.scene.children);
        console.log('intersects',intersects);
        if (intersects.length !== null) {
          alert('i');
        }
      }
    },
    render: function (gl, matrix) {
      var m = new THREE.Matrix4().fromArray(matrix);
      var l = new THREE.Matrix4()
        .makeTranslation(
          modelTransform.translateX,
          modelTransform.translateY,
          modelTransform.translateZ
        )
        .scale(
          new THREE.Vector3(
            modelTransform.scale,
            -modelTransform.scale,
            modelTransform.scale
          )
        );
      this.camera.projectionMatrix = m.multiply(l);
      this.renderer.resetState();
      this.renderer.render(this.scene, this.camera);
      this.map.triggerRepaint();
    },
  });
  if (lyr) lyr.modelId = parms.modelId;

  /* ################## Model Dragable Start ############## */
  if (parms.mrk) {
    /* create marker with model */
    mrk = new mappls.Marker({
      map: mapObj,
      position: { lat: parms.lnglat[1], lng: parms.lnglat[0] },
      fitbounds: false,
      width: 35,
      height: 40,
      popupHtml: parms.modelId.toString(),
      draggable: true,
      clusters: false,
      icon_url: "https://apis.mappls.com/vector_map/thumb/3dbuild.png",
    });
    /* Model position Update code on dragend */
    mrk.on("dragend", function (e) {
      modelAsMercatorCoordinate = mapplsgl.MercatorCoordinate.fromLngLat(
        [e.target._lngLat.lng, e.target._lngLat.lat],
        0
      );
      // transformation parameters to position, rotate and scale the 3D model onto the map
      modelTransform = {
        translateX: modelAsMercatorCoordinate.x,
        translateY: modelAsMercatorCoordinate.y,
        translateZ: modelAsMercatorCoordinate.z,
        rotateX: modelRotate[0],
        rotateY: modelRotate[1],
        rotateZ: modelRotate[2],
        /* Since our 3D model is in real world meters, a scale transform needs to be
         * applied since the CustomLayerInterface expects units in MercatorCoordinates.
         */
        scale: modelAsMercatorCoordinate.meterInMercatorCoordinateUnits(),
      };
    });
  }
  /* ################## Model Dragable End ############## */
  return lyr;
};

/* 3Dmodel method */
mappls.Model = function (obj, success_callback) {
  var res = {};
  if (obj.map) {
    if (
      typeof obj.path == "string" &&
      (obj.path.indexOf(".glb") > 0 || obj.path.indexOf(".gltf") > 0)
    ) {
      if (obj.hasOwnProperty("lnglat") && obj.hasOwnProperty("modelId")) {
        var el = {
          gltf: obj.path,
          modelId: obj.modelId.toString(),
          lnglat: obj.lnglat,
          color: obj.color,
          mrk: obj.mrk,
          mObj: obj.mdata,
        };
        var ly = null;
        ly = mappls.model_call(el, obj.map);
        res.layer = ly.modelId;
        ly = null;
        /* model fitbounds */
        res.fitModel = function () {
          return mappls.fitBounds({
            map: obj.map,
            cType: 1,
            bounds: [obj.lnglat],
            options: { maxZoom: 18 },
          });
        };
        if (
          typeof success_callback == "function" &&
          success_callback != undefined
        ) {
          success_callback(res);
        } else {
          return res;
        }
      } else {
        alert("please provide lanlat and modelId!.");
        return false;
      }
    }
  } else {
    console.log("please provide map!");
    return false;
  }
};

/* Remove 3DModel */
mappls.modelRemove = function (parms) {
  if (parms.map) {
    if (parms.id.length > 0) {
      for (var i = 0; i < parms.id.length; i++) {
        if (parms.map.getLayer(parms.id[i])) {
          parms.map.removeLayer(parms.id[i]);
        }
      }
    }
    if (typeof parms.id == "string") {
      if (parms.map.getLayer(parms.id)) {
        parms.map.removeLayer(parms.id);
      }
    }
  } else {
    console.warn("pass map!");
  }
};
