// VIETNAM LIFE 3D — V0.3 Blender/Tripo GLB Asset Pipeline & LOD Optimizer.
// Pure ES module compatible with both Node tests and browser Three.js runtime.

export const BLENDER_ASSET_MANIFEST = {
  plastic_stool: {
    id: 'plastic_stool',
    name: 'Ghế nhựa quán nhậu Hà Nội',
    path: './assets/models/ghe-nhua.glb',
    dimensions: { width: 0.34, height: 0.463, depth: 0.34 },
    maxTriangles: 450,
    maxTextureSize: 1024,
    origin: 'bottom-center',
    license: 'CC0 / Original Blender Asset',
  },
  beer_table: {
    id: 'beer_table',
    name: 'Bàn nhậu mặt gỗ khung sắt',
    path: './assets/models/beer_table.glb',
    dimensions: { width: 1.4, height: 0.74, depth: 1.4 },
    maxTriangles: 800,
    maxTextureSize: 1024,
    origin: 'bottom-center',
    license: 'CC0 / Original Blender Asset',
  },
  scooter: {
    id: 'scooter',
    name: 'Xe máy phổ thông Việt Nam',
    path: './assets/models/scooter.glb',
    dimensions: { width: 0.72, height: 1.1, depth: 1.9 },
    maxTriangles: 1800,
    maxTextureSize: 1024,
    origin: 'bottom-center',
    license: 'CC0 / Original Blender Asset',
  },
  waiter_male: {
    id: 'waiter_male',
    name: 'Nhân viên phục vụ nam',
    path: './assets/models/waiter_male.glb',
    dimensions: { width: 0.55, height: 1.72, depth: 0.4 },
    maxTriangles: 2800,
    maxTextureSize: 1024,
    origin: 'bottom-center',
    pose: 'A-pose',
    license: 'CC0 / Original Blender Asset',
  },
  waiter_female: {
    id: 'waiter_female',
    name: 'Nhân viên phục vụ nữ',
    path: './assets/models/waiter_female.glb',
    dimensions: { width: 0.52, height: 1.63, depth: 0.38 },
    maxTriangles: 2800,
    maxTextureSize: 1024,
    origin: 'bottom-center',
    pose: 'A-pose',
    license: 'CC0 / Original Blender Asset',
  },
  chef: {
    id: 'chef',
    name: 'Đầu bếp Nhậu Phố Việt',
    path: './assets/models/chef.glb',
    dimensions: { width: 0.58, height: 1.74, depth: 0.42 },
    maxTriangles: 3000,
    maxTextureSize: 1024,
    origin: 'bottom-center',
    pose: 'A-pose',
    license: 'CC0 / Original Blender Asset',
  },
  hanoi_townhouse: {
    id: 'hanoi_townhouse',
    name: 'Nhà ống mặt phố Hà Nội',
    path: './assets/models/hanoi_townhouse.glb',
    dimensions: { width: 5.0, height: 14.0, depth: 14.0 },
    maxTriangles: 3500,
    maxTextureSize: 1024,
    origin: 'bottom-center',
    license: 'CC0 / Original Blender Asset',
  },
  kitchen_cashier_counter: {
    id: 'kitchen_cashier_counter',
    name: 'Quầy bếp & Quầy thu ngân',
    path: './assets/models/kitchen_cashier_counter.glb',
    dimensions: { width: 3.4, height: 1.15, depth: 0.95 },
    maxTriangles: 1400,
    maxTextureSize: 1024,
    origin: 'bottom-center',
    license: 'CC0 / Original Blender Asset',
  },
};

export function validateAssetSpec(assetId, candidate = {}) {
  const spec = BLENDER_ASSET_MANIFEST[assetId];
  if (!spec) {
    return { valid: false, errors: [`Unknown asset id: ${assetId}`] };
  }
  const errors = [];
  const triangles = Number(candidate.triangles ?? spec.maxTriangles);
  const textureSize = Number(candidate.textureSize ?? spec.maxTextureSize);
  const origin = candidate.origin ?? spec.origin;

  if (!Number.isFinite(triangles) || triangles <= 0 || triangles > spec.maxTriangles) {
    errors.push(`Triangle count ${triangles} exceeds budget ${spec.maxTriangles}`);
  }
  if (!Number.isFinite(textureSize) || textureSize <= 0 || textureSize > spec.maxTextureSize) {
    errors.push(`Texture size ${textureSize} exceeds max ${spec.maxTextureSize}`);
  }
  if (origin !== 'bottom-center') {
    errors.push(`Origin must be 'bottom-center', got '${origin}'`);
  }
  return {
    valid: errors.length === 0,
    spec,
    errors,
  };
}

export function computeNpcLodTier(distanceMeters) {
  const d = Number.isFinite(Number(distanceMeters)) ? Math.max(0, Number(distanceMeters)) : 0;
  if (d <= 45) {
    return { tier: 'near', frameStride: 1, castShadow: true, animateLimbs: true };
  }
  if (d <= 105) {
    return { tier: 'medium', frameStride: 2, castShadow: false, animateLimbs: true };
  }
  return { tier: 'far', frameStride: 4, castShadow: false, animateLimbs: false };
}

export function createAssetRegistry(THREE, options = {}) {
  const materials = new Map();
  const geometries = new Map();
  const templates = new Map();
  const glbCache = new Map();
  const enableGlbProbing = Boolean(options.enableGlbProbing);

  function getMaterial(color, roughness = 0.82, metalness = 0.08) {
    const key = `${color}|${roughness}|${metalness}`;
    if (!materials.has(key)) {
      materials.set(
        key,
        new THREE.MeshStandardMaterial({
          color,
          roughness,
          metalness,
        })
      );
    }
    return materials.get(key);
  }

  function getBoxGeometry(w, h, d) {
    const key = `box|${w}|${h}|${d}`;
    if (!geometries.has(key)) geometries.set(key, new THREE.BoxGeometry(w, h, d));
    return geometries.get(key);
  }

  function getCylinderGeometry(rt, rb, h, seg = 10) {
    const key = `cyl|${rt}|${rb}|${h}|${seg}`;
    if (!geometries.has(key)) geometries.set(key, new THREE.CylinderGeometry(rt, rb, h, seg));
    return geometries.get(key);
  }

  function getSphereGeometry(r, ws = 10, hs = 8) {
    const key = `sph|${r}|${ws}|${hs}`;
    if (!geometries.has(key)) geometries.set(key, new THREE.SphereGeometry(r, ws, hs));
    return geometries.get(key);
  }

  async function tryLoadGlb(assetId, gltfLoader) {
    const spec = BLENDER_ASSET_MANIFEST[assetId];
    if (!spec || !enableGlbProbing || !gltfLoader) return null;
    if (glbCache.has(assetId)) return glbCache.get(assetId).clone(true);

    return new Promise(resolve => {
      gltfLoader.load(
        spec.path,
        gltf => {
          const root = gltf.scene || gltf.scenes?.[0];
          if (root) {
            root.traverse(node => {
              if (node.isMesh) {
                node.castShadow = true;
                node.receiveShadow = true;
              }
            });
            glbCache.set(assetId, root);
            resolve(root.clone(true));
          } else {
            resolve(null);
          }
        },
        undefined,
        () => resolve(null)
      );
    });
  }

  return {
    manifest: BLENDER_ASSET_MANIFEST,
    getMaterial,
    getBoxGeometry,
    getCylinderGeometry,
    getSphereGeometry,
    templates,
    tryLoadGlb,
    stats() {
      return {
        manifestCount: Object.keys(BLENDER_ASSET_MANIFEST).length,
        cachedMaterials: materials.size,
        cachedGeometries: geometries.size,
        cachedGlbModels: glbCache.size,
      };
    },
  };
}
