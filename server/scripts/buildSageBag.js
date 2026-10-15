/**
 * Adaçayı yeşili, yuvarlak tabanlı, çift bambu halkalı örgü çanta (.glb).
 * Çalıştır: node scripts/buildSageBag.js
 */
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
require('dotenv').config({ quiet: true });
const mongoose = require('mongoose');
const { putMedia, removeRemote } = require('../utils/mediaStore');

class Mesh {
  constructor() {
    this.positions = [];
    this.normals = [];
    this.indices = [];
  }

  add(x, y, z, nx, ny, nz) {
    const index = this.positions.length / 3;
    this.positions.push(x, y, z);
    this.normals.push(nx, ny, nz);
    return index;
  }
}

const tube = (mesh, centers, radius, sides, closed) => {
  const count = centers.length;
  const frames = centers.map((point, index) => {
    const prev = centers[(index - 1 + count) % count];
    const next = centers[(index + 1) % count];
    let tx = next[0] - prev[0];
    let ty = next[1] - prev[1];
    let tz = next[2] - prev[2];
    if (!closed && index === 0) {
      tx = centers[1][0] - point[0];
      ty = centers[1][1] - point[1];
      tz = centers[1][2] - point[2];
    }
    if (!closed && index === count - 1) {
      tx = point[0] - centers[count - 2][0];
      ty = point[1] - centers[count - 2][1];
      tz = point[2] - centers[count - 2][2];
    }
    const length = Math.hypot(tx, ty, tz) || 1;
    tx /= length;
    ty /= length;
    tz /= length;
    let ux = 0;
    let uy = 1;
    let uz = 0;
    if (Math.abs(ty) > 0.85) ux = 1;
    let sx = ty * uz - tz * uy;
    let sy = tz * ux - tx * uz;
    let sz = tx * uy - ty * ux;
    const side = Math.hypot(sx, sy, sz) || 1;
    sx /= side;
    sy /= side;
    sz /= side;
    ux = sy * tz - sz * ty;
    uy = sz * tx - sx * tz;
    uz = sx * ty - sy * tx;
    return { point, s: [sx, sy, sz], u: [ux, uy, uz] };
  });

  const rings = frames.map((frame) => {
    const ids = [];
    for (let side = 0; side < sides; side += 1) {
      const angle = (side / sides) * Math.PI * 2;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const nx = frame.s[0] * cos + frame.u[0] * sin;
      const ny = frame.s[1] * cos + frame.u[1] * sin;
      const nz = frame.s[2] * cos + frame.u[2] * sin;
      ids.push(mesh.add(
        frame.point[0] + nx * radius,
        frame.point[1] + ny * radius,
        frame.point[2] + nz * radius,
        nx, ny, nz
      ));
    }
    return ids;
  });

  const segments = closed ? count : count - 1;
  for (let index = 0; index < segments; index += 1) {
    const current = rings[index];
    const next = rings[(index + 1) % count];
    for (let side = 0; side < sides; side += 1) {
      const following = (side + 1) % sides;
      mesh.indices.push(current[side], next[side], next[following], current[side], next[following], current[following]);
    }
  }
};

const ellipse = (y, rx, rz, segments) => {
  const points = [];
  for (let index = 0; index < segments; index += 1) {
    const angle = (index / segments) * Math.PI * 2;
    points.push([Math.cos(angle) * rx, y, Math.sin(angle) * rz]);
  }
  return points;
};

const addTorus = (mesh, cx, cy, cz, ringRadius, tubeRadius, major, minor, nodeCount) => {
  const ids = [];
  for (let i = 0; i < major; i += 1) {
    const u = (i / major) * Math.PI * 2;
    const node = 1 + 0.11 * Math.exp(-18 * Math.sin(u * nodeCount) ** 2);
    ids.push([]);
    for (let j = 0; j < minor; j += 1) {
      const v = (j / minor) * Math.PI * 2;
      const radial = ringRadius + tubeRadius * node * Math.cos(v);
      const nx = Math.cos(v) * Math.cos(u);
      const ny = Math.cos(v) * Math.sin(u);
      const nz = Math.sin(v);
      ids[i].push(mesh.add(cx + radial * Math.cos(u), cy + radial * Math.sin(u), cz + tubeRadius * node * Math.sin(v), nx, ny, nz));
    }
  }
  for (let i = 0; i < major; i += 1) {
    const next = (i + 1) % major;
    for (let j = 0; j < minor; j += 1) {
      const following = (j + 1) % minor;
      mesh.indices.push(ids[i][j], ids[next][j], ids[next][following], ids[i][j], ids[next][following], ids[i][following]);
    }
  }
};

const shapeAt = (t) => {
  const y = -0.58 + t * 1.16;
  const side = Math.sin(t * Math.PI);
  const rx = 0.58 + side * 0.16 - (t < 0.18 ? (0.18 - t) * 1.1 : 0);
  const rz = 0.16 + side * 0.05;
  return { y, rx: Math.max(rx, 0.28), rz: Math.max(rz, 0.08) };
};

const build = () => {
  const body = new Mesh();
  const hardware = new Mesh();
  const around = 48;
  const rows = 18;

  for (let row = 0; row < rows; row += 1) {
    const { y, rx, rz } = shapeAt(row / (rows - 1));
    const radius = row < 5 ? 0.022 : 0.014;
    tube(body, ellipse(y, rx, rz, around), radius, 5, true);
  }

  for (let row = 4; row < rows - 1; row += 1) {
    const aShape = shapeAt(row / (rows - 1));
    const bShape = shapeAt((row + 1) / (rows - 1));
    for (let stitch = 0; stitch < 16; stitch += 1) {
      const angle = (stitch / 16) * Math.PI * 2 + (row % 2) * 0.1;
      const a = [Math.cos(angle) * aShape.rx, aShape.y, Math.sin(angle) * aShape.rz];
      const b = [Math.cos(angle) * bShape.rx, bShape.y, Math.sin(angle) * bShape.rz];
      tube(body, [a, b], 0.009, 4, false);
    }
  }

  const top = shapeAt(1);
  addTorus(hardware, 0, top.y + 0.34, 0.03, 0.25, 0.03, 40, 8, 5);
  addTorus(hardware, 0, top.y + 0.37, -0.015, 0.22, 0.027, 40, 8, 5);

  return { body, hardware };
};

const pad = (length) => (4 - (length % 4)) % 4;

const glbFrom = (body, hardware) => {
  const meshes = [body, hardware];
  const chunks = [];
  meshes.forEach((mesh) => {
    chunks.push(Buffer.from(new Float32Array(mesh.positions).buffer));
    chunks.push(Buffer.from(new Float32Array(mesh.normals).buffer));
    chunks.push(Buffer.from(new Uint16Array(mesh.indices).buffer));
  });
  let cursor = 0;
  const placed = chunks.map((chunk) => {
    const byteOffset = cursor;
    cursor += chunk.length + pad(chunk.length);
    return { chunk, byteOffset, byteLength: chunk.length };
  });
  const bin = Buffer.alloc(cursor);
  placed.forEach((item) => item.chunk.copy(bin, item.byteOffset));

  const bounds = (values) => {
    const min = [Infinity, Infinity, Infinity];
    const max = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < values.length; i += 3) {
      for (let axis = 0; axis < 3; axis += 1) {
        min[axis] = Math.min(min[axis], values[i + axis]);
        max[axis] = Math.max(max[axis], values[i + axis]);
      }
    }
    return { min, max };
  };
  const bodyBounds = bounds(body.positions);
  const hardwareBounds = bounds(hardware.positions);
  const sage = [0.27, 0.34, 0.22, 1];
  const bamboo = [0.62, 0.4, 0.16, 1];

  const view = (index, target) => ({
    buffer: 0,
    byteOffset: placed[index].byteOffset,
    byteLength: placed[index].byteLength,
    target
  });

  const json = {
    asset: { version: '2.0', generator: 'nikbag-sage-bag' },
    scene: 0,
    scenes: [{ nodes: [0, 1] }],
    nodes: [{ mesh: 0, name: 'Knit body' }, { mesh: 1, name: 'Bamboo handles' }],
    meshes: [
      { primitives: [{ attributes: { POSITION: 0, NORMAL: 1 }, indices: 2, material: 0 }] },
      { primitives: [{ attributes: { POSITION: 3, NORMAL: 4 }, indices: 5, material: 1 }] }
    ],
    materials: [
      { name: 'Body', doubleSided: true, pbrMetallicRoughness: { baseColorFactor: sage, metallicFactor: 0.02, roughnessFactor: 0.72 } },
      { name: 'Hardware', doubleSided: true, pbrMetallicRoughness: { baseColorFactor: bamboo, metallicFactor: 0.06, roughnessFactor: 0.48 } }
    ],
    accessors: [
      { bufferView: 0, componentType: 5126, count: body.positions.length / 3, type: 'VEC3', min: bodyBounds.min, max: bodyBounds.max },
      { bufferView: 1, componentType: 5126, count: body.normals.length / 3, type: 'VEC3' },
      { bufferView: 2, componentType: 5123, count: body.indices.length, type: 'SCALAR' },
      { bufferView: 3, componentType: 5126, count: hardware.positions.length / 3, type: 'VEC3', min: hardwareBounds.min, max: hardwareBounds.max },
      { bufferView: 4, componentType: 5126, count: hardware.normals.length / 3, type: 'VEC3' },
      { bufferView: 5, componentType: 5123, count: hardware.indices.length, type: 'SCALAR' }
    ],
    bufferViews: [view(0, 34962), view(1, 34962), view(2, 34963), view(3, 34962), view(4, 34962), view(5, 34963)],
    buffers: [{ byteLength: bin.length }]
  };

  const jsonChunk = Buffer.from(JSON.stringify(json));
  const jsonBody = Buffer.concat([jsonChunk, Buffer.alloc(pad(jsonChunk.length), 0x20)]);
  const binBody = Buffer.concat([bin, Buffer.alloc(pad(bin.length))]);
  const total = 12 + 8 + jsonBody.length + 8 + binBody.length;
  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546c67, 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(total, 8);
  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(jsonBody.length, 0);
  jsonHeader.writeUInt32LE(0x4e4f534a, 4);
  const binHeader = Buffer.alloc(8);
  binHeader.writeUInt32LE(binBody.length, 0);
  binHeader.writeUInt32LE(0x004e4942, 4);
  return Buffer.concat([header, jsonHeader, jsonBody, binHeader, binBody]);
};

const run = async () => {
  const { body, hardware } = build();
  if (body.positions.length / 3 > 65535 || hardware.positions.length / 3 > 65535) {
    throw new Error('Model indeks sınırını aşıyor.');
  }
  const buffer = glbFrom(body, hardware);
  await mongoose.connect(process.env.MONGO_URI, { family: 4, serverSelectionTimeoutMS: 20000 });
  const products = mongoose.connection.collection('products');
  const product = await products.findOne(
    { slug: 'adacayi-yesili-bambu-sapli-orgu-canta' },
    { projection: { title: 1, model3dUrl: 1 } }
  );
  if (!product) throw new Error('Ürün bulunamadı.');
  const url = await putMedia({
    buffer,
    mimetype: 'model/gltf-binary',
    originalname: 'adacayi-yesili-bambu-sapli-orgu-canta.glb'
  }, 'models');
  if (product.model3dUrl && product.model3dUrl !== url) await removeRemote(product.model3dUrl);
  await products.updateOne({ _id: product._id }, { $set: { model3dUrl: url } });
  console.log(JSON.stringify({ title: product.title, bytes: buffer.length, model3dUrl: url }));
  await mongoose.disconnect();
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
