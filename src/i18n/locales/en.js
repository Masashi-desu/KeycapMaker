const en = Object.freeze({
  language: {
    label: "LANGUAGE",
    ariaLabel: "Choose display language",
    listLabel: "Language options",
    options: {
      ja: "日本語",
      en: "English",
      zh: "中文",
      ko: "한국어",
    },
  },
  navigation: {
    label: "Workspace sections",
    settings: "Settings",
    export: "Export",
  },
  actions: {
    close: "Close",
    choose: "Choose",
    copy: "Copy",
    copied: "Copied",
    on: "On",
    off: "Off",
    saving: "Saving...",
  },
  dropOverlay: {
    title: "Drop editor data / compatible JSON",
    body: "Load saved editor data, or a compatible JSON file whose missing values will be filled from defaults.",
  },
  panels: {
    settings: {
      title: "Settings",
      body: "Adjust the selected keycap shape and legend while the preview updates automatically on the right.",
    },
    export: {
      title: "Export",
      body: "Save 3MF / STL print data and JSON editor data for resuming edits later.",
    },
  },
  mobileInspector: {
    hide: "Move settings card up",
    show: "Restore settings card",
  },
  exportPanel: {
    jsonChip: "Editable JSON",
    jsonTitle: "Save Editor Data",
    jsonBody: "Save the shape, dimensions, colors, and legend as JSON. You can load it again later by dragging and dropping it.",
    saveJson: "Save JSON",
    threeMfChip: "Printable 3MF",
    threeMfTitle: "Save 3MF Data",
    threeMfBody: "Save print-ready 3MF data containing the body, homing mark, and legend.",
    saveThreeMf: "Save 3MF",
    optionsTitle: "Options",
    optionsBody: "3MF is recommended for normal print data. Use STL only when your slicer or manufacturing requirement needs it.",
    optionsExpand: "Expand options",
    optionsCollapse: "Collapse options",
    stlChip: "Single-color STL",
    stlTitle: "Save STL",
    stlBody: "Save a single-material, single-mesh STL. Colors and legends are ignored, and only the shape is exported. Save as 3MF when you need colors or legends.",
    saveStl: "Save STL",
  },
  nameGroup: {
    title: "Name",
    description: "This name is used for 3MF, STL, and editor-data JSON files, and it remains when the data is loaded again.",
  },
  parameterGroupCaptions: {
    name: "Export file name",
    top: "Surface and tilt",
    legend: "Text and position",
  },
  unitBasis: {
    title: "1u Conversion",
    description: "Displaying 1u as {unitBase} mm.",
    fieldLabel: "1u Basis",
    fieldHint: "For narrow-pitch conversion. Model dimensions do not change",
    readout: "Current size: width {widthUnits}u / depth {depthUnits}u",
  },
  fieldGroup: {
    expand: "Expand {title}",
    collapse: "Collapse {title}",
  },
  legendCards: {
    keytop: "Keytop",
    sidewall: "{side} Sidewall",
  },
  stemCards: {
    clearance: "Clearance",
  },
  shapeProfiles: {
    "custom-shell": {
      label: "Custom Shell",
      fieldGroups: {
        shape: {
          title: "Keycap Shape",
          description: "Adjust the overall keycap size and the amount of taper toward the top. Width and depth are each converted using {unitBase} mm as 1u.",
        },
        top: {
          title: "Keytop",
          description: "Switch the top surface between flat, cylindrical, spherical, and a top-hat addition while keeping the center reference height fixed. Edge-height input is normalized internally to pitch / roll.",
        },
        legend: {
          title: "Legend",
          description: "Adjust keytop and sidewall legend text, typeface, appearance, position, and height. Multi-character legends can be entered as-is.",
        },
        homing: {
          title: "Homing Mark",
          description: "Adjust a tactile bump like the one on F and J keys. It can be configured separately from the legend.",
        },
        stem: {
          title: "Mount",
        },
      },
    },
    typewriter: {
      label: "Typewriter",
      fieldGroups: {
        shape: {
          title: "Keycap Shape",
          description: "Adjust a thin typewriter-style keytop outline. Width and depth are each converted using {unitBase} mm as 1u; a larger R makes it rounder, and a smaller R makes it more square.",
        },
        top: {
          title: "Keytop",
          description: "Edit front/back and left/right tilt by angle or edge height while keeping the center reference height fixed. Edge-height input is normalized internally to pitch / roll.",
        },
        legend: {
          title: "Legend",
          description: "Adjust keytop and sidewall legend text, typeface, appearance, position, and height. Multi-character legends can be entered as-is.",
        },
        homing: {
          title: "Homing Mark",
          description: "Adjust a tactile bump like the one on F and J keys. It can be configured separately from the legend.",
        },
        stem: {
          title: "Mount",
        },
      },
    },
    "jis-enter": {
      label: "JIS Enter",
      fieldGroups: {
        shape: {
          title: "Keycap Shape",
          description: "Adjust the overall size and lower-left notch from a common JIS / ISO-style tall Enter footprint. Width and depth are each converted using {unitBase} mm as 1u.",
        },
        top: {
          title: "Keytop",
          description: "Like Custom Shell, this can edit the top center reference height, flat / cylindrical / spherical surface, and front/back or left/right tilt.",
        },
        legend: {
          title: "Legend",
          description: "Adjust keytop and sidewall legend text, typeface, appearance, position, and height. Multi-character legends can be entered as-is.",
        },
        homing: {
          title: "Homing Mark",
          description: "Adjust a tactile bump like the one on F and J keys. It can be configured separately from the legend.",
        },
        stem: {
          title: "Mount",
        },
      },
    },
    "typewriter-jis-enter": {
      label: "Typewriter JIS Enter",
      fieldGroups: {
        shape: {
          title: "Keycap Shape",
          description: "Adjust a thin typewriter-style JIS Enter footprint, including overall size, lower-left notch, and R. Width and depth are each converted using {unitBase} mm as 1u.",
        },
        top: {
          title: "Keytop",
          description: "Like Typewriter, this can edit the thin keytop thickness, rim, and front/back or left/right tilt.",
        },
        legend: {
          title: "Legend",
          description: "Adjust keytop and sidewall legend text, typeface, appearance, position, and height. Multi-character legends can be entered as-is.",
        },
        homing: {
          title: "Homing Mark",
          description: "Adjust a tactile bump like the one on F and J keys. It can be configured separately from the legend.",
        },
        stem: {
          title: "Mount",
        },
      },
    },
  },
  fieldGroups: {
    shapeDescriptionShell: "Adjust the overall keycap size and the amount of taper toward the top. Width and depth are each converted using {unitBase} mm as 1u.",
    shapeDescriptionTypewriter: "Adjust a thin typewriter-style keytop outline. Width and depth are each converted using {unitBase} mm as 1u; a larger R makes it rounder, and a smaller R makes it more square.",
    topDescription: "Edit front/back and left/right tilt by angle or edge height while keeping the center reference height fixed. Edge-height input is normalized internally to pitch / roll.",
  },
  fields: {
    name: {
      label: "Name",
      hint: "Used as the file name for 3MF, STL, and editor-data JSON exports",
    },
    shapeProfile: {
      label: "Base Shape",
      hint: "Choose the base shape to use",
    },
    keyWidth: {
      label: "Width",
      hint: "Width and key size are linked. {unitBase} mm = 1u.",
      secondaryLabel: "Key Size",
      miniLabel: "Width",
    },
    keyDepth: {
      label: "Depth",
      hint: "Depth and depth size are linked. {unitBase} mm = 1u.",
      secondaryLabel: "Depth Size",
      miniLabel: "Depth",
    },
    wallThickness: {
      label: "Wall Thickness",
      hint: "The thickness that affects keycap strength",
    },
    typewriterCornerRadius: {
      label: "R",
      hint: "{maxRadius} is fully round; values near 0 mm make the corners sharper.",
    },
    jisEnterNotchWidth: {
      label: "Notch Width",
      hint: "Horizontal width of the lower-left notch. Maximum: {maxWidth}.",
    },
    jisEnterNotchDepth: {
      label: "Notch Depth",
      hint: "Front-to-back depth of the lower-left notch. Maximum: {maxDepth}.",
    },
    topScale: {
      label: "Top Taper",
      hint: "Lower numbers narrow the top face while keeping width and depth at the same ratio",
    },
    bodyColor: {
      label: "Body Color",
      hint: "Enter a color code directly or use the color picker",
    },
    topCenterHeight: {
      label: "Top Center Height",
      typewriterLabel: "Keytop Thickness",
      hint: "The keytop center before adding the dish. Current center surface: {height}.",
      typewriterHint: "The thickness from the bottom of the thin keytop to the top surface",
    },
    topOffset: {
      label: "Keytop Center Offset",
      hint: "Move only the keytop center left/right or front/back without moving the mount",
    },
    topOffsetX: {
      label: "Left-Right Offset",
      hint: "Move the keytop center left or right without moving the mount",
    },
    topOffsetY: {
      label: "Front-Back Offset",
      hint: "Move the keytop center forward or backward without moving the mount",
    },
    typewriterMountHeight: {
      label: "Top-Referenced Height",
      hint: "Distance from the keytop body top center to the lower end of the mount. Current minimum: {minHeight}.",
    },
    topSurfaceShape: {
      label: "Keytop Surface",
      hint: "Flat is planar, cylindrical curves in one direction, and spherical curves in all directions",
    },
    dishDepth: {
      label: "Depth",
      cylindricalHint: "Positive values make a one-direction recess; negative values make it raised in one direction.",
      sphericalHint: "Positive values make a bowl-shaped recess; negative values make it raised.",
      flatHint: "This has no effect when flat is selected.",
    },
    topHatEnabled: {
      label: "Add Top Hat",
      hint: "Add a smaller independently shaped keytop above the existing keytop.",
    },
    topHatTopWidth: {
      label: "Top Width",
      hint: "Width of the added keytop's top surface. Current maximum: {maxWidth}.",
      secondaryLabel: "Top Size",
      miniLabel: "Width",
    },
    topHatTopDepth: {
      label: "Top Depth",
      hint: "Front-to-back size of the added keytop's top surface. Current maximum: {maxDepth}.",
      secondaryLabel: "Top Depth Size",
      miniLabel: "Depth",
    },
    topHatInset: {
      label: "Top Inset",
      hint: "Inset from the Enter keytop outline to the added top surface. Current maximum: {maxInset}.",
    },
    topHatTopRadius: {
      label: "Top Radius",
      hint: "Corner radius of the added keytop's top surface. Current maximum: {maxRadius}.",
    },
    topHatHeight: {
      label: "Height",
      hint: "Height from the existing keytop surface to the added top surface. Negative values recess it. Current range: {minHeight} to {maxHeight}.",
    },
    topHatShoulderAngle: {
      label: "Shoulder Angle",
      hint: "Angle of the shoulder falling away from the added top. Higher values make it steeper.",
    },
    topHatShoulderRadius: {
      label: "Shoulder Radius",
      hint: "0 keeps a faceted shoulder; positive values bulge into a round shoulder, negative values recess it. Current range: {minRadius} to {maxRadius}.",
    },
    rimEnabled: {
      label: "Add Key Rim",
      hint: "Cover the keytop perimeter as a separate part",
    },
    rimWidth: {
      label: "Key Rim Width",
      hint: "The band width when viewing the keytop from the front. {maxWidth} expands it to the full surface.",
    },
    rimHeightUp: {
      label: "Upward Height",
      hint: "0 is flush with the top surface. Positive values extend upward.",
    },
    rimHeightDown: {
      label: "Downward Height",
      hint: "0 is flush with the bottom surface. Positive values extend downward.",
    },
    rimColor: {
      label: "Key Rim Color",
      hint: "Enter a color code directly or use the color picker",
    },
    topSlopeInputMode: {
      label: "Tilt Input Method",
      hint: "Choose whether to enter tilt by angle or by edge height",
    },
    topPitchDeg: {
      label: "Front-to-Back Tilt",
      hint: "Positive values raise the back. Current: front {front} / back {back}.",
    },
    topRollDeg: {
      label: "Left-to-Right Tilt",
      hint: "Positive values raise the right side. Current: left {left} / right {right}.",
    },
    topFrontHeight: {
      label: "Front Height",
      hint: "Front height of the top reference plane. Center height is fixed; current pitch is {pitch}.",
    },
    topBackHeight: {
      label: "Back Height",
      hint: "Back height of the top reference plane. Center height is fixed; current pitch is {pitch}.",
    },
    topLeftHeight: {
      label: "Left Height",
      hint: "Left height of the top reference plane. Center height is fixed; current roll is {roll}.",
    },
    topRightHeight: {
      label: "Right Height",
      hint: "Right height of the top reference plane. Center height is fixed; current roll is {roll}.",
    },
    legendEnabled: {
      label: "Add Keytop Legend",
      hint: "Turn this off to omit text geometry",
    },
    legendPrintNotice: "Depending on printer and slicer accuracy, you may need to adjust text size or weight.",
    legendText: {
      label: "Legend Text",
      hint: "Multiple characters can be entered as-is",
      placeholder: "A / Shift / あ",
    },
    legendFontKey: {
      label: "Typeface",
      staticHint: "Search with the magnifying glass",
      variableHint: "Search with the magnifying glass. Choose the supported style on the right.",
    },
    legendFontStyleKey: {
      label: "Font Style",
      selectableHint: "Use a built-in style",
      defaultHint: "Use the font's default style",
    },
    legendUnderlineEnabled: {
      label: "Add Underline",
      hint: "Underline position and thickness come from the font file. They are not replaced with an arbitrary look.",
    },
    legendSize: {
      label: "Text Size",
      hint: "Change the size of the legend text.",
    },
    legendOutlineDelta: {
      label: "Weight Adjustment",
      hint: "0 keeps the original outline. Positive values thicken it; negative values thin it.",
    },
    legendHeight: {
      label: "Text Height",
      hint: "0 creates an embedded legend that fills most of the top shell; higher values make it raised.",
    },
    legendEmbed: {
      label: "Inward Embed",
      hint: "How far the base of raised text enters the keytop. When height is 0, it automatically embeds through most of the top shell.",
    },
    legendColor: {
      label: "Legend Color",
      hint: "Enter a color code directly or use the color picker",
    },
    legendOffsetX: {
      label: "Horizontal Position",
      hint: "Move the text left or right",
    },
    legendOffsetY: {
      label: "Front-to-Back Position",
      hint: "Move the text forward or backward",
    },
    sideLegend: {
      enabled: {
        label: "Add {side} Sidewall Legend",
        hint: "Turn this off to omit text geometry on the {side} side",
      },
      color: {
        label: "{side} Legend Color",
        hint: "Enter a color code directly or use the color picker",
      },
      text: {
        label: "{side} Legend Text",
        hint: "Multiple characters can be entered as-is",
      },
      fontKey: {
        label: "{side} Typeface",
      },
      fontStyleKey: {
        label: "{side} Font Style",
      },
      underlineEnabled: {
        label: "Add {side} Underline",
        hint: "Underline position and thickness come from the font file. They are not replaced with an arbitrary look.",
      },
      size: {
        label: "{side} Text Size",
        hint: "Change the size of the sidewall legend text.",
      },
      outlineDelta: {
        label: "{side} Weight Adjustment",
      },
      height: {
        label: "{side} Text Height",
        hint: "0 creates a flush embedded sidewall legend; higher values raise it outward.",
      },
      offsetX: {
        label: "{side} Horizontal Position",
        hint: "Move the text left or right on the sidewall",
      },
      offsetY: {
        label: "{side} Vertical Position",
        hint: "Move the text up or down on the sidewall",
      },
    },
    homingBarEnabled: {
      label: "Add Homing Mark",
      hint: "Makes the key easier to locate by touch",
    },
    homingBarLength: {
      label: "Homing Mark Length",
      hint: "How far it extends left and right",
    },
    homingBarWidth: {
      label: "Homing Mark Width",
      hint: "The visible thickness of the homing mark",
    },
    homingBarHeight: {
      label: "Homing Mark Height",
      hint: "How far it protrudes from the surface",
    },
    homingBarChamfer: {
      label: "Homing Mark Chamfer",
      hint: "Small values lightly round the top edge; larger values approach a half-round ridge.",
    },
    homingBarOffsetY: {
      label: "Homing Mark Y Position",
      hint: "Move the homing mark forward or backward",
    },
    homingBarColor: {
      label: "Homing Mark Color",
      hint: "Enter a color code directly or use the color picker",
    },
    stemType: {
      label: "Mount Type",
      hint: "Choose the switch type this keycap should fit",
    },
    stemOuterDelta: {
      label: "Outer Adjustment",
      hint: "0 is standard. Positive values thicken the outer circle; negative values thin it.",
    },
    stemCrossMargin: {
      label: "Fit Clearance",
      mxHint: "0 is standard. Positive values widen the cross hole; negative values tighten it.",
      chocV1Hint: "0 is standard. Positive values make the two prongs thinner and looser; negative values make them thicker and tighter.",
      alpsHint: "0 is standard. Positive values make the insert thinner and looser; negative values make it thicker and tighter.",
      disabledHint: "Unused when no mount is generated",
    },
    stemCrossChamfer: {
      label: "Entry Chamfer",
      hint: "0 is standard. Increase the value to widen only the cross-hole entry.",
      disabledHint: "Unused for non-cross mounts",
    },
    stemInsetDelta: {
      label: "Mount Start Offset",
      hint: "0 is standard. Positive values raise the start position from the bottom; negative values extend it downward.",
      disabledHint: "Unused when no mount is generated",
    },
  },
  options: {
    stemType: {
      none: "None",
      mx: "MX Compatible",
      choc_v1: "Choc v1",
      choc_v2: "Choc v2",
      alps: "Alps / Matias",
    },
    topSurfaceShape: {
      flat: "Flat",
      cylindrical: "Cylindrical",
      spherical: "Spherical",
    },
    topSlopeInputMode: {
      angle: "Adjust by Angle",
      "edge-height": "Adjust by Edge Height",
    },
  },
  stemDescriptions: {
    none: "No mount is generated. Use this when you only want to inspect the outer shape or legend.",
    mx: "A Cherry MX-compatible cross shape. Fits common mechanical keyboard switches such as Cherry, Gateron, and Kailh BOX.",
    choc_v1: "A two-prong mount for Kailh Choc v1. Fits low-profile keyboards using Choc v1 switches.",
    alps: "An insert shape for Alps / Matias switches. Fits compatible Alps-family switches.",
    choc_v2: "A cross shape for Kailh Choc v2. Generates a mount that fits Choc v2 switches.",
  },
  sideLabels: {
    front: "Front",
    back: "Back",
    left: "Left",
    right: "Right",
  },
  font: {
    defaultStyleLabel: "Use Font Default",
    searchAriaLabel: "Search fonts",
    searchDialogLabel: "Font Search",
    searchPlaceholder: "Search by font name",
    noResults: "No matching fonts",
    variableMeta: "Variable / named style",
    staticMeta: "Static face",
    attributionTitle: "Copyright and License Notice",
    attributions: {
      "kurobara-cinderella-regular": [
        "Font used: 黒薔薇シンデレラ Version 1.00.20180805",
        "Copyright notice: Copyright(c) 2017 M+ FONTS PROJECT/MODI",
        "License notice: This font is free software. Unlimited permission is granted to use, copy, and distribute it, with or without modification, either commercially or noncommercially. THIS FONT IS PROVIDED \"AS IS\" WITHOUT WARRANTY.",
        "Base license: SIL Open Font License, Version 1.1",
        "Distribution page: https://modi.jpn.org/font_kurobara-cinderella.php"
      ],
    },
  },
  partLabels: {
    body: "Body",
    rim: "Key Rim",
    legend: "Legend",
    sideLegend: "{side} Side Legend",
    homing: "Homing Mark",
  },
  preview: {
    placeholder: "No preview yet. Change a setting to automatically update the latest shape.",
    running: "Updating preview",
    successSingle: "Preview updated. Showing {parts}.",
    successMultiple: "Preview updated. Showing {parts} separated by color.",
    failed: "Failed to update preview",
    summary: "{elapsedMs} ms / {objectCount} objects / {vertexCount} vertices / {faceCount} triangles",
  },
  status: {
    notGenerated: "Not generated",
    dirty: "Waiting to apply input",
    loadedDirty: "Waiting to apply loaded editor data",
  },
  importExport: {
    loaded: "Loaded editor data ({fileName})",
    loadLabel: "Editor Data Load",
    loadNote: "Applied {fileName} to the current editor state",
    noJsonFile: "No JSON file was found.",
    loadFailed: "Failed to load editor data",
    loadFailedLabel: "Editor Data Load Failed",
    preparing: "Preparing save data",
    savedEditorData: "Saved editor data ({byteLength} bytes)",
    editorDataLabel: "Editor Data JSON",
    editorDataNote: "Saved the on-screen editable parameters as JSON",
    savedThreeMf: "Saved 3MF data ({byteLength} bytes / {partCount} parts)",
    threeMfLabel: "3MF Data",
    threeMfNote: "Saved {parts} together as 3MF data",
    savedStl: "Saved STL ({byteLength} bytes)",
    stlLabel: "Single-color STL",
    stlNote: "Saved the shape as a single mesh without colors or legends",
    saveFailed: "Failed to save",
    saveFailedLabel: "Save Failed",
    unsupportedExport: "Unsupported export format: {format}",
  },
  errors: {
    appRootMissing: "#app was not found.",
    colorisLoadFailed: "Failed to load Coloris.",
    unsupportedOffPurpose: "Unsupported OFF job purpose: {purpose}",
  },
  format: {
    listSeparator: ", ",
  },
});

export default en;
