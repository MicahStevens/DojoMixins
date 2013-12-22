/**
 * Path Tools
 *
 * This mixin provides the ability to specify get/set and bind functions based on a dot seperated path such as 'a.b.c.d'
 *
 * The advantage is that this allows you to always see the latest object copies. This can be troublesome
 * when you use and update object references in Stateful dojo objects a lot. Using these methods will always give you
 * data from the current reference instead of stale objects. Also should help with memory leaks, but I'm still testing that.
 *
 *
 **/
define([
    "dojo/_base/declare",
    "dojo/_base/lang",
	"dojo/_base/array",
    "dojo/has",
    "dojo/sniff",
    "dojo/dom",
    "dojo/on",
    "dojo/dom-class",
    "dojo/dom-style",
    "dojo/dom-construct",
	"dojo/json",
    "outbox/dojo/LanguageUtilMixin",
    "outbox/dojo/UiResourcesMixin",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
	"dijit/registry",
    "dojo/topic"
], function(
    declare,
    lang,
	array,
    has,
    sniff,
    dom,
    on,
    domClass,
    domStyle,
    domConstruct,
	json,
    LanguageUtilMixin,
    UiResourcesMixin,
    _WidgetBase,
    _TemplatedMixin,
    _WidgetsInTemplateMixin,
	registry,
    topic
) {
	return declare("PathToolsMixin", [LanguageUtilMixin, UiResourcesMixin, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {


		/**
		 * Binds two stateful object properties using dot-seperated string syntax.
		 * Each level is called via .get/.set(name) if possible to preserve stateful bindings
		 */
		bindPath: function (from, to, context) {
			this.watchPath(from, lang.hitch(this, function(property, oldValue, newValue) {
				if (this.getPath(to) != newValue) {
					this.setPath(to, newValue, context);
				}
			}));
			// check to see if the target is a widget of some sort. If not, don't watch it for changes.
			var target = this.getPath(to);
			var w = this.watchPath(to, lang.hitch(this, function(property, oldValue, newValue) {
				if (this.getPath(from) != newValue) {
					this.setPath(from, newValue);
				}
			}), context);
			this.setPath(to, this.getPath(from), context); // initialize
			return w;
		},
		/**
		 * Same as bindPath, but only one direction. Tracks changes in 'from' and pushes to 'to'
		 */
		trackPath: function (from, to, context) {
			var w = this.watchPath(from, lang.hitch(this, function(property, oldValue, newValue) {
				if (this.getPath(to) != newValue) {
					this.setPath(to, newValue, context);
				}
			}));
			this.setPath(to, this.getPath(from), context); // initialize
			return w;
		},
		/**
		 * Watches a specified dot.seperated object path attribute for changes and calls
		 * the callback function appropriately. If the target does not have a watch method,
		 * onChange is used. This may not work properly in all cases.
		 */
		watchPath: function (path, callback, context) {
			var parts = path.split('.');
			var p, i=0, dojoGlobal = dojo.global;
			var lastPart = parts.pop();

			if (!context) {
				if (!parts.length) {
					return dojoGlobal;
				} else {
					// figure out context
					p = parts[0];
					if (p == "this") {
						context = this;
						i = 1;
					}
					if (p in this) {
						context = this;
					}
					if (p in dojoGlobal) {
						context = dojoGlobal;
					}
				}
			}
			while(context && (p = parts[i]) ){
				if (context.get) {
					context = context.get(p);
				} else if (p in context) {
					context = context[p];
				} else {
					context = undefined;
				}
				i++;
			}
			if (context.watch) {
				return context.watch(lastPart, callback);
			} else {
				return on(context.lastPart, 'change', callback);
			}
		},
		/**
		 * Retrieves the value specified by a dot seperated string to an object.
		 * This does stateful 'get' along the path if possible, preserving latest object
		 * bindings with stateful objects.
		 *
		 * This is a lot more work than just getting directly, but preserves stateful paths
		 * when objects are updated, so it's useful when binding deep objects to widgets. (see bindPath() above)
		 */
		getPath: function (path, context) {
			var parts = path.split('.');
			var p, i=0, dojoGlobal = dojo.global;
			if (!context) {
				if (!parts.length) {
					return dojoGlobal;
				} else {
					// figure out context
					p = parts[0];
					if (p == "this") {
						context = this;
						i = 1;
					}
					if (p in this) {
						context = this;
					}
					if (p in dojoGlobal) {
						context = dojoGlobal;
					}
				}
			}

			while(context && (p = parts[i]) ){
				if (context.get) {
					context = context.get(p);
				} else if (p in context) {
					context = context[p];
				} else {
					context = undefined;
				}
				i++;
			}
			return context; // mixed
		},
		/**
		 * Sets an object specified by a dot.seperated string path to the object.
		 * This does stateful gets along the way until the end if possible, the final property
		 * is then 'set' if the method exists, otherwise direct assignment is used.
		 *
		 * This also must trigger the watch at each level, bubble it up or something.
		 *
		 * This is a lot more work than just setting directly, but preserves stateful paths
		 * when objects are updated, so it's useful when binding deep objects to widgets. (see bindPath() above)
		 */
		setPath: function (path, value, context) {
			var parts = path.split('.');
			var p, i=0, dojoGlobal = dojo.global;
			var lastPart = parts.pop();

			if (!context) {
				if (!parts.length) {
					return dojoGlobal;
				} else {
					// figure out context
					p = parts[0];
					if (p == "this") {
						context = this;
						i = 1;
					}
					if (p in this) {
						context = this;
					}
					if (p in dojoGlobal) {
						context = dojoGlobal;
					}
				}
			}
			var contexts = [], // store for later watch trigger.
			oldValues = [],
			props = [];
			while(context && (p = parts[i]) ) {
				contexts.push(context);
				props.push(p);
				if (context.get) {
					context = context.get(p);
				} else if (p in context) {
					context = context[p];
				} else {
					context = undefined;
				}
				if (context.declaredClass && context.declaredClass.indexOf('dijit') !== -1) {
					// we have a dijit widget, so just pull the value. Cloning this doesn't work.
					oldValues.push(context.get('value'));
				} else {
					oldValues.push(lang.clone(context)); // needed?
				}

				i++;
			}
			if (context.set) {
				context.set(lastPart, value);
				// look for storeRefControllers and re-set because their watch implementation is borked and won't see into the stored stateful object.
				// @TODO this may not be necesary.
//				array.forEach(contexts, function (c, i) {
//					if(c.declaredClass && c.declaredClass == "dojox.mvc.StoreRefController") {
//						c.set(props[i], contexts[i].get(props[i]));
//					}
//				});

			} else {
				context[lastPart] = value;
			}
			return value;
		}
	});
});
