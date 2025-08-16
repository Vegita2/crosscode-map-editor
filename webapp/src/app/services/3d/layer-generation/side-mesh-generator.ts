import { Mesh, Vector3, VertexData } from '@babylonjs/core';
import { Point3 } from '../../../models/cross-code-map';
import { Globals } from '../../globals';
import { CCMapLayer } from '../../phaser/tilemap/cc-map-layer';
import { getLevelOffsetTile } from './offset-helper';
import { SimpleTileLayer } from './simple-tile-layer';

interface UV {
	u: number;
	v: number;
}

interface Quad {
	v1: Point3;
	v2: Point3;
	v3: Point3;
	v4: Point3;
}

export class SideMeshGenerator {
	
	private width = 0;
	private height = 0;
	
	private level = -1;
	
	private heightOffset = 0;
	private heightOffset2 = 0;
	
	generate(path: Vector3[], holes: Vector3[][], ccLayer: CCMapLayer, simpleTileLayer: SimpleTileLayer): Mesh {
		this.heightOffset = getLevelOffsetTile(ccLayer.details.level);
		this.heightOffset2 = getLevelOffsetTile(ccLayer.details.level + 1) - getLevelOffsetTile(ccLayer.details.level);
		
		this.width = simpleTileLayer.width;
		this.height = simpleTileLayer.height - simpleTileLayer.extendedBottom;
		
		this.level = ccLayer.details.level;
		
		const quads = this.makeQuads(path, holes, -this.heightOffset2);
		
		const positions: Point3[] = [];
		const indices: number[] = [];
		const uvs = new Map<number, UV>();
		const colors: number[] = [];
		const mathNormals: number[] = [];
		
		for (const quad of quads) {
			this.processQuad(quad, positions, indices, uvs, colors, mathNormals);
		}
		
		const simplePositions: number[] = [];
		for (const p of positions) {
			simplePositions.push(p.x);
			simplePositions.push(p.y);
			simplePositions.push(p.z);
		}
		
		const simpleUVs: number[] = [];
		for (const uv of uvs.values()) {
			simpleUVs.push(uv.u);
			simpleUVs.push(uv.v);
		}
		
		const customMesh = new Mesh('custom');
		
		const normals: number[] = [];
		VertexData.ComputeNormals(simplePositions, indices, normals);
		
		const vertexData = new VertexData();
		
		vertexData.positions = simplePositions;
		vertexData.indices = indices;
		vertexData.normals = mathNormals;
		// vertexData.colors = colors;
		vertexData.uvs = simpleUVs;
		
		vertexData.applyToMesh(customMesh);
		
		return customMesh;
	}
	
	private processQuad(quad: Quad, positions: Point3[], indices: number[], uvs: Map<number, UV>, colors: number[], normals: number[]) {
		const vertex: number[] = [
			this.findPosIndex(quad.v1, positions),
			this.findPosIndex(quad.v2, positions),
			this.findPosIndex(quad.v3, positions),
			this.findPosIndex(quad.v4, positions),
		];
		
		indices.push(
			vertex[0],
			vertex[1],
			vertex[2],
			vertex[2],
			vertex[3],
			vertex[0],
			
			// backside
			vertex[2],
			vertex[1],
			vertex[0],
			vertex[0],
			vertex[3],
			vertex[2],
		);
		
		// side/back is broken, remove them
		for (const v of [quad.v1, quad.v2, quad.v3, quad.v4]) {
			const hash = this.p3Hash(v);
			uvs.set(hash, this.getUvFromVertex(v));
		}
		
		// normals are wrong. Doesn't seem to matter much
		normals.push(
			0, 1, 0,
			0, 1, 0,
			0, 1, 0,
			0, 1, 0,
		);
		
		// vertex colors, currently unused
		// colors.push(...[
		// 	1, 0, 0, 1,
		// 	1, 0, 0, 1,
		// 	1, 0, 0, 1,
		// 	0, 1, 0, 0,
		// 	0, 1, 1, 0,
		// 	0, 1, 0, 1
		// ]);
	}
	
	private getUvFromVertex(vertex: Point3): UV {
		let u = vertex.x;
		let v = vertex.y === 0 ? this.heightOffset2 : 0;
		v += vertex.z;
		v += this.height;
		if (this.level < Globals.map.masterLevel) {
			v += getLevelOffsetTile(this.level) - getLevelOffsetTile(Globals.map.masterLevel);
		}
		// v -= this.heightOffset;
		u /= this.width;
		v /= this.height;
		
		// 1 pixel offset
		v -= 1 / (this.height * Globals.TILE_SIZE);
		return {u: u, v: v};
	}
	
	private findPosIndex(pos: Point3, positions: Point3[]) {
		let index = positions.findIndex((p) => p.x === pos.x && p.y === pos.y && p.z === pos.z);
		if (index === -1) {
			positions.push(pos);
			index = positions.length - 1;
		}
		return index;
	}
	
	private p3Hash(p: Point3) {
		return p.x * 100000000 + p.y * 10000 + p.z;
	}
	
	private makeQuads(path: Vector3[], holes: Vector3[][], height: number) {
		
		const groups = [path, ...holes];
		
		const quads: Quad[] = [];
		
		for (const vertices of groups) {
			for (let i = 0; i < vertices.length; i++) {
				const curr = vertices[i];
				const next = vertices[i + 1] || vertices[0];
				
				quads.push({
					v1: {x: curr.x, y: curr.y, z: curr.z},
					v2: {x: curr.x, y: curr.y + height, z: curr.z},
					v3: {x: next.x, y: next.y + height, z: next.z},
					v4: {x: next.x, y: next.y, z: next.z},
				});
			}
		}
		return quads;
	}
	
	// backup() {
	// 	//Create a custom mesh
	// 	const customMesh = new Mesh('custom');
	//
	// 	//Set arrays for positions and indices
	// 	const positions = [0, 0, 0, 1, 0, 0, 0, 1, 0];
	// 	const indices = [0, 1, 2];
	// 	const uvs = [0, 1, 0, 0, 1, 0];
	//
	// 	const normals: number[] = [];
	// 	VertexData.ComputeNormals(positions, indices, normals);
	//
	// 	//Create a vertexData object
	// 	const vertexData = new VertexData();
	//
	// 	//Assign positions and indices to vertexData
	// 	vertexData.positions = positions;
	// 	vertexData.indices = indices;
	// 	vertexData.normals = normals;
	// 	vertexData.uvs = uvs;
	//
	// 	//Apply vertexData to custom mesh
	// 	vertexData.applyToMesh(customMesh);
	//
	// 	return customMesh;
	// }
}
