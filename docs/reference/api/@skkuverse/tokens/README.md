---
title: "@skkuverse/tokens"
type: reference
status: accepted
owner: zoyoong124@gmail.com
last-updated: 2026-11-15
audience: public
---

# @skkuverse/tokens

## Interfaces

- [CssTextStyle](interfaces/CssTextStyle.md)
- [SdsTextStyle](interfaces/SdsTextStyle.md)

## Variables

### CssRadius

> `const` **CssRadius**: `PxScale`\<\{ `full`: `20`; `lg`: `14`; `md`: `12`; `sm`: `8`; `xl`: `16`; `xs`: `4`; \}\>

Radius scale in px. Same keys as `SdsRadius`.

***

### CssSpacing

> `const` **CssSpacing**: `PxScale`\<\{ `base`: `16`; `lg`: `20`; `md`: `12`; `sm`: `8`; `xl`: `24`; `xs`: `4`; `xxl`: `32`; `xxs`: `2`; \}\>

Spacing scale in px. Same keys as `SdsSpacing`.

***

### CssTypo

> `const` **CssTypo**: `object`

Every typography level, converted. Same keys as `SdsTypo`.

#### Type Declaration

##### sub10

> **sub10**: [`CssTextStyle`](interfaces/CssTextStyle.md)

16px / 24px — list item body, between t5 and t6

##### sub12

> **sub12**: [`CssTextStyle`](interfaces/CssTextStyle.md)

12px / 18px — small caption

##### sub13

> **sub13**: [`CssTextStyle`](interfaces/CssTextStyle.md)

11px / 16.5px — smallest text (badges)

##### sub5

> **sub5**: [`CssTextStyle`](interfaces/CssTextStyle.md)

24px / 33px — between t3 and t4

##### sub8

> **sub8**: [`CssTextStyle`](interfaces/CssTextStyle.md)

19px / 28px — between t4 and t5

##### t1

> **t1**: [`CssTextStyle`](interfaces/CssTextStyle.md)

30px / 40px — hero heading

##### t2

> **t2**: [`CssTextStyle`](interfaces/CssTextStyle.md)

26px / 35px — large heading

##### t3

> **t3**: [`CssTextStyle`](interfaces/CssTextStyle.md)

22px / 31px — screen title (most common)

##### t4

> **t4**: [`CssTextStyle`](interfaces/CssTextStyle.md)

20px / 29px — small title, section header

##### t5

> **t5**: [`CssTextStyle`](interfaces/CssTextStyle.md)

17px / 25.5px — body text (default)

##### t6

> **t6**: [`CssTextStyle`](interfaces/CssTextStyle.md)

15px / 22.5px — small body

##### t7

> **t7**: [`CssTextStyle`](interfaces/CssTextStyle.md)

13px / 19.5px — caption, meta info

***

### SdsColors

> `const` **SdsColors**: `object`

SDS Color Tokens — based on TDS (Toss Design System) official values.

Use these tokens instead of hardcoded hex values in all styling.
Flutter source: lib/design/sds_colors.dart

#### Type Declaration

##### background

> `readonly` **background**: `"#FFFFFF"` = `'#FFFFFF'`

##### blue200

> `readonly` **blue200**: `"#90C2FF"` = `'#90C2FF'`

##### blue400

> `readonly` **blue400**: `"#4593FC"` = `'#4593FC'`

##### blue50

> `readonly` **blue50**: `"#E8F3FF"` = `'#E8F3FF'`

##### blue500

> `readonly` **blue500**: `"#3182F6"` = `'#3182F6'`

##### blue600

> `readonly` **blue600**: `"#2272EB"` = `'#2272EB'`

##### blue700

> `readonly` **blue700**: `"#1B64DA"` = `'#1B64DA'`

##### brand

> `readonly` **brand**: `"#1A8A5C"` = `'#1A8A5C'`

##### brandDark

> `readonly` **brandDark**: `"#003626"` = `'#003626'`

##### brandLight

> `readonly` **brandLight**: `"#E8F5EE"` = `'#E8F5EE'`

##### floatedBackground

> `readonly` **floatedBackground**: `"#FFFFFF"` = `'#FFFFFF'`

##### green50

> `readonly` **green50**: `"#F0FAF6"` = `'#F0FAF6'`

##### green500

> `readonly` **green500**: `"#03B26C"` = `'#03B26C'`

##### grey100

> `readonly` **grey100**: `"#F2F4F6"` = `'#F2F4F6'`

##### grey200

> `readonly` **grey200**: `"#E5E8EB"` = `'#E5E8EB'`

##### grey300

> `readonly` **grey300**: `"#D1D6DB"` = `'#D1D6DB'`

##### grey400

> `readonly` **grey400**: `"#B0B8C1"` = `'#B0B8C1'`

##### grey50

> `readonly` **grey50**: `"#F9FAFB"` = `'#F9FAFB'`

##### grey500

> `readonly` **grey500**: `"#8B95A1"` = `'#8B95A1'`

##### grey600

> `readonly` **grey600**: `"#6B7684"` = `'#6B7684'`

##### grey700

> `readonly` **grey700**: `"#4E5968"` = `'#4E5968'`

##### grey800

> `readonly` **grey800**: `"#333D4B"` = `'#333D4B'`

##### grey900

> `readonly` **grey900**: `"#191F28"` = `'#191F28'`

##### greyBackground

> `readonly` **greyBackground**: `"#F2F4F6"` = `'#F2F4F6'`

##### greyOpacity200

> `readonly` **greyOpacity200**: `"rgba(0, 27, 55, 0.10)"` = `'rgba(0, 27, 55, 0.10)'`

##### greyOpacity50

> `readonly` **greyOpacity50**: `"rgba(0, 23, 51, 0.02)"` = `'rgba(0, 23, 51, 0.02)'`

##### greyOpacity500

> `readonly` **greyOpacity500**: `"rgba(3, 24, 50, 0.46)"` = `'rgba(3, 24, 50, 0.46)'`

##### greyOpacity800

> `readonly` **greyOpacity800**: `"rgba(0, 12, 30, 0.80)"` = `'rgba(0, 12, 30, 0.80)'`

##### greyOpacity900

> `readonly` **greyOpacity900**: `"rgba(2, 9, 19, 0.91)"` = `'rgba(2, 9, 19, 0.91)'`

##### highlight

> `readonly` **highlight**: `"#FFE08C"` = `'#FFE08C'`

##### layeredBackground

> `readonly` **layeredBackground**: `"#FFFFFF"` = `'#FFFFFF'`

##### orange50

> `readonly` **orange50**: `"#FFF3E0"` = `'#FFF3E0'`

##### orange500

> `readonly` **orange500**: `"#FE9800"` = `'#FE9800'`

##### purple500

> `readonly` **purple500**: `"#A234C7"` = `'#A234C7'`

##### red50

> `readonly` **red50**: `"#FFEEEE"` = `'#FFEEEE'`

##### red500

> `readonly` **red500**: `"#F04452"` = `'#F04452'`

##### scrim

> `readonly` **scrim**: `"rgba(0, 0, 0, 0.5)"` = `'rgba(0, 0, 0, 0.5)'`

##### scrimGlass

> `readonly` **scrimGlass**: `"rgba(0, 0, 0, 0.2)"` = `'rgba(0, 0, 0, 0.2)'`

##### teal50

> `readonly` **teal50**: `"#EDF8F8"` = `'#EDF8F8'`

##### teal500

> `readonly` **teal500**: `"#18A5A5"` = `'#18A5A5'`

##### yellow400

> `readonly` **yellow400**: `"#FFD158"` = `'#FFD158'`

##### yellow50

> `readonly` **yellow50**: `"#FFF9E7"` = `'#FFF9E7'`

##### yellow500

> `readonly` **yellow500**: `"#FFC342"` = `'#FFC342'`

##### yellow800

> `readonly` **yellow800**: `"#EE8F11"` = `'#EE8F11'`

##### yellow900

> `readonly` **yellow900**: `"#DD7D02"` = `'#DD7D02'`

***

### SdsRadius

> `const` **SdsRadius**: `object`

SDS Border Radius Tokens.

Flutter source: lib/design/sds_radius.dart

#### Type Declaration

##### full

> `readonly` **full**: `20` = `20`

20px — filter chips, tab pills

##### lg

> `readonly` **lg**: `14` = `14`

14px — cards

##### md

> `readonly` **md**: `12` = `12`

12px — card inner elements

##### sm

> `readonly` **sm**: `8` = `8`

8px — buttons, inputs

##### xl

> `readonly` **xl**: `16` = `16`

16px — bottom sheet top

##### xs

> `readonly` **xs**: `4` = `4`

4px — subtle rounding

***

### SdsSpacing

> `const` **SdsSpacing**: `object`

SDS Spacing Tokens — TDS official spacing scale.

Flutter source: lib/design/sds_spacing.dart

#### Type Declaration

##### base

> `readonly` **base**: `16` = `16`

##### lg

> `readonly` **lg**: `20` = `20`

##### md

> `readonly` **md**: `12` = `12`

##### sm

> `readonly` **sm**: `8` = `8`

##### xl

> `readonly` **xl**: `24` = `24`

##### xs

> `readonly` **xs**: `4` = `4`

##### xxl

> `readonly` **xxl**: `32` = `32`

##### xxs

> `readonly` **xxs**: `2` = `2`

***

### SdsTypo

> `const` **SdsTypo**: `object`

Grouped typography tokens for namespaced access

#### Type Declaration

##### sub10

> **sub10**: [`SdsTextStyle`](interfaces/SdsTextStyle.md)

16px / 24px — list item body, between t5 and t6

##### sub12

> **sub12**: [`SdsTextStyle`](interfaces/SdsTextStyle.md)

12px / 18px — small caption

##### sub13

> **sub13**: [`SdsTextStyle`](interfaces/SdsTextStyle.md)

11px / 16.5px — smallest text (badges)

##### sub5

> **sub5**: [`SdsTextStyle`](interfaces/SdsTextStyle.md)

24px / 33px — between t3 and t4

##### sub8

> **sub8**: [`SdsTextStyle`](interfaces/SdsTextStyle.md)

19px / 28px — between t4 and t5

##### t1

> **t1**: [`SdsTextStyle`](interfaces/SdsTextStyle.md)

30px / 40px — hero heading

##### t2

> **t2**: [`SdsTextStyle`](interfaces/SdsTextStyle.md)

26px / 35px — large heading

##### t3

> **t3**: [`SdsTextStyle`](interfaces/SdsTextStyle.md)

22px / 31px — screen title (most common)

##### t4

> **t4**: [`SdsTextStyle`](interfaces/SdsTextStyle.md)

20px / 29px — small title, section header

##### t5

> **t5**: [`SdsTextStyle`](interfaces/SdsTextStyle.md)

17px / 25.5px — body text (default)

##### t6

> **t6**: [`SdsTextStyle`](interfaces/SdsTextStyle.md)

15px / 22.5px — small body

##### t7

> **t7**: [`SdsTextStyle`](interfaces/SdsTextStyle.md)

13px / 19.5px — caption, meta info

## Functions

- [textStyleToCss](functions/textStyleToCss.md)
