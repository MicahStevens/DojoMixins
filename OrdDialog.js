/**
 * Order setting widget.
 *
 * Extends a Dialog widget by constructing with a
 * a `grid`, `ordinal` and `label` attribute in the data-dojo-props.
 *
 * When you create ordDialog - you must treat it like a dialog and ordDialog.show() . Then the dialog will appear,
 * and create a second grid which will allow drag and drop ordering of the labels which are retrieved from grid.store.
 *
 * Once the user is satisfied with the order, the 'Save' button will close
 * the dialog, which updates the store in the provided grid and re-orders by the ordinal column specified.
 *
 *
 * Usage:
 *  window.ordDialog = new OrdDialog({
 *			grid: grid,  // grid object you wish to order
 *			multiLingual: true,  // true if you're displaying a multilingual description column
 *			selectedLanguage: selectedLanguage,
 *			ordinal: "ordinal", // ordinal value property name
 *			label: "Name", // description column name
 *			field: "typeName" // description property
 *      });
 *       console.log(ordDialog);
 *       window.ordDialog.show();
 *
 **/

define([
	"dojo/_base/declare",
	"dojo/_base/lang",
	"dijit/Dialog",
	"outbox/dgrid/OnDemandGrid",
	"dojo/store/Observable",
	"dojo/store/Memory",
	"outbox/dojo/data/OrderedStoreMixin",
	"dgrid/Selection",
	"dgrid/extensions/DnD",
	"dojo/dnd/Source",
	"dgrid/Keyboard",
	"dojo/dom-construct",
	"dojo/on",
	"dijit/_WidgetBase",
	"dijit/_TemplatedMixin",
	"dijit/_WidgetsInTemplateMixin",
	"dojo/topic",
	"dojo/text!./templates/OrdDialog.html",
	"dijit/form/Button"
	], function(declare, lang, Dialog, Grid, Observable, Memory, OrderedStoreMixin, Selection, DnD, DnDSource, Keyboard, domConstruct, on, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, topic, template, Button) {

	return declare("OrdDialog", [Dialog, _TemplatedMixin, _WidgetsInTemplateMixin], {
		ordinal: 'ordinal',
		// column that stores the ordinal value
		labelField: 'typeName',
		// title for display column
		label: 'Name',
		// Column label
		prompt: 'Use drag and drop to order the items below and click save.',
		// displayed at top of grid to prompt user
		title: "Set Order",
		// dialog title
		templateString: template,
		multiLingual: false,
		// if true, multilingual display is enabled for the name column.
		selectedLanguage: 'en',
		// set to the display language
		showOrdinal: true,
		// if true, the ordinal column is to be displayed
		store: null,
		// hold the passed in grid. Data is pulled from this.
		postCreate: function() {
			this.inherited(arguments);
			// create grid definition
			var OrdinalWidget = declare([Grid, Selection, DnD, Keyboard]);
			var cols = [];
			if (this.showOrdinal) // add ordinal col if set
			{
				cols.push({
					field: this.ordinal,
					label: 'Ordinal',
					sortable: false
				});
			}
			cols.push({
				field: this.labelField,
				label: this.label,
				sortable: false,
				get: function(value) {
					if (this.grid.multiLingual) {
						if (value[this.field][this.grid.selectedLanguage] === undefined) {
							console.error('ordDialog::grid - selected language invalid.');
							console.log(this);
							return '';
						}
						return value[this.field][this.grid.selectedLanguage];
					}
					return value;
				}
			});

			// build it
			this.ordinalWidget = new OrdinalWidget({
				label: this.label,
				labelField: this.labelField,
				multiLingual: this.multiLingual,
				selectedLanguage: this.selectedLanguage,
				store: this.createOrderedStore(this.store),
				dndSourceType: 'dgrid-row',
				accept: 'dgrid-row',
				columns: cols,
				query: function(item) {
					return item !== null;
				}
			});
			domConstruct.place(this.ordinalWidget.domNode, this.gridNode, 'last');

			//topic.subscribe('/dnd/drop', lang.hitch(this, function() {
			//	var i = 1;
			//	this.store.query({}, {}).forEach(lang.hitch(this, function(object) {
			//		object[this.ordinal] = i;
			//		this.store.put(object);
			//		i++;
			//	}));
			//	this.ordinalWidget.refresh();
			//}));

		},

		// called when save button is clicked.
		saveClick: function(evt) {
			// go through ordinals and re-number
			var i = 1;
			this.ordinalWidget.store.query({}, {}).forEach(lang.hitch(this, function(object) {
				object[this.ordinal] = i;
				i++;
			}));
			// copy ordWidget.data to grid.store.data
			this.store.data = this.ordinalWidget.store.data;
			this.emit("save", {
				bubbles: false,
				cancelable: true
			});
			this.hide();
		},

		// called when close button is clicked
		cancelClick: function(evt) {
			// close and destroy so that next time we'll have correct data.
			this.hide();
		},

		onHide: function(evt) {
			this.inherited(arguments);
			this.destroyRecursive();
		},

		onShow: function(evt) {
			this.ordinalWidget.startup(); // have to call this after display, or you don't see the header.
		},
		// this returns a store that is capable of accepting ordered puts/adds
		createOrderedStore: function(store, options) {
			var Store = declare([Memory, OrderedStoreMixin]);
			return Observable(new Store({
				data: store.data,
				idProperty: store.idProperty,
				ordinal: this.ordinal
			}));
		}
	});
});
