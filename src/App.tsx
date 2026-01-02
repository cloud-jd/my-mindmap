import React, { useState, useRef, useCallback, useEffect } from 'react';
import './App.css'; // CSS 파일을 불러옵니다.

// 노드의 타입을 정의합니다. TypeScript의 장점이죠!
interface Node {
  id: string;
  text: string;
  x: number;
  y: number;
  parentId: string | null; // 부모 노드의 ID (루트 노드는 null)
}

const App: React.FC = () => {
  // 마인드맵 노드들의 상태를 관리합니다.
  const [nodes, setNodes] = useState<Node[]>([]);
  // 드래그 중인 노드의 ID
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  // 드래그 시작 시 마우스 위치와 노드의 초기 위치 차이
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  // 노드 연결을 위한 상태
  const [connectingNodeId, setConnectingNodeId] = useState<string | null>(null);
  // 연결 선이 그려질 임시 마우스 위치
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const mindmapRef = useRef<HTMLDivElement>(null); // 마인드맵 컨테이너 Ref

  // 새 노드를 추가하는 함수
  const addNode = useCallback(() => {
    const newId = `node-${Date.now()}`;
    const newNode: Node = {
      id: newId,
      text: "New Node",
      x: window.innerWidth / 2 - 50, // 화면 중앙에 배치
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
    e.stopPropagation(); // 이벤트 버블링 방지
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
    setMousePos({ x: e.clientX, y: e.clientY }); // 연결선 그리기 위해 마우스 위치 추적
  }, [draggingNodeId, dragOffset]);

  // 마우스 놓기 핸들러 (드래그 종료)
  const handleMouseUp = useCallback(() => {
    setDraggingNodeId(null);
    setConnectingNodeId(null); // 연결 드래그도 함께 종료
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

      // 노드 중앙에서 중앙으로 선을 그립니다.
      const startX = parent.x + 50; // 노드 너비의 절반
      const startY = parent.y + 20; // 노드 높이의 절반
      const endX = node.x + 50;
      const endY = node.y + 20;

      return (
        <line
          key={`${parent.id}-${node.id}`}
          x1={startX}
          y1={startY}
          x2={endX}
          y2={endY}
          stroke="#555"
          strokeWidth="2"
        />
      );
    });
  }, [nodes]);

  return (
    <div ref={mindmapRef} className="mindmap-container">
      <button className="add-node-button" onClick={addNode}>
        + Add Node
      </button>

      {/* SVG는 연결선을 그리는 데 사용됩니다. */}
      <svg className="connections-layer">
        {renderConnections()}
        {connectingNodeId && (
          // 연결 중인 노드와 마우스 위치 간의 임시 연결선
          <line
            x1={nodes.find(n => n.id === connectingNodeId)!.x + 50}
            y1={nodes.find(n => n.id === connectingNodeId)!.y + 20}
            x2={mousePos.x}
            y2={mousePos.y}
            stroke="blue"
            strokeWidth="2"
            strokeDasharray="5,5" // 점선
          />
        )}
      </svg>

      {/* 개별 노드들을 렌더링합니다. */}
      {nodes.map((node) => (
        <div
          key={node.id}
          className={`mindmap-node ${draggingNodeId === node.id ? 'dragging' : ''}`}
          style={{ left: node.x, top: node.y }}
          onMouseDown={(e) => handleDragStart(e, node.id)} // 노드 드래그 시작
          onDoubleClick={() => {
            const newText = prompt("Enter new node text:", node.text);
            if (newText !== null) {
              updateNodeText(node.id, newText);
            }
          }}
          onMouseUp={(e) => handleNodeDrop(e, node.id)} // 연결 드롭
        >
          {node.text}
          {/* 노드 연결 핸들러 */}
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