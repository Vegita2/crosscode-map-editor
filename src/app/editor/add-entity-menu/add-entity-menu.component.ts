import {Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import {GlobalEventsService} from '../../shared/global-events.service';
import {MapEntity, Point} from '../../shared/interfaces/cross-code-map';
import {MdMenuTrigger} from '@angular/material';
import {Vec2} from '../../shared/phaser/vec2';
import {Helper} from '../../shared/phaser/helper';

@Component({
	selector: 'app-add-entity-menu',
	templateUrl: './add-entity-menu.component.html',
	styleUrls: ['./add-entity-menu.component.scss']
})
export class AddEntityMenuComponent {
	@ViewChild(MdMenuTrigger) trigger: MdMenuTrigger;
	@ViewChild('filter') filter: ElementRef;

	pos: Point = {x: 0, y: 0};
	keys: string[];
	filteredKeys: string[];
	searchInput: string;

	private worldPos: Point;
	private mousePos: Point = {};

	constructor(private events: GlobalEventsService) {
		document.onmousemove = e => {
			this.mousePos.x = e.pageX;
			this.mousePos.y = e.pageY;
		};
		this.events.showAddEntityMenu.subscribe(val => {
			Vec2.assign(this.pos, this.mousePos);
			this.worldPos = val.worldPos;
			if (!this.keys) {
				this.keys = Object.keys(val.definitions);
			}

			this.searchInput = '';
			this.filteredKeys = this.keys.slice();
			setTimeout(() => {
				this.trigger.openMenu();
				this.filter.nativeElement.focus();
			}, 0);
		});
	}

	generateEntity(key: string) {
		const entity: MapEntity = {
			x: this.worldPos.x,
			y: this.worldPos.y,
			type: key,
			level: 0,
			settings: {}
		};

		this.events.generateNewEntity.next(entity);
	}

	filterKeys(search: string) {
		this.searchInput = search;
		this.filteredKeys = this.keys.filter(key => {
			if (!search) {
				return true;
			}
			return key.toLowerCase().includes(search.toLowerCase());
		});
		console.log(this.filteredKeys);
	}
}
