document.addEventListener("DOMContentLoaded", function () {
    const headerRight = document.querySelector(".header-right");
    const networkContainer = document.createElement("div");
    networkContainer.id = "network-container";
    networkContainer.classList.add("network-container"); 
    headerRight.appendChild(networkContainer);
  
    const networkCanvas = document.createElement("div");
    networkCanvas.id = "network-canvas";
    networkCanvas.style.position = "absolute";
    networkCanvas.style.top = "0";
    networkCanvas.style.left = "0";
    networkCanvas.style.width = "100%";
    networkCanvas.style.height = "100%";
    networkCanvas.style.zIndex = "10";
    networkContainer.appendChild(networkCanvas);
  
    let nodes = [];
    let edges = [];
  
    function createNode(x, y) {
      const node = document.createElement("div");
      node.classList.add("node");
      node.style.position = "absolute";
      node.style.width = "15px";
      node.style.height = "15px";
      node.style.borderRadius = "50%";
      node.style.transition = "transform 0.1s ease-out";
      const colors = ["rgba(0, 255, 255, 0.8)", "rgba(255, 255, 255, 0.9)", "rgb(62, 2, 118)"];
      node.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      node.style.left = `${x}px`;
      node.style.top = `${y}px`;
      networkCanvas.appendChild(node);
  
      const reactsToMouse = Math.random() < 0.6;
      nodes.push({ element: node, x, y, reactsToMouse });
    }
  
    function createEdge(node1, node2) {
      const edge = document.createElement("div");
      edge.classList.add("edge");
      const dx = node2.x - node1.x;
      const dy = node2.y - node1.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);
      const colors = ["rgba(0, 255, 255, 0.5)", "rgba(255, 255, 255, 0.4)", "rgba(180, 100, 255, 0.5)"];
      edge.style.position = "absolute";
      edge.style.width = `${length}px`;
      edge.style.height = "2px";
      edge.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      edge.style.transformOrigin = "0 50%";
      edge.style.transform = `rotate(${angle}rad)`;
      edge.style.left = `${node1.x}px`;
      edge.style.top = `${node1.y}px`;
      networkCanvas.appendChild(edge);
      edges.push({ element: edge, node1, node2 });
    }
  
    function initNetwork() {
      networkCanvas.innerHTML = '';
      nodes = [];
      edges = [];
  
      const containerWidth = networkContainer.offsetWidth;
      const containerHeight = networkContainer.offsetHeight;
      const centerX = containerWidth / 2 - 3.5;
      const centerY = containerHeight / 2 - 3;
      const radius = containerWidth * 0.5;
  
      const nodeCount = 15;
      for (let i = 0; i < nodeCount; i++) {
        const angle = (i / nodeCount) * Math.PI * 2;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        createNode(x, y);
      }
  
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          createEdge(nodes[i], nodes[j]);
        }
      }
    }
  
    function updateNetworkPosition(x, y) {
      const containerRect = networkContainer.getBoundingClientRect();
  
      if (
        x >= containerRect.left &&
        x <= containerRect.right &&
        y >= containerRect.top &&
        y <= containerRect.bottom
      ) {
        const containerWidth = networkContainer.offsetWidth;
        const containerHeight = networkContainer.offsetHeight;
  
        nodes.forEach((node, index) => {
          const nodeCenterX = containerRect.left + node.x + 7.5;
          const nodeCenterY = containerRect.top + node.y + 7.5;
          const deltaX = x - nodeCenterX;
          const deltaY = y - nodeCenterY;
          const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
          const attractionRadius = 120;
          const attractionStrength = 0.1;
  
          if (distance < attractionRadius) {
            const normalizedStrength = (1 - distance / attractionRadius) * attractionStrength;
            const horizontalBoost = 1.5;
            node.x += deltaX * normalizedStrength * horizontalBoost;
            node.y += deltaY * normalizedStrength;
          } else {
            node.x += (Math.random() - 0.5) * 0.3;
            node.y += (Math.random() - 0.5) * 0.3;
          }
  
          nodes.forEach((otherNode, j) => {
            if (index !== j) {
              const dx = node.x - otherNode.x;
              const dy = node.y - otherNode.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
  
              if (dist < 30 && dist > 0) {
                const repulsion = 1 / dist;
                node.x += dx * repulsion * 0.2;
                node.y += dy * repulsion * 0.2;
              }
            }
          });
  
          node.x = Math.max(0, Math.min(node.x, containerWidth - 15));
          node.y = Math.max(0, Math.min(node.y, containerHeight - 15));
  
          node.element.style.left = `${node.x}px`;
          node.element.style.top = `${node.y}px`;
        });
  
        edges.forEach(edge => {
          const dx = edge.node2.x - edge.node1.x;
          const dy = edge.node2.y - edge.node1.y;
          const length = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx);
  
          edge.element.style.width = `${length}px`;
          edge.element.style.transform = `rotate(${angle}rad)`;
          edge.element.style.left = `${edge.node1.x}px`;
          edge.element.style.top = `${edge.node1.y}px`;
        });
      }
    }
  
    function handleMouseMove(event) {
      const mouseX = event.clientX;
      const mouseY = event.clientY;
      updateNetworkPosition(mouseX, mouseY);
    }

    function handleTouchMove(event) {
      const touchX = event.touches[0].clientX;
      const touchY = event.touches[0].clientY;
      updateNetworkPosition(touchX, touchY);
    }

    setTimeout(() => {
      initNetwork();
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("touchmove", handleTouchMove, { passive: true });
    }, 100);
  
    window.addEventListener("resize", () => {
      initNetwork();
    });
  });
  