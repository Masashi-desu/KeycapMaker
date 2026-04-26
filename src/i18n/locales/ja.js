const ja = Object.freeze({
  language: {
    label: "LANGUAGE",
    ariaLabel: "表示言語を選択",
    listLabel: "言語選択",
    options: {
      ja: "日本語",
      en: "English",
      zh: "中文",
      ko: "한국어",
    },
  },
  navigation: {
    label: "作業セクション",
    settings: "設定",
    export: "書き出し",
  },
  actions: {
    close: "閉じる",
    choose: "選ぶ",
    copy: "コピー",
    copied: "コピー済み",
    on: "オン",
    off: "オフ",
    saving: "保存しています...",
  },
  dropOverlay: {
    title: "編集データ / 互換入力 JSON をドロップ",
    body: "保存済みの編集データ、または不足値を既定で補う互換入力 JSON を読み込みます。",
  },
  panels: {
    settings: {
      title: "設定",
      body: "選んだキーキャップの形や印字を、入力に合わせて右側へ自動反映しながら調整できます。",
    },
    export: {
      title: "書き出し",
      body: "3MF / STL の印刷データと、あとで編集を再開するための JSON を保存できます。",
    },
  },
  exportPanel: {
    jsonChip: "編集再開用 JSON",
    jsonTitle: "編集データを保存",
    jsonBody: "形状、寸法、色、印字を JSON として保存します。あとでドラッグ&ドロップで再読込できます。",
    saveJson: "JSON を保存",
    threeMfChip: "印刷用 3MF",
    threeMfTitle: "3MFデータを保存",
    threeMfBody: "本体、目印、印字を含む印刷用データを 3MF 形式でまとめて保存します。",
    saveThreeMf: "3MF を保存",
    optionsTitle: "オプション",
    optionsBody: "通常の印刷データは 3MF を推奨します。スライサーや製造要件で必要な場合だけ STL を使います。",
    optionsExpand: "オプションを展開",
    optionsCollapse: "オプションを折りたたむ",
    stlChip: "単色用 STL",
    stlTitle: "STL を保存",
    stlBody: "単一素材・単一メッシュの STL として保存します。色と印字は無視され、形状のみが出力されます。色分けや印字が必要な場合は 3MF を保存してください。",
    saveStl: "STL を保存",
  },
  nameGroup: {
    title: "名称",
    description: "保存するときの名前です。3MF、STL、編集データ JSON に使われ、あとで読み込んでもこの名前が残ります。",
  },
  fieldGroup: {
    expand: "{title}を展開",
    collapse: "{title}を折りたたむ",
  },
  shapeProfiles: {
    "custom-shell": {
      label: "カスタムシェル",
      fieldGroups: {
        shape: {
          title: "キーキャップの形",
          description: "キーキャップ全体の大きさと、上に向かって細くなる具合を調整します。キーサイズは横幅と連動していて、18 mm を 1u として換算します。",
        },
        top: {
          title: "キートップ",
          description: "上面中央の基準高さを固定したまま、フラット / シンドリカル / スフェリカルを切り替えられます。シンドリカルは一方向だけ曲がります。端の高さに切り替えた場合も内部では pitch / roll に正規化されます。",
        },
        legend: {
          title: "印字",
          description: "入れる文字、書体、見た目、位置、盛り上がり、埋め込み量をまとめて調整します。複数文字もそのまま入力できます。",
        },
        homing: {
          title: "指の目印",
          description: "F キーや J キーのように、指で触って分かる出っ張りを調整します。印字とは別に設定できます。",
        },
        stem: {
          title: "取り付け部分",
        },
      },
    },
    typewriter: {
      label: "タイプライター",
      fieldGroups: {
        shape: {
          title: "キーキャップの形",
          description: "タイプライター風の薄いキートップ外形を調整します。横幅は 18 mm を 1u として換算し、R を大きくすると丸く、小さくすると四角に近づきます。",
        },
        top: {
          title: "キートップ",
          description: "上面中央の基準高さを固定したまま、前後と左右の傾きを角度または端の高さで編集できます。端の高さに切り替えた場合も内部では pitch / roll に正規化されます。",
        },
        legend: {
          title: "印字",
          description: "入れる文字、書体、見た目、位置、盛り上がり、埋め込み量をまとめて調整します。複数文字もそのまま入力できます。",
        },
        homing: {
          title: "指の目印",
          description: "F キーや J キーのように、指で触って分かる出っ張りを調整します。印字とは別に設定できます。",
        },
        stem: {
          title: "取り付け部分",
        },
      },
    },
    "jis-enter": {
      label: "JISエンター",
      fieldGroups: {
        shape: {
          title: "キーキャップの形",
          description: "一般的な JIS / ISO 系の縦長 Enter footprint を基準に、全体寸法と左下の欠き込みを調整します。横幅は 18 mm を 1u として換算します。",
        },
        top: {
          title: "キートップ",
          description: "カスタムシェルと同じく、上面中央の基準高さ、フラット / シンドリカル / スフェリカル、前後左右の傾きを調整できます。",
        },
        legend: {
          title: "印字",
          description: "入れる文字、書体、見た目、位置、盛り上がり、埋め込み量をまとめて調整します。複数文字もそのまま入力できます。",
        },
        homing: {
          title: "指の目印",
          description: "F キーや J キーのように、指で触って分かる出っ張りを調整します。印字とは別に設定できます。",
        },
        stem: {
          title: "取り付け部分",
        },
      },
    },
    "typewriter-jis-enter": {
      label: "タイプライターJISエンター",
      fieldGroups: {
        shape: {
          title: "キーキャップの形",
          description: "タイプライター風の薄い JIS Enter footprint を基準に、全体寸法、左下の欠き込み、R を調整します。横幅は 18 mm を 1u として換算します。",
        },
        top: {
          title: "キートップ",
          description: "タイプライターと同じく、薄いキートップの厚み、リム、前後左右の傾きを調整できます。",
        },
        legend: {
          title: "印字",
          description: "入れる文字、書体、見た目、位置、盛り上がり、埋め込み量をまとめて調整します。複数文字もそのまま入力できます。",
        },
        homing: {
          title: "指の目印",
          description: "F キーや J キーのように、指で触って分かる出っ張りを調整します。印字とは別に設定できます。",
        },
        stem: {
          title: "取り付け部分",
        },
      },
    },
  },
  fieldGroups: {
    shapeDescriptionShell: "キーキャップ全体の大きさと、上に向かって細くなる具合を調整します。キーサイズは横幅と連動していて、18 mm を 1u として換算します。",
    shapeDescriptionTypewriter: "タイプライター風の薄いキートップ外形を調整します。横幅は 18 mm を 1u として換算し、R を大きくすると丸く、小さくすると四角に近づきます。",
    topDescription: "上面中央の基準高さを固定したまま、前後と左右の傾きを角度または端の高さで編集できます。端の高さに切り替えた場合も内部では pitch / roll に正規化されます。",
  },
  fields: {
    name: {
      label: "名称",
      hint: "3MF、STL、編集データ JSON の保存名に使います",
    },
    shapeProfile: {
      label: "形のベース",
      hint: "使う基本形を選びます",
    },
    keyWidth: {
      label: "横幅",
      hint: "横幅とキーサイズは連動します。18 mm = 1u です",
      secondaryLabel: "キーサイズ",
      miniLabel: "横幅",
    },
    keyDepth: {
      label: "奥行き",
      hint: "キーキャップの前後の大きさです",
    },
    wallThickness: {
      label: "肉厚",
      hint: "キーキャップの丈夫さに関わる厚みです",
    },
    typewriterCornerRadius: {
      label: "R",
      hint: "{maxRadius} で丸、0 mm に近づけると角が立ちます",
    },
    jisEnterNotchWidth: {
      label: "欠き込み幅",
      hint: "左下に空ける横方向の欠き込みです。最大 {maxWidth} です",
    },
    jisEnterNotchDepth: {
      label: "欠き込み奥行き",
      hint: "左下に空ける前後方向の欠き込みです。最大 {maxDepth} です",
    },
    topScale: {
      label: "上面のすぼまり",
      hint: "数字を小さくすると上面が細く見えます",
    },
    bodyColor: {
      label: "本体の色",
      hint: "カラーコードを直接入力するか、カラーピッカーで選べます",
    },
    topCenterHeight: {
      label: "上面中央の高さ",
      typewriterLabel: "キートップの厚み",
      hint: "dish を付ける前のキートップ中央です。現在の中央表面は {height} です",
      typewriterHint: "薄いキートップの底から上面までの厚みです",
    },
    typewriterMountHeight: {
      label: "上面基準の高さ",
      hint: "キートップ本体の上面中央から取り付け部分の下端までの距離です。現在の最小値は {minHeight} です",
    },
    topSurfaceShape: {
      label: "キートップ形状",
      hint: "フラットは平面、シンドリカルは一方向、スフェリカルは全方向に曲がります",
    },
    dishDepth: {
      label: "深さ",
      cylindricalHint: "プラスで一方向に凹み、マイナスで一方向に盛り上がります",
      sphericalHint: "プラスで椀形に凹み、マイナスで盛り上がります",
      flatHint: "フラットでは効きません",
    },
    rimEnabled: {
      label: "キーリムを付ける",
      hint: "キートップ外周を別パーツで覆います",
    },
    rimWidth: {
      label: "キーリムの幅",
      hint: "キートップ正面から見た帯の幅です。{maxWidth} で全面まで広がります",
    },
    rimHeightUp: {
      label: "上方向の高さ",
      hint: "0 で上面と面一です。プラスで上へ伸びます",
    },
    rimHeightDown: {
      label: "下方向の高さ",
      hint: "0 で下面と面一です。プラスで下へ伸びます",
    },
    rimColor: {
      label: "キーリムの色",
      hint: "カラーコードを直接入力するか、カラーピッカーで選べます",
    },
    topSlopeInputMode: {
      label: "傾きの入力方法",
      hint: "角度で入れるか、端の高さで入れるかを選びます",
    },
    topPitchDeg: {
      label: "手前から奥の傾斜",
      hint: "プラスで奥が高くなります。現在: 手前 {front} / 奥 {back}",
    },
    topRollDeg: {
      label: "左右の傾斜",
      hint: "プラスで右が高くなります。現在: 左 {left} / 右 {right}",
    },
    topFrontHeight: {
      label: "手前高さ",
      hint: "上面基準面の手前高さです。中央高さは固定され、現在の前後傾斜は {pitch} です",
    },
    topBackHeight: {
      label: "奥高さ",
      hint: "上面基準面の奥高さです。中央高さは固定され、現在の前後傾斜は {pitch} です",
    },
    topLeftHeight: {
      label: "左高さ",
      hint: "上面基準面の左高さです。中央高さは固定され、現在の左右傾斜は {roll} です",
    },
    topRightHeight: {
      label: "右高さ",
      hint: "上面基準面の右高さです。中央高さは固定され、現在の左右傾斜は {roll} です",
    },
    legendEnabled: {
      label: "印字を入れる",
      hint: "オフにすると文字を作りません",
    },
    legendText: {
      label: "入れる文字",
      hint: "複数文字をそのまま入力できます",
      placeholder: "A / Shift / あ",
    },
    legendFontKey: {
      label: "書体",
      staticHint: "虫眼鏡から検索できます",
      variableHint: "虫眼鏡から検索できます。対応 style は右側で選びます",
    },
    legendFontStyleKey: {
      label: "フォント内スタイル",
      selectableHint: "内蔵 style を使います",
      defaultHint: "フォント名どおりに使います",
    },
    legendUnderlineEnabled: {
      label: "下線を付ける",
      hint: "下線位置と太さは font ファイルの情報を使います。任意の見た目へ置き換えません",
    },
    legendSize: {
      label: "文字の大きさ",
      hint: "印字する文字の大きさを変更します。",
    },
    legendOutlineDelta: {
      label: "太さ補正",
      hint: "0 が元の輪郭です。プラスで太く、マイナスで細くします",
    },
    legendHeight: {
      label: "文字の高さ",
      hint: "0 にすると上面シェルの大半を埋める埋め込み印字になり、数字を上げると盛り上がります",
    },
    legendEmbed: {
      label: "内側への埋め込み",
      hint: "盛り上がる文字の根元をどれだけキートップ内部へ入れるかです。高さ 0 の場合は上面シェルの大半まで自動で埋め込みます",
    },
    legendColor: {
      label: "印字の色",
      hint: "カラーコードを直接入力するか、カラーピッカーで選べます",
    },
    legendOffsetX: {
      label: "左右の位置",
      hint: "文字を左右に動かします",
    },
    legendOffsetY: {
      label: "前後の位置",
      hint: "文字を前後に動かします",
    },
    homingBarEnabled: {
      label: "目印を付ける",
      hint: "指で位置を探しやすくします",
    },
    homingBarLength: {
      label: "目印の長さ",
      hint: "左右にどれくらい広げるかです",
    },
    homingBarWidth: {
      label: "目印の太さ",
      hint: "目印の見た目の太さです",
    },
    homingBarHeight: {
      label: "目印の高さ",
      hint: "表面からどれだけ出すかです",
    },
    homingBarChamfer: {
      label: "目印の面取り",
      hint: "小さい値では上端を軽く丸め、大きくすると半円状の山に近づきます",
    },
    homingBarOffsetY: {
      label: "目印の前後位置",
      hint: "目印を前後に動かします",
    },
    homingBarColor: {
      label: "目印の色",
      hint: "カラーコードを直接入力するか、カラーピッカーで選べます",
    },
    stemType: {
      label: "取り付け方式",
      hint: "キーキャップが合う軸の種類を選びます",
    },
    stemOuterDelta: {
      label: "外周の補正",
      hint: "0 が標準です。プラスで外周円を太く、マイナスで細くします",
    },
    stemCrossMargin: {
      label: "はまりのゆとり",
      mxHint: "0 が標準です。プラスで十字穴を広げ、マイナスで狭めます",
      chocV1Hint: "0 が標準です。プラスで 2 本爪を細くして緩く、マイナスで太くしてきつくします",
      alpsHint: "0 が標準です。プラスで差し込み部を細くして緩く、マイナスで太くしてきつくします",
      disabledHint: "取り付け部分を作らないときは使いません",
    },
    stemInsetDelta: {
      label: "軸の開始位置補正",
      hint: "0 が標準です。プラスで底面からの開始位置を上げ、内部干渉を避けます",
      disabledHint: "取り付け部分を作らないときは使いません",
    },
  },
  options: {
    stemType: {
      none: "なし",
      mx: "MX 互換",
      choc_v1: "Choc v1",
      choc_v2: "Choc v2",
      alps: "Alps / Matias",
    },
    topSurfaceShape: {
      flat: "フラット",
      cylindrical: "シンドリカル",
      spherical: "スフェリカル",
    },
    topSlopeInputMode: {
      angle: "角度で調整",
      "edge-height": "端の高さで調整",
    },
  },
  stemDescriptions: {
    none: "取り付け部分を作りません。外形や印字だけを確認したいとき向けです。",
    mx: "Cherry MX 互換の十字形状です。Cherry / Gateron / Kailh BOX など、一般的なメカニカルキーボード用の軸に合います。",
    choc_v1: "Kailh Choc v1 用の 2 本爪形状です。薄型キーボード向けの Choc v1 軸に合います。",
    alps: "Alps / Matias 系の差し込み形状です。対応する Alps 系の軸に合います。",
    choc_v2: "Kailh Choc v2 用の十字形状です。Choc v2 軸に合う取り付け部分を作ります。",
  },
  font: {
    defaultStyleLabel: "フォント名どおり",
    searchAriaLabel: "フォントを検索",
    searchDialogLabel: "フォント検索",
    searchPlaceholder: "フォント名で検索",
    noResults: "一致するフォントがありません",
    variableMeta: "Variable / named style",
    staticMeta: "Static face",
    attributionTitle: "著作権・ライセンス表記",
    attributions: {},
  },
  partLabels: {
    body: "本体",
    rim: "キーリム",
    legend: "印字",
    homing: "目印",
  },
  preview: {
    placeholder: "まだ見た目を表示していません。設定を変えると自動で最新の形に更新されます。",
    running: "見た目を更新しています",
    successSingle: "見た目の更新が完了しました。{parts}を表示しています。",
    successMultiple: "見た目の更新が完了しました。{parts}を色ごとに分けて表示しています。",
    failed: "見た目の更新に失敗しました",
    summary: "{elapsedMs} ms / {objectCount} objects / {vertexCount} vertices / {faceCount} triangles",
  },
  status: {
    notGenerated: "未生成",
    dirty: "入力内容を反映待ち",
    loadedDirty: "読み込んだ編集データを反映待ち",
  },
  importExport: {
    loaded: "編集データを読み込みました ({fileName})",
    loadLabel: "編集データ読込",
    loadNote: "{fileName} を現在の編集内容へ反映",
    noJsonFile: "JSON ファイルが見つかりません。",
    loadFailed: "編集データの読み込みに失敗しました",
    loadFailedLabel: "編集データ読込失敗",
    preparing: "保存データを準備しています",
    savedEditorData: "編集データを保存しました ({byteLength} bytes)",
    editorDataLabel: "編集データ JSON",
    editorDataNote: "画面で編集するパラメータを JSON 形式で保存",
    savedThreeMf: "3MFデータを保存しました ({byteLength} bytes / {partCount} 個のパーツ)",
    threeMfLabel: "3MFデータ",
    threeMfNote: "{parts}を 3MF 形式でまとめて保存",
    savedStl: "STLを保存しました ({byteLength} bytes)",
    stlLabel: "単色 STL",
    stlNote: "色と印字を含めず、単一メッシュの形状として保存",
    saveFailed: "保存に失敗しました",
    saveFailedLabel: "保存失敗",
    unsupportedExport: "未対応の export 形式です: {format}",
  },
  errors: {
    appRootMissing: "#app が見つかりません。",
    colorisLoadFailed: "Coloris の読み込みに失敗しました。",
    unsupportedOffPurpose: "未対応の OFF ジョブ用途です: {purpose}",
  },
  format: {
    listSeparator: "、",
  },
});

export default ja;
