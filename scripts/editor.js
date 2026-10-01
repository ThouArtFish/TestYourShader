const default_vertex = "attribute vec3 aPosition;\n\nmat4 perspective(float fovY, float aspect, float near, float far) {\n    float f = 1.0 / tan(fovY * 0.5);\n    float nf = 1.0 / (near - far);\n    return mat4(\n        f / aspect, 0.0, 0.0,                   0.0,\n        0.0,        f,   0.0,                   0.0,\n        0.0,        0.0, (far + near) * nf,    -1.0,\n        0.0,        0.0, 2.0 * far * near * nf, 0.0\n    );\n}\n\nmat4 lookAt(vec3 eye, vec3 target, vec3 up) {\n    vec3 z = normalize(eye - target);\n    vec3 x = normalize(cross(up, z));\n    vec3 y = cross(z, x);\n    return mat4(\n        x.x,          y.x,          z.x,          0.0,\n        x.y,          y.y,          z.y,          0.0,\n        x.z,          y.z,          z.z,          0.0,\n        -dot(x, eye), -dot(y, eye), -dot(z, eye), 1.0\n    );\n}\n\nvoid main() {\n    mat4 projection = perspective(radians(60.0), 1.0, 0.1, 100.0);\n    mat4 view = lookAt(vec3(-1.0, 2.0, 3.0), vec3(0.0), vec3(0.0, 1.0, 0.0));\n    gl_Position = projection * view * vec4(aPosition, 1.0);\n}\n";
const default_fragment = "precision mediump float;\n\nvoid main() {\n    gl_FragColor = vec4(1.0, 0.5, 0.2, 1.0);\n}\n";

function createEditor(el, source) {
  if (window.ace) {
    const ed = ace.edit(el, {
      mode: "ace/mode/glsl",
      theme: "ace/theme/tomorrow_night",
      fontSize: 14,
      tabSize: 4,
      useSoftTabs: true,
      showPrintMargin: false
    });
    ed.setValue(source, -1);
    ed.container.style.fontFamily = "var(--mono)";
    return { el: ed.container, get: () => ed.getValue(), resize: () => ed.resize() };
  }
  const ta = document.createElement("textarea");
  ta.className = "editor";
  ta.id = el.id;
  ta.value = source;
  ta.spellcheck = false;
  el.replaceWith(ta);
  return { el: ta, get: () => ta.value, resize: () => {} };
}

const vertex_editor = createEditor(document.getElementById("vertexEditor"), default_vertex);
const fragment_editor = createEditor(document.getElementById("fragmentEditor"), default_fragment);
const tabs = { vertex: document.getElementById("tabVertex"), fragment: document.getElementById("tabFragment") };
const panels = { vertex: vertex_editor, fragment: fragment_editor };

function showTab(name) {
  for (const key of Object.keys(tabs)) {
    const on = key === name;
    tabs[key].setAttribute("aria-selected", String(on));
    panels[key].el.classList.toggle("on", on);
  }
  panels[name].resize();
}
tabs.vertex.addEventListener("click", () => showTab("vertex"));
tabs.fragment.addEventListener("click", () => showTab("fragment"));

const app = document.getElementById("app");
const editor_pane = document.getElementById("editorPane");
const divider = document.getElementById("divider");

function setEditorWidth(px) {
  const total = app.clientWidth - divider.offsetWidth;
  const min = Math.min(220, total * 0.4);
  const max = total - Math.min(160, total * 0.4);
  editor_pane.style.flexBasis = Math.max(min, Math.min(max, px)) + "px";
}

divider.addEventListener("pointerdown", (e) => {
  divider.setPointerCapture(e.pointerId);
  divider.classList.add("active");
  document.body.classList.add("dragging");
});
divider.addEventListener("pointermove", (e) => {
  if (!divider.hasPointerCapture(e.pointerId)) return;
  setEditorWidth(e.clientX - app.getBoundingClientRect().left);
});
function endDrag(e) {
  if (divider.hasPointerCapture(e.pointerId)) divider.releasePointerCapture(e.pointerId);
  divider.classList.remove("active");
  document.body.classList.remove("dragging");
}
divider.addEventListener("pointerup", endDrag);
divider.addEventListener("pointercancel", endDrag);
divider.addEventListener("keydown", (e) => {
  if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
  const step = e.key === "ArrowLeft" ? -24 : 24;
  setEditorWidth(editor_pane.getBoundingClientRect().width + step);
  e.preventDefault();
});

const editors_box = document.getElementById("editors");
new ResizeObserver(() => {
  vertex_editor.resize();
  fragment_editor.resize();
}).observe(editors_box);

const gl_canvas = document.getElementById("glcanvas");
new ResizeObserver(() => {
  const dpr = window.devicePixelRatio || 1;
  const w = Math.max(1, Math.round(gl_canvas.clientWidth * dpr));
  const h = Math.max(1, Math.round(gl_canvas.clientHeight * dpr));
  if (gl_canvas.width !== w || gl_canvas.height !== h) {
    gl_canvas.width = w;
    gl_canvas.height = h;
  }
  object_renderer.draw();
}).observe(gl_canvas);

const terminal_el = document.getElementById("terminal");
const terminal_toggle = document.getElementById("termToggle");
terminal_toggle.addEventListener("click", () => {
  const hidden = terminal_el.classList.toggle("hidden");
  terminal_toggle.textContent = hidden ? "Show" : "Hide";
  terminal_toggle.setAttribute("aria-expanded", String(!hidden));
});

window.shaderBench = {
  getVertexSource: () => vertex_editor.get(),
  getFragmentSource: () => fragment_editor.get(),
  printLine: (text) => {
    const body = document.getElementById("termBody");
    const line = document.createElement("div");
    line.className = "line";
    line.textContent = String(text);
    body.appendChild(line);
    body.scrollTop = body.scrollHeight;
  }
};

function printTerminal(text) {
  window.shaderBench.printLine(text);
}

function formatSource(source) {
  return source.replace(/\r\n/g, "\n").trim() + "\n";
}
