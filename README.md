OrderedStoreMixin
=================

Dojo Mixin that adds functionality to the memory store to support DND ordering in dGrid. Just use it instead of Dojo/Memory for the store.

PathToolsMixin
==============

This mixin provides the ability to specify get/set and bind functions based on a dot seperated path such as 'a.b.c.d'. Mix it into your widget to provide easy bindings to forms, and other dynamic entities in your widget.

The advantage is that this allows you to always see the latest object copies. This can be troublesome when you use and update object references in Stateful dojo objects a lot. Using these methods will always give you data from the current reference instead of stale objects. Also should help with memory leaks, but I'm still testing that.

Example:

this.bindPath('this.store.description', 'this.descriptionWidget.value');
