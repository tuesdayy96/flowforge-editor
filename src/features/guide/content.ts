export const guideContent = {
  en: [
    {
      title: 'Editor layout',
      body: 'Add nodes in the palette, connect them on the canvas, and edit properties in the inspector. The header contains document controls, validation, Simulator, and Help.',
    },
    {
      title: 'Node types',
      body: 'Start begins a path, Action represents a task, Condition branches, Merge brings paths together visually, and End marks an exit.',
    },
    {
      title: 'Add and connect nodes',
      body: 'Choose a node in the palette to place it at the center of the current view. Drag from an output handle to an input handle.',
    },
    {
      title: 'Multiple Starts and Merge',
      body: 'Use multiple Start nodes for independent entry points. Connect several paths to the Merge input and use its single output to continue.',
    },
    {
      title: 'Condition branches',
      body: 'Connect both the true and false outputs. Each branch needs a path to an End.',
    },
    {
      title: 'Validate',
      body: 'Run Validate to check entry points, required connections, reachability and cycles. Use Locate to select and center a node with an issue.',
    },
    {
      title: 'Undo and Redo',
      body: 'Right-click empty canvas for Undo, Redo, Paste, Select all, and Fit view. Press Shift+F10 on the focused canvas to open the same menu. A drag or a continuous edit in one property field counts as one action.',
    },
    {
      title: 'Copy and Paste',
      body: 'Copy selected nodes and their internal connections, then paste them as a group with new IDs.',
    },
    {
      title: 'Select multiple nodes',
      body: 'Select one node or use Ctrl/Cmd-click or Shift-drag to select several. The floating toolbar provides Copy, Duplicate, Delete, and More. Right-click a node or its selected group to open the same actions. Right-click a connection to delete it.',
    },
    {
      title: 'Autosave',
      body: 'Edits and the viewport are saved in this browser. Check the toolbar status and refresh to restore the saved draft.',
    },
    {
      title: 'Import and export JSON',
      body: 'Export a JSON copy for sharing or backup. Import validates the file and asks before replacing the open draft.',
    },
    {
      title: 'Keyboard shortcuts',
      body: 'With focus on the canvas, use Ctrl/Cmd+Z to undo, Ctrl/Cmd+Shift+Z or Ctrl+Y to redo, Ctrl/Cmd+C/V to copy or paste, Ctrl/Cmd+A to select all, Delete/Backspace to delete, and Ctrl/Cmd+0 to fit the view.',
    },
    {
      title: 'Workflow Simulator',
      body: 'Double-click a Condition, enter an item such as Order total, choose a comparison symbol, and save a typed reference value. The node shows the saved comparison. Open Simulator, choose one Start, and enter test values in the generated Form. In JSON mode, select Apply JSON to use the draft. Exports store the comparison, and imports generate examples from it. The test value can differ from the saved reference. Equality compares values of the same type. Ordered comparisons require numbers. Use Start simulation and Step to advance one node at a time, or Run, Pause, Resume, and Stop to control autoplay. Choose a log entry to locate its node. Merge continues along the current path. The simulator checks workflow validity before starting and stops on missing inputs or after 500 steps.',
    },
  ],
  ko: [
    {
      title: '편집 화면',
      body: '왼쪽 팔레트에서 노드를 추가하고, 중앙 캔버스에서 연결하며, 오른쪽 속성 패널에서 편집합니다. 상단 툴바에서 문서를 관리하고 검증, 시뮬레이터, 도움말을 열 수 있습니다.',
    },
    {
      title: '노드 유형',
      body: 'Start는 시작점, Action은 작업, Condition은 분기, Merge는 시각적 합류 지점, End는 종료점입니다.',
    },
    {
      title: '노드 추가와 연결',
      body: '팔레트에서 노드를 선택하면 현재 화면 중앙에 배치됩니다. 출력 핸들을 입력 핸들로 드래그하여 연결합니다.',
    },
    {
      title: '여러 Start와 Merge',
      body: '여러 Start를 독립 진입점으로 사용합니다. 여러 경로를 Merge의 입력에 모으고, 출력 하나로 다음 노드에 연결합니다.',
    },
    {
      title: 'Condition의 true/false 분기',
      body: 'true와 false 출력을 각각 연결합니다. 두 분기 모두 End에 도달하는 경로가 필요합니다.',
    },
    {
      title: '워크플로 검증',
      body: '검증을 실행해 진입점, 필수 연결, 도달 가능성, 순환을 확인합니다. 위치로 이동을 누르면 문제 노드를 선택하고 중앙에 표시합니다.',
    },
    {
      title: '실행 취소와 다시 실행',
      body: '빈 캔버스를 우클릭하면 실행 취소, 다시 실행, 붙여넣기, 전체 선택, 화면에 맞추기를 사용할 수 있습니다. 캔버스에 포커스가 있을 때 Shift+F10으로도 메뉴를 열 수 있습니다. 드래그 한 번이나 한 속성 입력란에서의 연속 편집은 한 작업으로 기록합니다.',
    },
    {
      title: '복사와 붙여넣기',
      body: '선택한 노드와 그 사이의 연결을 복사한 다음, 새 ID로 한꺼번에 붙여넣습니다.',
    },
    {
      title: '다중 선택',
      body: '노드를 하나 선택하거나 Ctrl/Cmd 클릭과 Shift 드래그로 여러 노드를 선택하세요. 플로팅 툴바에서 복사, 복제, 삭제, 더 많은 작업을 사용할 수 있습니다. 노드나 선택 그룹을 우클릭하면 작업 메뉴가 열리고, 연결선을 우클릭하면 연결을 삭제할 수 있습니다.',
    },
    {
      title: '자동 저장',
      body: '편집 내용과 뷰포트를 이 브라우저에 저장합니다. 툴바에서 저장 상태를 확인할 수 있으며, 새로고침하면 저장한 초안을 복원합니다.',
    },
    {
      title: 'JSON 가져오기와 내보내기',
      body: '공유하거나 백업할 때 JSON을 내보냅니다. 파일을 가져오면 유효성을 검사한 뒤 현재 초안의 교체 여부를 확인합니다.',
    },
    {
      title: '키보드 단축키',
      body: '캔버스에 포커스가 있을 때 Ctrl/Cmd+Z 실행 취소, Ctrl/Cmd+Shift+Z 또는 Ctrl+Y 다시 실행, Ctrl/Cmd+C/V 복사·붙여넣기, Ctrl/Cmd+A 전체 선택, Delete/Backspace 삭제, Ctrl/Cmd+0 전체 보기를 사용할 수 있습니다.',
    },
    {
      title: '워크플로 시뮬레이터',
      body: 'Condition을 더블 클릭해 주문 금액 같은 항목명과 비교 기호, 기준값의 자료형을 선택하고 저장하세요. 저장된 조건식이 노드에 표시됩니다. 시뮬레이터에서 Start 하나를 선택하고 자동 생성된 양식에 테스트 값을 입력하세요. JSON 모드에서는 JSON 적용으로 초안을 반영합니다. 내보낸 파일에 비교 설정이 포함되며 가져올 때 이 설정으로 예시값을 만듭니다. 테스트 값은 저장한 기준값과 달라도 됩니다. 일치 비교에는 같은 자료형이 필요하며, 크기 비교에는 숫자가 필요합니다. 시뮬레이션 시작 후 한 단계 실행으로 노드를 하나씩 실행하거나 자동 실행, 일시 정지, 재개, 중지를 사용하세요. 로그를 선택하면 해당 노드로 이동합니다. Merge는 현재 경로를 이어서 진행합니다. 시작 전에 워크플로 유효성을 검사하며, 입력이 누락되거나 실행이 500단계를 초과하면 오류로 종료됩니다.',
    },
  ],
}

export const tourContent = {
  en: [
    {
      title: 'Node palette',
      body: 'Choose Start, Action, Condition, Merge or End to add a node.',
    },
    {
      title: 'Workflow canvas',
      body: 'Drag nodes to arrange them, then drag from an output to an input to connect them.',
    },
    {
      title: 'Property inspector',
      body: 'Select one node to edit its name and description.',
    },
    {
      title: 'Validation',
      body: 'Use Validate to see whether the workflow is ready and jump to any problem nodes.',
    },
    {
      title: 'Save, import and export',
      body: 'Your draft is saved in this browser. Export a JSON backup or import a saved document from the toolbar.',
    },
  ],
  ko: [
    {
      title: '노드 팔레트',
      body: 'Start, Action, Condition, Merge, End 중 하나를 선택해 노드를 추가하세요.',
    },
    {
      title: '워크플로 캔버스',
      body: '노드를 드래그해 배치하고, 출력에서 입력으로 드래그하여 연결하세요.',
    },
    {
      title: '속성 패널',
      body: '노드 하나를 선택해 이름과 설명을 편집하세요.',
    },
    {
      title: '워크플로 검증',
      body: '검증으로 워크플로를 확인하고 문제 노드로 이동하세요.',
    },
    {
      title: '저장, 가져오기, 내보내기',
      body: '초안은 이 브라우저에 저장됩니다. 툴바에서 JSON으로 백업하거나 저장한 문서를 가져오세요.',
    },
  ],
}
