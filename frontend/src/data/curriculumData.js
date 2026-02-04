// src/data/curriculumData.js

// 1. HELPER FUNCTION
const createWord = (word) => {
  if (!word) return null;
  const vowels = ['a', 'e', 'i', 'o', 'u', 'y'];
  let splitIndex = 0;
  
  for (let i = 0; i < word.length; i++) {
    if (vowels.includes(word[i].toLowerCase())) {
      splitIndex = i; 
      break;
    }
  }
  
  if (splitIndex === 0) splitIndex = 1;

  const onset = word.slice(0, splitIndex);
  const rime = word.slice(splitIndex);

  return {
    id: word, 
    whole: word,
    onset: onset, 
    rime: rime,   
    splitIndex: splitIndex,
    acceptedPhonemes: {
      part1: [onset, onset + "uh", onset.toUpperCase()], 
      part2: [rime, rime.toUpperCase()],
      whole: [word, word.toUpperCase()]
    }
  };
};

// 2. DATA EXPORT
export const curriculumData = {
  1: { // Level 1
    1: { // Unit 1
      title: "Short 'a' Adventures",
      sightWords: ["an", "a", "the", "is", "and", "has", "have", "on", "in", "it"],
      decodable: ["cat", "fat", "hat", "sat", "bat", "ham", "ram", "dam", "jam", "ran", "pan", "man", "van", "bag", "tag", "rag", "tap", "map", "nap", "sad", "mad", "bad"].map(createWord)
    },
    2: { // Unit 2
      title: "Short 'e' Excitement",
      sightWords: ["see", "sees", "are", "my", "I", "that", "want", "like", "this", "you"],
      decodable: ["pet", "net", "vet", "wet", "met", "leg", "peg", "beg", "bed", "red", "hen", "men", "ten", "pen", "den", "web"].map(createWord)
    },
    3: { // Unit 3
      title: "Short 'i' Igloo",
      sightWords: ["he", "your", "do", "she", "don't", "yes", "me", "am", "big", "small"],
      decodable: ["sit", "kit", "hit", "fit", "bit", "big", "pig", "dig", "fid", "hid", "kid", "lid", "lip"].map(createWord)
    }
  }
};