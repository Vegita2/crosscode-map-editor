import {Attributes, CrossCodeMap, MapEntity, MapLayer, Point} from '../../interfaces/cross-code-map';
import {CCMapLayer} from './cc-map-layer';
import {CCEntity} from '../entities/cc-entity';
import {Globals} from '../../globals';
import {Prop, PropSheet} from '../../interfaces/props';

export class CCMap {
	name: string;
	levels: { height: number }[];
	mapWidth: number;
	mapHeight: number;
	masterLevel: number;
	entities: CCEntity[] = [];
	layers: CCMapLayer[] = [];
	attributes: Attributes;
	screen: Point;

	filename: string;

	private props = [
		'name',
		'levels',
		'mapWidth',
		'mapHeight',
		'masterLevel',
		'attributes',
		'screen',
	];

	private inputLayers: MapLayer[];

	constructor(private game: Phaser.Game) {
	}

	loadMap(map: CrossCodeMap): Promise<CCMap> {
		const game = this.game;

		this.props.forEach(prop => this[prop] = map[prop]);
		this.filename = map.filename;

		this.inputLayers = map.layer;

		// cleanup everything before loading new map
		this.layers.forEach(layer => layer.destroy());
		this.entities.forEach(entity => entity.destroy());

		this.layers = [];
		this.entities = [];

		// load needed assets for sprite props
		console.log(map.entities.length);

		map.layer.forEach(layer => {
			game.load.image(layer.tilesetName, Globals.URL + layer.tilesetName, false);
		});

		return new Promise((resolve, reject) => {
			game.load.onLoadComplete.addOnce(() => {

				// generate Map Layers
				if (this.inputLayers) {
					this.inputLayers.forEach(layer => {
						if (!layer.tilesetName) {
							return;
						}
						const ccLayer = new CCMapLayer(game, layer);
						this.layers.push(ccLayer);
					});

					this.inputLayers = null;
				}

				// generate Map Entities
				if (map.entities) {
					map.entities.forEach(entity => {
						// if (entity.x < 10 || entity.x > 50 || entity.y > 300 || entity.y < 150) {
						// 	return;
						// }
						const ccEntity = new CCEntity(game, this, entity.x, entity.y);
						ccEntity.settings = entity.settings;
						ccEntity.ccType = entity.type;
						ccEntity.level = entity.level;
						this.entities.push(ccEntity);
					});
				}

				resolve(this);
			});
			game.load.crossOrigin = 'anonymous';
			game.load.start();
		});

	}

	resize(width: number, height: number) {
		this.mapWidth = width;
		this.mapHeight = height;

		this.layers.forEach(layer => {
			layer.resize(width, height);
		});
	}

	export(): CrossCodeMap {
		const out: CrossCodeMap = <any>{};

		this.props.forEach(prop => out[prop] = this[prop]);
		// TODO should export entities
		// out.entities = this.entities;
		out.layer = [];
		this.layers.forEach(l => out.layer.push(l.details));

		return out;
	}
}
