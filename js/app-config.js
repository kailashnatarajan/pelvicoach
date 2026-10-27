// Two videos stored in your GitHub repository (upload them into the "videos" folder).
// Change the title or file name here if you want. Use .mp4 (H.264) so every phone can play it.
export const VIDEOS = [
  { title: "Video 1: How to find your pelvic floor muscles", src: "assets/videos/video1.mp4" },
  { title: "Video 2: How to do the exercises correctly",     src: "assets/videos/video2.mp4" }
];
// Same broker and topic your Wokwi ESP32 publishes to (used by the Bedridden mode's live sensor option).
export const MQTT = { url: "wss://broker.hivemq.com:8884/mqtt", topic: "medaithon/pfm13/win" };
