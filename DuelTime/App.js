/*import { AppLoading } from 'expo';
import { Asset } from 'expo-asset';
import * as Font from 'expo-font';
import React, { useState } from 'react';
import { Platform, StatusBar, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import AppNavigator from './navigation/AppNavigator';

export default function App(props) {
  const [isLoadingComplete, setLoadingComplete] = useState(false);

  if (!isLoadingComplete && !props.skipLoadingScreen) {
    return (
      <AppLoading
        startAsync={loadResourcesAsync}
        onError={handleLoadingError}
        onFinish={() => handleFinishLoading(setLoadingComplete)}
      />
    );
  } else {
    return (
      <View style={styles.container}>
        {Platform.OS === 'ios' && <StatusBar barStyle="default" />}
        <AppNavigator />
      </View>
    );
  }
}

async function loadResourcesAsync() {
  await Promise.all([
    Asset.loadAsync([
      require('./assets/images/robot-dev.png'),
      require('./assets/images/robot-prod.png'),
    ]),
    Font.loadAsync({
      // This is the font that we are using for our tab bar
      ...Ionicons.font,
      // We include SpaceMono because we use it in HomeScreen.js. Feel free to
      // remove this if you are not using it in your app
      'space-mono': require('./assets/fonts/SpaceMono-Regular.ttf'),
    }),
  ]);
}

function handleLoadingError(error) {
  // In this case, you might want to report the error to your error reporting
  // service, for example Sentry
  console.warn(error);
}

function handleFinishLoading(setLoadingComplete) {
  setLoadingComplete(true);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});*/
import React from 'react';
import { Asset } from 'expo-asset';
import { Text, ScrollView, View, TextInput, Button, Image } from 'react-native'
import { AR } from 'expo';
// Let's alias ExpoTHREE.AR as ThreeAR so it doesn't collide with Expo.AR.
import ExpoTHREE, { THREE } from 'expo-three';
import * as ThreeAR from 'expo-three-ar'
// Let's also import `expo-graphics`
// expo-graphics manages the setup/teardown of the gl context/ar session, creates a frame-loop, and observes size/orientation changes.
// it also provides debug information with `isArCameraStateEnabled`
import { View as GraphicsView } from 'expo-graphics';

import ApiKeys from './constants/ApiKeys';
import GooglePoly from './api/GooglePoly';
import TurkeyObject from './assets/TurkeyObject.json';
import { GooglePolyAsset } from './components/AppComponents';
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

    this.googlePoly.getResearchResults('duck', '').then(assets => {
      const json = JSON.stringify(assets[0]);
      //console.log(json);
    });

    this.state = {
      searchQuery: "",
      currentResults: [],
    }
  }

  render() {
    // You need to add the `isArEnabled` & `arTrackingConfiguration` props.
    // `isArRunningStateEnabled` Will show us the play/pause button in the corner.
    // `isArCameraStateEnabled` Will render the camera tracking information on the screen.
    // `arTrackingConfiguration` denotes which camera the AR Session will use. 
    // World for rear, Face for front (iPhone X only)
    /*return (
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
    );*/

    return (
      <ScrollView style={{ paddingTop: 20 }}>
        <TextInput
          style={{ borderWidth: 1, height: 40 }}
          placeholder="Search..."
          value={this.state.searchQuery}
          onChangeText={this.onSearchChangeText}
        />
        <Button title="Search" onPress={this.onSearchPress} />
        {this.renderCurrentResults()}
        <Button title="Load More..." onPress={this.onLoadMorePress} />
        <View style={{ paddingTop: 40 }} />
      </ScrollView>
    );
  }

  renderCurrentResults() {
    if (this.state.currentResults.length == 0)
      return <Text>No Results</Text>

    return this.state.currentResults.map((asset, index) => {
      return (
        <GooglePolyAsset asset={asset} key={index} />
      );
    });
  }

  onLoadMorePress = () => {

    this.googlePoly.getResearchResults().then(function (assets) {
      this.setState({ currentResults: this.googlePoly.currentResults });
    }.bind(this));
  }

  onSearchPress = () => {
    var keyword = this.state.searchQuery;
    this.googlePoly.setSearchParams(keyword);

    this.googlePoly.getResearchResults().then(function (assets) {
      this.setState({ currentResults: this.googlePoly.currentResults });
    }.bind(this));
  }

  onSearchChangeText = (text) => {
    this.setState({ searchQuery: text });
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
    this.cube.position.z = -0.4
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
    // Finally render the scene with the AR Camera
    this.renderer.render(this.scene, this.camera);
  };
}
