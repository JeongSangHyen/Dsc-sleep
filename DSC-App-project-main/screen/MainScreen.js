import React from "react";
import { View, TouchableOpacity, Text } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Configure from "./Setting";
import SleepCapture from "./SleepCaptureScreen";

const Tab = createBottomTabNavigator();

const MainScreen = ({ navigation }) => {
  const handleMovePress = (screenName) => {
    navigation.navigate(screenName); // Navigate to the specified screen
  };
  return (

    <View style={{flex:1, marginHorizontal:3}}>
      <TouchableOpacity
        style={{
          borderRadius: 10,
          marginVertical: 6,
          height: 300,
          borderColor: "#000",
          backgroundColor: "#222",justifyContent: "center",
          alignItems: "center",
        }}
        onPress={() => handleMovePress("SleepCaptureScreen")}
        >
          <Text
            style={{
              fontSize: 15,
              fontWeight: "bold",
              color: "#fff",
              marginRight: 10,
            }}
            >
            프로젝트 실행(졸음)
          </Text>
      </TouchableOpacity>
      
      <View style={{flexDirection:"row", marginVertical:30, height: 100 }}> 
        <TouchableOpacity style={{flex:1, backgroundColor:"#777",borderRadius: 10}}>
            <Text>Button 1</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{flex:1,backgroundColor:"#345", borderRadius: 10}}>
            <Text>Button 2</Text>
        </TouchableOpacity>
      </View>
</View>


  );
};

// 하단 탭 추가
const BottomTab = () => {
  return (
    <Tab.Navigator>
      <Tab.Screen
        name="졸음방지"
        component={MainScreen}
        // options={{
        //   headerShown: false,
        // }}
      />
      <Tab.Screen name="Setting" component={Configure} />
    </Tab.Navigator>
  );
};

export default BottomTab;
