import { MainMenu } from "./scenes/MainMenu";
import { Preloader } from "./scenes/Preloader";

// Per-playable DOM setup — injected at runtime so the HTML stays engine-agnostic.
document.title = "Playable";
const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href = "https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700;800&display=swap";
document.head.appendChild(fontLink);

const playableStyles = document.createElement("style");
playableStyles.textContent = `
  body, .dummy p { font-family: 'Open Sans', sans-serif; }
  body { background: #7E3E1A; }
  canvas { background: #431902; }
  #game-container { width: 320px; height: 480px; }
`;
document.head.appendChild(playableStyles);

const DPR = Math.max(1, Math.min(window.devicePixelRatio || 1, 3));
const BASE_WIDTH = 320;
const BASE_HEIGHT = 480;
const DEFAULT_WIDTH = BASE_WIDTH * 2 * DPR;
const DEFAULT_HEIGHT = BASE_HEIGHT * 2 * DPR;
const config = {
    type: Phaser.AUTO,
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
    parent: 'game-container',
    backgroundColor: '#000000',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    render: {
        antialias: true,
        antialiasGL: true,
        pixelArt: false,
        roundPixels: false,
        powerPreference: 'high-performance',
    },
    fps: {
        target: 60,
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 2800 },
            debug: false,
        },
    },
    prefix: 'runner',
    soundMaxVolume: 1,
    musicMaxVolume: 0.5,
    responsive: true,
    lockOrientation: 'portrait',
    scene: [
        Preloader,
        MainMenu
    ]
};

export default new Phaser.Game(config);
