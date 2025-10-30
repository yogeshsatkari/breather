import React, { useState } from "react";
import { View, Text, Button, StyleSheet } from "react-native";

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>👋 Hello Expo</Text>
      <Text style={styles.text}>You pressed {count} times</Text>
      <Button title="Press Me" onPress={() => setCount(count + 1)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "gray" },
  title: { fontSize: 28, fontWeight: "bold", marginBottom: 20 },
  text: { fontSize: 18, marginBottom: 10 },
});
