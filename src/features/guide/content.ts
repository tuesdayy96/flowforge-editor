export const guideContent = {
  en: [
    {
      title: 'Editor layout',
      body: 'Add nodes in the palette, connect them on the canvas, and edit properties in the inspector. The toolbar contains document and editing actions.',
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
      body: 'Undo or redo graph edits in the toolbar. A drag or a continuous edit in one property field counts as one action.',
    },
    {
      title: 'Copy and Paste',
      body: 'Copy selected nodes and their internal connections, then paste them as a group with new IDs.',
    },
    {
      title: 'Select multiple nodes',
      body: 'Use Ctrl/Cmd-click or Shift-drag on the canvas. Move, copy or delete selected nodes together.',
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
  ],
  ko: [
    {
      title: '편집 화면',
      body: '왼쪽 팔레트에서 노드를 추가하고, 중앙 캔버스에서 연결하며, 오른쪽 속성 패널에서 편집합니다. 상단 툴바에는 문서와 편집 도구가 있습니다.',
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
      body: '툴바에서 그래프 편집을 취소하거나 다시 실행할 수 있습니다. 드래그 한 번이나 한 속성 입력란에서의 연속 편집은 한 작업으로 기록합니다.',
    },
    {
      title: '복사와 붙여넣기',
      body: '선택한 노드와 그 사이의 연결을 복사한 다음, 새 ID로 한꺼번에 붙여넣습니다.',
    },
    {
      title: '다중 선택',
      body: '캔버스에서 Ctrl/Cmd를 누른 채 클릭하거나 Shift를 누른 채 드래그합니다. 선택한 노드들을 한꺼번에 이동·복사·삭제할 수 있습니다.',
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
