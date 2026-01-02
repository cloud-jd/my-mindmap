import React, { useState, useRef, useCallback, useEffect } from 'react';
import './App.css';

// 노드의 타입을 정의합니다.
interface Node {
  id: string;
  text: string;
  x: number;
  y: number;
  parentId: string | null;
}

const App: React.FC = () => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [connectingNodeId, setConnectingNodeId] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // ✨ 다크 모드를 위한 새로운 State 추가
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  const mindmapRef = useRef<HTMLDivElement>(null);

  // 새 노드를 추가하는 함수
  const addNode = useCallback(() => {
    const newId = `node-${Date.now()}`;
    const newNode: Node = {
      id: newId,
      text: "New Node",
      x: window.innerWidth / 2 - 50,
      y: window.innerHeight / 2 - 20,
      parentId: null,
    };
    setNodes((prevNodes) => [...prevNodes, newNode]);
  }, []);

  // 노드 텍스트를 업데이트하는 함수
  const updateNodeText = useCallback((id: string, newText: string) => {
    setNodes((prevNodes) =>
      prevNodes.map((node) => (node.id === id ? { ...node, text: newText } : node))
    );
  }, []);

  // 노드 드래그 시작 핸들러
  const handleDragStart = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const node = nodes.find((n) => n.id === id);
    if (node) {
      setDraggingNodeId(id);
      setDragOffset({ x: e.clientX - node.x, y: e.clientY - node.y });
    }
  }, [nodes]);

  // 마우스 이동 핸들러 (드래그 중인 노드 위치 업데이트)
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (draggingNodeId) {
      setNodes((prevNodes) =>
        prevNodes.map((node) =>
          node.id === draggingNodeId
            ? { ...node, x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y }
            : node
        )
      );
    }
    setMousePos({ x: e.clientX, y: e.clientY });
  }, [draggingNodeId, dragOffset]);

  // 마우스 놓기 핸들러 (드래그 종료)
  const handleMouseUp = useCallback(() => {
    setDraggingNodeId(null);
    setConnectingNodeId(null);
  }, []);

  // 마우스 이벤트 리스너 등록 (전역적으로)
  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // 노드 연결 시작
  const handleConnectStart = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setConnectingNodeId(id);
  }, []);

  // 노드 연결 종료 (드롭)
  const handleNodeDrop = useCallback((e: React.MouseEvent, targetNodeId: string) => {
    e.stopPropagation();
    if (connectingNodeId && connectingNodeId !== targetNodeId) {
      setNodes((prevNodes) =>
        prevNodes.map((node) =>
          node.id === connectingNodeId ? { ...node, parentId: targetNodeId } : node
        )
      );
      setConnectingNodeId(null);
    }
  }, [connectingNodeId]);

  // 연결선 그리기 (SVG)
  const renderConnections = useCallback(() => {
    return nodes.map((node) => {
      if (!node.parentId) return null;

      const parent = nodes.find((n) => n.id === node.parentId);
      if (!parent) return null;

      const startX = parent.x + 50;
      const startY = parent.y + 20;
      const endX = node.x + 50;
      const endY = node.y + 20;

      return (
        <line
          key={`${parent.id}-${node.id}`}
          x1={startX}
          y1={startY}
          x2={endX}
          y2={endY}
          stroke="var(--connection-line-color)" // ✨ CSS 변수 사용
          strokeWidth="2"
        />
      );
    });
  }, [nodes]);

  return (
    // ✨ isDarkMode 상태에 따라 클래스 추가/제거
    <div ref={mindmapRef} className={`mindmap-container ${isDarkMode ? 'dark-mode' : ''}`}>
      <button className="add-node-button" onClick={addNode}>
        + Add Node
      </button>

      {/* ✨ 다크 모드 토글 버튼 추가 */}
      <button
        className="dark-mode-toggle"
        onClick={() => setIsDarkMode((prevMode) => !prevMode)}
      >
        {isDarkMode ? 'Light Mode' : 'Dark Mode'}
      </button>

      <svg className="connections-layer">
        {renderConnections()}
        {connectingNodeId && (
          <line
            x1={nodes.find(n => n.id === connectingNodeId)!.x + 50}
            y1={nodes.find(n => n.id === connectingNodeId)!.y + 20}
            x2={mousePos.x}
            y2={mousePos.y}
            stroke="var(--connection-line-active-color)" // ✨ CSS 변수 사용
            strokeWidth="2"
            strokeDasharray="5,5"
          />
        )}
      </svg>

      {nodes.map((node) => (
        <div
          key={node.id}
          className={`mindmap-node ${draggingNodeId === node.id ? 'dragging' : ''}`}
          style={{ left: node.x, top: node.y }}
          onMouseDown={(e) => handleDragStart(e, node.id)}
          onDoubleClick={() => {
            const newText = prompt("Enter new node text:", node.text);
            if (newText !== null) {
              updateNodeText(node.id, newText);
            }
          }}
          onMouseUp={(e) => handleNodeDrop(e, node.id)}
        >
          {node.text}
          <div
            className="connection-handle"
            onMouseDown={(e) => handleConnectStart(e, node.id)}
          ></div>
        </div>
      ))}
    </div>
  );
};

export default App;