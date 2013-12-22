OrderedStoreMixin
=================

Dojo Mixin that adds functionality to the memory store to support DND ordering in dGrid. Just use it instead of Dojo/Memory for the store.

PathToolsMixin
==============

This mixin provides the ability to specify get/set and bind functions based on a dot seperated path such as 'a.b.c.d'. Mix it into your widget to provide easy bindings to forms, and other dynamic entities in your widget.

The advantage is that this allows you to always see the latest object copies. This can be troublesome when you use and update object references in Stateful dojo objects a lot. Using these methods will always give you data from the current reference instead of stale objects. Also should help with memory leaks, but I'm still testing that.

Example:

this.bindPath('this.store.description', 'this.descriptionWidget.value');


OrdDialog
=============

Order setting widget.

Extends a Dialog widget by constructing with a `grid`, `ordinal` and `label` attribute in the data-dojo-props.

When you create ordDialog - you must treat it like a dialog and ordDialog.show() . Then the dialog will appear, and create a second grid which will allow drag and drop ordering of the labels which are retrieved from grid.store.

Once the user is satisfied with the order, the 'Save' button will close the dialog, which updates the store in the provided grid and re-orders by the ordinal column specified.


Usage:

    window.ordDialog = new OrdDialog({
        grid: grid,  // grid object you wish to order
        multiLingual: true,  // true if you're displaying a multilingual description column
        selectedLanguage: selectedLanguage,
        ordinal: "ordinal", // ordinal value property name
        label: "Name", // description column name
        field: "typeName" // description property
    });
    console.log(ordDialog);
    window.ordDialog.show();`
