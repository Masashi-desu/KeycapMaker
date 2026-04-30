const ko = Object.freeze({
  language: {
    label: "LANGUAGE",
    ariaLabel: "표시 언어 선택",
    listLabel: "언어 선택",
    options: {
      ja: "日本語",
      en: "English",
      zh: "中文",
      ko: "한국어",
    },
  },
  navigation: {
    label: "작업 섹션",
    settings: "설정",
    export: "내보내기",
  },
  actions: {
    close: "닫기",
    choose: "선택",
    copy: "복사",
    copied: "복사됨",
    on: "켜짐",
    off: "꺼짐",
    saving: "저장 중...",
  },
  dropOverlay: {
    title: "편집 데이터 / 호환 입력 JSON 드롭",
    body: "저장된 편집 데이터 또는 누락값을 기본값으로 보완하는 호환 입력 JSON을 불러옵니다.",
  },
  panels: {
    settings: {
      title: "설정",
      body: "선택한 키캡 형상과 각인을 입력에 맞춰 조정하고, 오른쪽 미리보기에 자동 반영할 수 있습니다.",
    },
    export: {
      title: "내보내기",
      body: "3MF / STL 인쇄 데이터와 나중에 편집을 다시 시작하기 위한 JSON을 저장할 수 있습니다.",
    },
  },
  mobileInspector: {
    hide: "설정 카드를 위로 숨기기",
    show: "설정 카드 되돌리기",
  },
  exportPanel: {
    jsonChip: "편집 재개용 JSON",
    jsonTitle: "편집 데이터 저장",
    jsonBody: "형상, 치수, 색상, 각인을 JSON으로 저장합니다. 나중에 드래그 앤 드롭으로 다시 불러올 수 있습니다.",
    saveJson: "JSON 저장",
    threeMfChip: "인쇄용 3MF",
    threeMfTitle: "3MF 데이터 저장",
    threeMfBody: "본체, 위치 표시, 각인을 포함한 인쇄용 데이터를 3MF 형식으로 묶어 저장합니다.",
    saveThreeMf: "3MF 저장",
    optionsTitle: "옵션",
    optionsBody: "일반 인쇄 데이터는 3MF를 권장합니다. 슬라이서나 제작 요구사항상 필요한 경우에만 STL을 사용합니다.",
    optionsExpand: "옵션 펼치기",
    optionsCollapse: "옵션 접기",
    stlChip: "단색용 STL",
    stlTitle: "STL 저장",
    stlBody: "단일 소재, 단일 메시 STL로 저장합니다. 색상과 각인은 무시되고 형상만 출력됩니다. 색상 구분이나 각인이 필요하면 3MF로 저장하세요.",
    saveStl: "STL 저장",
  },
  nameGroup: {
    title: "이름",
    description: "저장할 때 사용하는 이름입니다. 3MF, STL, 편집 데이터 JSON에 사용되며, 나중에 불러와도 이 이름이 유지됩니다.",
  },
  parameterGroupCaptions: {
    name: "내보내기 파일명",
    top: "상면과 기울기",
    legend: "문자와 위치",
  },
  unitBasis: {
    title: "1u 환산",
    description: "현재 {unitBase} mm를 1u로 표시합니다.",
    fieldLabel: "1u 기준",
    fieldHint: "좁은 피치 환산용입니다. 모델 치수는 바뀌지 않습니다",
    readout: "현재 치수: 폭 {widthUnits}u / 깊이 {depthUnits}u",
  },
  fieldGroup: {
    expand: "{title} 펼치기",
    collapse: "{title} 접기",
  },
  legendCards: {
    center: "중앙 각인",
    rightTop: "오른쪽 위 각인",
    rightBottom: "오른쪽 아래 각인",
    leftTop: "왼쪽 위 각인",
    leftBottom: "왼쪽 아래 각인",
    keytop: "키톱",
    sidewall: "{side} 측면",
  },
  stemCards: {
    clearance: "클리어런스",
  },
  shapeProfiles: {
    "custom-shell": {
      label: "커스텀 셸",
      fieldGroups: {
        shape: {
          title: "키캡 형상",
          description: "키캡 전체 크기와 위쪽으로 좁아지는 정도를 조정합니다. 폭과 깊이는 각각 {unitBase} mm를 1u로 환산합니다.",
        },
        top: {
          title: "키톱",
          description: "상면 중앙 기준 높이를 고정한 채 평면 / 원통 / 구면과 top-hat 추가 여부를 전환할 수 있습니다. 모서리 높이 입력으로 전환해도 내부에서는 pitch / roll로 정규화됩니다.",
        },
        legend: {
          title: "각인",
          description: "입력할 문자, 서체, 모양, 위치, 돌출 높이, 매립량을 한곳에서 조정합니다. 여러 글자도 그대로 입력할 수 있습니다.",
        },
        homing: {
          title: "손가락 위치 표시",
          description: "F 키나 J 키처럼 손끝으로 위치를 알 수 있는 돌출부를 조정합니다. 각인과 별도로 설정할 수 있습니다.",
        },
        stem: {
          title: "장착부",
        },
      },
    },
    typewriter: {
      label: "타자기",
      fieldGroups: {
        shape: {
          title: "키캡 형상",
          description: "타자기풍의 얇은 키톱 외형을 조정합니다. 폭과 깊이는 각각 {unitBase} mm를 1u로 환산하며, R이 커질수록 둥글고 작아질수록 사각형에 가까워집니다.",
        },
        top: {
          title: "키톱",
          description: "상면 중앙 기준 높이를 고정한 채 앞뒤와 좌우 기울기를 각도 또는 모서리 높이로 편집할 수 있습니다. 모서리 높이 입력은 내부에서 pitch / roll로 정규화됩니다.",
        },
        legend: {
          title: "각인",
          description: "입력할 문자, 서체, 모양, 위치, 돌출 높이, 매립량을 한곳에서 조정합니다. 여러 글자도 그대로 입력할 수 있습니다.",
        },
        homing: {
          title: "손가락 위치 표시",
          description: "F 키나 J 키처럼 손끝으로 위치를 알 수 있는 돌출부를 조정합니다. 각인과 별도로 설정할 수 있습니다.",
        },
        stem: {
          title: "장착부",
        },
      },
    },
    "jis-enter": {
      label: "JIS Enter",
      fieldGroups: {
        shape: {
          title: "키캡 형상",
          description: "일반적인 JIS / ISO 계열 세로형 Enter footprint를 기준으로 전체 치수와 왼쪽 아래 파임을 조정합니다. 폭과 깊이는 각각 {unitBase} mm를 1u로 환산합니다.",
        },
        top: {
          title: "키톱",
          description: "커스텀 셸처럼 상면 중앙 기준 높이, 평면 / 원통 / 구면, 앞뒤와 좌우 기울기를 조정할 수 있습니다.",
        },
        legend: {
          title: "각인",
          description: "입력할 문자, 서체, 모양, 위치, 돌출 높이, 매립량을 한곳에서 조정합니다. 여러 글자도 그대로 입력할 수 있습니다.",
        },
        homing: {
          title: "손가락 위치 표시",
          description: "F 키나 J 키처럼 손끝으로 위치를 알 수 있는 돌출부를 조정합니다. 각인과 별도로 설정할 수 있습니다.",
        },
        stem: {
          title: "장착부",
        },
      },
    },
    "typewriter-jis-enter": {
      label: "타자기 JIS Enter",
      fieldGroups: {
        shape: {
          title: "키캡 형상",
          description: "타자기풍의 얇은 JIS Enter footprint를 기준으로 전체 치수, 왼쪽 아래 파임, R을 조정합니다. 폭과 깊이는 각각 {unitBase} mm를 1u로 환산합니다.",
        },
        top: {
          title: "키톱",
          description: "타자기 형상처럼 얇은 키톱 두께, 림, 앞뒤와 좌우 기울기를 조정할 수 있습니다.",
        },
        legend: {
          title: "각인",
          description: "입력할 문자, 서체, 모양, 위치, 돌출 높이, 매립량을 한곳에서 조정합니다. 여러 글자도 그대로 입력할 수 있습니다.",
        },
        homing: {
          title: "손가락 위치 표시",
          description: "F 키나 J 키처럼 손끝으로 위치를 알 수 있는 돌출부를 조정합니다. 각인과 별도로 설정할 수 있습니다.",
        },
        stem: {
          title: "장착부",
        },
      },
    },
  },
  fieldGroups: {
    shapeDescriptionShell: "키캡 전체 크기와 위쪽으로 좁아지는 정도를 조정합니다. 폭과 깊이는 각각 {unitBase} mm를 1u로 환산합니다.",
    shapeDescriptionTypewriter: "타자기풍의 얇은 키톱 외형을 조정합니다. 폭과 깊이는 각각 {unitBase} mm를 1u로 환산하며, R이 커질수록 둥글고 작아질수록 사각형에 가까워집니다.",
    topDescription: "상면 중앙 기준 높이를 고정한 채 앞뒤와 좌우 기울기를 각도 또는 모서리 높이로 편집할 수 있습니다. 모서리 높이 입력은 내부에서 pitch / roll로 정규화됩니다.",
  },
  fields: {
    name: {
      label: "이름",
      hint: "3MF, STL, 편집 데이터 JSON의 저장 파일 이름으로 사용됩니다",
    },
    shapeProfile: {
      label: "기본 형상",
      hint: "사용할 기본 형상을 선택합니다",
    },
    keyWidth: {
      label: "폭",
      hint: "폭과 키 크기는 연동됩니다. {unitBase} mm = 1u입니다.",
      secondaryLabel: "키 크기",
      miniLabel: "폭",
    },
    keyDepth: {
      label: "깊이",
      hint: "깊이와 깊이 크기는 연동됩니다. {unitBase} mm = 1u입니다.",
      secondaryLabel: "깊이 크기",
      miniLabel: "깊이",
    },
    wallThickness: {
      label: "벽 두께",
      hint: "키캡의 견고함에 영향을 주는 두께입니다",
    },
    typewriterCornerRadius: {
      label: "R",
      hint: "{maxRadius}이면 둥글고, 0 mm에 가까울수록 모서리가 살아납니다.",
    },
    topCornerRadius: {
      label: "상면 R",
      hint: "키톱 상면의 네 모서리를 함께 둥글게 합니다. 현재 최대값은 {maxRadius}입니다.",
    },
    topCornerRadiusIndividualEnabled: {
      label: "개별",
      hint: "켜면 네 모서리의 R을 각각 조정할 수 있습니다.",
    },
    topCornerRadiusLeftTop: {
      label: "왼쪽 위 R",
    },
    topCornerRadiusRightTop: {
      label: "오른쪽 위 R",
    },
    topCornerRadiusRightBottom: {
      label: "오른쪽 아래 R",
    },
    topCornerRadiusLeftBottom: {
      label: "왼쪽 아래 R",
    },
    jisEnterNotchWidth: {
      label: "파임 폭",
      hint: "왼쪽 아래 파임의 가로 폭입니다. 최댓값은 {maxWidth}입니다.",
    },
    jisEnterNotchDepth: {
      label: "파임 깊이",
      hint: "왼쪽 아래 파임의 앞뒤 깊이입니다. 최댓값은 {maxDepth}입니다.",
    },
    topScale: {
      label: "상면 좁아짐",
      hint: "숫자가 작을수록 폭과 깊이 비율을 유지한 채 상면이 좁아집니다",
    },
    bodyColor: {
      label: "본체 색상",
      hint: "색상 코드를 직접 입력하거나 색상 선택기로 고를 수 있습니다",
    },
    topCenterHeight: {
      label: "상면 중앙 높이",
      typewriterLabel: "키톱 두께",
      hint: "dish를 적용하기 전의 키톱 중앙입니다. 현재 중앙 표면은 {height}입니다.",
      typewriterHint: "얇은 키톱의 바닥에서 상면까지의 두께입니다",
    },
    topOffset: {
      label: "키톱 중심 오프셋",
      hint: "장착부 위치는 그대로 두고 키톱 중심만 좌우 / 앞뒤로 이동합니다",
    },
    topOffsetX: {
      label: "좌우 오프셋",
      hint: "장착부 위치는 그대로 두고 키톱 중심을 좌우로 이동합니다",
    },
    topOffsetY: {
      label: "앞뒤 오프셋",
      hint: "장착부 위치는 그대로 두고 키톱 중심을 앞뒤로 이동합니다",
    },
    typewriterMountHeight: {
      label: "상면 기준 높이",
      hint: "키톱 본체의 상면 중앙에서 장착부 하단까지의 거리입니다. 현재 최솟값은 {minHeight}입니다.",
    },
    topSurfaceShape: {
      label: "키톱 형상",
      hint: "평면은 납작한 면, 원통은 한 방향, 구면은 모든 방향으로 휘어집니다",
    },
    dishDepth: {
      label: "깊이",
      cylindricalHint: "양수이면 한 방향으로 오목해지고, 음수이면 한 방향으로 솟아오릅니다.",
      sphericalHint: "양수이면 그릇 모양으로 오목해지고, 음수이면 솟아오릅니다.",
      flatHint: "평면에서는 적용되지 않습니다.",
    },
    topHatEnabled: {
      label: "탑햇 추가",
      hint: "기존 키톱 위에 별도 형상의 작은 키톱을 추가합니다.",
    },
    topHatTopWidth: {
      label: "상면 가로폭",
      hint: "추가 키톱 상면의 가로폭입니다. 현재 최대값은 {maxWidth}입니다.",
      secondaryLabel: "상면 크기",
      miniLabel: "폭",
    },
    topHatTopDepth: {
      label: "상면 깊이",
      hint: "추가 키톱 상면의 앞뒤 치수입니다. 현재 최대값은 {maxDepth}입니다.",
      secondaryLabel: "상면 깊이 크기",
      miniLabel: "깊이",
    },
    topHatInset: {
      label: "상면 축소량",
      hint: "엔터 키톱 윤곽에서 안쪽으로 줄이는 양입니다. 현재 최대값은 {maxInset}입니다.",
    },
    topHatTopRadius: {
      label: "상면 R",
      hint: "추가 키톱 상면의 모서리 반경입니다. 현재 최대값은 {maxRadius}입니다.",
    },
    topHatHeight: {
      label: "높이",
      hint: "기존 키톱 면에서 추가 상면까지의 높이입니다. 음수는 키톱을 파냅니다. 현재 범위는 {minHeight}부터 {maxHeight}까지입니다.",
    },
    topHatShoulderAngle: {
      label: "shoulder 각도",
      hint: "추가 상면에서 어깨로 내려가는 각도입니다. 값이 클수록 급해집니다.",
    },
    topHatShoulderRadius: {
      label: "shoulder R",
      hint: "0이면 각진 면이고, 양수는 둥글게 부풀며 음수는 오목하게 들어갑니다. 현재 범위는 {minRadius}부터 {maxRadius}까지입니다.",
    },
    rimEnabled: {
      label: "키 림 추가",
      hint: "키톱 외주를 별도 부품으로 덮습니다",
    },
    rimWidth: {
      label: "키 림 폭",
      hint: "키톱을 정면에서 봤을 때의 띠 폭입니다. {maxWidth}이면 전체 표면까지 넓어집니다.",
    },
    rimHeightUp: {
      label: "위쪽 높이",
      hint: "0이면 상면과 같은 높이입니다. 양수이면 위로 늘어납니다.",
    },
    rimHeightDown: {
      label: "아래쪽 높이",
      hint: "0이면 하면과 같은 높이입니다. 양수이면 아래로 늘어납니다.",
    },
    rimColor: {
      label: "키 림 색상",
      hint: "색상 코드를 직접 입력하거나 색상 선택기로 고를 수 있습니다",
    },
    topSlopeInputMode: {
      label: "기울기 입력 방식",
      hint: "각도로 입력할지, 모서리 높이로 입력할지 선택합니다",
    },
    topPitchDeg: {
      label: "앞뒤 기울기",
      hint: "양수이면 뒤쪽이 높아집니다. 현재: 앞 {front} / 뒤 {back}",
    },
    topRollDeg: {
      label: "좌우 기울기",
      hint: "양수이면 오른쪽이 높아집니다. 현재: 왼쪽 {left} / 오른쪽 {right}",
    },
    topFrontHeight: {
      label: "앞쪽 높이",
      hint: "상면 기준면의 앞쪽 높이입니다. 중앙 높이는 고정되며 현재 앞뒤 기울기는 {pitch}입니다.",
    },
    topBackHeight: {
      label: "뒤쪽 높이",
      hint: "상면 기준면의 뒤쪽 높이입니다. 중앙 높이는 고정되며 현재 앞뒤 기울기는 {pitch}입니다.",
    },
    topLeftHeight: {
      label: "왼쪽 높이",
      hint: "상면 기준면의 왼쪽 높이입니다. 중앙 높이는 고정되며 현재 좌우 기울기는 {roll}입니다.",
    },
    topRightHeight: {
      label: "오른쪽 높이",
      hint: "상면 기준면의 오른쪽 높이입니다. 중앙 높이는 고정되며 현재 좌우 기울기는 {roll}입니다.",
    },
    legendEnabled: {
      label: "각인 추가",
      hint: "끄면 문자 형상을 만들지 않습니다",
    },
    legendText: {
      label: "입력 문자",
      hint: "여러 글자를 그대로 입력할 수 있습니다",
      placeholder: "A / Shift / あ",
    },
    legendFontKey: {
      label: "서체",
      staticHint: "돋보기로 검색할 수 있습니다",
      variableHint: "돋보기로 검색할 수 있습니다. 지원되는 style은 오른쪽에서 선택합니다.",
    },
    legendFontStyleKey: {
      label: "폰트 내 스타일",
      selectableHint: "내장 style을 사용합니다",
      defaultHint: "폰트 이름 그대로 사용합니다",
    },
    legendUnderlineEnabled: {
      label: "밑줄 추가",
      hint: "밑줄 위치와 두께는 font 파일의 정보를 사용합니다. 임의의 모양으로 대체하지 않습니다.",
    },
    legendSize: {
      label: "문자 크기",
      hint: "각인할 문자의 크기를 변경합니다.",
    },
    legendOutlineDelta: {
      label: "굵기 보정",
      hint: "0은 원래 윤곽입니다. 양수이면 굵게, 음수이면 가늘게 합니다.",
    },
    legendHeight: {
      label: "문자 높이",
      hint: "0이면 상면 셸의 대부분을 채우는 매립 각인이 되고, 값을 올리면 돌출됩니다.",
    },
    legendEmbed: {
      label: "안쪽 매립",
      hint: "돌출된 문자의 뿌리를 키톱 내부로 얼마나 넣을지입니다. 높이가 0이면 상면 셸 대부분까지 자동으로 매립됩니다.",
    },
    legendColor: {
      label: "각인 색상",
      hint: "색상 코드를 직접 입력하거나 색상 선택기로 고를 수 있습니다",
    },
    legendOffsetX: {
      label: "좌우 위치",
      hint: "문자를 좌우로 움직입니다",
    },
    legendOffsetY: {
      label: "앞뒤 위치",
      hint: "문자를 앞뒤로 움직입니다",
    },
    homingBarEnabled: {
      label: "위치 표시 추가",
      hint: "손가락으로 위치를 찾기 쉽게 합니다",
    },
    homingBarLength: {
      label: "위치 표시 길이",
      hint: "좌우로 얼마나 넓힐지입니다",
    },
    homingBarWidth: {
      label: "위치 표시 두께",
      hint: "위치 표시의 겉보기 두께입니다",
    },
    homingBarHeight: {
      label: "위치 표시 높이",
      hint: "표면에서 얼마나 튀어나오게 할지입니다",
    },
    homingBarChamfer: {
      label: "위치 표시 모따기",
      hint: "작은 값은 위쪽 모서리를 살짝 둥글게 하고, 큰 값은 반원형 봉우리에 가까워집니다.",
    },
    homingBarOffsetY: {
      label: "위치 표시 앞뒤 위치",
      hint: "위치 표시를 앞뒤로 움직입니다",
    },
    homingBarColor: {
      label: "위치 표시 색상",
      hint: "색상 코드를 직접 입력하거나 색상 선택기로 고를 수 있습니다",
    },
    stemType: {
      label: "장착 방식",
      hint: "키캡이 맞을 스위치 종류를 선택합니다",
    },
    stemOuterDelta: {
      label: "외주 보정",
      hint: "0이 표준입니다. 양수이면 외주 원을 굵게, 음수이면 가늘게 합니다.",
    },
    stemCrossMargin: {
      label: "끼움 여유",
      mxHint: "0이 표준입니다. 양수이면 십자 구멍을 넓히고, 음수이면 좁힙니다.",
      chocV1Hint: "0이 표준입니다. 양수이면 두 갈래를 가늘게 해 느슨하게, 음수이면 두껍게 해 빡빡하게 합니다.",
      alpsHint: "0이 표준입니다. 양수이면 삽입부를 가늘게 해 느슨하게, 음수이면 두껍게 해 빡빡하게 합니다.",
      disabledHint: "장착부를 만들지 않을 때는 사용하지 않습니다",
    },
    stemCrossChamfer: {
      label: "입구 모따기",
      hint: "0이 표준입니다. 값을 키우면 십자 구멍 입구만 넓힙니다.",
      disabledHint: "십자형 마운트가 아닐 때는 사용하지 않습니다",
    },
    stemInsetDelta: {
      label: "축 시작 위치 보정",
      hint: "0이 표준입니다. 양수이면 바닥면에서 시작 위치를 올리고, 음수이면 아래로 늘립니다.",
      disabledHint: "장착부를 만들지 않을 때는 사용하지 않습니다",
    },
  },
  options: {
    stemType: {
      none: "없음",
      mx: "MX 호환",
      choc_v1: "Choc v1",
      choc_v2: "Choc v2",
      alps: "Alps / Matias",
    },
    topSurfaceShape: {
      flat: "평면",
      cylindrical: "원통",
      spherical: "구면",
    },
    topSlopeInputMode: {
      angle: "각도로 조정",
      "edge-height": "모서리 높이로 조정",
    },
  },
  stemDescriptions: {
    none: "장착부를 만들지 않습니다. 외형이나 각인만 확인하고 싶을 때 사용합니다.",
    mx: "Cherry MX 호환 십자 형상입니다. Cherry / Gateron / Kailh BOX 등 일반적인 기계식 키보드 스위치에 맞습니다.",
    choc_v1: "Kailh Choc v1용 두 갈래 형상입니다. 슬림 키보드용 Choc v1 스위치에 맞습니다.",
    alps: "Alps / Matias 계열 삽입 형상입니다. 대응하는 Alps 계열 스위치에 맞습니다.",
    choc_v2: "Kailh Choc v2용 십자 형상입니다. Choc v2 스위치에 맞는 장착부를 만듭니다.",
  },
  font: {
    defaultStyleLabel: "폰트 기본값 사용",
    searchAriaLabel: "폰트 검색",
    searchDialogLabel: "폰트 검색",
    searchPlaceholder: "폰트 이름으로 검색",
    noResults: "일치하는 폰트가 없습니다",
    variableMeta: "가변 / 명명된 스타일",
    staticMeta: "정적 글꼴",
    attributionTitle: "저작권 및 라이선스 표기",
    attributions: {
      "kurobara-cinderella-regular": [
        "사용 폰트: 黒薔薇シンデレラ Version 1.00.20180805",
        "저작권 표기: Copyright(c) 2017 M+ FONTS PROJECT/MODI",
        "라이선스 표기: This font is free software. Unlimited permission is granted to use, copy, and distribute it, with or without modification, either commercially or noncommercially. THIS FONT IS PROVIDED \"AS IS\" WITHOUT WARRANTY.",
        "파생 원본 라이선스: SIL Open Font License, Version 1.1",
        "배포 페이지: https://modi.jpn.org/font_kurobara-cinderella.php"
      ],
    },
  },
  partLabels: {
    body: "본체",
    rim: "키 림",
    legend: "각인",
    topLegend: "{position}",
    sideLegend: "{side} 측면 각인",
    homing: "위치 표시",
  },
  preview: {
    placeholder: "아직 미리보기를 표시하지 않았습니다. 설정을 바꾸면 최신 형상으로 자동 업데이트됩니다.",
    running: "미리보기를 업데이트하는 중",
    successSingle: "미리보기 업데이트가 완료되었습니다. {parts}을(를) 표시하고 있습니다.",
    successMultiple: "미리보기 업데이트가 완료되었습니다. {parts}을(를) 색상별로 나누어 표시하고 있습니다.",
    failed: "미리보기 업데이트에 실패했습니다",
    summary: "{elapsedMs} ms / {objectCount} objects / {vertexCount} vertices / {faceCount} triangles",
  },
  status: {
    notGenerated: "미생성",
    dirty: "입력 내용 반영 대기 중",
    loadedDirty: "불러온 편집 데이터 반영 대기 중",
  },
  importExport: {
    loaded: "편집 데이터를 불러왔습니다 ({fileName})",
    loadLabel: "편집 데이터 불러오기",
    loadNote: "{fileName}을(를) 현재 편집 내용에 반영",
    noJsonFile: "JSON 파일을 찾을 수 없습니다.",
    loadFailed: "편집 데이터 불러오기에 실패했습니다",
    loadFailedLabel: "편집 데이터 불러오기 실패",
    preparing: "저장 데이터를 준비하는 중",
    savedEditorData: "편집 데이터를 저장했습니다 ({byteLength} bytes)",
    editorDataLabel: "편집 데이터 JSON",
    editorDataNote: "화면에서 편집하는 파라미터를 JSON 형식으로 저장",
    savedThreeMf: "3MF 데이터를 저장했습니다 ({byteLength} bytes / 부품 {partCount}개)",
    threeMfLabel: "3MF 데이터",
    threeMfNote: "{parts}을(를) 3MF 형식으로 묶어 저장",
    savedStl: "STL을 저장했습니다 ({byteLength} bytes)",
    stlLabel: "단색 STL",
    stlNote: "색상과 각인을 포함하지 않고 단일 메시 형상으로 저장",
    saveFailed: "저장에 실패했습니다",
    saveFailedLabel: "저장 실패",
    unsupportedExport: "지원하지 않는 export 형식입니다: {format}",
  },
  errors: {
    appRootMissing: "#app을 찾을 수 없습니다.",
    colorisLoadFailed: "Coloris를 불러오지 못했습니다.",
    unsupportedOffPurpose: "지원하지 않는 OFF 작업 용도입니다: {purpose}",
  },
  format: {
    listSeparator: ", ",
  },
});

export default ko;
