import { Vector3 } from "three";

/**
 * Equirectangular TextureMapper
 *
 * Matches:
 *  - Three.js SphereGeometry default UVs (flipY = true)
 *  - Blender UV sphere + the mankind TextureMapper addon script
 *
 * u = (lon + 180) / 360
 * v = (lat + 90) / 180     // north pole at v = 1
 */
export const TextureMapper = {
  lonLatToUV(lon: number, lat: number) {
    return {
      u: (lon + 180) / 360,
      v: (lat + 90) / 180,
    };
  },

  uvToLonLat(u: number, v: number) {
    return {
      lon: u * 360 - 180,
      lat: v * 180 - 90,
    };
  },

  lonLatToVector3(lon: number, lat: number, radius = 1, target = new Vector3()) {
    const phi = ((lon + 180) * Math.PI) / 180;
    const theta = ((90 - lat) * Math.PI) / 180;
    const x = -Math.cos(phi) * Math.sin(theta) * radius;
    const y = Math.cos(theta) * radius;
    const z = Math.sin(phi) * Math.sin(theta) * radius;
    return target.set(x, y, z);
  },

  vector3ToLonLat(v: Vector3) {
    const r = v.length() || 1;
    const lat = (Math.asin(v.y / r) * 180) / Math.PI;
    const lon = (Math.atan2(v.z, -v.x) * 180) / Math.PI - 180;
    const wrapped = lon < -180 ? lon + 360 : lon;
    return { lon: wrapped, lat };
  },

  greatCircle(
    from: [number, number],
    to: [number, number],
    segments = 64,
    peak = 0.16,
    radius = 1,
  ) {
    const a = TextureMapper.lonLatToVector3(from[0], from[1], 1).normalize();
    const b = TextureMapper.lonLatToVector3(to[0], to[1], 1).normalize();
    const points: Vector3[] = [];
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const s = slerp(a, b, t);
      const lift = Math.sin(t * Math.PI) * peak;
      points.push(s.multiplyScalar(radius + lift));
    }
    return points;
  },
};

function slerp(a: Vector3, b: Vector3, t: number) {
  const dot = Math.min(Math.max(a.dot(b), -1), 1);
  const omega = Math.acos(dot);
  if (omega < 1e-5) return a.clone().lerp(b, t).normalize();
  const so = Math.sin(omega);
  return a
    .clone()
    .multiplyScalar(Math.sin((1 - t) * omega) / so)
    .add(b.clone().multiplyScalar(Math.sin(t * omega) / so))
    .normalize();
}

export type LonLat = [number, number];
