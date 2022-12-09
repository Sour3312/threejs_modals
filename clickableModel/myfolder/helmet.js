import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.119.1/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.119.1/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.119.1/examples/jsm/loaders/GLTFLoader.js";
import { RGBELoader } from "https://cdn.jsdelivr.net/npm/three@0.119.1/examples/jsm/loaders/RGBELoader.js";
// https://jsfiddle.net/ct4dboym/
var container, controls, camera, scene, renderer, raycaster, mouse;

init();

function init() {
  console.log("started");
  scene = new THREE.Scene();
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();
  renderer = new THREE.WebGLRenderer({
    antialias: true,
  });

  container = document.createElement("div");
  document.body.appendChild(container);

  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.25,
    20
  );
  camera.position.set(-1.8, 0.9, 2.7);

  new RGBELoader()
    .setDataType(THREE.UnsignedByteType)
    .setPath("https://threejs.org/examples/textures/equirectangular/")
    .load("royal_esplanade_1k.hdr", function (texture) {
      var envMap = pmremGenerator.fromEquirectangular(texture).texture;

      scene.background = envMap;
      scene.environment = envMap;

      texture.dispose();
      pmremGenerator.dispose();

      // model
      var loader = new GLTFLoader().setPath(
        "https://threejs.org/examples/models/gltf/DamagedHelmet/glTF/"
      );

      loader.load("DamagedHelmet.gltf", function (gltf) {
        gltf.scene.traverse(function (child) {
          if (child.isMesh) {
            child.material.envMap = envMap;
          }
        });

        scene.add(gltf.scene);

        render();
      });
    });

  // window.addEventListener("click", onClick);
  renderer.domElement.addEventListener("click", onClick, false);

  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  var pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();

  controls = new OrbitControls(camera, renderer.domElement);
  controls.addEventListener("change", render); // use if there is no animation loop
  controls.minDistance = 2;
  controls.maxDistance = 10;
  controls.target.set(0, 0, -0.2);
  controls.update();

  window.addEventListener("resize", onWindowResize, false);
}

function onClick(event) {
  // console.log(raycaster);
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  var intersects = raycaster.intersectObjects(scene.children, true);
  // console.log(intersects);

  if (intersects.length > 0) {
    console.log("Intersection:", intersects[0]);
  }
}

function onWindowResize() {
  console.log("resized");
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);

  render();
}

function render() {
  renderer.render(scene, camera);
}
