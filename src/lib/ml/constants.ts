export const TRAINING_TEXTS = [
  "To be, or not to be, that is the question: Whether 'tis nobler in the mind to suffer The slings and arrows of outrageous fortune, Or to take arms against a sea of troubles And by opposing end them.",
  "In the beginning the Universe was created. This has made a lot of people very angry and been widely regarded as a bad move.",
  "The quick brown fox jumps over the lazy dog. A quick brown fox jumps over the lazy dog.",
  "Hello world. Hello world. Hello world. Hello universe. Hello universe. Hello universe.",
  "It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.",
  "Call me Ishmael. Some years ago—never mind how long precisely—having little or no money in my purse, and nothing particular to interest me on shore, I thought I would sail about a little and see the watery part of the world.",
  "I am a neural network. I am learning to speak. I am learning to write. I am a machine. I am alive.",
  "Artificial intelligence is the simulation of human intelligence processes by machines, especially computer systems.",
  "A B C D E F G H I J K L M N O P Q R S T U V W X Y Z. a b c d e f g h i j k l m n o p q r s t u v w x y z.",
  "1 2 3 4 5 6 7 8 9 10. 1 2 3 4 5 6 7 8 9 10. 1 2 3 4 5 6 7 8 9 10.",
  "Once upon a time there was a little girl who lived in a village near the forest. Whenever she went out, the little girl wore a red riding cloak.",
  "The sky above the port was the color of television, tuned to a dead channel.",
  "All happy families are alike; each unhappy family is unhappy in its own way.",
  "Far out in the uncharted backwaters of the unfashionable end of the western spiral arm of the Galaxy lies a small unregarded yellow sun.",
  "There is a theory which states that if ever anyone discovers exactly what the Universe is for and why it is here, it will instantly disappear and be replaced by something even more bizarre and inexplicable.",
  "JavaScript is a lightweight, interpreted, or just-in-time compiled programming language with first-class functions.",
  "TypeScript is a strongly typed programming language that builds on JavaScript, giving you better tooling at any scale.",
  "Recurrent neural networks, or RNNs, are a type of artificial neural network commonly used in speech recognition and natural language processing.",
  "Deep learning is part of a broader family of machine learning methods based on artificial neural networks with representation learning.",
  "We are what we repeatedly do. Excellence, then, is not an act, but a habit."
];

export function getRandomTexts(count: number = 3): string[] {
  const shuffled = [...TRAINING_TEXTS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}
