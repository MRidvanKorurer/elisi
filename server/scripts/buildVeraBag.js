/**
 * Vera kırmızı strap çanta ve mini cüzdan seti.
 * Çalıştır: node scripts/buildVeraBag.js
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

const frameOf = (centers, index, closed) => {
  const count = centers.length;
  const point = centers[index];
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
  if (Math.abs(ty) > 0.9) { ux = 1; uy = 0; }
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
};

const tube = (mesh, centers, radius, sides, closed) => {
  const count = centers.length;
  const rings = centers.map((_, index) => {
    const frame = frameOf(centers, index, closed);
    const ids = [];
    for (let side = 0; side < sides; side += 1) {
      const angle = (side / sides) * Math.PI * 2;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const nx = frame.s[0] * cos + frame.u[0] * sin;
      const ny = frame.s[1] * cos + frame.u[1] * sin;
      const nz = frame.s[2] * cos + frame.u[2] * sin;
      ids.push(mesh.add(frame.point[0] + nx * radius, frame.point[1] + ny * radius, frame.point[2] + nz * radius, nx, ny, nz));
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

const ribbon = (mesh, centers, width, thick) => {
  const rings = centers.map((_, index) => {
    const frame = frameOf(centers, index, false);
    return [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sw, tw]) => {
      const nx = frame.s[0] * sw + frame.u[0] * tw;
      const ny = frame.s[1] * sw + frame.u[1] * tw;
      const nz = frame.s[2] * sw + frame.u[2] * tw;
      const ox = frame.s[0] * sw * width + frame.u[0] * tw * thick;
      const oy = frame.s[1] * sw * width + frame.u[1] * tw * thick;
      const oz = frame.s[2] * sw * width + frame.u[2] * tw * thick;
      return mesh.add(frame.point[0] + ox, frame.point[1] + oy, frame.point[2] + oz, nx, ny, nz);
    });
  });
  for (let index = 0; index < centers.length - 1; index += 1) {
    const current = rings[index];
    const next = rings[index + 1];
    for (let side = 0; side < 4; side += 1) {
      const following = (side + 1) % 4;
      mesh.indices.push(current[side], next[side], next[following], current[side], next[following], current[following]);
    }
  }
};

const sphere = (mesh, cx, cy, cz, radius, seg) => {
  const ids = [];
  for (let lat = 0; lat <= seg; lat += 1) {
    const v = (lat / seg) * Math.PI;
    ids.push([]);
    for (let lon = 0; lon < seg; lon += 1) {
      const u = (lon / seg) * Math.PI * 2;
      const nx = Math.sin(v) * Math.cos(u);
      const ny = Math.cos(v);
      const nz = Math.sin(v) * Math.sin(u);
      ids[lat].push(mesh.add(cx + nx * radius, cy + ny * radius, cz + nz * radius, nx, ny, nz));
    }
  }
  for (let lat = 0; lat < seg; lat += 1) {
    for (let lon = 0; lon < seg; lon += 1) {
      const next = (lon + 1) % seg;
      mesh.indices.push(ids[lat][lon], ids[lat + 1][lon], ids[lat + 1][next], ids[lat][lon], ids[lat + 1][next], ids[lat][next]);
    }
  }
};

const ellipse = (y, rx, rz, segments, ox = 0, oz = 0) => {
  const points = [];
  for (let index = 0; index < segments; index += 1) {
    const angle = (index / segments) * Math.PI * 2;
    points.push([ox + Math.cos(angle) * rx, y, oz + Math.sin(angle) * rz]);
  }
  return points;
};

const profile = (t) => {
  const y = -0.62 + t * 1.22;
  const rise = t < 0.5 ? Math.sin((t / 0.5) * Math.PI * 0.5) : 1;
  return { y, rx: 0.22 + rise * 0.62, rz: 0.08 + rise * 0.1 };
};

const knit = (mesh, scale, ox, oy, oz) => {
  const rows = 20;
  const around = 40;
  const placed = [];
  for (let row = 0; row < rows; row += 1) {
    const shape = profile(row / (rows - 1));
    placed.push(shape);
    const loop = ellipse(oy + shape.y * scale, shape.rx * scale, shape.rz * scale, around, ox, oz);
    tube(mesh, loop, (row < 4 ? 0.016 : 0.011) * scale, 5, true);
  }
  for (let row = 3; row < rows - 1; row += 1) {
    const a = placed[row];
    const b = placed[row + 1];
    for (let stitch = 0; stitch < 18; stitch += 1) {
      const angle = (stitch / 18) * Math.PI * 2;
      const from = [ox + Math.cos(angle) * a.rx * scale, oy + a.y * scale, oz + Math.sin(angle) * a.rz * scale];
      const to = [ox + Math.cos(angle) * b.rx * scale, oy + b.y * scale, oz + Math.sin(angle) * b.rz * scale];
      tube(mesh, [from, to], 0.007 * scale, 4, false);
    }
  }
};

const strapPath = () => {
  const points = [];
  const y0 = 0.58;
  const y1 = 1.22;
  for (let i = 0; i <= 10; i += 1) points.push([-0.3, y0 + ((y1 - y0) * i) / 10, 0.24]);
  for (let i = 1; i < 14; i += 1) {
    const angle = Math.PI - (i / 14) * Math.PI;
    points.push([Math.cos(angle) * 0.3, y1 + Math.sin(angle) * 0.18, 0.24]);
  }
  for (let i = 0; i <= 10; i += 1) points.push([0.3, y1 - ((y1 - y0) * i) / 10, 0.24]);
  return points;
};

const build = () => {
  const yarn = new Mesh();
  const leather = new Mesh();
  const metal = new Mesh();
  knit(yarn, 1, 0, 0, 0);
  knit(yarn, 0.46, 0.78, -0.18, 0.2);
  ribbon(leather, strapPath(), 0.045, 0.008);
  [-0.3, 0.3].forEach((x) => {
    sphere(metal, x, 0.66, 0.27, 0.012, 8);
    sphere(metal, x, 0.76, 0.27, 0.012, 8);
  });
  return { yarn, leather, metal };
};

const pad = (length) => (4 - (length % 4)) % 4;

const pack = (meshes, materials) => {
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
  const accessors = [];
  const bufferViews = [];
  const primitives = meshes.map((mesh, index) => {
    const base = index * 3;
    const box = bounds(mesh.positions);
    accessors.push(
      { bufferView: base, componentType: 5126, count: mesh.positions.length / 3, type: 'VEC3', min: box.min, max: box.max },
      { bufferView: base + 1, componentType: 5126, count: mesh.normals.length / 3, type: 'VEC3' },
      { bufferView: base + 2, componentType: 5123, count: mesh.indices.length, type: 'SCALAR' }
    );
    bufferViews.push(
      { buffer: 0, byteOffset: placed[base].byteOffset, byteLength: placed[base].byteLength, target: 34962 },
      { buffer: 0, byteOffset: placed[base + 1].byteOffset, byteLength: placed[base + 1].byteLength, target: 34962 },
      { buffer: 0, byteOffset: placed[base + 2].byteOffset, byteLength: placed[base + 2].byteLength, target: 34963 }
    );
    return { primitives: [{ attributes: { POSITION: base, NORMAL: base + 1 }, indices: base + 2, material: index }] };
  });
  const json = {
    asset: { version: '2.0', generator: 'nikbag-vera' },
    scene: 0,
    scenes: [{ nodes: meshes.map((_, index) => index) }],
    nodes: meshes.map((_, index) => ({ mesh: index })),
    meshes: primitives,
    materials,
    accessors,
    bufferViews,
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
  const { yarn, leather, metal } = build();
  [yarn, leather, metal].forEach((mesh) => {
    if (mesh.positions.length / 3 > 65535) throw new Error('Model indeks sınırını aşıyor.');
  });
  const buffer = pack([yarn, leather, metal], [
    { name: 'Body', doubleSided: true, pbrMetallicRoughness: { baseColorFactor: [0.72, 0.08, 0.07, 1], metallicFactor: 0.02, roughnessFactor: 0.7 } },
    { name: 'Hardware', doubleSided: true, pbrMetallicRoughness: { baseColorFactor: [0.78, 0.1, 0.08, 1], metallicFactor: 0.04, roughnessFactor: 0.42 } },
    { name: 'Metal', doubleSided: true, pbrMetallicRoughness: { baseColorFactor: [0.75, 0.75, 0.78, 1], metallicFactor: 0.85, roughnessFactor: 0.25 } }
  ]);
  await mongoose.connect(process.env.MONGO_URI, { family: 4, serverSelectionTimeoutMS: 20000 });
  const products = mongoose.connection.collection('products');
  const product = await products.findOne(
    { slug: 'vera-kirmizi-strap-canta-vera-mini-cuzdan-seti' },
    { projection: { title: 1, model3dUrl: 1 } }
  );
  if (!product) throw new Error('Ürün bulunamadı.');
  const url = await putMedia({
    buffer,
    mimetype: 'model/gltf-binary',
    originalname: 'vera-kirmizi-strap-canta.glb'
  }, 'models');
  if (product.model3dUrl) await removeRemote(product.model3dUrl);
  await products.updateOne({ _id: product._id }, { $set: { model3dUrl: url } });
  console.log(JSON.stringify({ title: product.title, bytes: buffer.length, verts: yarn.positions.length / 3, model3dUrl: url }));
  await mongoose.disconnect();
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
