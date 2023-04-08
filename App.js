// Import modules
import React, { useState, useEffect } from "react";
import { Text, View, Button, TextInput } from "react-native";
import { Audio } from "expo-av";
import RNFS from "react-native-fs";
import NetInfo from "@react-native-community/netinfo";

// Create a function to read words from a JSON file
const readWords = async () => {
  try {
    const path = RNFS.DocumentDirectoryPath + "/words.json";
    const content = await RNFS.readFile(path);
    const data = JSON.parse(content);
    return data;
  } catch (error) {
    console.log(error);
  }
};

// Create a function to write words to a JSON file
const writeWords = async (data) => {
  try {
    const path = RNFS.DocumentDirectoryPath + "/words.json";
    const content = JSON.stringify(data);
    await RNFS.writeFile(path, content);
  } catch (error) {
    console.log(error);
  }
};

// Create a function to update words from a URL
const updateWords = async (words) => {
  try {
    // Define the URL of the JSON file
    const url = "https://example.com/words.json";
    // Fetch the data from the URL
    const response = await fetch(url);
    const data = await response.json();
    // Loop through the data and update the words array
    for (let item of data) {
      // Find the index of the word in the array
      const index = words.findIndex((word) => word.word === item.word);
      // If the word exists, keep its weight and update its other properties
      if (index !== -1) {
        words[index] = { ...item, weight: words[index].weight };
      } else {
        // If the word does not exist, add it with a default weight of 3
        words.push({ ...item, weight: 3 });
      }
    }
    // Return the updated words array
    return words;
  } catch (error) {
    console.log(error);
  }
};

// Create a function to choose a random word and speak it
const speakWord = async (words) => {
  // Sort the words by weight in descending order
  words.sort((a, b) => b.weight - a.weight);
  // Choose a random word from the first half of the sorted array
  const index = Math.floor(Math.random() * Math.floor(words.length / 2));
  const word = words[index].word;
  // Speak the word using Google Translate API
  const soundObject = new Audio.Sound();
  try {
    await soundObject.loadAsync({
      uri: `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&q=${word}&tl=en&total=1&idx=0`,
    });
    await soundObject.playAsync();
    return word;
  } catch (error) {
    console.log(error);
  }
};

// Create a function to check the user's input and give feedback
const checkWord = (userInput, word, words) => {
  // Find the index of the word in the array
  const index = words.findIndex((item) => item.word === word);
  // If the user input is correct, increase the weight by 1 (up to 5)
  if (userInput === word) {
    words[index].weight = Math.min(words[index].weight + 1, 5);
    return "Correct!";
  } else {
    // If the user input is incorrect, decrease the weight by 1 (down to 0)
    words[index].weight = Math.max(words[index].weight - 1, 0);
    return "Incorrect!";
  }
};

// Create a component for the web app
const App = () => {
  // Create state variables for the words, the current word, the user input, and the result
  const [words, setWords] = useState([]);
  const [word, setWord] = useState("");
  const [userInput, setUserInput] = useState("");
  const [result, setResult] = useState("");

  // Read the words from the JSON file when the component mounts
  useEffect(() => {
    readWords().then((data) => setWords(data));
  }, []);
  // Write the words to the JSON file when the component unmounts
  useEffect(() => {
    return () => {
      writeWords(words);
    };
  }, [words]);

  // Update the words from the URL if the internet connection is available when the component mounts
  useEffect(() => {
    // Subscribe to network state updates
    const unsubscribe = NetInfo.addEventListener((state) => {
      // If the device is connected to the internet, update the words
      if (state.isConnected) {
        updateWords(words).then((data) => setWords(data));
      }
    });
    // Unsubscribe from network state updates when the component unmounts
    return () => {
      unsubscribe();
    };
  }, [words]);

  // Return the JSX elements for the web app
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ fontSize: 20 }}>
        Listen to the word and type it below:
      </Text>
      <Button
        title="Speak Word"
        onPress={() => speakWord(words).then((word) => setWord(word))}
      />
      <TextInput
        style={{ borderWidth: 1, width: 200 }}
        value={userInput}
        onChangeText={setUserInput}
      />
      <Button
        title="Check Spelling"
        onPress={() => setResult(checkWord(userInput, word, words))}
      />
      <Text style={{ fontSize: 20 }}>{result}</Text>
    </View>
  );
};

export default App;
