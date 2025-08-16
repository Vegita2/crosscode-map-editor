import { Component, ElementRef, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { EventManager } from '@angular/platform-browser';
import { NavigationStart, Router } from '@angular/router';

import { Helper } from '../../../../services/phaser/helper';
import { HistoryState, HistoryStateContainer, StateHistoryService } from './state-history.service';

@Component({
	selector: 'app-history',
	templateUrl: './history.component.html',
	styleUrls: ['./history.component.scss'],
	encapsulation: ViewEncapsulation.None
})
export class HistoryComponent implements OnInit, OnDestroy {
	
	@ViewChild('listContainer', {static: false}) list?: ElementRef;
	
	private eventHandler?: Function;
	
	states: HistoryState[] = [];
	selected?: HistoryStateContainer;
	selectedIndex = 0;
	hide = false;
	
	constructor(
		private stateHistory: StateHistoryService,
		private eventManager: EventManager,
		router: Router,
	) {
		stateHistory.states.subscribe(states => {
			this.states = states;
			this.updateSelected(this.selected);
			setTimeout(() => {
				if (!this.list) {
					return;
				}
				const el = this.list.nativeElement;
				el.scrollTop = el.scrollHeight * 2;
			}, 0);
		});
		stateHistory.selectedState.subscribe(container => {
			this.updateSelected(container);
		});
		
		// TODO: floating windows should be handled globally
		router.events.subscribe(event => {
			if (event instanceof NavigationStart) {
				this.hide = event.url === '/3d';
			}
		});
	}
	
	ngOnInit() {
		this.eventHandler = this.eventManager.addEventListener(document as any, 'keydown', (event: KeyboardEvent) => {
			if (Helper.isInputFocused()) {
				return;
			}
			if (event.ctrlKey && event.key.toLowerCase() === 'z') {
				event.preventDefault();
				if (event.shiftKey) {
					this.redo();
				} else {
					this.undo();
				}
			}
		});
	}
	
	ngOnDestroy(): void {
		if (this.eventHandler) {
			this.eventHandler();
			this.eventHandler = undefined;
		}
	}
	
	updateSelected(container?: HistoryStateContainer) {
		if (!container) {
			return;
		}
		this.selected = container;
		this.selectedIndex = this.states.indexOf(container.state!);
	}
	
	undo() {
		this.stateHistory.undo();
	}
	
	redo() {
		this.stateHistory.redo();
	}
	
	selectState(state: HistoryState) {
		this.stateHistory.selectedState.next({state: state});
	}
	
}
