import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Image,
  Text,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Audio } from "expo-av";
import axios from "axios";
import io from "socket.io-client";

// 서버주소 변경
const SERVER_URL = "http://172.30.1.34:5000";

export default function App() {
  const [drowsinessImage, setDrowsinessImage] = useState(null);
  const [imageKey, setImageKey] = useState(0);
  const [sound, setSound] = useState(false);
  const [flashingTextVisible, setFlashingTextVisible] = useState(true);
  const socket = io(SERVER_URL); // Flask 서버 URL로 교체하세요

  // 웹소켓 커넥트
  useEffect(() => {
    socket.on("connect", () => {
      console.log("서버에 연결됨");
    });

    socket.on("alarm_played", (data) => {
      console.log("알람이 울렸음:", data);
      // React Native 측에서 원하는 동작을 트리거합니다.
      // 예를 들어 play_alarm_function 호출
      play_alarm_function();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // 초기 로딩 및 cv 시작
  useEffect(() => {
    projectStart();
    reloadImage();
  }, []);

  // 사운드 및 경고 알림 구현 코드 시작부분
  async function playSound() {
    console.log("사운드 로딩 중");
    const { sound } = await Audio.Sound.createAsync(
      require("../assets/war.wav")
    );
    setSound(sound);

    console.log("사운드 재생 중");
    await sound.playAsync();
  }

  const showAlertDialog = async () => {
    try {
      Alert.alert(
        "졸음 알림",
        "졸음운전이 예상됩니다. 쉬어가세요!",
        [
          {
            text: "확인",
            onPress: async () => {
              // 사운드 중지
              if (sound) {
                try {
                  await sound.stopAsync();
                  await sound.unloadAsync();
                  console.log("확인 버튼이 눌렸습니다.");
                } catch (error) {
                  // console.error("사운드 중지 또는 언로드 중 오류:", error);
                }
              }
              // else {
              //   console.warn("사운드가 로드되지 않았습니다.");
              // }
            },
          },
        ],
        { cancelable: false }
      );
      // 이미지 불러오기
      reloadImage();
    } catch (error) {
      console.error("사운드 재생 중 오류:", error);
    }
  };
  // 사운드 및 경고 알림 구현 코드 끝
  useEffect(() => {
    return sound
      ? () => {
          console.log("사운드 언로딩 중");
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  // 서버에서 오는 요청 받는 코드
  const play_alarm_function = async () => {
    console.log("React Native 측에서 알람 재생 중");
    await playSound();
    showAlertDialog();
  };

  const reloadImage = async () => {
    try {
      const response = await axios.get(`${SERVER_URL}/sleep_image?${imageKey}`);
      setDrowsinessImage(response.data.image);
      setImageKey((prevKey) => prevKey + 1);
    } catch (error) {
      console.error("졸음 이미지를 불러오는 중 오류 발생:", error);
    }
  };

  const projectStart = () => {
    fetch(`${SERVER_URL}/video_feed`)
      .then((response) => response.text())
      .then((data) => console.log(data));
    // .catch(error => console.error('Error:', error));
  };

  // Toggle the visibility of flashing text at regular intervals
  useEffect(() => {
    const interval = setInterval(() => {
      setFlashingTextVisible((prev) => !prev);
    }, 500); // Change the interval based on your preference

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.bottomContainer}>
        <Text style={[styles.flashingText, flashingTextVisible && styles.visibleText]}>
          졸음감지 중
        </Text>
      </View>
      {drowsinessImage ? (
        <Image
          key={imageKey}
          source={{ uri: `data:image/jpeg;base64,${drowsinessImage}` }}
          style={[styles.image, styles.roundedImage]}
        />
      ) : (
        <ActivityIndicator size="large" color="#0000ff" />
      )}
      <View  style={styles.overlay}>
        <Image
          source={require("../images/car2.png")} // Make sure to provide the correct path to your car2.png file
          style={styles.carImage}
        />
      </View>
      
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: 320,
    height: 240,
    resizeMode: "contain",
    zIndex:1

  },
  bottomContainer: {
    position: "relative",
    bottom: 50,
    width: "100%",
    alignItems: "center",
    
    },
  flashingText: {
    color: "red",
    fontSize: 40,
    fontFamily: "System",
    fontWeight: "bold"

    
  },
  visibleText: {
    opacity: 0, // Make the text invisible when not visible
  },
  overlay: {
    ...StyleSheet.absoluteFillObject, // This will make the overlay cover the entire parent view
    justifyContent: "center",
    alignItems: "center",
  },
  carImage: {
    width: 300, // Adjust the width as needed
    height: 300, // Adjust the height as needed
    resizeMode: "contain",
    marginTop: 380, // Adjust the margin top as needed
  },
  roundedImage: {
    borderRadius: 15, // Adjust the border radius as needed
  },
});
