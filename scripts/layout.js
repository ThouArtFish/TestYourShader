const DEFAULT_ATTRIB_NAME = "aPosition";

const GL = WebGLRenderingContext;

const TYPE_INFO = {
  [GL.FLOAT]: [1, 1, "f"], [GL.FLOAT_VEC2]: [1, 2, "f"], [GL.FLOAT_VEC3]: [1, 3, "f"], [GL.FLOAT_VEC4]: [1, 4, "f"],
  [GL.INT]: [1, 1, "i"], [GL.INT_VEC2]: [1, 2, "i"], [GL.INT_VEC3]: [1, 3, "i"], [GL.INT_VEC4]: [1, 4, "i"],
  [GL.BOOL]: [1, 1, "b"], [GL.BOOL_VEC2]: [1, 2, "b"], [GL.BOOL_VEC3]: [1, 3, "b"], [GL.BOOL_VEC4]: [1, 4, "b"],
  [GL.FLOAT_MAT2]: [2, 2, "f"], [GL.FLOAT_MAT3]: [3, 3, "f"], [GL.FLOAT_MAT4]: [4, 4, "f"]
};

const attribSelect = document.getElementById("attribSelect");
const uniformList = document.getElementById("uniformList");
let uniformEntries = [];

function createNumberInput(kind, label) {
  const input = document.createElement("input");
  input.type = "number";
  input.className = "num";
  input.value = "0";
  input.step = kind === "f" ? "any" : "1";
  if (kind === "u") input.min = "0";
  if (kind === "b") {
    input.min = "0";
    input.max = "1";
  }
  input.setAttribute("aria-label", label);
  return input;
}

function createUniformRow(info, typeInfo) {
  const [rows, cols, kind] = typeInfo;
  const row = document.createElement("div");
  row.className = "uniform";

  const name = document.createElement("div");
  name.className = "uniform-name";
  name.textContent = info.name;

  const grid = document.createElement("div");
  grid.className = "uniform-grid";
  grid.style.gridTemplateColumns = "repeat(" + cols + ", 5.5rem)";

  const inputs = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const input = createNumberInput(kind, info.name + " row " + (r + 1) + " column " + (c + 1));
      inputs[c * rows + r] = input;
      grid.appendChild(input);
    }
  }

  row.append(name, grid);
  uniformEntries.push({ name: info.name, type: info.type, rows, cols, inputs });
  return row;
}

function isPlainUniform(info) {
  return info.size === 1 && !info.name.includes("[") && !info.name.includes(".");
}

function defineLayout(uniforms, attribs) {
  const attribNames = (attribs || []).map((a) => a.name);
  if (attribNames.length === 0) attribNames.push(DEFAULT_ATTRIB_NAME);

  attribSelect.replaceChildren();
  for (const name of attribNames) {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    attribSelect.appendChild(option);
  }
  attribSelect.value = attribNames[0];

  uniformList.replaceChildren();
  uniformEntries = [];
  for (const info of uniforms || []) {
    const typeInfo = TYPE_INFO[info.type];
    if (!typeInfo || !isPlainUniform(info)) continue;
    uniformList.appendChild(createUniformRow(info, typeInfo));
  }

  if (uniformEntries.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "No uniforms";
    uniformList.appendChild(empty);
  }
}

window.shaderBench.getSelectedAttrib = () => attribSelect.value;
window.shaderBench.getUniformValues = () => {
  const values = {};
  for (const entry of uniformEntries) {
    values[entry.name] = entry.inputs.map((input) => {
      const n = parseFloat(input.value);
      return Number.isFinite(n) ? n : 0;
    });
  }
  return values;
};

function formatSource(source) {
  return source.replace(/\r\n/g, "\n").trim() + "\n";
}
