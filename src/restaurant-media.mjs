// Optional user-made assets for VIETNAM LIFE 3D.
// Requires the Three.js import map in index.html; preserves procedural seats when GLB is absent.
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export const GREETING_TEXT = 'Dạ, em chào anh chị ạ. Nhà mình đi mấy người để em sắp xếp bàn? Anh chị muốn ngồi trong nhà hay ngoài trời ạ?';
const STOOL_URL = './assets/models/ghe-nhua.glb';
const AUDIO_URL = './assets/audio/npc-greeting-vien.mp3';

export async function installUserStools({scene, THREE, tables, fallbackStools, notify = () => {}}) {
  let sceneModel;
  try {
    const gltf = await new GLTFLoader().loadAsync(STOOL_URL);
    sceneModel = gltf.scene;
    const bbox = new THREE.Box3().setFromObject(sceneModel);
    if (bbox.isEmpty()) throw new Error('Model GLB is empty');
    const size = bbox.getSize(new THREE.Vector3());
    if (!Number.isFinite(size.y) || size.y <= 0.01) throw new Error('Invalid stool height');
    // Current procedural restaurant uses stylized sizes; rescale Blender model to .72 world units.
    const factor = 0.72 / size.y;
    const seatBottom = bbox.min.y;
    const assetGroup = new THREE.Group();
    assetGroup.name = 'BlenderUserStools';
    for (const [x,z] of tables) {
      for (const offsetX of [-2,2]) {
        const seat = sceneModel.clone(true);
        seat.scale.setScalar(factor);
        seat.position.set(x+offsetX, 0.03-seatBottom*factor, z);
        assetGroup.add(seat);
      }
    }
    scene.add(assetGroup);
    for (const oldSeat of fallbackStools) oldSeat.visible = false;
    notify('Đã dùng ghế nhựa Blender trong quán');
    return true;
  } catch (err) {
    console.info('Stool GLB unavailable; keep procedural chairs:', err?.message);
    return false;
  }
}

export function installNpcGreeting({button, notify = () => {}}) {
  if (!button) return;
  const audio = new Audio(AUDIO_URL);
  audio.preload = 'none';
  audio.volume = 0.75;
  button.addEventListener('click', async () => {
    try {
      audio.currentTime = 0;
      await audio.play(); // Explicit user gesture: no automatic voice playback.
    } catch (error) {
      console.info('Optional MP3 unavailable, use browser voice:', error?.message);
      if ('speechSynthesis' in window && 'SpeechSynthesisUtterance' in window) {
        speechSynthesis.cancel();
        const msg = new SpeechSynthesisUtterance(GREETING_TEXT);
        msg.lang = 'vi-VN';
        msg.rate = 0.96;
        speechSynthesis.speak(msg);
      } else notify('Chưa có âm thanh. Chép MP3 vào assets/audio/npc-greeting-vien.mp3');
    }
  });
}
