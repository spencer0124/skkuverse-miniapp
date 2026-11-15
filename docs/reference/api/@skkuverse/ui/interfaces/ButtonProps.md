---
title: "@skkuverse/ui ButtonProps (interface)"
type: reference
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-11-15
audience: public
---

# Interface: ButtonProps

## Extends

- `NativeButtonProps`
- `Pick`\<`NativeAnchorProps`, `"href"` \| `"target"` \| `"rel"`\>

## Properties

### about?

> `optional` **about?**: `string`

#### Inherited from

`NativeButtonProps.about`

***

### accessKey?

> `optional` **accessKey?**: `string`

#### Inherited from

`NativeButtonProps.accessKey`

***

### aria-activedescendant?

> `optional` **aria-activedescendant?**: `string`

Identifies the currently active element when DOM focus is on a composite widget, textbox, group, or application.

#### Inherited from

`NativeButtonProps.aria-activedescendant`

***

### aria-atomic?

> `optional` **aria-atomic?**: `Booleanish`

Indicates whether assistive technologies will present all, or only parts of, the changed region based on the change notifications defined by the aria-relevant attribute.

#### Inherited from

`NativeButtonProps.aria-atomic`

***

### aria-autocomplete?

> `optional` **aria-autocomplete?**: `"none"` \| `"inline"` \| `"list"` \| `"both"`

Indicates whether inputting text could trigger display of one or more predictions of the user's intended value for an input and specifies how predictions would be
presented if they are made.

#### Inherited from

`NativeButtonProps.aria-autocomplete`

***

### aria-braillelabel?

> `optional` **aria-braillelabel?**: `string`

Defines a string value that labels the current element, which is intended to be converted into Braille.

#### See

aria-label.

#### Inherited from

`NativeButtonProps.aria-braillelabel`

***

### aria-brailleroledescription?

> `optional` **aria-brailleroledescription?**: `string`

Defines a human-readable, author-localized abbreviated description for the role of an element, which is intended to be converted into Braille.

#### See

aria-roledescription.

#### Inherited from

`NativeButtonProps.aria-brailleroledescription`

***

### aria-busy?

> `optional` **aria-busy?**: `Booleanish`

#### Inherited from

`NativeButtonProps.aria-busy`

***

### aria-checked?

> `optional` **aria-checked?**: `boolean` \| `"mixed"` \| `"false"` \| `"true"`

Indicates the current "checked" state of checkboxes, radio buttons, and other widgets.

#### See

 - aria-pressed
 - aria-selected.

#### Inherited from

`NativeButtonProps.aria-checked`

***

### aria-colcount?

> `optional` **aria-colcount?**: `number`

Defines the total number of columns in a table, grid, or treegrid.

#### See

aria-colindex.

#### Inherited from

`NativeButtonProps.aria-colcount`

***

### aria-colindex?

> `optional` **aria-colindex?**: `number`

Defines an element's column index or position with respect to the total number of columns within a table, grid, or treegrid.

#### See

 - aria-colcount
 - aria-colspan.

#### Inherited from

`NativeButtonProps.aria-colindex`

***

### aria-colindextext?

> `optional` **aria-colindextext?**: `string`

Defines a human readable text alternative of aria-colindex.

#### See

aria-rowindextext.

#### Inherited from

`NativeButtonProps.aria-colindextext`

***

### aria-colspan?

> `optional` **aria-colspan?**: `number`

Defines the number of columns spanned by a cell or gridcell within a table, grid, or treegrid.

#### See

 - aria-colindex
 - aria-rowspan.

#### Inherited from

`NativeButtonProps.aria-colspan`

***

### aria-controls?

> `optional` **aria-controls?**: `string`

Identifies the element (or elements) whose contents or presence are controlled by the current element.

#### See

aria-owns.

#### Inherited from

`NativeButtonProps.aria-controls`

***

### aria-current?

> `optional` **aria-current?**: `boolean` \| `"page"` \| `"false"` \| `"true"` \| `"step"` \| `"location"` \| `"date"` \| `"time"`

Indicates the element that represents the current item within a container or set of related elements.

#### Inherited from

`NativeButtonProps.aria-current`

***

### aria-describedby?

> `optional` **aria-describedby?**: `string`

Identifies the element (or elements) that describes the object.

#### See

aria-labelledby

#### Inherited from

`NativeButtonProps.aria-describedby`

***

### aria-description?

> `optional` **aria-description?**: `string`

Defines a string value that describes or annotates the current element.

#### See

related aria-describedby.

#### Inherited from

`NativeButtonProps.aria-description`

***

### aria-details?

> `optional` **aria-details?**: `string`

Identifies the element that provides a detailed, extended description for the object.

#### See

aria-describedby.

#### Inherited from

`NativeButtonProps.aria-details`

***

### aria-disabled?

> `optional` **aria-disabled?**: `Booleanish`

Indicates that the element is perceivable but disabled, so it is not editable or otherwise operable.

#### See

 - aria-hidden
 - aria-readonly.

#### Inherited from

`NativeButtonProps.aria-disabled`

***

### ~~aria-dropeffect?~~

> `optional` **aria-dropeffect?**: `"none"` \| `"copy"` \| `"link"` \| `"move"` \| `"execute"` \| `"popup"`

Indicates what functions can be performed when a dragged object is released on the drop target.

#### Deprecated

in ARIA 1.1

#### Inherited from

`NativeButtonProps.aria-dropeffect`

***

### aria-errormessage?

> `optional` **aria-errormessage?**: `string`

Identifies the element that provides an error message for the object.

#### See

 - aria-invalid
 - aria-describedby.

#### Inherited from

`NativeButtonProps.aria-errormessage`

***

### aria-expanded?

> `optional` **aria-expanded?**: `Booleanish`

Indicates whether the element, or another grouping element it controls, is currently expanded or collapsed.

#### Inherited from

`NativeButtonProps.aria-expanded`

***

### aria-flowto?

> `optional` **aria-flowto?**: `string`

Identifies the next element (or elements) in an alternate reading order of content which, at the user's discretion,
allows assistive technology to override the general default of reading in document source order.

#### Inherited from

`NativeButtonProps.aria-flowto`

***

### ~~aria-grabbed?~~

> `optional` **aria-grabbed?**: `Booleanish`

Indicates an element's "grabbed" state in a drag-and-drop operation.

#### Deprecated

in ARIA 1.1

#### Inherited from

`NativeButtonProps.aria-grabbed`

***

### aria-haspopup?

> `optional` **aria-haspopup?**: `boolean` \| `"grid"` \| `"dialog"` \| `"listbox"` \| `"menu"` \| `"tree"` \| `"false"` \| `"true"`

Indicates the availability and type of interactive popup element, such as menu or dialog, that can be triggered by an element.

#### Inherited from

`NativeButtonProps.aria-haspopup`

***

### aria-hidden?

> `optional` **aria-hidden?**: `Booleanish`

Indicates whether the element is exposed to an accessibility API.

#### See

aria-disabled.

#### Inherited from

`NativeButtonProps.aria-hidden`

***

### aria-invalid?

> `optional` **aria-invalid?**: `boolean` \| `"false"` \| `"true"` \| `"grammar"` \| `"spelling"`

Indicates the entered value does not conform to the format expected by the application.

#### See

aria-errormessage.

#### Inherited from

`NativeButtonProps.aria-invalid`

***

### aria-keyshortcuts?

> `optional` **aria-keyshortcuts?**: `string`

Indicates keyboard shortcuts that an author has implemented to activate or give focus to an element.

#### Inherited from

`NativeButtonProps.aria-keyshortcuts`

***

### aria-label?

> `optional` **aria-label?**: `string`

Defines a string value that labels the current element.

#### See

aria-labelledby.

#### Inherited from

`NativeButtonProps.aria-label`

***

### aria-labelledby?

> `optional` **aria-labelledby?**: `string`

Identifies the element (or elements) that labels the current element.

#### See

aria-describedby.

#### Inherited from

`NativeButtonProps.aria-labelledby`

***

### aria-level?

> `optional` **aria-level?**: `number`

Defines the hierarchical level of an element within a structure.

#### Inherited from

`NativeButtonProps.aria-level`

***

### aria-live?

> `optional` **aria-live?**: `"off"` \| `"assertive"` \| `"polite"`

Indicates that an element will be updated, and describes the types of updates the user agents, assistive technologies, and user can expect from the live region.

#### Inherited from

`NativeButtonProps.aria-live`

***

### aria-modal?

> `optional` **aria-modal?**: `Booleanish`

Indicates whether an element is modal when displayed.

#### Inherited from

`NativeButtonProps.aria-modal`

***

### aria-multiline?

> `optional` **aria-multiline?**: `Booleanish`

Indicates whether a text box accepts multiple lines of input or only a single line.

#### Inherited from

`NativeButtonProps.aria-multiline`

***

### aria-multiselectable?

> `optional` **aria-multiselectable?**: `Booleanish`

Indicates that the user may select more than one item from the current selectable descendants.

#### Inherited from

`NativeButtonProps.aria-multiselectable`

***

### aria-orientation?

> `optional` **aria-orientation?**: `"horizontal"` \| `"vertical"`

Indicates whether the element's orientation is horizontal, vertical, or unknown/ambiguous.

#### Inherited from

`NativeButtonProps.aria-orientation`

***

### aria-owns?

> `optional` **aria-owns?**: `string`

Identifies an element (or elements) in order to define a visual, functional, or contextual parent/child relationship
between DOM elements where the DOM hierarchy cannot be used to represent the relationship.

#### See

aria-controls.

#### Inherited from

`NativeButtonProps.aria-owns`

***

### aria-placeholder?

> `optional` **aria-placeholder?**: `string`

Defines a short hint (a word or short phrase) intended to aid the user with data entry when the control has no value.
A hint could be a sample value or a brief description of the expected format.

#### Inherited from

`NativeButtonProps.aria-placeholder`

***

### aria-posinset?

> `optional` **aria-posinset?**: `number`

Defines an element's number or position in the current set of listitems or treeitems. Not required if all elements in the set are present in the DOM.

#### See

aria-setsize.

#### Inherited from

`NativeButtonProps.aria-posinset`

***

### aria-pressed?

> `optional` **aria-pressed?**: `boolean` \| `"mixed"` \| `"false"` \| `"true"`

Indicates the current "pressed" state of toggle buttons.

#### See

 - aria-checked
 - aria-selected.

#### Inherited from

`NativeButtonProps.aria-pressed`

***

### aria-readonly?

> `optional` **aria-readonly?**: `Booleanish`

Indicates that the element is not editable, but is otherwise operable.

#### See

aria-disabled.

#### Inherited from

`NativeButtonProps.aria-readonly`

***

### aria-relevant?

> `optional` **aria-relevant?**: `"text"` \| `"all"` \| `"additions"` \| `"additions removals"` \| `"additions text"` \| `"removals"` \| `"removals additions"` \| `"removals text"` \| `"text additions"` \| `"text removals"`

Indicates what notifications the user agent will trigger when the accessibility tree within a live region is modified.

#### See

aria-atomic.

#### Inherited from

`NativeButtonProps.aria-relevant`

***

### aria-required?

> `optional` **aria-required?**: `Booleanish`

Indicates that user input is required on the element before a form may be submitted.

#### Inherited from

`NativeButtonProps.aria-required`

***

### aria-roledescription?

> `optional` **aria-roledescription?**: `string`

Defines a human-readable, author-localized description for the role of an element.

#### Inherited from

`NativeButtonProps.aria-roledescription`

***

### aria-rowcount?

> `optional` **aria-rowcount?**: `number`

Defines the total number of rows in a table, grid, or treegrid.

#### See

aria-rowindex.

#### Inherited from

`NativeButtonProps.aria-rowcount`

***

### aria-rowindex?

> `optional` **aria-rowindex?**: `number`

Defines an element's row index or position with respect to the total number of rows within a table, grid, or treegrid.

#### See

 - aria-rowcount
 - aria-rowspan.

#### Inherited from

`NativeButtonProps.aria-rowindex`

***

### aria-rowindextext?

> `optional` **aria-rowindextext?**: `string`

Defines a human readable text alternative of aria-rowindex.

#### See

aria-colindextext.

#### Inherited from

`NativeButtonProps.aria-rowindextext`

***

### aria-rowspan?

> `optional` **aria-rowspan?**: `number`

Defines the number of rows spanned by a cell or gridcell within a table, grid, or treegrid.

#### See

 - aria-rowindex
 - aria-colspan.

#### Inherited from

`NativeButtonProps.aria-rowspan`

***

### aria-selected?

> `optional` **aria-selected?**: `Booleanish`

Indicates the current "selected" state of various widgets.

#### See

 - aria-checked
 - aria-pressed.

#### Inherited from

`NativeButtonProps.aria-selected`

***

### aria-setsize?

> `optional` **aria-setsize?**: `number`

Defines the number of items in the current set of listitems or treeitems. Not required if all elements in the set are present in the DOM.

#### See

aria-posinset.

#### Inherited from

`NativeButtonProps.aria-setsize`

***

### aria-sort?

> `optional` **aria-sort?**: `"none"` \| `"ascending"` \| `"descending"` \| `"other"`

Indicates if items in a table or grid are sorted in ascending or descending order.

#### Inherited from

`NativeButtonProps.aria-sort`

***

### aria-valuemax?

> `optional` **aria-valuemax?**: `number`

Defines the maximum allowed value for a range widget.

#### Inherited from

`NativeButtonProps.aria-valuemax`

***

### aria-valuemin?

> `optional` **aria-valuemin?**: `number`

Defines the minimum allowed value for a range widget.

#### Inherited from

`NativeButtonProps.aria-valuemin`

***

### aria-valuenow?

> `optional` **aria-valuenow?**: `number`

Defines the current value for a range widget.

#### See

aria-valuetext.

#### Inherited from

`NativeButtonProps.aria-valuenow`

***

### aria-valuetext?

> `optional` **aria-valuetext?**: `string`

Defines the human readable text alternative of aria-valuenow for a range widget.

#### Inherited from

`NativeButtonProps.aria-valuetext`

***

### as?

> `optional` **as?**: `"button"` \| `"a"`

Renders an anchor instead of a button.

#### Default

`'button'`

***

### autoCapitalize?

> `optional` **autoCapitalize?**: `"none"` \| `"on"` \| `string` & `object` \| `"off"` \| `"sentences"` \| `"words"` \| `"characters"`

#### Inherited from

`NativeButtonProps.autoCapitalize`

***

### autoCorrect?

> `optional` **autoCorrect?**: `string`

#### Inherited from

`NativeButtonProps.autoCorrect`

***

### autoFocus?

> `optional` **autoFocus?**: `boolean`

#### Inherited from

`NativeButtonProps.autoFocus`

***

### autoSave?

> `optional` **autoSave?**: `string`

#### Inherited from

`NativeButtonProps.autoSave`

***

### children

> **children**: `ReactNode`

#### Overrides

`NativeButtonProps.children`

***

### className?

> `optional` **className?**: `string`

#### Inherited from

`NativeButtonProps.className`

***

### color?

> `optional` **color?**: [`ButtonColor`](../type-aliases/ButtonColor.md)

#### Default

`'primary'`

***

### containerStyle?

> `optional` **containerStyle?**: [`Style`](../type-aliases/Style.md)

***

### content?

> `optional` **content?**: `string`

#### Inherited from

`NativeButtonProps.content`

***

### contentEditable?

> `optional` **contentEditable?**: `"inherit"` \| `Booleanish` \| `"plaintext-only"`

#### Inherited from

`NativeButtonProps.contentEditable`

***

### contextMenu?

> `optional` **contextMenu?**: `string`

#### Inherited from

`NativeButtonProps.contextMenu`

***

### dangerouslySetInnerHTML?

> `optional` **dangerouslySetInnerHTML?**: `object`

#### \_\_html

> **\_\_html**: `string` \| `TrustedHTML`

#### Inherited from

`NativeButtonProps.dangerouslySetInnerHTML`

***

### datatype?

> `optional` **datatype?**: `string`

#### Inherited from

`NativeButtonProps.datatype`

***

### defaultChecked?

> `optional` **defaultChecked?**: `boolean`

#### Inherited from

`NativeButtonProps.defaultChecked`

***

### defaultValue?

> `optional` **defaultValue?**: `string` \| `number` \| readonly `string`[]

#### Inherited from

`NativeButtonProps.defaultValue`

***

### dir?

> `optional` **dir?**: `string`

#### Inherited from

`NativeButtonProps.dir`

***

### disabled?

> `optional` **disabled?**: `boolean`

#### Default

`false`

#### Overrides

`NativeButtonProps.disabled`

***

### display?

> `optional` **display?**: [`ButtonDisplay`](../type-aliases/ButtonDisplay.md)

#### Default

`'inline'`

***

### draggable?

> `optional` **draggable?**: `Booleanish`

#### Inherited from

`NativeButtonProps.draggable`

***

### enterKeyHint?

> `optional` **enterKeyHint?**: `"search"` \| `"next"` \| `"enter"` \| `"done"` \| `"go"` \| `"previous"` \| `"send"`

#### Inherited from

`NativeButtonProps.enterKeyHint`

***

### exportparts?

> `optional` **exportparts?**: `string`

#### See

[https://developer.mozilla.org/en-US/docs/Web/HTML/Global\_attributes/exportparts](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/exportparts)

#### Inherited from

`NativeButtonProps.exportparts`

***

### form?

> `optional` **form?**: `string`

#### Inherited from

`NativeButtonProps.form`

***

### formAction?

> `optional` **formAction?**: `string` \| ((`formData`) => `void` \| `Promise`\<`void`\>)

#### Inherited from

`NativeButtonProps.formAction`

***

### formEncType?

> `optional` **formEncType?**: `string`

#### Inherited from

`NativeButtonProps.formEncType`

***

### formMethod?

> `optional` **formMethod?**: `string`

#### Inherited from

`NativeButtonProps.formMethod`

***

### formNoValidate?

> `optional` **formNoValidate?**: `boolean`

#### Inherited from

`NativeButtonProps.formNoValidate`

***

### formTarget?

> `optional` **formTarget?**: `string`

#### Inherited from

`NativeButtonProps.formTarget`

***

### hidden?

> `optional` **hidden?**: `boolean`

#### Inherited from

`NativeButtonProps.hidden`

***

### href?

> `optional` **href?**: `string`

#### Inherited from

`Pick.href`

***

### id?

> `optional` **id?**: `string`

#### Inherited from

`NativeButtonProps.id`

***

### inert?

> `optional` **inert?**: `boolean`

#### See

[https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/inert](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/inert)

#### Inherited from

`NativeButtonProps.inert`

***

### inlist?

> `optional` **inlist?**: `any`

#### Inherited from

`NativeButtonProps.inlist`

***

### inputMode?

> `optional` **inputMode?**: `"none"` \| `"url"` \| `"text"` \| `"search"` \| `"tel"` \| `"email"` \| `"numeric"` \| `"decimal"`

Hints at the type of data that might be entered by the user while editing the element or its contents

#### See

[https://html.spec.whatwg.org/multipage/interaction.html#input-modalities:-the-inputmode-attribute](https://html.spec.whatwg.org/multipage/interaction.html#input-modalities:-the-inputmode-attribute)

#### Inherited from

`NativeButtonProps.inputMode`

***

### is?

> `optional` **is?**: `string`

Specify that a standard HTML element should behave like a defined custom built-in element

#### See

[https://html.spec.whatwg.org/multipage/custom-elements.html#attr-is](https://html.spec.whatwg.org/multipage/custom-elements.html#attr-is)

#### Inherited from

`NativeButtonProps.is`

***

### itemID?

> `optional` **itemID?**: `string`

#### Inherited from

`NativeButtonProps.itemID`

***

### itemProp?

> `optional` **itemProp?**: `string`

#### Inherited from

`NativeButtonProps.itemProp`

***

### itemRef?

> `optional` **itemRef?**: `string`

#### Inherited from

`NativeButtonProps.itemRef`

***

### itemScope?

> `optional` **itemScope?**: `boolean`

#### Inherited from

`NativeButtonProps.itemScope`

***

### itemType?

> `optional` **itemType?**: `string`

#### Inherited from

`NativeButtonProps.itemType`

***

### lang?

> `optional` **lang?**: `string`

#### Inherited from

`NativeButtonProps.lang`

***

### leftAccessory?

> `optional` **leftAccessory?**: `ReactNode`

***

### loading?

> `optional` **loading?**: `boolean`

#### Default

`false`

***

### name?

> `optional` **name?**: `string`

#### Inherited from

`NativeButtonProps.name`

***

### nonce?

> `optional` **nonce?**: `string`

#### Inherited from

`NativeButtonProps.nonce`

***

### onAbort?

> `optional` **onAbort?**: `ReactEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onAbort`

***

### onAbortCapture?

> `optional` **onAbortCapture?**: `ReactEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onAbortCapture`

***

### onAnimationEnd?

> `optional` **onAnimationEnd?**: `AnimationEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onAnimationEnd`

***

### onAnimationEndCapture?

> `optional` **onAnimationEndCapture?**: `AnimationEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onAnimationEndCapture`

***

### onAnimationIteration?

> `optional` **onAnimationIteration?**: `AnimationEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onAnimationIteration`

***

### onAnimationIterationCapture?

> `optional` **onAnimationIterationCapture?**: `AnimationEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onAnimationIterationCapture`

***

### onAnimationStart?

> `optional` **onAnimationStart?**: `AnimationEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onAnimationStart`

***

### onAnimationStartCapture?

> `optional` **onAnimationStartCapture?**: `AnimationEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onAnimationStartCapture`

***

### onAuxClick?

> `optional` **onAuxClick?**: `MouseEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onAuxClick`

***

### onAuxClickCapture?

> `optional` **onAuxClickCapture?**: `MouseEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onAuxClickCapture`

***

### onBeforeInput?

> `optional` **onBeforeInput?**: `InputEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onBeforeInput`

***

### onBeforeInputCapture?

> `optional` **onBeforeInputCapture?**: `InputEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onBeforeInputCapture`

***

### onBeforeToggle?

> `optional` **onBeforeToggle?**: `ToggleEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onBeforeToggle`

***

### onBlur?

> `optional` **onBlur?**: `FocusEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onBlur`

***

### onBlurCapture?

> `optional` **onBlurCapture?**: `FocusEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onBlurCapture`

***

### onCanPlay?

> `optional` **onCanPlay?**: `ReactEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onCanPlay`

***

### onCanPlayCapture?

> `optional` **onCanPlayCapture?**: `ReactEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onCanPlayCapture`

***

### onCanPlayThrough?

> `optional` **onCanPlayThrough?**: `ReactEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onCanPlayThrough`

***

### onCanPlayThroughCapture?

> `optional` **onCanPlayThroughCapture?**: `ReactEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onCanPlayThroughCapture`

***

### onChange?

> `optional` **onChange?**: `ChangeEventHandler`\<`HTMLButtonElement`, `Element`\>

#### Inherited from

`NativeButtonProps.onChange`

***

### onChangeCapture?

> `optional` **onChangeCapture?**: `ChangeEventHandler`\<`HTMLButtonElement`, `Element`\>

#### Inherited from

`NativeButtonProps.onChangeCapture`

***

### onClick?

> `optional` **onClick?**: `MouseEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onClick`

***

### onClickCapture?

> `optional` **onClickCapture?**: `MouseEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onClickCapture`

***

### onCompositionEnd?

> `optional` **onCompositionEnd?**: `CompositionEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onCompositionEnd`

***

### onCompositionEndCapture?

> `optional` **onCompositionEndCapture?**: `CompositionEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onCompositionEndCapture`

***

### onCompositionStart?

> `optional` **onCompositionStart?**: `CompositionEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onCompositionStart`

***

### onCompositionStartCapture?

> `optional` **onCompositionStartCapture?**: `CompositionEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onCompositionStartCapture`

***

### onCompositionUpdate?

> `optional` **onCompositionUpdate?**: `CompositionEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onCompositionUpdate`

***

### onCompositionUpdateCapture?

> `optional` **onCompositionUpdateCapture?**: `CompositionEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onCompositionUpdateCapture`

***

### onContextMenu?

> `optional` **onContextMenu?**: `MouseEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onContextMenu`

***

### onContextMenuCapture?

> `optional` **onContextMenuCapture?**: `MouseEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onContextMenuCapture`

***

### onCopy?

> `optional` **onCopy?**: `ClipboardEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onCopy`

***

### onCopyCapture?

> `optional` **onCopyCapture?**: `ClipboardEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onCopyCapture`

***

### onCut?

> `optional` **onCut?**: `ClipboardEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onCut`

***

### onCutCapture?

> `optional` **onCutCapture?**: `ClipboardEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onCutCapture`

***

### onDoubleClick?

> `optional` **onDoubleClick?**: `MouseEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onDoubleClick`

***

### onDoubleClickCapture?

> `optional` **onDoubleClickCapture?**: `MouseEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onDoubleClickCapture`

***

### onDrag?

> `optional` **onDrag?**: `DragEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onDrag`

***

### onDragCapture?

> `optional` **onDragCapture?**: `DragEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onDragCapture`

***

### onDragEnd?

> `optional` **onDragEnd?**: `DragEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onDragEnd`

***

### onDragEndCapture?

> `optional` **onDragEndCapture?**: `DragEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onDragEndCapture`

***

### onDragEnter?

> `optional` **onDragEnter?**: `DragEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onDragEnter`

***

### onDragEnterCapture?

> `optional` **onDragEnterCapture?**: `DragEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onDragEnterCapture`

***

### onDragExit?

> `optional` **onDragExit?**: `DragEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onDragExit`

***

### onDragExitCapture?

> `optional` **onDragExitCapture?**: `DragEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onDragExitCapture`

***

### onDragLeave?

> `optional` **onDragLeave?**: `DragEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onDragLeave`

***

### onDragLeaveCapture?

> `optional` **onDragLeaveCapture?**: `DragEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onDragLeaveCapture`

***

### onDragOver?

> `optional` **onDragOver?**: `DragEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onDragOver`

***

### onDragOverCapture?

> `optional` **onDragOverCapture?**: `DragEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onDragOverCapture`

***

### onDragStart?

> `optional` **onDragStart?**: `DragEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onDragStart`

***

### onDragStartCapture?

> `optional` **onDragStartCapture?**: `DragEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onDragStartCapture`

***

### onDrop?

> `optional` **onDrop?**: `DragEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onDrop`

***

### onDropCapture?

> `optional` **onDropCapture?**: `DragEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onDropCapture`

***

### onDurationChange?

> `optional` **onDurationChange?**: `ReactEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onDurationChange`

***

### onDurationChangeCapture?

> `optional` **onDurationChangeCapture?**: `ReactEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onDurationChangeCapture`

***

### onEmptied?

> `optional` **onEmptied?**: `ReactEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onEmptied`

***

### onEmptiedCapture?

> `optional` **onEmptiedCapture?**: `ReactEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onEmptiedCapture`

***

### onEncrypted?

> `optional` **onEncrypted?**: `ReactEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onEncrypted`

***

### onEncryptedCapture?

> `optional` **onEncryptedCapture?**: `ReactEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onEncryptedCapture`

***

### onEnded?

> `optional` **onEnded?**: `ReactEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onEnded`

***

### onEndedCapture?

> `optional` **onEndedCapture?**: `ReactEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onEndedCapture`

***

### onError?

> `optional` **onError?**: `ReactEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onError`

***

### onErrorCapture?

> `optional` **onErrorCapture?**: `ReactEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onErrorCapture`

***

### onFocus?

> `optional` **onFocus?**: `FocusEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onFocus`

***

### onFocusCapture?

> `optional` **onFocusCapture?**: `FocusEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onFocusCapture`

***

### onGotPointerCapture?

> `optional` **onGotPointerCapture?**: `PointerEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onGotPointerCapture`

***

### onGotPointerCaptureCapture?

> `optional` **onGotPointerCaptureCapture?**: `PointerEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onGotPointerCaptureCapture`

***

### onInput?

> `optional` **onInput?**: `InputEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onInput`

***

### onInputCapture?

> `optional` **onInputCapture?**: `InputEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onInputCapture`

***

### onInvalid?

> `optional` **onInvalid?**: `ReactEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onInvalid`

***

### onInvalidCapture?

> `optional` **onInvalidCapture?**: `ReactEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onInvalidCapture`

***

### onKeyDown?

> `optional` **onKeyDown?**: `KeyboardEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onKeyDown`

***

### onKeyDownCapture?

> `optional` **onKeyDownCapture?**: `KeyboardEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onKeyDownCapture`

***

### ~~onKeyPress?~~

> `optional` **onKeyPress?**: `KeyboardEventHandler`\<`HTMLButtonElement`\>

#### Deprecated

Use `onKeyUp` or `onKeyDown` instead

#### Inherited from

`NativeButtonProps.onKeyPress`

***

### ~~onKeyPressCapture?~~

> `optional` **onKeyPressCapture?**: `KeyboardEventHandler`\<`HTMLButtonElement`\>

#### Deprecated

Use `onKeyUpCapture` or `onKeyDownCapture` instead

#### Inherited from

`NativeButtonProps.onKeyPressCapture`

***

### onKeyUp?

> `optional` **onKeyUp?**: `KeyboardEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onKeyUp`

***

### onKeyUpCapture?

> `optional` **onKeyUpCapture?**: `KeyboardEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onKeyUpCapture`

***

### onLoad?

> `optional` **onLoad?**: `ReactEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onLoad`

***

### onLoadCapture?

> `optional` **onLoadCapture?**: `ReactEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onLoadCapture`

***

### onLoadedData?

> `optional` **onLoadedData?**: `ReactEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onLoadedData`

***

### onLoadedDataCapture?

> `optional` **onLoadedDataCapture?**: `ReactEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onLoadedDataCapture`

***

### onLoadedMetadata?

> `optional` **onLoadedMetadata?**: `ReactEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onLoadedMetadata`

***

### onLoadedMetadataCapture?

> `optional` **onLoadedMetadataCapture?**: `ReactEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onLoadedMetadataCapture`

***

### onLoadStart?

> `optional` **onLoadStart?**: `ReactEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onLoadStart`

***

### onLoadStartCapture?

> `optional` **onLoadStartCapture?**: `ReactEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onLoadStartCapture`

***

### onLostPointerCapture?

> `optional` **onLostPointerCapture?**: `PointerEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onLostPointerCapture`

***

### onLostPointerCaptureCapture?

> `optional` **onLostPointerCaptureCapture?**: `PointerEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onLostPointerCaptureCapture`

***

### onMouseDown?

> `optional` **onMouseDown?**: `MouseEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onMouseDown`

***

### onMouseDownCapture?

> `optional` **onMouseDownCapture?**: `MouseEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onMouseDownCapture`

***

### onMouseEnter?

> `optional` **onMouseEnter?**: `MouseEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onMouseEnter`

***

### onMouseLeave?

> `optional` **onMouseLeave?**: `MouseEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onMouseLeave`

***

### onMouseMove?

> `optional` **onMouseMove?**: `MouseEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onMouseMove`

***

### onMouseMoveCapture?

> `optional` **onMouseMoveCapture?**: `MouseEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onMouseMoveCapture`

***

### onMouseOut?

> `optional` **onMouseOut?**: `MouseEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onMouseOut`

***

### onMouseOutCapture?

> `optional` **onMouseOutCapture?**: `MouseEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onMouseOutCapture`

***

### onMouseOver?

> `optional` **onMouseOver?**: `MouseEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onMouseOver`

***

### onMouseOverCapture?

> `optional` **onMouseOverCapture?**: `MouseEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onMouseOverCapture`

***

### onMouseUp?

> `optional` **onMouseUp?**: `MouseEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onMouseUp`

***

### onMouseUpCapture?

> `optional` **onMouseUpCapture?**: `MouseEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onMouseUpCapture`

***

### onPaste?

> `optional` **onPaste?**: `ClipboardEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onPaste`

***

### onPasteCapture?

> `optional` **onPasteCapture?**: `ClipboardEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onPasteCapture`

***

### onPause?

> `optional` **onPause?**: `ReactEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onPause`

***

### onPauseCapture?

> `optional` **onPauseCapture?**: `ReactEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onPauseCapture`

***

### onPlay?

> `optional` **onPlay?**: `ReactEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onPlay`

***

### onPlayCapture?

> `optional` **onPlayCapture?**: `ReactEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onPlayCapture`

***

### onPlaying?

> `optional` **onPlaying?**: `ReactEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onPlaying`

***

### onPlayingCapture?

> `optional` **onPlayingCapture?**: `ReactEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onPlayingCapture`

***

### onPointerCancel?

> `optional` **onPointerCancel?**: `PointerEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onPointerCancel`

***

### onPointerCancelCapture?

> `optional` **onPointerCancelCapture?**: `PointerEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onPointerCancelCapture`

***

### onPointerDown?

> `optional` **onPointerDown?**: `PointerEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onPointerDown`

***

### onPointerDownCapture?

> `optional` **onPointerDownCapture?**: `PointerEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onPointerDownCapture`

***

### onPointerEnter?

> `optional` **onPointerEnter?**: `PointerEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onPointerEnter`

***

### onPointerLeave?

> `optional` **onPointerLeave?**: `PointerEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onPointerLeave`

***

### onPointerMove?

> `optional` **onPointerMove?**: `PointerEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onPointerMove`

***

### onPointerMoveCapture?

> `optional` **onPointerMoveCapture?**: `PointerEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onPointerMoveCapture`

***

### onPointerOut?

> `optional` **onPointerOut?**: `PointerEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onPointerOut`

***

### onPointerOutCapture?

> `optional` **onPointerOutCapture?**: `PointerEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onPointerOutCapture`

***

### onPointerOver?

> `optional` **onPointerOver?**: `PointerEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onPointerOver`

***

### onPointerOverCapture?

> `optional` **onPointerOverCapture?**: `PointerEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onPointerOverCapture`

***

### onPointerUp?

> `optional` **onPointerUp?**: `PointerEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onPointerUp`

***

### onPointerUpCapture?

> `optional` **onPointerUpCapture?**: `PointerEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onPointerUpCapture`

***

### onProgress?

> `optional` **onProgress?**: `ReactEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onProgress`

***

### onProgressCapture?

> `optional` **onProgressCapture?**: `ReactEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onProgressCapture`

***

### onRateChange?

> `optional` **onRateChange?**: `ReactEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onRateChange`

***

### onRateChangeCapture?

> `optional` **onRateChangeCapture?**: `ReactEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onRateChangeCapture`

***

### onReset?

> `optional` **onReset?**: `ReactEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onReset`

***

### onResetCapture?

> `optional` **onResetCapture?**: `ReactEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onResetCapture`

***

### onScroll?

> `optional` **onScroll?**: `UIEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onScroll`

***

### onScrollCapture?

> `optional` **onScrollCapture?**: `UIEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onScrollCapture`

***

### onScrollEnd?

> `optional` **onScrollEnd?**: `UIEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onScrollEnd`

***

### onScrollEndCapture?

> `optional` **onScrollEndCapture?**: `UIEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onScrollEndCapture`

***

### onSeeked?

> `optional` **onSeeked?**: `ReactEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onSeeked`

***

### onSeekedCapture?

> `optional` **onSeekedCapture?**: `ReactEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onSeekedCapture`

***

### onSeeking?

> `optional` **onSeeking?**: `ReactEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onSeeking`

***

### onSeekingCapture?

> `optional` **onSeekingCapture?**: `ReactEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onSeekingCapture`

***

### onSelect?

> `optional` **onSelect?**: `ReactEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onSelect`

***

### onSelectCapture?

> `optional` **onSelectCapture?**: `ReactEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onSelectCapture`

***

### onStalled?

> `optional` **onStalled?**: `ReactEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onStalled`

***

### onStalledCapture?

> `optional` **onStalledCapture?**: `ReactEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onStalledCapture`

***

### onSubmit?

> `optional` **onSubmit?**: `SubmitEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onSubmit`

***

### onSubmitCapture?

> `optional` **onSubmitCapture?**: `SubmitEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onSubmitCapture`

***

### onSuspend?

> `optional` **onSuspend?**: `ReactEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onSuspend`

***

### onSuspendCapture?

> `optional` **onSuspendCapture?**: `ReactEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onSuspendCapture`

***

### onTimeUpdate?

> `optional` **onTimeUpdate?**: `ReactEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onTimeUpdate`

***

### onTimeUpdateCapture?

> `optional` **onTimeUpdateCapture?**: `ReactEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onTimeUpdateCapture`

***

### onToggle?

> `optional` **onToggle?**: `ToggleEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onToggle`

***

### onTouchCancel?

> `optional` **onTouchCancel?**: `TouchEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onTouchCancel`

***

### onTouchCancelCapture?

> `optional` **onTouchCancelCapture?**: `TouchEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onTouchCancelCapture`

***

### onTouchEnd?

> `optional` **onTouchEnd?**: `TouchEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onTouchEnd`

***

### onTouchEndCapture?

> `optional` **onTouchEndCapture?**: `TouchEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onTouchEndCapture`

***

### onTouchMove?

> `optional` **onTouchMove?**: `TouchEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onTouchMove`

***

### onTouchMoveCapture?

> `optional` **onTouchMoveCapture?**: `TouchEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onTouchMoveCapture`

***

### onTouchStart?

> `optional` **onTouchStart?**: `TouchEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onTouchStart`

***

### onTouchStartCapture?

> `optional` **onTouchStartCapture?**: `TouchEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onTouchStartCapture`

***

### onTransitionCancel?

> `optional` **onTransitionCancel?**: `TransitionEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onTransitionCancel`

***

### onTransitionCancelCapture?

> `optional` **onTransitionCancelCapture?**: `TransitionEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onTransitionCancelCapture`

***

### onTransitionEnd?

> `optional` **onTransitionEnd?**: `TransitionEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onTransitionEnd`

***

### onTransitionEndCapture?

> `optional` **onTransitionEndCapture?**: `TransitionEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onTransitionEndCapture`

***

### onTransitionRun?

> `optional` **onTransitionRun?**: `TransitionEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onTransitionRun`

***

### onTransitionRunCapture?

> `optional` **onTransitionRunCapture?**: `TransitionEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onTransitionRunCapture`

***

### onTransitionStart?

> `optional` **onTransitionStart?**: `TransitionEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onTransitionStart`

***

### onTransitionStartCapture?

> `optional` **onTransitionStartCapture?**: `TransitionEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onTransitionStartCapture`

***

### onVolumeChange?

> `optional` **onVolumeChange?**: `ReactEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onVolumeChange`

***

### onVolumeChangeCapture?

> `optional` **onVolumeChangeCapture?**: `ReactEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onVolumeChangeCapture`

***

### onWaiting?

> `optional` **onWaiting?**: `ReactEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onWaiting`

***

### onWaitingCapture?

> `optional` **onWaitingCapture?**: `ReactEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onWaitingCapture`

***

### onWheel?

> `optional` **onWheel?**: `WheelEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onWheel`

***

### onWheelCapture?

> `optional` **onWheelCapture?**: `WheelEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`NativeButtonProps.onWheelCapture`

***

### part?

> `optional` **part?**: `string`

#### See

[https://developer.mozilla.org/en-US/docs/Web/HTML/Global\_attributes/part](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/part)

#### Inherited from

`NativeButtonProps.part`

***

### popover?

> `optional` **popover?**: `""` \| `"auto"` \| `"manual"` \| `"hint"`

#### Inherited from

`NativeButtonProps.popover`

***

### popoverTarget?

> `optional` **popoverTarget?**: `string`

#### Inherited from

`NativeButtonProps.popoverTarget`

***

### popoverTargetAction?

> `optional` **popoverTargetAction?**: `"toggle"` \| `"hide"` \| `"show"`

#### Inherited from

`NativeButtonProps.popoverTargetAction`

***

### prefix?

> `optional` **prefix?**: `string`

#### Inherited from

`NativeButtonProps.prefix`

***

### property?

> `optional` **property?**: `string`

#### Inherited from

`NativeButtonProps.property`

***

### radioGroup?

> `optional` **radioGroup?**: `string`

#### Inherited from

`NativeButtonProps.radioGroup`

***

### rel?

> `optional` **rel?**: `string`

#### Inherited from

`NativeButtonProps.rel`

***

### resource?

> `optional` **resource?**: `string`

#### Inherited from

`NativeButtonProps.resource`

***

### results?

> `optional` **results?**: `number`

#### Inherited from

`NativeButtonProps.results`

***

### rev?

> `optional` **rev?**: `string`

#### Inherited from

`NativeButtonProps.rev`

***

### role?

> `optional` **role?**: `AriaRole`

#### Inherited from

`NativeButtonProps.role`

***

### security?

> `optional` **security?**: `string`

#### Inherited from

`NativeButtonProps.security`

***

### size?

> `optional` **size?**: [`ButtonSize`](../type-aliases/ButtonSize.md)

#### Default

`'xlarge'`

***

### slot?

> `optional` **slot?**: `string`

#### Inherited from

`NativeButtonProps.slot`

***

### spellCheck?

> `optional` **spellCheck?**: `Booleanish`

#### Inherited from

`NativeButtonProps.spellCheck`

***

### style?

> `optional` **style?**: [`Style`](../type-aliases/Style.md)

***

### suppressContentEditableWarning?

> `optional` **suppressContentEditableWarning?**: `boolean`

#### Inherited from

`NativeButtonProps.suppressContentEditableWarning`

***

### suppressHydrationWarning?

> `optional` **suppressHydrationWarning?**: `boolean`

#### Inherited from

`NativeButtonProps.suppressHydrationWarning`

***

### tabIndex?

> `optional` **tabIndex?**: `number`

#### Inherited from

`NativeButtonProps.tabIndex`

***

### target?

> `optional` **target?**: `HTMLAttributeAnchorTarget`

#### Inherited from

`Pick.target`

***

### textColor?

> `optional` **textColor?**: `string`

Overrides the resolved text colour.

***

### textStyle?

> `optional` **textStyle?**: [`Style`](../type-aliases/Style.md)

***

### title?

> `optional` **title?**: `string`

#### Inherited from

`NativeButtonProps.title`

***

### translate?

> `optional` **translate?**: `"yes"` \| `"no"`

#### Inherited from

`NativeButtonProps.translate`

***

### type?

> `optional` **type?**: `"reset"` \| `"submit"` \| `"button"`

#### Inherited from

`NativeButtonProps.type`

***

### typeof?

> `optional` **typeof?**: `string`

#### Inherited from

`NativeButtonProps.typeof`

***

### unselectable?

> `optional` **unselectable?**: `"on"` \| `"off"`

#### Inherited from

`NativeButtonProps.unselectable`

***

### value?

> `optional` **value?**: `string` \| `number` \| readonly `string`[]

#### Inherited from

`NativeButtonProps.value`

***

### variant?

> `optional` **variant?**: [`ButtonVariant`](../type-aliases/ButtonVariant.md)

#### Default

`'fill'`

***

### vocab?

> `optional` **vocab?**: `string`

#### Inherited from

`NativeButtonProps.vocab`
