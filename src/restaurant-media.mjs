// Optional user-made assets & Reception NPC Greeting for VIETNAM LIFE 3D V0.3.
// Uses the Three.js import map in index.html; preserves procedural seats when GLB is absent.

export const GREETING_TEXT =
  'Dạ, em chào anh chị ạ. Nhà mình đi mấy người để em sắp xếp bàn? Anh chị muốn ngồi trong nhà hay ngoài trời ạ?';
export const STOOL_URL = './assets/models/ghe-nhua.glb';
export const AUDIO_URL = './assets/audio/npc-greeting-vien.mp3';
export const GREETING_COOLDOWN_MS = 15000;
export const RECEPTION_GREETING_RADIUS = 5.5;

export function shouldTriggerReceptionGreeting(
  greetingState,
  playerPos,
  receptionPos,
  now = Date.now(),
  cooldownMs = GREETING_COOLDOWN_MS,
  radius = RECEPTION_GREETING_RADIUS
) {
  if (!greetingState || !playerPos || !receptionPos) return false;
  const dx = Number(playerPos.x) - Number(receptionPos.x);
  const dz = Number(playerPos.z) - Number(receptionPos.z);
  const dist = Math.hypot(dx, dz);
  const isInside = dist <= radius;
  const enteredZone = isInside && !greetingState.wasInsideReception;
  greetingState.wasInsideReception = isInside;

  if (!greetingState.enabled) return false;
  if (!isInside) return false;
  if (now - greetingState.lastPlayedAt < cooldownMs) return false;
  if (enteredZone || now - greetingState.lastPlayedAt >= cooldownMs) {
    greetingState.lastPlayedAt = now;
    return true;
  }
  return false;
}

export async function installUserStools({
  scene,
  THREE,
  tables,
  fallbackStools,
  notify = () => {},
  loader = null,
}) {
  let sceneModel;
  try {
    let gltfLoader = loader;
    if (!gltfLoader) {
      const mod = await import('three/addons/loaders/GLTFLoader.js');
      gltfLoader = new mod.GLTFLoader();
    }
    const gltf = await gltfLoader.loadAsync(STOOL_URL);
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

    const spawnStoolsAtTable = (x, z) => {
      for (const offsetX of [-2, 2]) {
        const seat = sceneModel.clone(true);
        seat.scale.setScalar(factor);
        seat.position.set(x + offsetX, 0.03 - seatBottom * factor, z);
        assetGroup.add(seat);
      }
    };

    for (const [x, z] of tables) {
      spawnStoolsAtTable(x, z);
    }
    scene.add(assetGroup);
    if (scene.userData) {
      scene.userData.spawnStoolsAtTable = spawnStoolsAtTable;
    }
    for (const oldSeat of fallbackStools) oldSeat.visible = false;
    notify('Đã dùng ghế nhựa Blender trong quán');
    return true;
  } catch (err) {
    console.info('Stool GLB unavailable; keep procedural chairs:', err?.message);
    return false;
  }
}

export function installNpcGreeting({
  button,
  notify = () => {},
  cooldownMs = GREETING_COOLDOWN_MS,
} = {}) {
  const greetingState = {
    enabled: false,
    lastPlayedAt: -Infinity,
    wasInsideReception: false,
  };

  let audio = null;
  if (typeof Audio !== 'undefined') {
    audio = new Audio(AUDIO_URL);
    audio.preload = 'none';
    audio.volume = 0.75;
  }

  async function playGreetingVoice(sourceLabel = 'Lễ tân') {
    notify(`${sourceLabel}: "${GREETING_TEXT}"`);
    if (audio) {
      try {
        audio.currentTime = 0;
        await audio.play(); // Explicit user gesture or after user enabled sound; never autoplays on load.
        return true;
      } catch (error) {
        console.info('Optional MP3 unavailable, use browser voice:', error?.message);
      }
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window) {
      window.speechSynthesis.cancel();
      const msg = new SpeechSynthesisUtterance(GREETING_TEXT);
      msg.lang = 'vi-VN';
      msg.rate = 0.96;
      window.speechSynthesis.speak(msg);
      return true;
    }
    return false;
  }

  if (button) {
    button.addEventListener('click', async () => {
      greetingState.enabled = true;
      greetingState.lastPlayedAt = Date.now();
      button.textContent = '🔊 Đã bật lời chào lễ tân (Nhấn để nghe lại)';
      await playGreetingVoice('Lễ tân');
    });
  }

  return {
    state: greetingState,
    isEnabled: () => greetingState.enabled,
    setEnabled: val => {
      greetingState.enabled = Boolean(val);
    },
    checkReceptionProximity: (playerPos, receptionPos, now = Date.now()) => {
      const triggered = shouldTriggerReceptionGreeting(
        greetingState,
        playerPos,
        receptionPos,
        now,
        cooldownMs
      );
      if (triggered) {
        playGreetingVoice('Lễ tân đón khách');
      }
      return triggered;
    },
  };
}
