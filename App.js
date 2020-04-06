import React, {Component}from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Accelerometer } from 'expo-sensors';
import io from "socket.io-client";

export default class App extends Component {

  state = {
    data : 0
  }
  
  componentDidMount(){
    this.socket = io("http://127.0.0.1:3000");
    this.subscription = Accelerometer.addListener(accelerometerData => {
      this.setState({data : accelerometerData});
      this.socket.emit('data', this.state.data);
    });
  }

  componentWillUnmount(){
    this.subscription.remove();
  }
  
 
  render(){
    let { x, y, z } = this.state.data;
    return (
      <View style={styles.sensor}>
        <Text style={styles.text}>Accelerometer: (in Gs where 1 G = 9.81 m s^-2)</Text>
        <Text style={styles.text}>
          x: {round(x)} y: {round(y)} z: {round(z)}
        </Text>
      </View>
    );
  }
  
}

function round(n) {
  if (!n) {
    return 0;
  }

  return Math.floor(n * 100) / 100;
}

const styles = StyleSheet.create({
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginTop: 15,
  },
  button: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#eee',
    padding: 10,
  },
  middleButton: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#ccc',
  },
  sensor: {
    marginTop: 45,
    paddingHorizontal: 10,
  },
  text: {
    textAlign: 'center',
  },
});
