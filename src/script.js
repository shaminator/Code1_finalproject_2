import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js'

import  skyFragmentShader  from './shaders/sky/fragment.glsl'
import  skyVertexShader  from './shaders/sky/vertex.glsl'
import sunFragmentShader from './shaders/sun/fragment.glsl'
import sunVertexShader from './shaders/sun/vertex.glsl'
import grassyHillsFragmentShader from './shaders/grassyHills/fragment.glsl'
import grassyHillsVertexShader from './shaders/grassyHills/vertex.glsl'
import tubeFragmentShader from './shaders/tube/fragment.glsl'
import tubeVertexShader from './shaders/tube/vertex.glsl'

const TWO_PI = Math.PI * 2;
let debugMode = false;
const playerCameraPosition = {
    x: 0,
    y: 1,
    z: 1,
}
let sceneMode = 0;

const clock = new THREE.Clock();

// Shader Uniforms

const customUniforms = {
    uTime: {value : 0.16},
    uWhirlpoolActive: {value: 0},
    uWhirlpoolTime: {value : 0.16},
    uSnowActive: {value: 0},
    uSnowTime: {value: 0.16},
    uAcidActive: {value: 0},
    uAcidTime: {value: 0.16},
}

// Canvas
const canvas = document.querySelector("canvas.webgl");

// Window Dimensions
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();
 
  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// Mouse

const mouse = new THREE.Vector2();

window.addEventListener("mousemove", (event) => {
  mouse.x = (event.clientX / sizes.width) * 2 - 1;
  mouse.y = -((event.clientY / sizes.height) * 2 - 1);
});

// Renderer

const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.antialias = true;



// Scene
const scene = new THREE.Scene();
const world = new THREE.Group();

// Camera
// Base camera
const camera = new THREE.PerspectiveCamera(
  debugMode ? 75 : 45,
  sizes.width / sizes.height,
  0.1,
  200
);
if (debugMode) {
    camera.position.set(2.5, 2.5, 2.5);
} else {
    camera.position.set(0.001, 0.001, 0.001);
}

if (debugMode) {
    const cameraHelper = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, 0.05, 0.05), 
        new THREE.MeshBasicMaterial({ color: "#4287f5"})
    );
    cameraHelper.position.set(
        playerCameraPosition.x,
        playerCameraPosition.y,
        playerCameraPosition.z
    )
    scene.add(cameraHelper);
}

scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
if (!debugMode) {
    controls.enablePan = false;
    controls.enableZoom = false;
    //controls.maxPolarAngle = Math.PI * 0.5 - 0.1;
}


// Loading Manager

const loadingManager = new THREE.LoadingManager(
    // Loaded
    () =>
    {
        console.log('loaded')
        overlayMaterial.opacity = 0.0
    },

    // Progress
    () =>
    {
        console.log('progress')
    }
)







// AUDIO

const audioLoader = new THREE.AudioLoader(loadingManager);
const audioListener = new THREE.AudioListener();

const buttonSound = new THREE.Audio( audioListener );

audioLoader.load('/sounds/effects/switch.mp3',
    (audioBuffer) => {
        buttonSound.setBuffer( audioBuffer);
    }
)

const lightOnSound = new THREE.Audio( audioListener );

audioLoader.load('/sounds/effects/lightOn.mp3',
    (audioBuffer) => {
        lightOnSound.setBuffer( audioBuffer);
        lightOnSound.setVolume(0.2);
    }
)

const waterAmbience = new THREE.Audio( audioListener );
waterAmbience.loop = true;

audioLoader.load('/sounds/ambience/waterAmbience.mp3',
    (audioBuffer) => {
        waterAmbience.setBuffer( audioBuffer);
    }
);

const wind = new THREE.Audio( audioListener );
wind.loop = true;

audioLoader.load('/sounds/ambience/wind.wav',
    (audioBuffer) => {
        wind.setBuffer( audioBuffer);
        wind.setVolume(0.1)
    }
);

const snowing = new THREE.Audio( audioListener );
snowing.loop = true;

audioLoader.load('/sounds/ambience/snowing.wav',
    (audioBuffer) => {
        snowing.setBuffer( audioBuffer);
        snowing.setVolume(0.8)
    }
);

const drone = new THREE.Audio( audioListener );
drone.loop = true;

audioLoader.load('/sounds/ambience/drone.wav',
    (audioBuffer) => {
        drone.setBuffer( audioBuffer);
        drone.setVolume(0.6)
    }
);

const whirlpool = new THREE.Audio( audioListener );
whirlpool.loop = true;

audioLoader.load('/sounds/effects/whirlpool.mp3',
    (audioBuffer) => {
        whirlpool.setBuffer( audioBuffer);
        whirlpool.playbackRate = 0.8;
        whirlpool.setLoopStart(1)
        whirlpool.setLoopEnd(11)
    }
);

const lightHum = new THREE.PositionalAudio( audioListener );
audioLoader.load('/sounds/ambience/light_hum.wav',
    (audioBuffer) => {
        lightHum.setBuffer( audioBuffer );
        lightHum.setRefDistance(0.5);
        lightHum.setVolume(0.2);
        lightHum.loop = true;
        lightHum.play();
    }
)

// Textures
const textureLoader = new THREE.TextureLoader(loadingManager);

const setWrapping = (texture, xwrap, ywrap) => {
    texture.repeat.set(xwrap, ywrap);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
}

// Loading

const loadingTexture = textureLoader.load("/textures/loading.jpg", (texture) => {
    setWrapping(texture, 20, 20)
})

const overlayGeometry = new THREE.SphereGeometry(0.5, 0.5, 1, 1)
const overlayMaterial = new THREE.MeshBasicMaterial({ 
   side: THREE.BackSide,
   transparent: true,
   opacity: 1.0, 
   map: loadingTexture
})
const overlay = new THREE.Mesh(overlayGeometry, overlayMaterial)

scene.add(overlay)





const floorTexture = {
    color: textureLoader.load("/textures/Wood_Floor_009/Wood_Floor_009_basecolor.jpg", (texture) => {
        setWrapping(texture, 3, 2);
    }),
    ambientOcclusion: textureLoader.load("/textures/Wood_Floor_009/Wood_Floor_009_ambientOcclusion.jpg", (texture) => {
        setWrapping(texture, 3, 2);
    }),
    normal: textureLoader.load("/textures/Wood_Floor_009/Wood_Floor_009_normal.jpg", (texture) => {
        setWrapping(texture, 3, 2);
    }),
    roughness: textureLoader.load("/textures/Wood_Floor_009/Wood_Floor_009_roughness.jpg", (texture) => {
        setWrapping(texture, 3, 2);
    }),
};

// const floorTexture = {
//     color: textureLoader.load("/textures/WoodFlooringNatural007/WoodFlooringNatural007_COL_2K.jpg", (texture) => {
//         setWrapping(texture, 3, 2);
//     }),
//     ambientOcclusion: textureLoader.load("/textures/WoodFlooringNatural007/WoodFlooringNatural007_AO_2K.jpg", (texture) => {
//         setWrapping(texture, 3, 2);
//     }),
//     normal: textureLoader.load("/textures/WoodFlooringNatural007/WoodFlooringNatural007_NRM_2K.jpg", (texture) => {
//         setWrapping(texture, 3, 2);
//     }),
//     roughness: textureLoader.load("/textures/WoodFlooringNatural007/WoodFlooringNatural007_REFL_2K.jpg", (texture) => {
//         setWrapping(texture, 3, 2);
//     }),
//     metalness: textureLoader.load("/textures/WoodFlooringNatural007/WoodFlooringNatural007_GLOSS_2K.jpg", (texture) => {
//         setWrapping(texture, 3, 2);
//     }),
// };

// const floorTexture = {
//     color: textureLoader.load("/textures/WoodFlooringNatural007/WoodFlooringNatural007_COL_2K.jpg", (texture) => {
//         setWrapping(texture, 3, 2);
//     }),
//     ambientOcclusion: textureLoader.load("/textures/WoodFlooringNatural007/WoodFlooringNatural007_AO_2K.jpg", (texture) => {
//         setWrapping(texture, 3, 2);
//     }),
//     normal: textureLoader.load("/textures/WoodFlooringNatural007/WoodFlooringNatural007_NRM_2K.jpg", (texture) => {
//         setWrapping(texture, 3, 2);
//     }),
//     roughness: textureLoader.load("/textures/WoodFlooringNatural007/WoodFlooringNatural007_REFL_2K.jpg", (texture) => {
//         setWrapping(texture, 3, 2);
//     }),
//     metalness: textureLoader.load("/textures/WoodFlooringNatural007/WoodFlooringNatural007_GLOSS_2K.jpg", (texture) => {
//         setWrapping(texture, 3, 2);
//     }),
// };

const woodTexture = {
    color: textureLoader.load("/textures/Wood_011/Wood_011_Base_color.jpg", (texture) => {
        texture.rotation = Math.PI * 0.5;
        setWrapping(texture, 1, 1);
    }),
    ambientOcclusion: textureLoader.load("/textures/Wood_011/Wood_011_ambientOcclusion.jpg", (texture) => {
        texture.rotation = Math.PI * 0.5;
        setWrapping(texture, 1, 1);
    }),
    height: textureLoader.load("/textures/Wood_011/Wood_011_Height.png", (texture) => {
        texture.rotation = Math.PI * 0.5;
        setWrapping(texture, 1, 1);
    }),
    normal: textureLoader.load("/textures/Wood_011/Wood_011_Normal.jpg", (texture) => {
        texture.rotation = Math.PI * 0.5;
        setWrapping(texture, 1, 1);
    }),
    roughness: textureLoader.load("/textures/Wood_011/Wood_011_Roughness.jpg", (texture) => {
        texture.rotation = Math.PI * 0.5;
        setWrapping(texture, 1, 1);
    }),
}

const scratchedMetalTexure = {
    color: textureLoader.load("/textures/Metal_scratched_008/Metal_scratched_008_basecolor.jpg"),
    ambientOcclusion: textureLoader.load(
    "/textures/Metal_scratched_008/Metal_scratched_008_ambientOcclusion.jpg"
    ),
    height: textureLoader.load("/textures/Metal_scratched_008/Metal_scratched_008_height.png"),
    normal: textureLoader.load("/textures/Metal_scratched_008/Metal_scratched_008_normal.jpg"),
    roughness: textureLoader.load("/textures/Metal_scratched_008/Metal_scratched_008_roughness.jpg"),
    metallic: textureLoader.load("/textures/Metal_scratched_008/Metal_scratched_008_metallic.jpg"),
}

const rustedMetalTexture = {
    color: textureLoader.load("/textures/MetalAluminumRusted001/MetalAluminumRusted001_COL_4K_METALNESS.jpg", (texture) => {

        setWrapping(texture, 2, 2);
    }),
    metalness: textureLoader.load("/textures/MetalAluminumRusted001/MetalAluminumRusted001_METALNESS_4K_METALNESS.jpg", (texture) => {

        setWrapping(texture, 2, 2);
    }),
    normal: textureLoader.load("/textures/MetalAluminumRusted001/MetalAluminumRusted001_NRM_4K_METALNESS.jpg", (texture) => {
     
        setWrapping(texture, 2, 2);
    }),
    roughness: textureLoader.load("/textures/MetalAluminumRusted001/MetalAluminumRusted001_ROUGHNESS_4K_METALNESS.jpg", (texture) => {
       
        setWrapping(texture, 2, 2);
    }),
}

const darkRockTexture = {
    color: textureLoader.load("/textures/RockDark003/RockDark003_COL_6K.jpg", (texture) => {

        setWrapping(texture, 1, 1);
    }),
    metalness: textureLoader.load("/textures/RockDark003/RockDark003_REFL_6K.jpg", (texture) => {

        setWrapping(texture, 1, 1);
    }),
    normal: textureLoader.load("/textures/RockDark003/RockDark003_NRM_6K.jpg", (texture) => {
     
        setWrapping(texture, 1, 1);
    }),
    displacement: textureLoader.load("/textures/RockDark003/RockDark003_DISP_6K.jpg", (texture) => {
       
        setWrapping(texture, 1, 1);
    }),
}


const wetGroundTexture = {
    color: textureLoader.load("/textures/Ground_wet_003/Ground_wet_003_basecolor.jpg", (texture) => {
        setWrapping(texture, 5, 5);
    }),
    ambientOcclusion: textureLoader.load("/textures/Ground_wet_003/Ground_wet_003_ambientOcclusion.jpg", (texture) => {
        setWrapping(texture, 5, 5);
    }),
    height: textureLoader.load("/textures/Ground_wet_003/Ground_wet_003_height.png", (texture) => {
        setWrapping(texture, 5, 5);
    }),
    normal: textureLoader.load("/textures/Ground_wet_003/Ground_wet_003_normal.jpg", (texture) => {
        setWrapping(texture, 5, 5);
    }),
    roughness: textureLoader.load("/textures/Ground_wet_003/Ground_wet_003_roughness.jpg", (texture) => {
        setWrapping(texture, 5, 5);
    }),
}

const wallTexture = {
color: textureLoader.load("/textures/Wall_Interior_001/Wall_Interior_001_basecolor.jpg"),
ambientOcclusion: textureLoader.load(
    "/textures/Wall_Interior_001/Wall_Interior_001_ambientOcclusion.jpg"
),
height: textureLoader.load("/textures/Wall_Interior_001/Wall_Interior_001_height.png"),
normal: textureLoader.load("/textures/Wall_Interior_001/Wall_Interior_001_normal.jpg"),
roughness: textureLoader.load("/textures/Wall_Interior_001/Wall_Interior_001_roughness.jpg"),
};

wallTexture.color.repeat.x = 3;
wallTexture.color.repeat.y = 2;
wallTexture.color.wrapS = THREE.RepeatWrapping;
wallTexture.ambientOcclusion.repeat.x = 3;
wallTexture.ambientOcclusion.repeat.y = 2;
wallTexture.ambientOcclusion.wrapS = THREE.RepeatWrapping;
wallTexture.height.repeat.x = 3;
wallTexture.height.repeat.y = 2;
wallTexture.height.wrapS = THREE.RepeatWrapping;
wallTexture.normal.repeat.x = 3;
wallTexture.normal.repeat.y = 2;
wallTexture.normal.wrapS = THREE.RepeatWrapping;
wallTexture.roughness.repeat.x = 3;
wallTexture.roughness.repeat.y = 2;
wallTexture.roughness.wrapS = THREE.RepeatWrapping;

const clearSkyHDRI = textureLoader.load('/textures/HDRIs/HdrOutdoorFieldAfternoonClear001_JPG_4K.jpg')

const groundGrassTexture = {
    color: textureLoader.load("/textures/GroundGrassGreen001/GroundGrassGreen001_COL_2K.jpg", (texture) => {
        setWrapping(texture, 5, 5);
    }), 
}

const groundSnowTexture = {
    color: textureLoader.load("/textures/Snow_001/Snow_001_COLOR.jpg", (texture) => {
        setWrapping(texture, 5, 5);
    }), 
}

const steelTexture = {
    color: textureLoader.load("/textures/MetalStainlessSteelHeatTreated001/MetalStainlessSteelHeatTreated001_COL_4K_METALNESS.jpg", (texture) => {

        setWrapping(texture, 1, 1);
    }),
    metalness: textureLoader.load("/textures/MetalStainlessSteelHeatTreated001/MetalStainlessSteelHeatTreated001_METALNESS_4K_METALNESS.jpg", (texture) => {

        setWrapping(texture, 1, 1);
    }),
    normal: textureLoader.load("/textures/MetalStainlessSteelHeatTreated001/MetalStainlessSteelHeatTreated001_NRM_4K_METALNESS.jpg", (texture) => {
     
        setWrapping(texture, 1, 1);
    }),
    roughness: textureLoader.load("/textures/MetalStainlessSteelHeatTreated001/MetalStainlessSteelHeatTreated001_ROUGHNESS_4K_METALNESS.jpg", (texture) => {
       
        setWrapping(texture, 1, 1);
    })
}

const bricksTexture = {
    color: textureLoader.load("/textures/Bricks05/Bricks05_COL_VAR1_6K.jpg", (texture) => {

        setWrapping(texture, 2, 2);
    }),
    height: textureLoader.load("/textures/Bricks05/Bricks05_DISP_6K.jpg", (texture) => {

        setWrapping(texture, 2, 2);
    }),
    normal: textureLoader.load("/textures/Bricks05/Bricks05_NRM_6K.jpg", (texture) => {
     
        setWrapping(texture, 2, 2);
    }),
    roughness: textureLoader.load("/textures/Bricks05/Bricks05_REFL_6K.jpg", (texture) => {
       
        setWrapping(texture, 2, 2);
    })
}

const snowFlake = textureLoader.load("/textures/snowAlpha.png")


const tilesTexture = {
    color: textureLoader.load("/textures/TilesRectangularWhite001/TilesRectangularWhite001_COL_4K.jpg", (texture) => {

        setWrapping(texture, 1, 1);
    }),
    height: textureLoader.load("/textures/TilesRectangularWhite001/TilesRectangularWhite001_DISP_4K.jpg", (texture) => {

        setWrapping(texture, 1, 1);
    }),
    normal: textureLoader.load("/textures/TilesRectangularWhite001/TilesRectangularWhite001_NRM_4K.jpg", (texture) => {
     
        setWrapping(texture, 1, 1);
    }),
    roughness: textureLoader.load("/textures/TilesRectangularWhite001/TilesRectangularWhite001_REFL_4K.jpg", (texture) => {
       
        setWrapping(texture, 1, 1);
    })
}

const plasterTexture = {
    color: textureLoader.load("/textures/Plaster35/Plaster35_COL_VAR1_3K.jpg", (texture) => {

        setWrapping(texture, 1, 1);
    }),
    normal: textureLoader.load("/textures/Plaster35/Plaster35_NRM_3K.jpg", (texture) => {
     
        setWrapping(texture, 1, 1);
    }),
    roughness: textureLoader.load("/textures/Plaster35/Plaster35_REFL_3K.jpg", (texture) => {
       
        setWrapping(texture, 1, 1);
    })
}

// TEXTURES END




// Fog

// const fog = new THREE.Fog('rbga(0,0,0,0)', 20, 100)
// scene.fog = fog




// Room

const room = new THREE.Group();

//FLOOR



const floorMaterial = new THREE.MeshStandardMaterial({ 
    map: floorTexture.color,
    aoMap: floorTexture.ambientOcclusion,
    roughnessMap: floorTexture.roughness,
    // metalnessMap: woodTexture.metalness,
    normalMap: floorTexture.normal,
});

const roomFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(5, 5),
    floorMaterial
);

roomFloor.rotation.x = -Math.PI * 0.5;
room.add(roomFloor);

// FLOOR END

// SWINGING LIGHT

const roomLight = new THREE.Group();

const lightShade = new THREE.Mesh(
  new THREE.CylinderGeometry(0.01, 0.1, 0.2, 10, 3, true),
  new THREE.MeshBasicMaterial({ color: "black", side: THREE.DoubleSide })
);
lightShade.openEnded = true;
lightShade.position.y = -1.5;
roomLight.add(lightShade);

const lightConnection = new THREE.Mesh(
  new THREE.SphereGeometry(0.02, 5, 5),
  new THREE.MeshBasicMaterial({ color: "black" })
);
lightConnection.position.y = -1.4;
roomLight.add(lightConnection);

const lightWire = new THREE.Mesh(
  new THREE.CylinderGeometry(0.01, 0.01, 1.5, 3),
  new THREE.MeshBasicMaterial({ color: "black" })
);
lightWire.position.y = -0.75;
roomLight.add(lightWire);

const lightBulb = new THREE.Mesh(
  new THREE.SphereGeometry(0.04, 10, 10),
  new THREE.MeshStandardMaterial({ emissive: "white" })
);
lightBulb.position.y = -1.57;
lightBulb.add(lightHum);
roomLight.add(lightBulb);

const lightSource = new THREE.SpotLight("#dcf1f5", 1);
//lightSource.position.y = -1.57
lightSource.angle = 0.2;
lightSource.decay = 1;
lightSource.penumbra = 0.8;
lightSource.distance = 50;

const lightSourceTarget = new THREE.Object3D();
lightSourceTarget.position.y = -2;

lightSource.target = lightSourceTarget;

// const targetHelper = new THREE.Mesh(
//     new THREE.BoxGeometry(0.01, 0.01, 0.01),
//     new THREE.MeshStandardMaterial({})
// )
// targetHelper.position.y = lightSourceTarget.position.y
// roomLight.add(targetHelper)
roomLight.add(lightSourceTarget);
roomLight.add(lightSource);

// const helper = new THREE.CameraHelper( lightSource.shadow.camera );
// roomLight.add( helper );

roomLight.position.y = 2.6;
room.add(roomLight);





// TABLE

const table = new THREE.Group();

const tableTop = new THREE.Mesh(
    new THREE.BoxGeometry(1.4, 0.03, 0.5, 50, 1, 50), 
    new THREE.MeshStandardMaterial({
        map: woodTexture.color,
        aoMap: woodTexture.ambientOcclusion,
        roughnessMap: woodTexture.roughness,
        
        // displacementMap: woodTexture.height,
        // displacementScale: 0.05,
        normalMap: woodTexture.normal,
        wireframe: false
    }));
tableTop.position.set(0, 0.5, 0);
table.add(tableTop);

const legGeometry = new THREE.CylinderGeometry(0.02, 0.01, 0.5, 10, 4);
// const legMaterial = new THREE.MeshBasicMaterial({color: "#242424"});
const legMaterial = new THREE.MeshStandardMaterial({
    map: scratchedMetalTexure.color,
  aoMap: scratchedMetalTexure.ambientOcclusion,
  roughnessMap: scratchedMetalTexure.roughness,
  normalMap: scratchedMetalTexure.normal,
  metalnessMap: scratchedMetalTexure.metallic,
});
const legs = [
    new THREE.Mesh(legGeometry, legMaterial),
    new THREE.Mesh(legGeometry, legMaterial),
    new THREE.Mesh(legGeometry, legMaterial),
    new THREE.Mesh(legGeometry, legMaterial)
]
legs[0].position.set(-0.65, 0.25, -0.2);
legs[1].position.set(0.65, 0.25, -0.2);
legs[2].position.set(-0.65, 0.25, 0.2);
legs[3].position.set(0.65, 0.25, 0.2);

table.add(legs[0],legs[1],legs[2],legs[3]);

const swampOceanButton = new THREE.Group();

const swampOceanButtonBase = new THREE.Mesh(
    new THREE.TorusGeometry(0.07, 0.04, 50, 50),
    new THREE.MeshStandardMaterial({
        map: rustedMetalTexture.color,
        normalMap: rustedMetalTexture.normal,
        roughnessMap: rustedMetalTexture.roughness,
        metalnessMap: rustedMetalTexture.metalness
    })
);
swampOceanButtonBase.rotation.x = Math.PI * 0.5;

const swampOceanButtonPad = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.07, 0.07, 20),
    new THREE.MeshStandardMaterial({
        color: "#6eff7c",
        metalness: 0.1,
        roughness: 0.4,
        emissive: "green",
        emissiveIntensity: 0.0,
        map: scratchedMetalTexure.color,
        roughnessMap: scratchedMetalTexure.roughness,
        normalMap: scratchedMetalTexure.normal,
        metalnessMap: scratchedMetalTexure.metallic
    })
)
swampOceanButtonPad.position.y = 0.03
swampOceanButtonPad.name = "swampOceanButtonPad";

const swampOceanButtonLight = new THREE.PointLight("green", 3, 0.8);
swampOceanButtonLight.position.y = 0.3
// const sphereSize = 0.2;
// const pointLightHelper = new THREE.PointLightHelper( swampOceanButtonLight, sphereSize );
// scene.add( pointLightHelper );

swampOceanButton.add(swampOceanButtonBase, swampOceanButtonPad, swampOceanButtonLight);


swampOceanButton.position.set(-0.4, 0.52, 0.0)

table.add(swampOceanButton)


const grassMountainsButton = new THREE.Group();

const grassMountainsButtonBase = new THREE.Mesh(
    new THREE.TorusGeometry(0.07, 0.04, 50, 50),
    new THREE.MeshStandardMaterial({
        map: steelTexture.color,
        normalMap: steelTexture.normal,
        roughnessMap: steelTexture.roughness,
        metalnessMap: steelTexture.metalness
    })
);
grassMountainsButtonBase.rotation.x = Math.PI * 0.5;

const grassMountainsButtonPad = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.07, 0.07, 20),
    new THREE.MeshStandardMaterial({
        color: "blue",
        metalness: 0.1,
        roughness: 0.4,
        emissive: "blue",
        emissiveIntensity: 0.0,
        map: steelTexture.color,
        roughnessMap: steelTexture.roughness,
        normalMap: steelTexture.normal,
        metalnessMap: steelTexture.metalness
    })
)
grassMountainsButtonPad.position.y = 0.03
grassMountainsButtonPad.name = "grassMountainsButtonPad";

const grassMountainsButtonLight = new THREE.PointLight("blue", 3, 0.8);
grassMountainsButtonLight.position.y = 0.3
// const sphereSize = 0.2;
// const pointLightHelper = new THREE.PointLightHelper( grassMountainsButtonLight, sphereSize );
// scene.add( pointLightHelper );

grassMountainsButton.add(grassMountainsButtonBase, grassMountainsButtonPad, grassMountainsButtonLight);


grassMountainsButton.position.set(0.0, 0.52, 0.0)

table.add(grassMountainsButton)


const acidButton = new THREE.Group();

const acidButtonBase = new THREE.Mesh(
    new THREE.TorusGeometry(0.07, 0.04, 50, 50),
    new THREE.MeshStandardMaterial({
        normalMap: plasterTexture.normal,
        map: plasterTexture.color,
        roughnessMap: plasterTexture.roughness,

    })
);
acidButtonBase.rotation.x = Math.PI * 0.5;

const acidButtonPad = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.07, 0.07, 20),
    new THREE.MeshStandardMaterial({
        color: "red",
        metalness: 0.1,
        roughness: 0.4,
        emissive: "red",
        emissiveIntensity: 0.0,
        
    })
)
acidButtonPad.position.y = 0.03
acidButtonPad.name = "acidButtonPad";

const acidButtonLight = new THREE.PointLight("red", 3, 0.8);
acidButtonLight.position.y = 0.3
// const sphereSize = 0.2;
// const pointLightHelper = new THREE.PointLightHelper( acidButtonLight, sphereSize );
// scene.add( pointLightHelper );

acidButton.add(acidButtonBase, acidButtonPad, acidButtonLight);


acidButton.position.set(0.4, 0.52, 0.0)

table.add(acidButton)





// TABLE END

room.add(table);





// ROOM END

world.add(room);


// OUTSIDE

const outside1 = new THREE.Group();

// SkyBox

const sky = new THREE.Mesh(
    new THREE.SphereGeometry(99, 99, 99),
    new THREE.ShaderMaterial({ 
        uniforms: {
            uTime: customUniforms.uTime
        },
        vertexShader: skyVertexShader,
        fragmentShader: skyFragmentShader,
        side: THREE.BackSide,
    })
)
sky.rotation.x = Math.PI * 0.5;
sky.rotation.z = Math.PI * 0.5;
sky.position.y = -20;
outside1.add(sky);


// SUN
const sunLight = new THREE.DirectionalLight("#b5ebf5", 0.6);
sunLight.position.set(0, 3, 0);
sunLight.position.normalize();
outside1.add(sunLight);

const sun = new THREE.Mesh(
    new THREE.CircleGeometry(15, 20),
    new THREE.ShaderMaterial({ 
        uniforms: {
            uTime: customUniforms.uTime
        },
        vertexShader: sunVertexShader,
        fragmentShader: sunFragmentShader,
        transparent: true,
        side: THREE.DoubleSide
    })
)

sun.position.y = 20;
outside1.add(sun);

// GROUND

const groundMaterial = new THREE.MeshStandardMaterial({
    map: wetGroundTexture.color,
    aoMap: wetGroundTexture.ambientOcclusion,
    roughnessMap: wetGroundTexture.roughness,
    displacementMap: wetGroundTexture.height,
    displacementScale: 1,
    normalMap: wetGroundTexture.normal,
    transparent: true,
    wireframe: false
})

groundMaterial.onBeforeCompile = (shader) =>
{
    shader.uniforms.uTime = customUniforms.uTime
    shader.uniforms.uWhirlpoolActive = customUniforms.uWhirlpoolActive
    shader.uniforms.uWhirlpoolTime = customUniforms.uWhirlpoolTime
    shader.vertexShader = shader.vertexShader.replace(
        '#include <common>',
        `
        uniform float uTime;    
        uniform float uWhirlpoolActive; 
        uniform float uWhirlpoolTime;    
        
        #include <common>

            mat2 get2dRotateMatrix(float _angle)
            {
                return mat2(cos(_angle), - sin(_angle), sin(_angle), cos(_angle));
            }

            //
            // GLSL textureless classic 3D noise "cnoise",
            // with an RSL-style periodic variant "pnoise".
            // Author:  Stefan Gustavson (stefan.gustavson@liu.se)
            // Version: 2011-10-11
            //
            // Many thanks to Ian McEwan of Ashima Arts for the
            // ideas for permutation and gradient selection.
            //
            // Copyright (c) 2011 Stefan Gustavson. All rights reserved.
            // Distributed under the MIT license. See LICENSE file.
            // https://github.com/stegu/webgl-noise
            //

            vec3 mod289(vec3 x)
            {
            return x - floor(x * (1.0 / 289.0)) * 289.0;
            }

            vec4 mod289(vec4 x)
            {
            return x - floor(x * (1.0 / 289.0)) * 289.0;
            }

            vec4 permute(vec4 x)
            {
            return mod289(((x*34.0)+10.0)*x);
            }

            vec4 taylorInvSqrt(vec4 r)
            {
            return 1.79284291400159 - 0.85373472095314 * r;
            }

            vec3 fade(vec3 t) {
            return t*t*t*(t*(t*6.0-15.0)+10.0);
            }

            // Classic Perlin noise
            float cnoise(vec3 P)
            {
            vec3 Pi0 = floor(P); // Integer part for indexing
            vec3 Pi1 = Pi0 + vec3(1.0); // Integer part + 1
            Pi0 = mod289(Pi0);
            Pi1 = mod289(Pi1);
            vec3 Pf0 = fract(P); // Fractional part for interpolation
            vec3 Pf1 = Pf0 - vec3(1.0); // Fractional part - 1.0
            vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
            vec4 iy = vec4(Pi0.yy, Pi1.yy);
            vec4 iz0 = Pi0.zzzz;
            vec4 iz1 = Pi1.zzzz;

            vec4 ixy = permute(permute(ix) + iy);
            vec4 ixy0 = permute(ixy + iz0);
            vec4 ixy1 = permute(ixy + iz1);

            vec4 gx0 = ixy0 * (1.0 / 7.0);
            vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
            gx0 = fract(gx0);
            vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
            vec4 sz0 = step(gz0, vec4(0.0));
            gx0 -= sz0 * (step(0.0, gx0) - 0.5);
            gy0 -= sz0 * (step(0.0, gy0) - 0.5);

            vec4 gx1 = ixy1 * (1.0 / 7.0);
            vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
            gx1 = fract(gx1);
            vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
            vec4 sz1 = step(gz1, vec4(0.0));
            gx1 -= sz1 * (step(0.0, gx1) - 0.5);
            gy1 -= sz1 * (step(0.0, gy1) - 0.5);

            vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
            vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
            vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
            vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
            vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
            vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
            vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
            vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);

            vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
            g000 *= norm0.x;
            g010 *= norm0.y;
            g100 *= norm0.z;
            g110 *= norm0.w;
            vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
            g001 *= norm1.x;
            g011 *= norm1.y;
            g101 *= norm1.z;
            g111 *= norm1.w;

            float n000 = dot(g000, Pf0);
            float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
            float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
            float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
            float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
            float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
            float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
            float n111 = dot(g111, Pf1);

            vec3 fade_xyz = fade(Pf0);
            vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
            vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
            float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x); 
            return 2.2 * n_xyz;
            }

            // Classic Perlin noise, periodic variant
            float pnoise(vec3 P, vec3 rep)
            {
            vec3 Pi0 = mod(floor(P), rep); // Integer part, modulo period
            vec3 Pi1 = mod(Pi0 + vec3(1.0), rep); // Integer part + 1, mod period
            Pi0 = mod289(Pi0);
            Pi1 = mod289(Pi1);
            vec3 Pf0 = fract(P); // Fractional part for interpolation
            vec3 Pf1 = Pf0 - vec3(1.0); // Fractional part - 1.0
            vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
            vec4 iy = vec4(Pi0.yy, Pi1.yy);
            vec4 iz0 = Pi0.zzzz;
            vec4 iz1 = Pi1.zzzz;

            vec4 ixy = permute(permute(ix) + iy);
            vec4 ixy0 = permute(ixy + iz0);
            vec4 ixy1 = permute(ixy + iz1);

            vec4 gx0 = ixy0 * (1.0 / 7.0);
            vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
            gx0 = fract(gx0);
            vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
            vec4 sz0 = step(gz0, vec4(0.0));
            gx0 -= sz0 * (step(0.0, gx0) - 0.5);
            gy0 -= sz0 * (step(0.0, gy0) - 0.5);

            vec4 gx1 = ixy1 * (1.0 / 7.0);
            vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
            gx1 = fract(gx1);
            vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
            vec4 sz1 = step(gz1, vec4(0.0));
            gx1 -= sz1 * (step(0.0, gx1) - 0.5);
            gy1 -= sz1 * (step(0.0, gy1) - 0.5);

            vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
            vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
            vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
            vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
            vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
            vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
            vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
            vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);

            vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
            g000 *= norm0.x;
            g010 *= norm0.y;
            g100 *= norm0.z;
            g110 *= norm0.w;
            vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
            g001 *= norm1.x;
            g011 *= norm1.y;
            g101 *= norm1.z;
            g111 *= norm1.w;

            float n000 = dot(g000, Pf0);
            float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
            float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
            float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
            float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
            float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
            float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
            float n111 = dot(g111, Pf1);

            vec3 fade_xyz = fade(Pf0);
            vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
            vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
            float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x); 
            return 2.2 * n_xyz;
            }
        `
    )

    shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
            #include <begin_vertex>

            float angle = (position.x + uTime - uWhirlpoolTime) * (uTime - uWhirlpoolTime) * 0.005 * uWhirlpoolActive;
            mat2 rotateMatrix = get2dRotateMatrix(angle);

            transformed.xy = rotateMatrix * transformed.xy;
            transformed.z =  transformed.z + (sin((distance(vec2(0.0), transformed.xy) * 4.0) + uTime) * 0.05);
            transformed.z -= abs(cnoise(vec3(transformed.xy * 100., uTime * 0.5)) * 0.1) ;
        `
    )

    shader.fragmentShader = shader.fragmentShader.replace(
        'uniform float opacity;',
        `
            uniform float opacity;
            uniform float uTime;
        `
    )

    shader.fragmentShader = shader.fragmentShader.replace(
        'vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;',
        `
        vec3 outgoingLight = (totalDiffuse * vec3(1.0, (abs(sin(uTime * 0.01)) + 1.0), 1.0)) + totalSpecular + totalEmissiveRadiance;
        `
    )

    //console.log(shader.fragmentShader);
}

const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(205, 205, 1000, 1000),
    groundMaterial
)
ground.rotation.x = -Math.PI * 0.5;
ground.position.y = -1;
outside1.add(ground);

// LIGHTHOUSE

const lightHouse = new THREE.Group();

const pillar = new THREE.Mesh(
    new THREE.CylinderGeometry(2, 3, 10, 100, 100),
    new THREE.MeshStandardMaterial({
        color: "#849485",
        map: darkRockTexture.color,
        displacementMap: darkRockTexture.displacement,
        displacementScale: 0.3,
        normalMap: darkRockTexture.normal,
        metalnessMap: darkRockTexture.metalness
    })
)

pillar.position.y = 4;

const lightHouseTop = new THREE.Mesh(
    new THREE.OctahedronGeometry(1.8, 1),
    new THREE.MeshBasicMaterial({color: "blue"})
)
lightHouseTop.position.y = 12;
lightHouseTop.name = "lightHouseTop"

const lightHouseTopLight = new THREE.PointLight("blue", 5, 50, 2);
lightHouseTopLight.position.y = 12;
lightHouseTopLight.position.z = 2.5;

lightHouse.add(pillar, lightHouseTop, lightHouseTopLight)

lightHouse.position.z = -50;
outside1.add(lightHouse);
world.add(outside1);
if (sceneMode != 1) {
    world.remove(outside1);
}

// OUTSIDE 1 END

// OUTSIDE 2 

const outside2 = new THREE.Group();

const sky2 = new THREE.Mesh(
    new THREE.SphereGeometry(99, 99, 99),
    new THREE.MeshBasicMaterial({ 
        side: THREE.BackSide,
        map: clearSkyHDRI
    })
)
sky2.position.y = -50;
outside2.add(sky2);


const grassyHillsMaterial = new THREE.ShaderMaterial(
    {
        uniforms: 
        {
            uTime: customUniforms.uTime,
            uTexture: { value: null },
            uSnowTexture: {value : null},
            uRockTexture: {value: null},
            uSnowActive: customUniforms.uSnowActive,
            uSnowTime: customUniforms.uSnowTime

        },
        vertexShader: grassyHillsVertexShader,
        fragmentShader: grassyHillsFragmentShader,
        transparent: true
    }
)
grassyHillsMaterial.uniforms.uTexture.value = groundGrassTexture.color
grassyHillsMaterial.uniforms.uSnowTexture.value = groundSnowTexture.color
grassyHillsMaterial.uniforms.uRockTexture.value = darkRockTexture.color
//console.log(grassyHillsMaterial.uniforms.uTexture.value);

const ground2 = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 200, 1000, 1000),
    grassyHillsMaterial
)

ground2.rotation.x = -Math.PI * 0.5;
ground2.position.y = -1;
outside2.add(ground2);

const sun2 = new THREE.DirectionalLight("#ffffd6", 1.0)
sun2.position.set(3, 1, -2);
outside2.add(sun2);

const lightHouse2 = new THREE.Group();

const pillar2 = new THREE.Mesh(
    new THREE.CylinderGeometry(2, 3, 20, 100, 100),
    new THREE.MeshStandardMaterial({
        color: "#849485",
        map: bricksTexture.color,
        displacementMap: bricksTexture.height,
        displacementScale: 0.3,
        normalMap: bricksTexture.normal,
        roughnessMap: bricksTexture.roughness,
        
    })
)

pillar2.position.y = -1;

const lightHouse2Top = new THREE.Mesh(
    new THREE.OctahedronGeometry(1.8, 1),
    new THREE.MeshBasicMaterial({color: "blue"})
)
lightHouse2Top.position.y = 12;
lightHouse2Top.name = "lightHouse2Top"

const lightHouse2TopLight = new THREE.PointLight("blue", 5, 50, 2);
lightHouse2TopLight.position.y = 12;
lightHouse2TopLight.position.z = 2.5;

lightHouse2.add(pillar2, lightHouse2Top, lightHouse2TopLight)

lightHouse2.position.z = -50;
// lightHouse2.position.y = -5;
outside2.add(lightHouse2);

const snowGeometry = new THREE.BufferGeometry()
const snowCount = 100000

const snowPositions = new Float32Array(snowCount * 3) 

for(let i = 0; i < snowCount * 3; i += 3) 
{
    snowPositions[i] = (Math.random() - 0.5) * 150 
    snowPositions[i + 1] = ((Math.random() - 0.5) * 70) + 20 
    snowPositions[i + 2] = (Math.random() - 0.5) * 150 
}

snowGeometry.setAttribute('position', new THREE.BufferAttribute(snowPositions, 3));

const snowMaterial = new THREE.PointsMaterial({
    alphaMap: snowFlake,
    transparent: true,
    depthWrite: false
});
snowMaterial.size = 0.25
snowMaterial.sizeAttenuation = true

snowMaterial.onBeforeCompile = (shader) =>
{
    shader.uniforms.uTime = customUniforms.uTime;
  //  console.log(shader.vertexShader);

    shader.vertexShader = shader.vertexShader.replace(
        '#include <common>',
        `
        uniform float uTime;    

        //
        // GLSL textureless classic 2D noise "cnoise",
        // with an RSL-style periodic variant "pnoise".
        // Author:  Stefan Gustavson (stefan.gustavson@liu.se)
        // Version: 2011-08-22
        //
        // Many thanks to Ian McEwan of Ashima Arts for the
        // ideas for permutation and gradient selection.
        //
        // Copyright (c) 2011 Stefan Gustavson. All rights reserved.
        // Distributed under the MIT license. See LICENSE file.
        // https://github.com/stegu/webgl-noise
        //

        vec4 mod289(vec4 x)
        {
         return x - floor(x * (1.0 / 289.0)) * 289.0;
        }

        vec4 permute(vec4 x)
        {
            return mod289(((x*34.0)+10.0)*x);
        }

        vec4 taylorInvSqrt(vec4 r)
        {
            return 1.79284291400159 - 0.85373472095314 * r;
        }

        vec2 fade(vec2 t) {
            return t*t*t*(t*(t*6.0-15.0)+10.0);
        }

        // Classic Perlin noise
        float cnoise(vec2 P)
        {
            vec4 Pi = floor(P.xyxy) + vec4(0.0, 0.0, 1.0, 1.0);
            vec4 Pf = fract(P.xyxy) - vec4(0.0, 0.0, 1.0, 1.0);
            Pi = mod289(Pi); // To avoid truncation effects in permutation
            vec4 ix = Pi.xzxz;
            vec4 iy = Pi.yyww;
            vec4 fx = Pf.xzxz;
            vec4 fy = Pf.yyww;

            vec4 i = permute(permute(ix) + iy);

            vec4 gx = fract(i * (1.0 / 41.0)) * 2.0 - 1.0 ;
            vec4 gy = abs(gx) - 0.5 ;
            vec4 tx = floor(gx + 0.5);
            gx = gx - tx;

            vec2 g00 = vec2(gx.x,gy.x);
            vec2 g10 = vec2(gx.y,gy.y);
            vec2 g01 = vec2(gx.z,gy.z);
            vec2 g11 = vec2(gx.w,gy.w);

            vec4 norm = taylorInvSqrt(vec4(dot(g00, g00), dot(g01, g01), dot(g10, g10), dot(g11, g11)));
            g00 *= norm.x;  
            g01 *= norm.y;  
            g10 *= norm.z;  
            g11 *= norm.w;  

            float n00 = dot(g00, vec2(fx.x, fy.x));
            float n10 = dot(g10, vec2(fx.y, fy.y));
            float n01 = dot(g01, vec2(fx.z, fy.z));
            float n11 = dot(g11, vec2(fx.w, fy.w));

            vec2 fade_xy = fade(Pf.xy);
            vec2 n_x = mix(vec2(n00, n01), vec2(n10, n11), fade_xy.x);
            float n_xy = mix(n_x.x, n_x.y, fade_xy.y);
            return 2.3 * n_xy;
        }
         
        #include <common>
        `
    )

    shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
            #include <begin_vertex>

            transformed.y = ((1. - tan((uTime * 0.1) + position.y)) * 5.5) ;
            
            float speed = cnoise(position.xy);
            transformed.x = transformed.x + sin(uTime * speed);
            transformed.z = transformed.z + cos(uTime * speed);
            transformed.z = transformed.z + sin(uTime * speed * 2.);

            transformed.xy = transformed.xy;
            transformed.z =  transformed.z + (sin((distance(vec2(0.0), transformed.xy) * 4.0) + uTime) * 0.05);
        `
    )
}



const snow = new THREE.Points(snowGeometry, snowMaterial)

// outside2.add(snow)

world.add(outside2)

if (sceneMode != 2) {
    world.remove(outside2)
}

// OUTSIDE 2 END

// Walls

const walls = new THREE.Group();

const wallGeometry = new THREE.PlaneGeometry(5, 2.8, 500, 500);
const wallMaterial = new THREE.MeshStandardMaterial({
  map: wallTexture.color,
  aoMap: wallTexture.ambientOcclusion,
  roughnessMap: wallTexture.roughness,
  normalMap: wallTexture.normal,
  displacementMap: wallTexture.height,
  displacementScale: 0.3,
  wireframe: false,
  transparent: true,
});

const wallF = new THREE.Mesh(wallGeometry, wallMaterial);
wallF.position.set(0, 2.8 * 0.5, -2.5);
const wallB = new THREE.Mesh(wallGeometry, wallMaterial);
wallB.position.set(0, 2.8 * 0.5, 2.5);
wallB.rotation.y = Math.PI;
const wallL = new THREE.Mesh(wallGeometry, wallMaterial);
wallL.position.set(2.5, 2.8 * 0.5, 0);
wallL.rotation.y = -Math.PI * 0.5;
const wallR = new THREE.Mesh(wallGeometry, wallMaterial);
wallR.position.set(-2.5, 2.8 * 0.5, 0);
wallR.rotation.y = Math.PI * 0.5;
walls.add(wallF, wallB, wallL, wallR);

world.add(walls);
if (sceneMode != 0) {
    world.remove(walls);
}

// Walls END

// OUTSIDE 3

const outside3 = new THREE.Group();

const tube = new THREE.Mesh(
    new THREE.TorusGeometry(10, 8, 100, 100),
    new THREE.ShaderMaterial({
        uniforms: {
            uTime: customUniforms.uTime,
            uAcidTime: customUniforms.uAcidTime,
            uAcidActive: customUniforms.uAcidActive
        },
        vertexShader: tubeVertexShader,
        fragmentShader: tubeFragmentShader,
        side: THREE.DoubleSide
    })
);

tube.position.y = - 2.5;
tube.rotation.z = - Math.PI * 0.5;
tube.rotation.y = - Math.PI * 0.5;
// tube.scale.y = 6;

outside3.add(tube);

const outside3Light = new THREE.DirectionalLight("white", 0.5);
outside3Light.position.set(1, 5, 2)

outside3.add(outside3Light);


const lightHouse3 = new THREE.Group();

const pillar3 = new THREE.Mesh(
    new THREE.CylinderGeometry(2, 3, 20, 100, 100),
    new THREE.MeshStandardMaterial({
        map: tilesTexture.color,
        displacementMap: tilesTexture.height,
        displacementScale: 0.8,
        normalMap: tilesTexture.normal,
        roughnessMap: tilesTexture.roughness,
        
    })
)

pillar3.position.y = -1;

const lightHouse3Top = new THREE.Mesh(
    new THREE.OctahedronGeometry(1.8, 1),
    new THREE.MeshBasicMaterial({color: "blue"})
)
lightHouse3Top.position.y = 12;
lightHouse3Top.name = "lightHouse3Top"

const lightHouse3TopLight = new THREE.PointLight("blue", 5, 50, 2);
lightHouse3TopLight.position.y = 12;
lightHouse3TopLight.position.z = 6;

lightHouse3.add(pillar3, lightHouse3Top, lightHouse3TopLight)

lightHouse3.position.z = -50;
// lightHouse3.position.y = -5;
outside3.add(lightHouse3);


world.add(outside3)
if (sceneMode != 3) {
    world.remove(outside3);
}

// OUTSIDE 3 END






if (!debugMode) {
    world.position.set(
        - playerCameraPosition.x,
        - playerCameraPosition.y,
        - playerCameraPosition.z,
    )
}
scene.add(world);



//Lights
const ambientLight = new THREE.AmbientLight("#f4f7d5", 0.3);
scene.add(ambientLight);


// Shadows


lightSource.castShadow = true;
lightSource.shadow.mapSize.width = 200;
lightSource.shadow.mapSize.height = 200;
lightSource.shadow.camera.fov = 10;
lightSource.shadow.camera.near = 1;
lightSource.shadow.camera.far = 4;

tableTop.castShadow = true;
roomFloor.receiveShadow = true;











// Raycaster
const rayCaster = new THREE.Raycaster();
let currentIntersect = null;
let intersects;
let active = false;




// Click Event

window.addEventListener("click", () => {
    // console.log(intersects[0]?.object.name);
    if (intersects[0]?.object.name == "lightHouseTop" && sceneMode == 1) {
        customUniforms.uWhirlpoolTime.value = clock.getElapsedTime();
        if (customUniforms.uWhirlpoolActive.value == 0) {
            customUniforms.uWhirlpoolActive.value = 1;
            whirlpool.play();
        } else {
            customUniforms.uWhirlpoolActive.value = 0;  
            whirlpool.stop();    
        }
    } else if (intersects[0]?.object.name == "lightHouse2Top" && sceneMode == 2) {
        customUniforms.uSnowTime.value = clock.getElapsedTime();
        if (customUniforms.uSnowActive.value == 0) {
            customUniforms.uSnowActive.value = 1;
            outside2.add(snow)
            if (!snowing.isPlaying) {
                snowing.play();
            }
        } else {
            customUniforms.uSnowActive.value = 0;    
            outside2.remove(snow)  
            snowing.stop();
        }
    } else if (intersects[0]?.object.name == "lightHouse3Top" && sceneMode == 3) {

        customUniforms.uAcidTime.value = clock.getElapsedTime();
        if (customUniforms.uAcidActive.value == 0) {
            customUniforms.uAcidActive.value = 1;
            drone.play()
       
        } else {
            customUniforms.uAcidActive.value = 0;    
            drone.stop()
        }
    } else if (intersects[0]?.object.name == "swampOceanButtonPad") {
        if (waterAmbience.isPlaying) {
            waterAmbience.stop();
        }
        if (whirlpool.isPlaying) {
            whirlpool.stop();
        }
        if (wind.isPlaying) {
            wind.stop();
        }
        if (snowing.isPlaying) {
            snowing.stop();
        }
        if (drone.isPlaying) {
            drone.stop();
        }
        buttonSound.play();
        buttonAnimations.ocean.playing = true;
        buttonAnimations.ocean.startTime = clock.getElapsedTime();
        if (sceneMode != 1) {
            sceneMode = 1;
            waterAmbience.play();
            world.add(outside1)
            world.remove(walls);
            world.remove(outside2)
            world.remove(outside3);
        } else {
            
            customUniforms.uWhirlpoolActive.value = 0;  
            sceneMode = 0;
            world.remove(outside1)
            world.remove(outside2)
            world.remove(outside3);
            world.add(walls);
        }
        
    } else if (intersects[0]?.object.name == "grassMountainsButtonPad") {
        if (whirlpool.isPlaying) {
            whirlpool.stop();
        }
        if (waterAmbience.isPlaying) {
            waterAmbience.stop();
        }
        if (wind.isPlaying) {
            wind.stop();
        }
        if (snowing.isPlaying) {
            snowing.stop();
        }
        if (drone.isPlaying) {
            drone.stop();
        }
        buttonSound.play();
        buttonAnimations.mountains.playing = true;
        buttonAnimations.mountains.startTime = clock.getElapsedTime();
        if (sceneMode != 2) {
            if (!wind.isPlaying) {
                wind.play();
            }
            sceneMode = 2;
            customUniforms.uSnowActive.value = 0;
            outside2.remove(snow)  
            world.add(outside2)
            world.remove(outside1)
            world.remove(outside3);
            world.remove(walls);
        } else {
            customUniforms.uWhirlpoolActive.value = 0;  
            customUniforms.uSnowActive.value = 0;    
            sceneMode = 0;
            world.remove(outside1)
            world.remove(outside2)
            world.remove(outside3);
            world.add(walls);
        }
        
    } else if (intersects[0]?.object.name == "acidButtonPad") {
        if (waterAmbience.isPlaying) {
            waterAmbience.stop();
        }
        if (whirlpool.isPlaying) {
            whirlpool.stop();
        }
        if (wind.isPlaying) {
            wind.stop();
        }
        if (snowing.isPlaying) {
            snowing.stop();
        }
        if (drone.isPlaying) {
            drone.stop();
        }
        buttonSound.play();
        buttonAnimations.acid.playing = true;
        buttonAnimations.acid.startTime = clock.getElapsedTime();
        if (sceneMode != 3) {
            sceneMode = 3; 
            world.add(outside3)
            world.remove(outside1)
            world.remove(outside2);
            world.remove(walls);
        } else {
            sceneMode = 0;
            world.remove(outside3)
            world.remove(outside2)
            world.remove(outside2);
            world.add(walls);
        }
        
    } 
});

// Postprocessing

const effectComposer = new EffectComposer(renderer)
effectComposer.setSize(sizes.width, sizes.height)
effectComposer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

const smaaPass = new SMAAPass()
effectComposer.addPass(smaaPass)
// const renderPass = new RenderPass(scene, camera)
// effectComposer.addPass(renderPass)

//Animations

let lastTime = 0.0;

const buttonAnimations = {
    ocean: {
        playing: false,
        startTime: 0.0, 
        duration: 0.5, 
        bottomPoint: 0.45,
        goingUp: false
    },
    mountains: {
        playing: false,
        startTime: 0.0, 
        duration: 0.5, 
        bottomPoint: 0.45,
        goingUp: false
    },
    acid: {
        playing: false,
        startTime: 0.0, 
        duration: 0.5, 
        bottomPoint: 0.45,
        goingUp: false
    },
}

const draw = () => {
  const elapsedTime = clock.getElapsedTime();
  const timeChange = elapsedTime - lastTime;
  lastTime = elapsedTime;

  // Update controls
  controls.update();


  rayCaster.setFromCamera(mouse, camera);
  const objectsToTest = [swampOceanButtonPad, swampOceanButtonBase, lightHouseTop, grassMountainsButtonPad, lightHouse2Top, lightHouse3Top, acidButtonPad];
  intersects = rayCaster.intersectObjects(objectsToTest);

  if (intersects[0]?.object.name == "swampOceanButtonPad") {
    // if (!lightOnSound.isPlaying){
    //     lightOnSound.play();
    // }
    swampOceanButtonPad.material.emissiveIntensity = 3
    swampOceanButtonLight.intensity = 3
  } else if (intersects[0]?.object.name == "grassMountainsButtonPad") {
    grassMountainsButtonPad.material.emissiveIntensity = 3
    grassMountainsButtonLight.intensity = 3
  } else if (intersects[0]?.object.name == "acidButtonPad") {
    acidButtonPad.material.emissiveIntensity = 2
    acidButtonLight.intensity = 2
  } else {
    acidButtonPad.material.emissiveIntensity = 0
    acidButtonLight.intensity = 0
    grassMountainsButtonPad.material.emissiveIntensity = 0
    grassMountainsButtonLight.intensity = 0
    swampOceanButtonPad.material.emissiveIntensity = 0
    swampOceanButtonLight.intensity = 0
  }

  
//   console.log(intersects[0]?.object.name); 
  

  roomLight.rotation.x = Math.sin(elapsedTime * 0.3) * 0.3;
  roomLight.rotation.z = Math.cos(elapsedTime * 0.6) * 0.7;


  // Button Animations

  if (buttonAnimations.ocean.playing) {
      if (buttonAnimations.ocean.goingUp) {
        swampOceanButtonPad.position.y += 0.02 * timeChange ;
        if (elapsedTime - buttonAnimations.ocean.startTime >= buttonAnimations.ocean.duration) {
            buttonAnimations.ocean.goingUp = false;
            buttonAnimations.ocean.playing = false;
            swampOceanButtonPad.position.y = 0.03
        }
      } else {
        swampOceanButtonPad.position.y -= 0.02 * timeChange ;  
        if (elapsedTime - buttonAnimations.ocean.startTime >= buttonAnimations.ocean.duration * 0.5) {
            buttonAnimations.ocean.goingUp = true;
        }
      }
  }
  if (buttonAnimations.mountains.playing) {
    if (buttonAnimations.mountains.goingUp) {
      grassMountainsButtonPad.position.y += 0.02 * timeChange ;
      if (elapsedTime - buttonAnimations.mountains.startTime >= buttonAnimations.mountains.duration) {
          buttonAnimations.mountains.goingUp = false;
          buttonAnimations.mountains.playing = false;
          grassMountainsButtonPad.position.y = 0.03
      }
    } else {
      grassMountainsButtonPad.position.y -= 0.02 * timeChange ;  
      if (elapsedTime - buttonAnimations.mountains.startTime >= buttonAnimations.mountains.duration * 0.5) {
          buttonAnimations.mountains.goingUp = true;
      }
    }
    }
    if (buttonAnimations.acid.playing) {
        if (buttonAnimations.acid.goingUp) {
          acidButtonPad.position.y += 0.02 * timeChange ;
          if (elapsedTime - buttonAnimations.acid.startTime >= buttonAnimations.acid.duration) {
              buttonAnimations.acid.goingUp = false;
              buttonAnimations.acid.playing = false;
              acidButtonPad.position.y = 0.03
          }
        } else {
          acidButtonPad.position.y -= 0.02 * timeChange ;  
          if (elapsedTime - buttonAnimations.acid.startTime >= buttonAnimations.acid.duration * 0.5) {
              buttonAnimations.acid.goingUp = true;
          }
        }
    }

  
  
  if (sceneMode == 0) {
    
    
    ambientLight.intensity = 0.1

  } else if (sceneMode == 1) {
    ambientLight.intensity = 0.2

    sunLight.position.set(Math.sin(elapsedTime * 0.1) * 5, 3, Math.cos(elapsedTime * 0.1) * 5);
    sun.position.set(Math.sin(elapsedTime * 0.1) * 40, 20, Math.cos(elapsedTime * 0.1) * 40);
    sun.rotation.y = elapsedTime * 0.1 %  TWO_PI

    if (customUniforms.uWhirlpoolActive.value == 0) {
        lightHouseTop.rotation.y = elapsedTime * 0.2 %  TWO_PI
        lightHouseTop.rotation.x = elapsedTime * 0.7 %  TWO_PI
    } else {
        lightHouseTop.rotation.y = elapsedTime * 12.2 %  TWO_PI
        lightHouseTop.rotation.x = elapsedTime * 0.0 %  TWO_PI
        
        //whirlpool.setPlaybackRate(Math.min((elapsedTime - customUniforms.uWhirlpoolTime) * 0.1, 1 ))
       
    }

    if (intersects[0]?.object.name == "lightHouseTop") {
        lightHouseTop.material.color = new THREE.Color("red")
        lightHouseTopLight.color = new THREE.Color("red")
        lightHouseTopLight.intensity = 10
    } else {
        lightHouseTop.material.color = new THREE.Color("white")
        lightHouseTopLight.color = new THREE.Color("white")
        lightHouseTopLight.intensity = 2
    }
  } else if (sceneMode == 2) {
    ambientLight.intensity = 1.5
    lightHouse2Top.rotation.y = elapsedTime * 0.2 %  TWO_PI
    lightHouse2Top.rotation.x = elapsedTime * 0.7 %  TWO_PI

    if (intersects[0]?.object.name == "lightHouse2Top") {
        lightHouse2Top.material.color = new THREE.Color("red")
        lightHouse2TopLight.color = new THREE.Color("red")
        lightHouse2TopLight.intensity = 10
    } else {
        lightHouse2Top.material.color = new THREE.Color("white")
        lightHouse2TopLight.color = new THREE.Color("white")
        lightHouse2TopLight.intensity = 2
    }
  } else if (sceneMode == 3) {
    ambientLight.intensity = 0.1

    if (intersects[0]?.object.name == "lightHouse3Top") {
        lightHouse3Top.material.color = new THREE.Color("red")
        lightHouse3TopLight.color = new THREE.Color("red")
        lightHouse3TopLight.intensity = 1.5
    } else {
        lightHouse3Top.material.color = new THREE.Color("white")
        lightHouse3TopLight.color = new THREE.Color("white")
        lightHouse3TopLight.intensity = 0
    }
  }

  lightHouseTop.position.y = 12 + (Math.sin(elapsedTime) * 0.4);
  // Update Shader Materials
//   floorMaterial.uniforms.uTime.value = elapsedTime;
  customUniforms.uTime.value = elapsedTime;
  effectComposer.render()
  // Render
  renderer.render(scene, camera);

  // Call draw again on the next frame
  window.requestAnimationFrame(draw);
};

draw();
