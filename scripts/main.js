const vertices = [
    0.577350269, 0.577350269, 0.577350269,
    -0.577350269, 0.577350269, 0.577350269,
    -0.577350269, -0.577350269, 0.577350269,
    0.577350269, -0.577350269, 0.577350269,
    0.577350269, 0.577350269, -0.577350269,
    -0.577350269, 0.577350269, -0.577350269,
    -0.577350269, -0.577350269, -0.577350269,
    0.577350269, -0.57735026, -0.577350269
]
const indices = [
    0, 1, 3,
    2, 3, 1,
    4, 7, 5,
    6, 5, 7,
    0, 4, 1,
    5, 1, 4,
    3, 2, 7,
    6, 7, 2,
    5, 6, 1,
    2, 1, 6,
    4, 0, 7,
    3, 7, 0
]
const gl = gl_canvas.getContext("webgl2");

var object_renderer = null;

if (gl === null) {
  alert(
    "Unable to initialize WebGL. Your browser or machine may not support it.",
  );
}

class ObjectRenderer {
  constructor() {
    this.default_program = ObjectRenderer.compileProgram(default_vertex, default_fragment);
    this.current_program = null;

    // Create cube 
    this.vao = gl.createVertexArray();
    gl.bindVertexArray(this.vao);

    const vertex_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    const index_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(indices), gl.STATIC_DRAW);

    gl.bindVertexArray(null);
  }

  // Draw cube
  draw() {
    gl.enable(gl.DEPTH_TEST); 
    gl.depthFunc(gl.LEQUAL);

    gl.enable(gl.CULL_FACE);
    
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0); 
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.viewport(0, 0, gl_canvas.clientWidth, gl_canvas.clientHeight);

    const vertex_loc = gl.getAttribLocation((this.current_program == null ? this.default_program : this.current_program), "aPosition");
    
    gl.bindVertexArray(this.vao);
    gl.vertexAttribPointer(vertex_loc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vertex_loc);
    gl.useProgram((this.current_program == null ? this.default_program : this.current_program));
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_INT, 0);
    gl.useProgram(null);
    gl.disableVertexAttribArray(vertex_loc);
    gl.bindVertexArray(null);
  }

  // Function for compiling shader program
  static compileProgram(vertex, fragment) {
    const vertex_shader = ObjectRenderer.compileShader(vertex, gl.VERTEX_SHADER);
    const fragment_shader = ObjectRenderer.compileShader(fragment, gl.FRAGMENT_SHADER);

    if (!vertex_shader || !fragment_shader) {
      return null;
    }

    const program = gl.createProgram();
    gl.attachShader(program, vertex_shader);
    gl.attachShader(program, fragment_shader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      printTerminal(`An error occured while linking the shader program:\n\n${gl.getProgramInfoLog(program)}`);
      gl.deleteProgram(program);
      return null;
    }

    gl.deleteShader(vertex_shader);
    gl.deleteShader(fragment_shader);
    return program;
  }

  // Function for compiling shaders
  static compileShader(source, type) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      printTerminal(`An error occurred while compiling the ${(type == gl.VERTEX_SHADER ? "vertex" : "fragment")} shader:\n\n${gl.getShaderInfoLog(shader)}`);
      gl.deleteShader(shader);
      return null;
    }

    return shader;
  }
}

// Draw default when HTML loads
document.addEventListener("DOMContentLoaded", () => { 
  object_renderer = new ObjectRenderer(); 
  object_renderer.draw();
});

// Compile shader program and draw with it when compile button is pressed
document.getElementById("compile").addEventListener("click", () => {
  const vertex_source = formatSource(window.shaderBench.getVertexSource());
  const fragment_source = formatSource(window.shaderBench.getFragmentSource());

  object_renderer.current_program = ObjectRenderer.compileProgram(vertex_source, fragment_source);

  if (object_renderer.current_program) {
    printTerminal("Shader successfully compiled");
    printTerminal("Vertex shader: " + vertex_source.split("\n").length + " lines");
    printTerminal("Fragment shader: " + fragment_source.split("\n").length + " lines");

    object_renderer.draw();
  }
});
