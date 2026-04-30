const zh = Object.freeze({
  language: {
    label: "LANGUAGE",
    ariaLabel: "选择显示语言",
    listLabel: "语言选项",
    options: {
      ja: "日本語",
      en: "English",
      zh: "中文",
      ko: "한국어",
    },
  },
  navigation: {
    label: "工作区部分",
    settings: "设置",
    export: "导出",
  },
  actions: {
    close: "关闭",
    choose: "选择",
    copy: "复制",
    copied: "已复制",
    on: "开启",
    off: "关闭",
    saving: "正在保存...",
  },
  dropOverlay: {
    title: "拖放编辑数据 / 兼容输入 JSON",
    body: "读取已保存的编辑数据，或读取缺少值会由默认值补齐的兼容输入 JSON。",
  },
  panels: {
    settings: {
      title: "设置",
      body: "可以根据输入调整所选键帽形状和字符，并自动在右侧更新预览。",
    },
    export: {
      title: "导出",
      body: "可以保存用于打印的 3MF / STL 数据，以及稍后继续编辑用的 JSON。",
    },
  },
  mobileInspector: {
    hide: "将设置卡片移到上方",
    show: "恢复设置卡片",
  },
  exportPanel: {
    jsonChip: "可继续编辑的 JSON",
    jsonTitle: "保存编辑数据",
    jsonBody: "将形状、尺寸、颜色和字符保存为 JSON。之后可以通过拖放再次读取。",
    saveJson: "保存 JSON",
    threeMfChip: "打印用 3MF",
    threeMfTitle: "保存 3MF 数据",
    threeMfBody: "将包含本体、定位标记和字符的打印用数据汇总保存为 3MF 格式。",
    saveThreeMf: "保存 3MF",
    optionsTitle: "选项",
    optionsBody: "普通打印数据推荐使用 3MF。只有切片软件或制造要求需要时才使用 STL。",
    optionsExpand: "展开选项",
    optionsCollapse: "折叠选项",
    stlChip: "单色 STL",
    stlTitle: "保存 STL",
    stlBody: "保存为单一材料、单一网格的 STL。颜色和字符会被忽略，只导出形状。如果需要颜色区分或字符，请保存为 3MF。",
    saveStl: "保存 STL",
  },
  nameGroup: {
    title: "名称",
    description: "保存时使用的名称。3MF、STL 和编辑数据 JSON 都会使用它，之后读取时也会保留。",
  },
  parameterGroupCaptions: {
    name: "导出文件名",
    top: "上表面与倾斜",
    legend: "字符与位置",
  },
  unitBasis: {
    title: "1u 换算",
    description: "当前按 {unitBase} mm 显示为 1u。",
    fieldLabel: "1u 基准",
    fieldHint: "用于窄间距换算。模型尺寸不会改变",
    readout: "当前尺寸: 宽度 {widthUnits}u / 深度 {depthUnits}u",
  },
  fieldGroup: {
    expand: "展开{title}",
    collapse: "折叠{title}",
  },
  legendCards: {
    center: "中央字符",
    rightTop: "右上字符",
    rightBottom: "右下字符",
    leftTop: "左上字符",
    leftBottom: "左下字符",
    keytop: "键顶",
    sidewall: "{side}侧壁",
  },
  stemCards: {
    clearance: "间隙",
  },
  shapeProfiles: {
    "custom-shell": {
      label: "自定义外壳",
      fieldGroups: {
        shape: {
          title: "键帽形状",
          description: "调整键帽整体尺寸，以及向顶部收窄的程度。宽度和深度都按 {unitBase} mm = 1u 换算。",
        },
        top: {
          title: "键顶",
          description: "在固定上表面中心基准高度的同时，可切换平面 / 圆柱 / 球面以及 top-hat 追加。切换为边缘高度输入时，内部仍会规范化为 pitch / roll。",
        },
        legend: {
          title: "字符",
          description: "集中调整输入文字、字体、外观、位置、凸起高度和嵌入量。也可以直接输入多个字符。",
        },
        homing: {
          title: "手指定位标记",
          description: "调整类似 F 键和 J 键上的触感凸起。可与字符分开设置。",
        },
        stem: {
          title: "安装部",
        },
      },
    },
    typewriter: {
      label: "打字机",
      fieldGroups: {
        shape: {
          title: "键帽形状",
          description: "调整打字机风格的薄键顶外形。宽度和深度都按 {unitBase} mm = 1u 换算；R 越大越圆，越小越接近方形。",
        },
        top: {
          title: "键顶",
          description: "在固定上表面中心基准高度的同时，可用角度或边缘高度编辑前后和左右倾斜。边缘高度输入在内部会规范化为 pitch / roll。",
        },
        legend: {
          title: "字符",
          description: "集中调整输入文字、字体、外观、位置、凸起高度和嵌入量。也可以直接输入多个字符。",
        },
        homing: {
          title: "手指定位标记",
          description: "调整类似 F 键和 J 键上的触感凸起。可与字符分开设置。",
        },
        stem: {
          title: "安装部",
        },
      },
    },
    "jis-enter": {
      label: "JIS Enter",
      fieldGroups: {
        shape: {
          title: "键帽形状",
          description: "以常见 JIS / ISO 系纵向 Enter 轮廓为基准，调整整体尺寸和左下缺口。宽度和深度都按 {unitBase} mm = 1u 换算。",
        },
        top: {
          title: "键顶",
          description: "与自定义外壳一样，可调整上表面中心基准高度、平面 / 圆柱 / 球面，以及前后和左右倾斜。",
        },
        legend: {
          title: "字符",
          description: "集中调整输入文字、字体、外观、位置、凸起高度和嵌入量。也可以直接输入多个字符。",
        },
        homing: {
          title: "手指定位标记",
          description: "调整类似 F 键和 J 键上的触感凸起。可与字符分开设置。",
        },
        stem: {
          title: "安装部",
        },
      },
    },
    "typewriter-jis-enter": {
      label: "打字机 JIS Enter",
      fieldGroups: {
        shape: {
          title: "键帽形状",
          description: "以打字机风格的薄型 JIS Enter 轮廓为基准，调整整体尺寸、左下缺口和 R。宽度和深度都按 {unitBase} mm = 1u 换算。",
        },
        top: {
          title: "键顶",
          description: "与打字机形状一样，可调整薄键顶厚度、边框以及前后和左右倾斜。",
        },
        legend: {
          title: "字符",
          description: "集中调整输入文字、字体、外观、位置、凸起高度和嵌入量。也可以直接输入多个字符。",
        },
        homing: {
          title: "手指定位标记",
          description: "调整类似 F 键和 J 键上的触感凸起。可与字符分开设置。",
        },
        stem: {
          title: "安装部",
        },
      },
    },
  },
  fieldGroups: {
    shapeDescriptionShell: "调整键帽整体尺寸，以及向顶部收窄的程度。宽度和深度都按 {unitBase} mm = 1u 换算。",
    shapeDescriptionTypewriter: "调整打字机风格的薄键顶外形。宽度和深度都按 {unitBase} mm = 1u 换算；R 越大越圆，越小越接近方形。",
    topDescription: "在固定上表面中心基准高度的同时，可用角度或边缘高度编辑前后和左右倾斜。边缘高度输入在内部会规范化为 pitch / roll。",
  },
  fields: {
    name: {
      label: "名称",
      hint: "用于 3MF、STL 和编辑数据 JSON 的保存文件名",
    },
    shapeProfile: {
      label: "基础形状",
      hint: "选择要使用的基本形状",
    },
    keyWidth: {
      label: "宽度",
      hint: "宽度与键尺寸联动。{unitBase} mm = 1u。",
      secondaryLabel: "键尺寸",
      miniLabel: "宽度",
    },
    keyDepth: {
      label: "深度",
      hint: "深度与深度尺寸联动。{unitBase} mm = 1u。",
      secondaryLabel: "深度尺寸",
      miniLabel: "深度",
    },
    wallThickness: {
      label: "壁厚",
      hint: "影响键帽强度的厚度",
    },
    typewriterCornerRadius: {
      label: "R",
      hint: "{maxRadius} 时为圆形，接近 0 mm 时边角更尖。",
    },
    jisEnterNotchWidth: {
      label: "缺口宽度",
      hint: "左下缺口的横向宽度。最大 {maxWidth}。",
    },
    jisEnterNotchDepth: {
      label: "缺口深度",
      hint: "左下缺口的前后方向深度。最大 {maxDepth}。",
    },
    topScale: {
      label: "顶部收窄",
      hint: "数值越小，顶部会在保持宽度和深度比例的同时收窄",
    },
    bodyColor: {
      label: "本体颜色",
      hint: "可直接输入颜色代码，或使用颜色选择器",
    },
    topCenterHeight: {
      label: "上表面中心高度",
      typewriterLabel: "键顶厚度",
      hint: "添加 dish 前的键顶中心。当前中心表面为 {height}。",
      typewriterHint: "薄键顶从底部到上表面的厚度",
    },
    topOffset: {
      label: "键顶中心偏移",
      hint: "安装部位置不变，只将键顶中心左右 / 前后移动",
    },
    topOffsetX: {
      label: "左右偏移",
      hint: "安装部位置不变，只将键顶中心左右移动",
    },
    topOffsetY: {
      label: "前后偏移",
      hint: "安装部位置不变，只将键顶中心前后移动",
    },
    typewriterMountHeight: {
      label: "以上表面为基准的高度",
      hint: "从键顶本体上表面中心到安装部下端的距离。当前最小值为 {minHeight}。",
    },
    topSurfaceShape: {
      label: "键顶形状",
      hint: "平面为平坦表面，圆柱为单方向弯曲，球面为全方向弯曲",
    },
    dishDepth: {
      label: "深度",
      cylindricalHint: "正值会形成单方向凹陷，负值会形成单方向凸起。",
      sphericalHint: "正值会形成碗状凹陷，负值会凸起。",
      flatHint: "平面时此项不起作用。",
    },
    topHatEnabled: {
      label: "添加 Top Hat",
      hint: "在现有键顶上添加一个可独立设置形状的小键顶。",
    },
    topHatTopWidth: {
      label: "上面宽度",
      hint: "追加键顶上表面的宽度。当前最大值为 {maxWidth}。",
      secondaryLabel: "上面尺寸",
      miniLabel: "宽度",
    },
    topHatTopDepth: {
      label: "上面深度",
      hint: "追加键顶上表面的前后尺寸。当前最大值为 {maxDepth}。",
      secondaryLabel: "上面深度尺寸",
      miniLabel: "深度",
    },
    topHatInset: {
      label: "上面内缩量",
      hint: "从 Enter 键顶轮廓向内缩小的距离。当前最大值为 {maxInset}。",
    },
    topHatTopRadius: {
      label: "上面 R",
      hint: "追加键顶上表面的圆角。当前最大值为 {maxRadius}。",
    },
    topHatHeight: {
      label: "高度",
      hint: "从现有键顶面到追加上表面的高度。负值会向下凹陷。当前范围为 {minHeight} 到 {maxHeight}。",
    },
    topHatShoulderAngle: {
      label: "shoulder 角度",
      hint: "从追加上表面向肩部下降的角度。数值越大肩部越陡。",
    },
    topHatShoulderRadius: {
      label: "shoulder R",
      hint: "0 为折面；正值使肩部圆滑外凸，负值使肩部内凹。当前范围为 {minRadius} 到 {maxRadius}。",
    },
    rimEnabled: {
      label: "添加键圈",
      hint: "用单独部件覆盖键顶外周",
    },
    rimWidth: {
      label: "键圈宽度",
      hint: "从键顶正面看到的带状宽度。{maxWidth} 时会扩展到整个表面。",
    },
    rimHeightUp: {
      label: "向上高度",
      hint: "0 表示与上表面齐平。正值会向上延伸。",
    },
    rimHeightDown: {
      label: "向下高度",
      hint: "0 表示与下表面齐平。正值会向下延伸。",
    },
    rimColor: {
      label: "键圈颜色",
      hint: "可直接输入颜色代码，或使用颜色选择器",
    },
    topSlopeInputMode: {
      label: "倾斜输入方式",
      hint: "选择用角度输入，或用边缘高度输入",
    },
    topPitchDeg: {
      label: "前后倾斜",
      hint: "正值会抬高后侧。当前: 前 {front} / 后 {back}",
    },
    topRollDeg: {
      label: "左右倾斜",
      hint: "正值会抬高右侧。当前: 左 {left} / 右 {right}",
    },
    topFrontHeight: {
      label: "前侧高度",
      hint: "上表面基准面的前侧高度。中心高度固定，当前前后倾斜为 {pitch}。",
    },
    topBackHeight: {
      label: "后侧高度",
      hint: "上表面基准面的后侧高度。中心高度固定，当前前后倾斜为 {pitch}。",
    },
    topLeftHeight: {
      label: "左侧高度",
      hint: "上表面基准面的左侧高度。中心高度固定，当前左右倾斜为 {roll}。",
    },
    topRightHeight: {
      label: "右侧高度",
      hint: "上表面基准面的右侧高度。中心高度固定，当前左右倾斜为 {roll}。",
    },
    legendEnabled: {
      label: "添加字符",
      hint: "关闭后不会生成文字形状",
    },
    legendText: {
      label: "输入字符",
      hint: "可以直接输入多个字符",
      placeholder: "A / Shift / あ",
    },
    legendFontKey: {
      label: "字体",
      staticHint: "可通过放大镜搜索",
      variableHint: "可通过放大镜搜索。支持的 style 在右侧选择。",
    },
    legendFontStyleKey: {
      label: "字体内样式",
      selectableHint: "使用内置 style",
      defaultHint: "按字体名称默认方式使用",
    },
    legendUnderlineEnabled: {
      label: "添加下划线",
      hint: "下划线位置和粗细使用 font 文件中的信息，不会替换为任意外观。",
    },
    legendSize: {
      label: "文字大小",
      hint: "更改字符的大小。",
    },
    legendOutlineDelta: {
      label: "粗细补正",
      hint: "0 为原始轮廓。正值变粗，负值变细。",
    },
    legendHeight: {
      label: "文字高度",
      hint: "设为 0 时会成为嵌入式字符，填入上表面壳体的大部分；提高数值则会凸起。",
    },
    legendEmbed: {
      label: "向内嵌入",
      hint: "凸起文字根部进入键顶内部的距离。高度为 0 时会自动嵌入到上表面壳体的大部分。",
    },
    legendColor: {
      label: "字符颜色",
      hint: "可直接输入颜色代码，或使用颜色选择器",
    },
    legendOffsetX: {
      label: "左右位置",
      hint: "左右移动文字",
    },
    legendOffsetY: {
      label: "前后位置",
      hint: "前后移动文字",
    },
    homingBarEnabled: {
      label: "添加定位标记",
      hint: "让手指更容易找到位置",
    },
    homingBarLength: {
      label: "定位标记长度",
      hint: "左右扩展的距离",
    },
    homingBarWidth: {
      label: "定位标记宽度",
      hint: "定位标记外观上的粗细",
    },
    homingBarHeight: {
      label: "定位标记高度",
      hint: "从表面凸起的高度",
    },
    homingBarChamfer: {
      label: "定位标记倒角",
      hint: "较小值会轻微圆化上缘，较大值会接近半圆形凸脊。",
    },
    homingBarOffsetY: {
      label: "定位标记前后位置",
      hint: "前后移动定位标记",
    },
    homingBarColor: {
      label: "定位标记颜色",
      hint: "可直接输入颜色代码，或使用颜色选择器",
    },
    stemType: {
      label: "安装方式",
      hint: "选择键帽适配的轴体类型",
    },
    stemOuterDelta: {
      label: "外周补正",
      hint: "0 为标准值。正值会加粗外周圆，负值会变细。",
    },
    stemCrossMargin: {
      label: "配合余量",
      mxHint: "0 为标准值。正值会扩大十字孔，负值会收紧。",
      chocV1Hint: "0 为标准值。正值会让两个爪更细更松，负值会让其更粗更紧。",
      alpsHint: "0 为标准值。正值会让插入部更细更松，负值会让其更粗更紧。",
      disabledHint: "不生成安装部时不使用",
    },
    stemCrossChamfer: {
      label: "入口倒角",
      hint: "0 为标准值。增大该值只会扩大十字孔入口。",
      disabledHint: "非十字安装部不使用",
    },
    stemInsetDelta: {
      label: "轴部起始位置补正",
      hint: "0 为标准值。正值会从底面抬高起始位置，负值会向下延伸。",
      disabledHint: "不生成安装部时不使用",
    },
  },
  options: {
    stemType: {
      none: "无",
      mx: "MX 兼容",
      choc_v1: "Choc v1",
      choc_v2: "Choc v2",
      alps: "Alps / Matias",
    },
    topSurfaceShape: {
      flat: "平面",
      cylindrical: "圆柱",
      spherical: "球面",
    },
    topSlopeInputMode: {
      angle: "按角度调整",
      "edge-height": "按边缘高度调整",
    },
  },
  stemDescriptions: {
    none: "不生成安装部。适合只检查外形或字符时使用。",
    mx: "Cherry MX 兼容的十字形状。适配 Cherry / Gateron / Kailh BOX 等常见机械键盘轴。",
    choc_v1: "Kailh Choc v1 用的双爪形状。适配使用 Choc v1 轴的薄型键盘。",
    alps: "Alps / Matias 系的插入形状。适配对应的 Alps 系轴体。",
    choc_v2: "Kailh Choc v2 用的十字形状。生成适配 Choc v2 轴的安装部。",
  },
  font: {
    defaultStyleLabel: "按字体默认",
    searchAriaLabel: "搜索字体",
    searchDialogLabel: "字体搜索",
    searchPlaceholder: "按字体名称搜索",
    noResults: "没有匹配的字体",
    variableMeta: "可变 / 命名样式",
    staticMeta: "静态字形",
    attributionTitle: "版权与许可标注",
    attributions: {
      "kurobara-cinderella-regular": [
        "使用字体: 黒薔薇シンデレラ Version 1.00.20180805",
        "版权标注: Copyright(c) 2017 M+ FONTS PROJECT/MODI",
        "许可标注: This font is free software. Unlimited permission is granted to use, copy, and distribute it, with or without modification, either commercially or noncommercially. THIS FONT IS PROVIDED \"AS IS\" WITHOUT WARRANTY.",
        "派生源许可: SIL Open Font License, Version 1.1",
        "发布页面: https://modi.jpn.org/font_kurobara-cinderella.php"
      ],
    },
  },
  partLabels: {
    body: "本体",
    rim: "键圈",
    legend: "字符",
    topLegend: "{position}",
    sideLegend: "{side}侧面字符",
    homing: "定位标记",
  },
  preview: {
    placeholder: "尚未显示预览。更改设置后会自动更新为最新形状。",
    running: "正在更新预览",
    successSingle: "预览更新完成。正在显示{parts}。",
    successMultiple: "预览更新完成。正在按颜色分开显示{parts}。",
    failed: "预览更新失败",
    summary: "{elapsedMs} ms / {objectCount} objects / {vertexCount} vertices / {faceCount} triangles",
  },
  status: {
    notGenerated: "未生成",
    dirty: "等待应用输入内容",
    loadedDirty: "等待应用已读取的编辑数据",
  },
  importExport: {
    loaded: "已读取编辑数据 ({fileName})",
    loadLabel: "编辑数据读取",
    loadNote: "已将 {fileName} 应用到当前编辑内容",
    noJsonFile: "未找到 JSON 文件。",
    loadFailed: "读取编辑数据失败",
    loadFailedLabel: "编辑数据读取失败",
    preparing: "正在准备保存数据",
    savedEditorData: "已保存编辑数据 ({byteLength} bytes)",
    editorDataLabel: "编辑数据 JSON",
    editorDataNote: "将画面中可编辑的参数保存为 JSON 格式",
    savedThreeMf: "已保存 3MF 数据 ({byteLength} bytes / {partCount} 个部件)",
    threeMfLabel: "3MF 数据",
    threeMfNote: "已将{parts}汇总保存为 3MF 格式",
    savedStl: "已保存 STL ({byteLength} bytes)",
    stlLabel: "单色 STL",
    stlNote: "不包含颜色和字符，作为单一网格形状保存",
    saveFailed: "保存失败",
    saveFailedLabel: "保存失败",
    unsupportedExport: "不支持的 export 格式: {format}",
  },
  errors: {
    appRootMissing: "找不到 #app。",
    colorisLoadFailed: "Coloris 读取失败。",
    unsupportedOffPurpose: "不支持的 OFF 作业用途: {purpose}",
  },
  format: {
    listSeparator: "、",
  },
});

export default zh;
