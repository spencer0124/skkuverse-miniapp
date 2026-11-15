---
title: "@skkuverse/ui TextFieldProps (interface)"
type: reference
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-11-15
audience: public
---

# Interface: TextFieldProps

## Extends

- `NativeInputProps`

## Properties

### about?

> `optional` **about?**: `string`

#### Inherited from

`NativeInputProps.about`

***

### accept?

> `optional` **accept?**: `string`

#### Inherited from

`NativeInputProps.accept`

***

### accessKey?

> `optional` **accessKey?**: `string`

#### Inherited from

`NativeInputProps.accessKey`

***

### alt?

> `optional` **alt?**: `string`

#### Inherited from

`NativeInputProps.alt`

***

### aria-activedescendant?

> `optional` **aria-activedescendant?**: `string`

Identifies the currently active element when DOM focus is on a composite widget, textbox, group, or application.

#### Inherited from

`NativeInputProps.aria-activedescendant`

***

### aria-atomic?

> `optional` **aria-atomic?**: `Booleanish`

Indicates whether assistive technologies will present all, or only parts of, the changed region based on the change notifications defined by the aria-relevant attribute.

#### Inherited from

`NativeInputProps.aria-atomic`

***

### aria-autocomplete?

> `optional` **aria-autocomplete?**: `"none"` \| `"inline"` \| `"list"` \| `"both"`

Indicates whether inputting text could trigger display of one or more predictions of the user's intended value for an input and specifies how predictions would be
presented if they are made.

#### Inherited from

`NativeInputProps.aria-autocomplete`

***

### aria-braillelabel?

> `optional` **aria-braillelabel?**: `string`

Defines a string value that labels the current element, which is intended to be converted into Braille.

#### See

aria-label.

#### Inherited from

`NativeInputProps.aria-braillelabel`

***

### aria-brailleroledescription?

> `optional` **aria-brailleroledescription?**: `string`

Defines a human-readable, author-localized abbreviated description for the role of an element, which is intended to be converted into Braille.

#### See

aria-roledescription.

#### Inherited from

`NativeInputProps.aria-brailleroledescription`

***

### aria-busy?

> `optional` **aria-busy?**: `Booleanish`

#### Inherited from

`NativeInputProps.aria-busy`

***

### aria-checked?

> `optional` **aria-checked?**: `boolean` \| `"mixed"` \| `"false"` \| `"true"`

Indicates the current "checked" state of checkboxes, radio buttons, and other widgets.

#### See

 - aria-pressed
 - aria-selected.

#### Inherited from

`NativeInputProps.aria-checked`

***

### aria-colcount?

> `optional` **aria-colcount?**: `number`

Defines the total number of columns in a table, grid, or treegrid.

#### See

aria-colindex.

#### Inherited from

`NativeInputProps.aria-colcount`

***

### aria-colindex?

> `optional` **aria-colindex?**: `number`

Defines an element's column index or position with respect to the total number of columns within a table, grid, or treegrid.

#### See

 - aria-colcount
 - aria-colspan.

#### Inherited from

`NativeInputProps.aria-colindex`

***

### aria-colindextext?

> `optional` **aria-colindextext?**: `string`

Defines a human readable text alternative of aria-colindex.

#### See

aria-rowindextext.

#### Inherited from

`NativeInputProps.aria-colindextext`

***

### aria-colspan?

> `optional` **aria-colspan?**: `number`

Defines the number of columns spanned by a cell or gridcell within a table, grid, or treegrid.

#### See

 - aria-colindex
 - aria-rowspan.

#### Inherited from

`NativeInputProps.aria-colspan`

***

### aria-controls?

> `optional` **aria-controls?**: `string`

Identifies the element (or elements) whose contents or presence are controlled by the current element.

#### See

aria-owns.

#### Inherited from

`NativeInputProps.aria-controls`

***

### aria-current?

> `optional` **aria-current?**: `boolean` \| `"page"` \| `"false"` \| `"true"` \| `"step"` \| `"location"` \| `"date"` \| `"time"`

Indicates the element that represents the current item within a container or set of related elements.

#### Inherited from

`NativeInputProps.aria-current`

***

### aria-describedby?

> `optional` **aria-describedby?**: `string`

Identifies the element (or elements) that describes the object.

#### See

aria-labelledby

#### Inherited from

`NativeInputProps.aria-describedby`

***

### aria-description?

> `optional` **aria-description?**: `string`

Defines a string value that describes or annotates the current element.

#### See

related aria-describedby.

#### Inherited from

`NativeInputProps.aria-description`

***

### aria-details?

> `optional` **aria-details?**: `string`

Identifies the element that provides a detailed, extended description for the object.

#### See

aria-describedby.

#### Inherited from

`NativeInputProps.aria-details`

***

### aria-disabled?

> `optional` **aria-disabled?**: `Booleanish`

Indicates that the element is perceivable but disabled, so it is not editable or otherwise operable.

#### See

 - aria-hidden
 - aria-readonly.

#### Inherited from

`NativeInputProps.aria-disabled`

***

### ~~aria-dropeffect?~~

> `optional` **aria-dropeffect?**: `"none"` \| `"copy"` \| `"link"` \| `"move"` \| `"execute"` \| `"popup"`

Indicates what functions can be performed when a dragged object is released on the drop target.

#### Deprecated

in ARIA 1.1

#### Inherited from

`NativeInputProps.aria-dropeffect`

***

### aria-errormessage?

> `optional` **aria-errormessage?**: `string`

Identifies the element that provides an error message for the object.

#### See

 - aria-invalid
 - aria-describedby.

#### Inherited from

`NativeInputProps.aria-errormessage`

***

### aria-expanded?

> `optional` **aria-expanded?**: `Booleanish`

Indicates whether the element, or another grouping element it controls, is currently expanded or collapsed.

#### Inherited from

`NativeInputProps.aria-expanded`

***

### aria-flowto?

> `optional` **aria-flowto?**: `string`

Identifies the next element (or elements) in an alternate reading order of content which, at the user's discretion,
allows assistive technology to override the general default of reading in document source order.

#### Inherited from

`NativeInputProps.aria-flowto`

***

### ~~aria-grabbed?~~

> `optional` **aria-grabbed?**: `Booleanish`

Indicates an element's "grabbed" state in a drag-and-drop operation.

#### Deprecated

in ARIA 1.1

#### Inherited from

`NativeInputProps.aria-grabbed`

***

### aria-haspopup?

> `optional` **aria-haspopup?**: `boolean` \| `"grid"` \| `"dialog"` \| `"listbox"` \| `"menu"` \| `"tree"` \| `"false"` \| `"true"`

Indicates the availability and type of interactive popup element, such as menu or dialog, that can be triggered by an element.

#### Inherited from

`NativeInputProps.aria-haspopup`

***

### aria-hidden?

> `optional` **aria-hidden?**: `Booleanish`

Indicates whether the element is exposed to an accessibility API.

#### See

aria-disabled.

#### Inherited from

`NativeInputProps.aria-hidden`

***

### aria-invalid?

> `optional` **aria-invalid?**: `boolean` \| `"false"` \| `"true"` \| `"grammar"` \| `"spelling"`

Indicates the entered value does not conform to the format expected by the application.

#### See

aria-errormessage.

#### Inherited from

`NativeInputProps.aria-invalid`

***

### aria-keyshortcuts?

> `optional` **aria-keyshortcuts?**: `string`

Indicates keyboard shortcuts that an author has implemented to activate or give focus to an element.

#### Inherited from

`NativeInputProps.aria-keyshortcuts`

***

### aria-label?

> `optional` **aria-label?**: `string`

Defines a string value that labels the current element.

#### See

aria-labelledby.

#### Inherited from

`NativeInputProps.aria-label`

***

### aria-labelledby?

> `optional` **aria-labelledby?**: `string`

Identifies the element (or elements) that labels the current element.

#### See

aria-describedby.

#### Inherited from

`NativeInputProps.aria-labelledby`

***

### aria-level?

> `optional` **aria-level?**: `number`

Defines the hierarchical level of an element within a structure.

#### Inherited from

`NativeInputProps.aria-level`

***

### aria-live?

> `optional` **aria-live?**: `"off"` \| `"assertive"` \| `"polite"`

Indicates that an element will be updated, and describes the types of updates the user agents, assistive technologies, and user can expect from the live region.

#### Inherited from

`NativeInputProps.aria-live`

***

### aria-modal?

> `optional` **aria-modal?**: `Booleanish`

Indicates whether an element is modal when displayed.

#### Inherited from

`NativeInputProps.aria-modal`

***

### aria-multiline?

> `optional` **aria-multiline?**: `Booleanish`

Indicates whether a text box accepts multiple lines of input or only a single line.

#### Inherited from

`NativeInputProps.aria-multiline`

***

### aria-multiselectable?

> `optional` **aria-multiselectable?**: `Booleanish`

Indicates that the user may select more than one item from the current selectable descendants.

#### Inherited from

`NativeInputProps.aria-multiselectable`

***

### aria-orientation?

> `optional` **aria-orientation?**: `"horizontal"` \| `"vertical"`

Indicates whether the element's orientation is horizontal, vertical, or unknown/ambiguous.

#### Inherited from

`NativeInputProps.aria-orientation`

***

### aria-owns?

> `optional` **aria-owns?**: `string`

Identifies an element (or elements) in order to define a visual, functional, or contextual parent/child relationship
between DOM elements where the DOM hierarchy cannot be used to represent the relationship.

#### See

aria-controls.

#### Inherited from

`NativeInputProps.aria-owns`

***

### aria-placeholder?

> `optional` **aria-placeholder?**: `string`

Defines a short hint (a word or short phrase) intended to aid the user with data entry when the control has no value.
A hint could be a sample value or a brief description of the expected format.

#### Inherited from

`NativeInputProps.aria-placeholder`

***

### aria-posinset?

> `optional` **aria-posinset?**: `number`

Defines an element's number or position in the current set of listitems or treeitems. Not required if all elements in the set are present in the DOM.

#### See

aria-setsize.

#### Inherited from

`NativeInputProps.aria-posinset`

***

### aria-pressed?

> `optional` **aria-pressed?**: `boolean` \| `"mixed"` \| `"false"` \| `"true"`

Indicates the current "pressed" state of toggle buttons.

#### See

 - aria-checked
 - aria-selected.

#### Inherited from

`NativeInputProps.aria-pressed`

***

### aria-readonly?

> `optional` **aria-readonly?**: `Booleanish`

Indicates that the element is not editable, but is otherwise operable.

#### See

aria-disabled.

#### Inherited from

`NativeInputProps.aria-readonly`

***

### aria-relevant?

> `optional` **aria-relevant?**: `"text"` \| `"all"` \| `"additions"` \| `"additions removals"` \| `"additions text"` \| `"removals"` \| `"removals additions"` \| `"removals text"` \| `"text additions"` \| `"text removals"`

Indicates what notifications the user agent will trigger when the accessibility tree within a live region is modified.

#### See

aria-atomic.

#### Inherited from

`NativeInputProps.aria-relevant`

***

### aria-required?

> `optional` **aria-required?**: `Booleanish`

Indicates that user input is required on the element before a form may be submitted.

#### Inherited from

`NativeInputProps.aria-required`

***

### aria-roledescription?

> `optional` **aria-roledescription?**: `string`

Defines a human-readable, author-localized description for the role of an element.

#### Inherited from

`NativeInputProps.aria-roledescription`

***

### aria-rowcount?

> `optional` **aria-rowcount?**: `number`

Defines the total number of rows in a table, grid, or treegrid.

#### See

aria-rowindex.

#### Inherited from

`NativeInputProps.aria-rowcount`

***

### aria-rowindex?

> `optional` **aria-rowindex?**: `number`

Defines an element's row index or position with respect to the total number of rows within a table, grid, or treegrid.

#### See

 - aria-rowcount
 - aria-rowspan.

#### Inherited from

`NativeInputProps.aria-rowindex`

***

### aria-rowindextext?

> `optional` **aria-rowindextext?**: `string`

Defines a human readable text alternative of aria-rowindex.

#### See

aria-colindextext.

#### Inherited from

`NativeInputProps.aria-rowindextext`

***

### aria-rowspan?

> `optional` **aria-rowspan?**: `number`

Defines the number of rows spanned by a cell or gridcell within a table, grid, or treegrid.

#### See

 - aria-rowindex
 - aria-colspan.

#### Inherited from

`NativeInputProps.aria-rowspan`

***

### aria-selected?

> `optional` **aria-selected?**: `Booleanish`

Indicates the current "selected" state of various widgets.

#### See

 - aria-checked
 - aria-pressed.

#### Inherited from

`NativeInputProps.aria-selected`

***

### aria-setsize?

> `optional` **aria-setsize?**: `number`

Defines the number of items in the current set of listitems or treeitems. Not required if all elements in the set are present in the DOM.

#### See

aria-posinset.

#### Inherited from

`NativeInputProps.aria-setsize`

***

### aria-sort?

> `optional` **aria-sort?**: `"none"` \| `"ascending"` \| `"descending"` \| `"other"`

Indicates if items in a table or grid are sorted in ascending or descending order.

#### Inherited from

`NativeInputProps.aria-sort`

***

### aria-valuemax?

> `optional` **aria-valuemax?**: `number`

Defines the maximum allowed value for a range widget.

#### Inherited from

`NativeInputProps.aria-valuemax`

***

### aria-valuemin?

> `optional` **aria-valuemin?**: `number`

Defines the minimum allowed value for a range widget.

#### Inherited from

`NativeInputProps.aria-valuemin`

***

### aria-valuenow?

> `optional` **aria-valuenow?**: `number`

Defines the current value for a range widget.

#### See

aria-valuetext.

#### Inherited from

`NativeInputProps.aria-valuenow`

***

### aria-valuetext?

> `optional` **aria-valuetext?**: `string`

Defines the human readable text alternative of aria-valuenow for a range widget.

#### Inherited from

`NativeInputProps.aria-valuetext`

***

### autoCapitalize?

> `optional` **autoCapitalize?**: `"none"` \| `"on"` \| `string` & `object` \| `"off"` \| `"sentences"` \| `"words"` \| `"characters"`

#### Inherited from

`NativeInputProps.autoCapitalize`

***

### autoComplete?

> `optional` **autoComplete?**: `HTMLInputAutoCompleteAttribute`

#### Inherited from

`NativeInputProps.autoComplete`

***

### autoCorrect?

> `optional` **autoCorrect?**: `string`

#### Inherited from

`NativeInputProps.autoCorrect`

***

### autoFocus?

> `optional` **autoFocus?**: `boolean`

#### Inherited from

`NativeInputProps.autoFocus`

***

### autoSave?

> `optional` **autoSave?**: `string`

#### Inherited from

`NativeInputProps.autoSave`

***

### capture?

> `optional` **capture?**: `boolean` \| `"user"` \| `"environment"`

#### Inherited from

`NativeInputProps.capture`

***

### checked?

> `optional` **checked?**: `boolean`

#### Inherited from

`NativeInputProps.checked`

***

### children?

> `optional` **children?**: `ReactNode`

#### Inherited from

`NativeInputProps.children`

***

### className?

> `optional` **className?**: `string`

#### Inherited from

`NativeInputProps.className`

***

### color?

> `optional` **color?**: `string`

#### Inherited from

`NativeInputProps.color`

***

### content?

> `optional` **content?**: `string`

#### Inherited from

`NativeInputProps.content`

***

### contentEditable?

> `optional` **contentEditable?**: `"inherit"` \| `Booleanish` \| `"plaintext-only"`

#### Inherited from

`NativeInputProps.contentEditable`

***

### contextMenu?

> `optional` **contextMenu?**: `string`

#### Inherited from

`NativeInputProps.contextMenu`

***

### dangerouslySetInnerHTML?

> `optional` **dangerouslySetInnerHTML?**: `object`

#### \_\_html

> **\_\_html**: `string` \| `TrustedHTML`

#### Inherited from

`NativeInputProps.dangerouslySetInnerHTML`

***

### datatype?

> `optional` **datatype?**: `string`

#### Inherited from

`NativeInputProps.datatype`

***

### defaultChecked?

> `optional` **defaultChecked?**: `boolean`

#### Inherited from

`NativeInputProps.defaultChecked`

***

### defaultValue?

> `optional` **defaultValue?**: `string` \| `number` \| readonly `string`[]

#### Inherited from

`NativeInputProps.defaultValue`

***

### dir?

> `optional` **dir?**: `string`

#### Inherited from

`NativeInputProps.dir`

***

### disabled?

> `optional` **disabled?**: `boolean`

#### Default

`false`

#### Overrides

`NativeInputProps.disabled`

***

### draggable?

> `optional` **draggable?**: `Booleanish`

#### Inherited from

`NativeInputProps.draggable`

***

### enterKeyHint?

> `optional` **enterKeyHint?**: `"search"` \| `"next"` \| `"enter"` \| `"done"` \| `"go"` \| `"previous"` \| `"send"`

#### Inherited from

`NativeInputProps.enterKeyHint`

***

### exportparts?

> `optional` **exportparts?**: `string`

#### See

[https://developer.mozilla.org/en-US/docs/Web/HTML/Global\_attributes/exportparts](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/exportparts)

#### Inherited from

`NativeInputProps.exportparts`

***

### form?

> `optional` **form?**: `string`

#### Inherited from

`NativeInputProps.form`

***

### formAction?

> `optional` **formAction?**: `string` \| ((`formData`) => `void` \| `Promise`\<`void`\>)

#### Inherited from

`NativeInputProps.formAction`

***

### format?

> `optional` **format?**: `object`

#### reset?

> `optional` **reset?**: (`formattedValue`) => `string`

##### Parameters

###### formattedValue

`string`

##### Returns

`string`

#### transform

> **transform**: (`value`) => `string`

##### Parameters

###### value

`string`

##### Returns

`string`

***

### formEncType?

> `optional` **formEncType?**: `string`

#### Inherited from

`NativeInputProps.formEncType`

***

### formMethod?

> `optional` **formMethod?**: `string`

#### Inherited from

`NativeInputProps.formMethod`

***

### formNoValidate?

> `optional` **formNoValidate?**: `boolean`

#### Inherited from

`NativeInputProps.formNoValidate`

***

### formTarget?

> `optional` **formTarget?**: `string`

#### Inherited from

`NativeInputProps.formTarget`

***

### hasError?

> `optional` **hasError?**: `boolean`

#### Default

`false`

***

### height?

> `optional` **height?**: `string` \| `number`

#### Inherited from

`NativeInputProps.height`

***

### help?

> `optional` **help?**: `ReactNode`

***

### hidden?

> `optional` **hidden?**: `boolean`

#### Inherited from

`NativeInputProps.hidden`

***

### id?

> `optional` **id?**: `string`

#### Inherited from

`NativeInputProps.id`

***

### inert?

> `optional` **inert?**: `boolean`

#### See

[https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/inert](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/inert)

#### Inherited from

`NativeInputProps.inert`

***

### inlist?

> `optional` **inlist?**: `any`

#### Inherited from

`NativeInputProps.inlist`

***

### inputMode?

> `optional` **inputMode?**: `"none"` \| `"url"` \| `"text"` \| `"search"` \| `"tel"` \| `"email"` \| `"numeric"` \| `"decimal"`

Hints at the type of data that might be entered by the user while editing the element or its contents

#### See

[https://html.spec.whatwg.org/multipage/interaction.html#input-modalities:-the-inputmode-attribute](https://html.spec.whatwg.org/multipage/interaction.html#input-modalities:-the-inputmode-attribute)

#### Inherited from

`NativeInputProps.inputMode`

***

### is?

> `optional` **is?**: `string`

Specify that a standard HTML element should behave like a defined custom built-in element

#### See

[https://html.spec.whatwg.org/multipage/custom-elements.html#attr-is](https://html.spec.whatwg.org/multipage/custom-elements.html#attr-is)

#### Inherited from

`NativeInputProps.is`

***

### itemID?

> `optional` **itemID?**: `string`

#### Inherited from

`NativeInputProps.itemID`

***

### itemProp?

> `optional` **itemProp?**: `string`

#### Inherited from

`NativeInputProps.itemProp`

***

### itemRef?

> `optional` **itemRef?**: `string`

#### Inherited from

`NativeInputProps.itemRef`

***

### itemScope?

> `optional` **itemScope?**: `boolean`

#### Inherited from

`NativeInputProps.itemScope`

***

### itemType?

> `optional` **itemType?**: `string`

#### Inherited from

`NativeInputProps.itemType`

***

### label?

> `optional` **label?**: `string`

***

### labelOption?

> `optional` **labelOption?**: [`TextFieldLabelOption`](../README.md#textfieldlabeloption)

#### Default

`'appear'`

***

### lang?

> `optional` **lang?**: `string`

#### Inherited from

`NativeInputProps.lang`

***

### list?

> `optional` **list?**: `string`

#### Inherited from

`NativeInputProps.list`

***

### max?

> `optional` **max?**: `string` \| `number`

#### Inherited from

`NativeInputProps.max`

***

### maxLength?

> `optional` **maxLength?**: `number`

#### Inherited from

`NativeInputProps.maxLength`

***

### min?

> `optional` **min?**: `string` \| `number`

#### Inherited from

`NativeInputProps.min`

***

### minLength?

> `optional` **minLength?**: `number`

#### Inherited from

`NativeInputProps.minLength`

***

### multiple?

> `optional` **multiple?**: `boolean`

#### Inherited from

`NativeInputProps.multiple`

***

### name?

> `optional` **name?**: `string`

#### Inherited from

`NativeInputProps.name`

***

### nonce?

> `optional` **nonce?**: `string`

#### Inherited from

`NativeInputProps.nonce`

***

### onAbort?

> `optional` **onAbort?**: `ReactEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onAbort`

***

### onAbortCapture?

> `optional` **onAbortCapture?**: `ReactEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onAbortCapture`

***

### onAnimationEnd?

> `optional` **onAnimationEnd?**: `AnimationEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onAnimationEnd`

***

### onAnimationEndCapture?

> `optional` **onAnimationEndCapture?**: `AnimationEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onAnimationEndCapture`

***

### onAnimationIteration?

> `optional` **onAnimationIteration?**: `AnimationEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onAnimationIteration`

***

### onAnimationIterationCapture?

> `optional` **onAnimationIterationCapture?**: `AnimationEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onAnimationIterationCapture`

***

### onAnimationStart?

> `optional` **onAnimationStart?**: `AnimationEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onAnimationStart`

***

### onAnimationStartCapture?

> `optional` **onAnimationStartCapture?**: `AnimationEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onAnimationStartCapture`

***

### onAuxClick?

> `optional` **onAuxClick?**: `MouseEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onAuxClick`

***

### onAuxClickCapture?

> `optional` **onAuxClickCapture?**: `MouseEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onAuxClickCapture`

***

### onBeforeInput?

> `optional` **onBeforeInput?**: `InputEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onBeforeInput`

***

### onBeforeInputCapture?

> `optional` **onBeforeInputCapture?**: `InputEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onBeforeInputCapture`

***

### onBeforeToggle?

> `optional` **onBeforeToggle?**: `ToggleEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onBeforeToggle`

***

### onBlur?

> `optional` **onBlur?**: (`event`) => `void`

#### Parameters

##### event

`FocusEvent`\<`HTMLInputElement`\>

#### Returns

`void`

#### Overrides

`NativeInputProps.onBlur`

***

### onBlurCapture?

> `optional` **onBlurCapture?**: `FocusEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onBlurCapture`

***

### onCanPlay?

> `optional` **onCanPlay?**: `ReactEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onCanPlay`

***

### onCanPlayCapture?

> `optional` **onCanPlayCapture?**: `ReactEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onCanPlayCapture`

***

### onCanPlayThrough?

> `optional` **onCanPlayThrough?**: `ReactEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onCanPlayThrough`

***

### onCanPlayThroughCapture?

> `optional` **onCanPlayThroughCapture?**: `ReactEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onCanPlayThroughCapture`

***

### onChange?

> `optional` **onChange?**: (`event`) => `void`

#### Parameters

##### event

`ChangeEvent`\<`HTMLInputElement`\>

#### Returns

`void`

#### Overrides

`NativeInputProps.onChange`

***

### onChangeCapture?

> `optional` **onChangeCapture?**: `ChangeEventHandler`\<`HTMLInputElement`, `Element`\>

#### Inherited from

`NativeInputProps.onChangeCapture`

***

### onClick?

> `optional` **onClick?**: `MouseEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onClick`

***

### onClickCapture?

> `optional` **onClickCapture?**: `MouseEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onClickCapture`

***

### onCompositionEnd?

> `optional` **onCompositionEnd?**: `CompositionEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onCompositionEnd`

***

### onCompositionEndCapture?

> `optional` **onCompositionEndCapture?**: `CompositionEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onCompositionEndCapture`

***

### onCompositionStart?

> `optional` **onCompositionStart?**: `CompositionEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onCompositionStart`

***

### onCompositionStartCapture?

> `optional` **onCompositionStartCapture?**: `CompositionEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onCompositionStartCapture`

***

### onCompositionUpdate?

> `optional` **onCompositionUpdate?**: `CompositionEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onCompositionUpdate`

***

### onCompositionUpdateCapture?

> `optional` **onCompositionUpdateCapture?**: `CompositionEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onCompositionUpdateCapture`

***

### onContextMenu?

> `optional` **onContextMenu?**: `MouseEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onContextMenu`

***

### onContextMenuCapture?

> `optional` **onContextMenuCapture?**: `MouseEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onContextMenuCapture`

***

### onCopy?

> `optional` **onCopy?**: `ClipboardEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onCopy`

***

### onCopyCapture?

> `optional` **onCopyCapture?**: `ClipboardEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onCopyCapture`

***

### onCut?

> `optional` **onCut?**: `ClipboardEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onCut`

***

### onCutCapture?

> `optional` **onCutCapture?**: `ClipboardEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onCutCapture`

***

### onDoubleClick?

> `optional` **onDoubleClick?**: `MouseEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onDoubleClick`

***

### onDoubleClickCapture?

> `optional` **onDoubleClickCapture?**: `MouseEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onDoubleClickCapture`

***

### onDrag?

> `optional` **onDrag?**: `DragEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onDrag`

***

### onDragCapture?

> `optional` **onDragCapture?**: `DragEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onDragCapture`

***

### onDragEnd?

> `optional` **onDragEnd?**: `DragEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onDragEnd`

***

### onDragEndCapture?

> `optional` **onDragEndCapture?**: `DragEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onDragEndCapture`

***

### onDragEnter?

> `optional` **onDragEnter?**: `DragEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onDragEnter`

***

### onDragEnterCapture?

> `optional` **onDragEnterCapture?**: `DragEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onDragEnterCapture`

***

### onDragExit?

> `optional` **onDragExit?**: `DragEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onDragExit`

***

### onDragExitCapture?

> `optional` **onDragExitCapture?**: `DragEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onDragExitCapture`

***

### onDragLeave?

> `optional` **onDragLeave?**: `DragEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onDragLeave`

***

### onDragLeaveCapture?

> `optional` **onDragLeaveCapture?**: `DragEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onDragLeaveCapture`

***

### onDragOver?

> `optional` **onDragOver?**: `DragEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onDragOver`

***

### onDragOverCapture?

> `optional` **onDragOverCapture?**: `DragEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onDragOverCapture`

***

### onDragStart?

> `optional` **onDragStart?**: `DragEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onDragStart`

***

### onDragStartCapture?

> `optional` **onDragStartCapture?**: `DragEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onDragStartCapture`

***

### onDrop?

> `optional` **onDrop?**: `DragEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onDrop`

***

### onDropCapture?

> `optional` **onDropCapture?**: `DragEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onDropCapture`

***

### onDurationChange?

> `optional` **onDurationChange?**: `ReactEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onDurationChange`

***

### onDurationChangeCapture?

> `optional` **onDurationChangeCapture?**: `ReactEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onDurationChangeCapture`

***

### onEmptied?

> `optional` **onEmptied?**: `ReactEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onEmptied`

***

### onEmptiedCapture?

> `optional` **onEmptiedCapture?**: `ReactEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onEmptiedCapture`

***

### onEncrypted?

> `optional` **onEncrypted?**: `ReactEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onEncrypted`

***

### onEncryptedCapture?

> `optional` **onEncryptedCapture?**: `ReactEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onEncryptedCapture`

***

### onEnded?

> `optional` **onEnded?**: `ReactEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onEnded`

***

### onEndedCapture?

> `optional` **onEndedCapture?**: `ReactEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onEndedCapture`

***

### onError?

> `optional` **onError?**: `ReactEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onError`

***

### onErrorCapture?

> `optional` **onErrorCapture?**: `ReactEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onErrorCapture`

***

### onFocus?

> `optional` **onFocus?**: (`event`) => `void`

#### Parameters

##### event

`FocusEvent`\<`HTMLInputElement`\>

#### Returns

`void`

#### Overrides

`NativeInputProps.onFocus`

***

### onFocusCapture?

> `optional` **onFocusCapture?**: `FocusEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onFocusCapture`

***

### onGotPointerCapture?

> `optional` **onGotPointerCapture?**: `PointerEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onGotPointerCapture`

***

### onGotPointerCaptureCapture?

> `optional` **onGotPointerCaptureCapture?**: `PointerEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onGotPointerCaptureCapture`

***

### onInput?

> `optional` **onInput?**: `InputEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onInput`

***

### onInputCapture?

> `optional` **onInputCapture?**: `InputEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onInputCapture`

***

### onInvalid?

> `optional` **onInvalid?**: `ReactEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onInvalid`

***

### onInvalidCapture?

> `optional` **onInvalidCapture?**: `ReactEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onInvalidCapture`

***

### onKeyDown?

> `optional` **onKeyDown?**: `KeyboardEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onKeyDown`

***

### onKeyDownCapture?

> `optional` **onKeyDownCapture?**: `KeyboardEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onKeyDownCapture`

***

### ~~onKeyPress?~~

> `optional` **onKeyPress?**: `KeyboardEventHandler`\<`HTMLInputElement`\>

#### Deprecated

Use `onKeyUp` or `onKeyDown` instead

#### Inherited from

`NativeInputProps.onKeyPress`

***

### ~~onKeyPressCapture?~~

> `optional` **onKeyPressCapture?**: `KeyboardEventHandler`\<`HTMLInputElement`\>

#### Deprecated

Use `onKeyUpCapture` or `onKeyDownCapture` instead

#### Inherited from

`NativeInputProps.onKeyPressCapture`

***

### onKeyUp?

> `optional` **onKeyUp?**: `KeyboardEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onKeyUp`

***

### onKeyUpCapture?

> `optional` **onKeyUpCapture?**: `KeyboardEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onKeyUpCapture`

***

### onLoad?

> `optional` **onLoad?**: `ReactEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onLoad`

***

### onLoadCapture?

> `optional` **onLoadCapture?**: `ReactEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onLoadCapture`

***

### onLoadedData?

> `optional` **onLoadedData?**: `ReactEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onLoadedData`

***

### onLoadedDataCapture?

> `optional` **onLoadedDataCapture?**: `ReactEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onLoadedDataCapture`

***

### onLoadedMetadata?

> `optional` **onLoadedMetadata?**: `ReactEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onLoadedMetadata`

***

### onLoadedMetadataCapture?

> `optional` **onLoadedMetadataCapture?**: `ReactEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onLoadedMetadataCapture`

***

### onLoadStart?

> `optional` **onLoadStart?**: `ReactEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onLoadStart`

***

### onLoadStartCapture?

> `optional` **onLoadStartCapture?**: `ReactEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onLoadStartCapture`

***

### onLostPointerCapture?

> `optional` **onLostPointerCapture?**: `PointerEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onLostPointerCapture`

***

### onLostPointerCaptureCapture?

> `optional` **onLostPointerCaptureCapture?**: `PointerEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onLostPointerCaptureCapture`

***

### onMouseDown?

> `optional` **onMouseDown?**: `MouseEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onMouseDown`

***

### onMouseDownCapture?

> `optional` **onMouseDownCapture?**: `MouseEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onMouseDownCapture`

***

### onMouseEnter?

> `optional` **onMouseEnter?**: `MouseEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onMouseEnter`

***

### onMouseLeave?

> `optional` **onMouseLeave?**: `MouseEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onMouseLeave`

***

### onMouseMove?

> `optional` **onMouseMove?**: `MouseEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onMouseMove`

***

### onMouseMoveCapture?

> `optional` **onMouseMoveCapture?**: `MouseEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onMouseMoveCapture`

***

### onMouseOut?

> `optional` **onMouseOut?**: `MouseEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onMouseOut`

***

### onMouseOutCapture?

> `optional` **onMouseOutCapture?**: `MouseEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onMouseOutCapture`

***

### onMouseOver?

> `optional` **onMouseOver?**: `MouseEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onMouseOver`

***

### onMouseOverCapture?

> `optional` **onMouseOverCapture?**: `MouseEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onMouseOverCapture`

***

### onMouseUp?

> `optional` **onMouseUp?**: `MouseEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onMouseUp`

***

### onMouseUpCapture?

> `optional` **onMouseUpCapture?**: `MouseEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onMouseUpCapture`

***

### onPaste?

> `optional` **onPaste?**: `ClipboardEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onPaste`

***

### onPasteCapture?

> `optional` **onPasteCapture?**: `ClipboardEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onPasteCapture`

***

### onPause?

> `optional` **onPause?**: `ReactEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onPause`

***

### onPauseCapture?

> `optional` **onPauseCapture?**: `ReactEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onPauseCapture`

***

### onPlay?

> `optional` **onPlay?**: `ReactEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onPlay`

***

### onPlayCapture?

> `optional` **onPlayCapture?**: `ReactEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onPlayCapture`

***

### onPlaying?

> `optional` **onPlaying?**: `ReactEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onPlaying`

***

### onPlayingCapture?

> `optional` **onPlayingCapture?**: `ReactEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onPlayingCapture`

***

### onPointerCancel?

> `optional` **onPointerCancel?**: `PointerEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onPointerCancel`

***

### onPointerCancelCapture?

> `optional` **onPointerCancelCapture?**: `PointerEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onPointerCancelCapture`

***

### onPointerDown?

> `optional` **onPointerDown?**: `PointerEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onPointerDown`

***

### onPointerDownCapture?

> `optional` **onPointerDownCapture?**: `PointerEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onPointerDownCapture`

***

### onPointerEnter?

> `optional` **onPointerEnter?**: `PointerEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onPointerEnter`

***

### onPointerLeave?

> `optional` **onPointerLeave?**: `PointerEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onPointerLeave`

***

### onPointerMove?

> `optional` **onPointerMove?**: `PointerEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onPointerMove`

***

### onPointerMoveCapture?

> `optional` **onPointerMoveCapture?**: `PointerEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onPointerMoveCapture`

***

### onPointerOut?

> `optional` **onPointerOut?**: `PointerEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onPointerOut`

***

### onPointerOutCapture?

> `optional` **onPointerOutCapture?**: `PointerEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onPointerOutCapture`

***

### onPointerOver?

> `optional` **onPointerOver?**: `PointerEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onPointerOver`

***

### onPointerOverCapture?

> `optional` **onPointerOverCapture?**: `PointerEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onPointerOverCapture`

***

### onPointerUp?

> `optional` **onPointerUp?**: `PointerEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onPointerUp`

***

### onPointerUpCapture?

> `optional` **onPointerUpCapture?**: `PointerEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onPointerUpCapture`

***

### onProgress?

> `optional` **onProgress?**: `ReactEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onProgress`

***

### onProgressCapture?

> `optional` **onProgressCapture?**: `ReactEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onProgressCapture`

***

### onRateChange?

> `optional` **onRateChange?**: `ReactEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onRateChange`

***

### onRateChangeCapture?

> `optional` **onRateChangeCapture?**: `ReactEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onRateChangeCapture`

***

### onReset?

> `optional` **onReset?**: `ReactEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onReset`

***

### onResetCapture?

> `optional` **onResetCapture?**: `ReactEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onResetCapture`

***

### onScroll?

> `optional` **onScroll?**: `UIEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onScroll`

***

### onScrollCapture?

> `optional` **onScrollCapture?**: `UIEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onScrollCapture`

***

### onScrollEnd?

> `optional` **onScrollEnd?**: `UIEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onScrollEnd`

***

### onScrollEndCapture?

> `optional` **onScrollEndCapture?**: `UIEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onScrollEndCapture`

***

### onSeeked?

> `optional` **onSeeked?**: `ReactEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onSeeked`

***

### onSeekedCapture?

> `optional` **onSeekedCapture?**: `ReactEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onSeekedCapture`

***

### onSeeking?

> `optional` **onSeeking?**: `ReactEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onSeeking`

***

### onSeekingCapture?

> `optional` **onSeekingCapture?**: `ReactEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onSeekingCapture`

***

### onSelect?

> `optional` **onSelect?**: `ReactEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onSelect`

***

### onSelectCapture?

> `optional` **onSelectCapture?**: `ReactEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onSelectCapture`

***

### onStalled?

> `optional` **onStalled?**: `ReactEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onStalled`

***

### onStalledCapture?

> `optional` **onStalledCapture?**: `ReactEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onStalledCapture`

***

### onSubmit?

> `optional` **onSubmit?**: `SubmitEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onSubmit`

***

### onSubmitCapture?

> `optional` **onSubmitCapture?**: `SubmitEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onSubmitCapture`

***

### onSuspend?

> `optional` **onSuspend?**: `ReactEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onSuspend`

***

### onSuspendCapture?

> `optional` **onSuspendCapture?**: `ReactEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onSuspendCapture`

***

### onTimeUpdate?

> `optional` **onTimeUpdate?**: `ReactEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onTimeUpdate`

***

### onTimeUpdateCapture?

> `optional` **onTimeUpdateCapture?**: `ReactEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onTimeUpdateCapture`

***

### onToggle?

> `optional` **onToggle?**: `ToggleEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onToggle`

***

### onTouchCancel?

> `optional` **onTouchCancel?**: `TouchEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onTouchCancel`

***

### onTouchCancelCapture?

> `optional` **onTouchCancelCapture?**: `TouchEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onTouchCancelCapture`

***

### onTouchEnd?

> `optional` **onTouchEnd?**: `TouchEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onTouchEnd`

***

### onTouchEndCapture?

> `optional` **onTouchEndCapture?**: `TouchEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onTouchEndCapture`

***

### onTouchMove?

> `optional` **onTouchMove?**: `TouchEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onTouchMove`

***

### onTouchMoveCapture?

> `optional` **onTouchMoveCapture?**: `TouchEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onTouchMoveCapture`

***

### onTouchStart?

> `optional` **onTouchStart?**: `TouchEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onTouchStart`

***

### onTouchStartCapture?

> `optional` **onTouchStartCapture?**: `TouchEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onTouchStartCapture`

***

### onTransitionCancel?

> `optional` **onTransitionCancel?**: `TransitionEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onTransitionCancel`

***

### onTransitionCancelCapture?

> `optional` **onTransitionCancelCapture?**: `TransitionEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onTransitionCancelCapture`

***

### onTransitionEnd?

> `optional` **onTransitionEnd?**: `TransitionEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onTransitionEnd`

***

### onTransitionEndCapture?

> `optional` **onTransitionEndCapture?**: `TransitionEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onTransitionEndCapture`

***

### onTransitionRun?

> `optional` **onTransitionRun?**: `TransitionEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onTransitionRun`

***

### onTransitionRunCapture?

> `optional` **onTransitionRunCapture?**: `TransitionEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onTransitionRunCapture`

***

### onTransitionStart?

> `optional` **onTransitionStart?**: `TransitionEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onTransitionStart`

***

### onTransitionStartCapture?

> `optional` **onTransitionStartCapture?**: `TransitionEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onTransitionStartCapture`

***

### onVolumeChange?

> `optional` **onVolumeChange?**: `ReactEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onVolumeChange`

***

### onVolumeChangeCapture?

> `optional` **onVolumeChangeCapture?**: `ReactEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onVolumeChangeCapture`

***

### onWaiting?

> `optional` **onWaiting?**: `ReactEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onWaiting`

***

### onWaitingCapture?

> `optional` **onWaitingCapture?**: `ReactEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onWaitingCapture`

***

### onWheel?

> `optional` **onWheel?**: `WheelEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onWheel`

***

### onWheelCapture?

> `optional` **onWheelCapture?**: `WheelEventHandler`\<`HTMLInputElement`\>

#### Inherited from

`NativeInputProps.onWheelCapture`

***

### paddingBottom?

> `optional` **paddingBottom?**: `string` \| `number`

***

### paddingTop?

> `optional` **paddingTop?**: `string` \| `number`

***

### part?

> `optional` **part?**: `string`

#### See

[https://developer.mozilla.org/en-US/docs/Web/HTML/Global\_attributes/part](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/part)

#### Inherited from

`NativeInputProps.part`

***

### pattern?

> `optional` **pattern?**: `string`

#### Inherited from

`NativeInputProps.pattern`

***

### placeholder?

> `optional` **placeholder?**: `string`

#### Inherited from

`NativeInputProps.placeholder`

***

### popover?

> `optional` **popover?**: `""` \| `"auto"` \| `"manual"` \| `"hint"`

#### Inherited from

`NativeInputProps.popover`

***

### popoverTarget?

> `optional` **popoverTarget?**: `string`

#### Inherited from

`NativeInputProps.popoverTarget`

***

### popoverTargetAction?

> `optional` **popoverTargetAction?**: `"toggle"` \| `"hide"` \| `"show"`

#### Inherited from

`NativeInputProps.popoverTargetAction`

***

### prefix?

> `optional` **prefix?**: `string`

***

### property?

> `optional` **property?**: `string`

#### Inherited from

`NativeInputProps.property`

***

### radioGroup?

> `optional` **radioGroup?**: `string`

#### Inherited from

`NativeInputProps.radioGroup`

***

### readOnly?

> `optional` **readOnly?**: `boolean`

#### Inherited from

`NativeInputProps.readOnly`

***

### rel?

> `optional` **rel?**: `string`

#### Inherited from

`NativeInputProps.rel`

***

### required?

> `optional` **required?**: `boolean`

#### Inherited from

`NativeInputProps.required`

***

### resource?

> `optional` **resource?**: `string`

#### Inherited from

`NativeInputProps.resource`

***

### results?

> `optional` **results?**: `number`

#### Inherited from

`NativeInputProps.results`

***

### rev?

> `optional` **rev?**: `string`

#### Inherited from

`NativeInputProps.rev`

***

### right?

> `optional` **right?**: `ReactNode`

***

### role?

> `optional` **role?**: `AriaRole`

#### Inherited from

`NativeInputProps.role`

***

### security?

> `optional` **security?**: `string`

#### Inherited from

`NativeInputProps.security`

***

### slot?

> `optional` **slot?**: `string`

#### Inherited from

`NativeInputProps.slot`

***

### spellCheck?

> `optional` **spellCheck?**: `Booleanish`

#### Inherited from

`NativeInputProps.spellCheck`

***

### src?

> `optional` **src?**: `string`

#### Inherited from

`NativeInputProps.src`

***

### step?

> `optional` **step?**: `string` \| `number`

#### Inherited from

`NativeInputProps.step`

***

### style?

> `optional` **style?**: [`Style`](../README.md#style)

***

### suffix?

> `optional` **suffix?**: `string`

***

### suppressContentEditableWarning?

> `optional` **suppressContentEditableWarning?**: `boolean`

#### Inherited from

`NativeInputProps.suppressContentEditableWarning`

***

### suppressHydrationWarning?

> `optional` **suppressHydrationWarning?**: `boolean`

#### Inherited from

`NativeInputProps.suppressHydrationWarning`

***

### tabIndex?

> `optional` **tabIndex?**: `number`

#### Inherited from

`NativeInputProps.tabIndex`

***

### title?

> `optional` **title?**: `string`

#### Inherited from

`NativeInputProps.title`

***

### translate?

> `optional` **translate?**: `"yes"` \| `"no"`

#### Inherited from

`NativeInputProps.translate`

***

### type?

> `optional` **type?**: `HTMLInputTypeAttribute`

#### Inherited from

`NativeInputProps.type`

***

### typeof?

> `optional` **typeof?**: `string`

#### Inherited from

`NativeInputProps.typeof`

***

### unselectable?

> `optional` **unselectable?**: `"on"` \| `"off"`

#### Inherited from

`NativeInputProps.unselectable`

***

### value?

> `optional` **value?**: `string` \| `number` \| readonly `string`[]

#### Inherited from

`NativeInputProps.value`

***

### variant

> **variant**: [`TextFieldVariant`](../README.md#textfieldvariant)

***

### vocab?

> `optional` **vocab?**: `string`

#### Inherited from

`NativeInputProps.vocab`

***

### width?

> `optional` **width?**: `string` \| `number`

#### Inherited from

`NativeInputProps.width`
