import React from 'react';
import { View, Button, Modal } from 'react-native';
import { AR } from 'expo';
// Let's alias ExpoTHREE.AR as ThreeAR so it doesn't collide with Expo.AR.
import ExpoTHREE, { THREE } from 'expo-three';
import * as ThreeAR from 'expo-three-ar';
// Let's also import `expo-graphics`
// expo-graphics manages the setup/teardown of the gl context/ar session, creates a frame-loop, and observes size/orientation changes.
// it also provides debug information with `isArCameraStateEnabled`
import { View as GraphicsView } from 'expo-graphics';

import ApiKeys from './constants/ApiKeys';
import GooglePoly from './api/GooglePoly';
import { SearchableGooglePolyAssetList } from './components/AppComponents';
import { set } from 'gl-matrix/src/gl-matrix/mat4';
//import { ScrollView } from 'react-native-gesture-handler';

export default class App extends React.Component {
  componentDidMount() {
    // Turn off extra warnings
    THREE.suppressExpoWarnings(true)
    ThreeAR.suppressWarnings()
  }

  constructor(props) {
    super(props);

    this.googlePoly = new GooglePoly(ApiKeys.GooglePoly);

    this.googlePoly.getSearchResults('duck', '').then(assets => {
      const json = JSON.stringify(assets[0]);
      //console.log(json);
    });

    this.state = {
      searchModalVisible: false,
      currentAsset: {},
      isPaused: false,
    }
  }

  render() {

    return (
      <View style={{ flex: 1 }}>
        <GraphicsView
          style={{ flex: 1 }}
          onContextCreate={this.onContextCreate}
          onRender={this.onRender}
          onResize={this.onResize}
          isArEnabled
          isArRunningStateEnabled
          isArCameraStateEnabled

          arTrackingConfiguration={'ARWorldTrackingConfiguration'}
        />

        <Button title="Add Object" onPress={this.onAddObjectPress} />
        <Button title="Search" onPress={this.onSearchModalPress} />
        <Button title="Pause" onPress={this.onPausePress} />

        <Modal visible={this.state.searchModalVisible} animationType="slide">
          <SearchableGooglePolyAssetList
            googlePoly={this.googlePoly}
            onCancelPress={this.onCancelPress}
            onAssetPress={this.onAssetPress}
          />
        </Modal>
      </View >
    );
  }

  onPausePress = () => {
    if (!this.state.isPaused) {
      console.log("Ferhat : True");
      //AR.pause();
      this.setState({ isPaused: true });
    }
    else {
      //AR.resume();
      this.setState({ isPaused: false });
    }
  }

  onAddObjectPress = () => {
    if (this.threeModel)
      this.scene.remove(this.threeModel);

    GooglePoly.getThreeModel(this.state.currentAsset, function (object) {

      this.threeModel = object;

      ExpoTHREE.utils.scaleLongestSideToSize(object, 0.75);
      object.position.z = -3;
      this.scene.add(object);
    }.bind(this), function (error) {
      console.log(error);
    });
  }

  onCancelPress = () => {
    this.setState({ searchModalVisible: false });
  }

  onAssetPress = (asset) => {
    this.setState({ currentAsset: asset });
    this.setState({ searchModalVisible: false });
  }

  onSearchModalPress = () => {
    this.setState({ searchModalVisible: true });
  }

  // When our context is built we can start coding 3D things.
  onContextCreate = async ({ gl, scale: pixelRatio, width, height }) => {
    // This will allow ARKit to collect Horizontal surfaces
    AR.setPlaneDetection(AR.PlaneDetectionTypes.Horizontal);

    // Create a 3D renderer
    this.renderer = new ExpoTHREE.Renderer({
      gl,
      pixelRatio,
      width,
      height,
    });

    // We will add all of our meshes to this scene.
    this.scene = new THREE.Scene();
    // This will create a camera texture and use it as the background for our scene
    this.scene.background = new ThreeAR.BackgroundTexture(this.renderer);
    // Now we make a camera that matches the device orientation.
    // Ex: When we look down this camera will rotate to look down too!
    this.camera = new ThreeAR.Camera(width, height, 0.01, 1000);

    // Make a cube - notice that each unit is 1 meter in real life, we will make our box 0.1 meters
    const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    // Simple color material
    const material = new THREE.MeshPhongMaterial({
      color: 0xff00ff,
    });

    // Combine our geometry and material
    this.cube = new THREE.Mesh(geometry, material);
    // Place the box 0.4 meters in front of us.
    this.cube.position.z = -0.4;
    // Add the cube to the scene
    this.scene.add(this.cube);

    // Setup a light so we can see the cube color
    // AmbientLight colors all things in the scene equally.
    this.scene.add(new THREE.AmbientLight(0xffffff));

    // Create this cool utility function that let's us see all the raw data points.
    this.points = new ThreeAR.Points();
    // Add the points to our scene...
    this.scene.add(this.points)
  };

  // When the phone rotates, or the view changes size, this method will be called.
  onResize = ({ x, y, scale, width, height }) => {
    // Let's stop the function if we haven't setup our scene yet
    if (!this.renderer) {
      return;
    }
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setPixelRatio(scale);
    this.renderer.setSize(width, height);
  };

  // Called every frame.
  onRender = () => {
    // This will make the points get more rawDataPoints from Expo.AR
    //this.points.update()
    if (this.state.isPaused) {
      var camPos = this.camera.getWorldPosition(new ExpoTHREE.THREE.Vector3(0, 0, 0));
      var newPos = new ExpoTHREE.THREE.Vector3(camPos.x + 0, camPos.y + 0, camPos.z - 0.5);
      this.cube.position.x = newPos.x;
      this.cube.position.y = newPos.y;
      this.cube.position.z = newPos.z;
    }

    console.log(this.cube.position);

    // Finally render the scene with the AR Camera
    this.renderer.render(this.scene, this.camera);
  };
}
