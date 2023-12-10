import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MainScreen from "./screen/MainScreen";
import SleepCapture from "./screen/SleepCaptureScreen";

const Stack = createNativeStackNavigator();
function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="MainScreen"
          component={MainScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="SleepCaptureScreen"
          component={SleepCapture}
          options={{ headerShown: false }}
        />
       
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;
