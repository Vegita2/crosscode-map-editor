import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { MapLoaderService } from '../../shared/map-loader.service';
import { MatDialog } from '@angular/material/dialog';
import { MapSettingsComponent } from '../dialogs/map-settings/map-settings.component';
import { NewMapComponent } from '../dialogs/new-map/new-map.component';
import { CCMap } from '../../shared/phaser/tilemap/cc-map';
import { GlobalEventsService } from '../../shared/global-events.service';
import { OffsetMapComponent } from '../dialogs/offset-map/offset-map.component';
import { environment } from '../../../environments/environment';
import { OverlayService } from '../../shared/overlay/overlay.service';
import { Overlay } from '@angular/cdk/overlay';
import { SettingsComponent } from '../dialogs/settings/settings.component';
import { SaveService } from '../../services/save.service';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { Router } from '@angular/router';
import { take } from 'rxjs/operators';
import { EditorView } from '../../models/editor-view';

@Component({
	selector: 'app-toolbar',
	templateUrl: './toolbar.component.html',
	styleUrls: ['./toolbar.component.scss']
})
export class ToolbarComponent implements OnInit {

	map?: CCMap;
	loaded = false;
	error = '';
	version = environment.version;
	is3d = false;
	is3dLoading = false;

	@Output()
	public loadMapClicked = new EventEmitter<void>(false);

	constructor(private mapLoader: MapLoaderService,
		private events: GlobalEventsService,
		private dialog: MatDialog,
		private overlayService: OverlayService,
		private overlay: Overlay,
		private router: Router,
		private save: SaveService,
	) {
	}

	ngOnInit() {
		this.mapLoader.tileMap.subscribe(map => {
			this.map = map;
		});
		this.events.loadComplete.subscribe(
			() => this.loaded = true,
			err => this.error = 'Error: could not load CrossCode assets. Update path in edit/settings'
		);

		// Use this to automatically load a map on startup for faster testing
		if (!environment.production) {
			this.events.loadComplete.subscribe(async () => {
				// await this.mapLoader.tileMap.pipe(take(1)).toPromise();
				// this.mapLoader.loadMapByName('autumn/entrance');
				
				// automatically opens npc event editor
				// console.log('after map load');
				// await new Promise(r => setTimeout(r, 500));
				// const npc = this.map?.entityManager.entities.find(e => e.details.type === 'NPC');
				// this.events.currentView.next(EditorView.Entities);
				// await new Promise(r => setTimeout(r, 300));
				// this.events.selectedEntity.next(npc);
				// await new Promise(r => setTimeout(r, 400));
				// const el = document.getElementsByTagName('app-npcstates-widget');
				// el[0].getElementsByTagName('input')[0].click();
			});
		}

		this.events.babylonLoading.subscribe(val => this.is3dLoading = val);
	}

	saveMap(saveAs: boolean) {
		if (!this.map) {
			throw new Error('no map loaded');
		}

		if (saveAs) {
			this.save.saveMapAs(this.map);
		} else {
			this.save.saveMap(this.map);
		}
	}

	newMap() {
		this.overlayService.open(NewMapComponent, {
			positionStrategy: this.overlay.position().global()
				.left('23vw')
				.top('calc(64px + 6vh / 2)'),
			hasBackdrop: true
		});
	}

	openMapSettings() {
		this.overlayService.open(MapSettingsComponent, {
			positionStrategy: this.overlay.position().global()
				.left('23vw')
				.top('calc(64px + 6vh / 2)'),
			hasBackdrop: true
		});
	}

	generateHeights(forceAll: boolean) {
		this.events.generateHeights.next(forceAll);
	}

	offsetMap() {
		this.dialog.open(OffsetMapComponent, {
			data: this.map
		});
	}

	showSettings() {
		this.overlayService.open(SettingsComponent, {
			positionStrategy: this.overlay.position().global()
				.left('23vw')
				.top('calc(64px + 6vh / 2)'),
			hasBackdrop: true
		});
	}

	changeTo3d(event: MatSlideToggleChange) {
		this.is3d = event.checked;
		this.router.navigate([event.checked ? '3d' : '']);
	}
}
