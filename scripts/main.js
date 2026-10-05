const gl = gl_canvas.getContext("webgl2");

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

const UNIFORM_SETTERS = {
  [GL.FLOAT]: (loc, v) => gl.uniform1fv(loc, v), [GL.FLOAT_VEC2]: (loc, v) => gl.uniform2fv(loc, v), 
  [GL.FLOAT_VEC3]: (loc, v) => gl.uniform3fv(loc, v), [GL.FLOAT_VEC4]: (loc, v) => gl.uniform4fv(loc, v),
  [GL.INT]: (loc, v) => gl.uniform1iv(loc, v), [GL.INT_VEC2]: (loc, v) => gl.uniform2iv(loc, v), 
  [GL.INT_VEC3]: (loc, v) => gl.uniform3iv(loc, v), [GL.INT_VEC4]: (loc, v) => gl.uniform4iv(loc, v),
  [GL.BOOL]: (loc, v) => gl.uniform1iv(loc, v), [GL.BOOL_VEC2]: (loc, v) => gl.uniform2iv(loc, v), 
  [GL.BOOL_VEC3]: (loc, v) => gl.uniform3iv(loc, v), [GL.BOOL_VEC4]: (loc, v) => gl.uniform4iv(loc, v),
  [GL.FLOAT_MAT2]: (loc, v) => gl.uniformMatrix2fv(loc, false, v), [GL.FLOAT_MAT3]: (loc, v) => gl.uniformMatrix3fv(loc, false, v), 
  [GL.FLOAT_MAT4]: (loc, v) => gl.uniformMatrix4fv(loc, false, v)
};

var object_renderer = null;

if (gl === null) {
  alert(
    "Unable to initialize WebGL. Your browser or machine may not support it.",
  );
}

class ObjectRenderer {
  constructor() {
    this.default_program = ObjectRenderer.compileProgram(default_vertex, default_fragment);
    defineLayout(this.default_program.uniforms, this.default_program.attribs);
    
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

    const prog = (this.current_program ? this.current_program : this.default_program);
    const vertex_loc = gl.getAttribLocation(prog.program, (this.current_program ? window.shaderBench.getSelectedAttrib() : DEFAULT_ATTRIB_NAME));
    gl.useProgram(prog.program);

    const input_uniforms = window.shaderBench.getUniformValues();
    for (const uniform of prog.uniforms) {
      if (!TYPE_INFO[uniform.type]) continue;
      
      const loc = gl.getUniformLocation(prog.program, uniform.name);
      const setter = UNIFORM_SETTERS[uniform.type];

      if (setter) setter(loc, input_uniforms[uniform.name]);
    }

    gl.bindVertexArray(this.vao);
    gl.vertexAttribPointer(vertex_loc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vertex_loc);
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_INT, 0);
    gl.disableVertexAttribArray(vertex_loc);
    gl.bindVertexArray(null);
    gl.useProgram(null);
  }

  // Function for compiling shader program
  static compileProgram(vertex, fragment) {
    const vertex_shader = ObjectRenderer.compileShader(vertex, gl.VERTEX_SHADER);
    const fragment_shader = ObjectRenderer.compileShader(fragment, gl.FRAGMENT_SHADER);

    if (!vertex_shader || !fragment_shader) return null;

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

    var attribs = [], uniforms = [];
    const num_attribs = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
    for (let i = 0; i < num_attribs; i++) {
      attribs.push(gl.getActiveAttrib(program, i));
    }
    const num_uniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < num_uniforms; i++) {
      uniforms.push(gl.getActiveUniform(program, i));
    }

    return { program: program, uniforms: uniforms, attribs: attribs };
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

// Compile button
document.getElementById("compile").addEventListener("click", () => {
  const vertex_source = formatSource(window.shaderBench.getVertexSource());
  const fragment_source = formatSource(window.shaderBench.getFragmentSource());

  object_renderer.current_program = ObjectRenderer.compileProgram(vertex_source, fragment_source);

  if (object_renderer.current_program.program) {
    printTerminal("Shader successfully compiled");
    printTerminal("Vertex shader: " + vertex_source.split("\n").length + " lines");
    printTerminal("Fragment shader: " + fragment_source.split("\n").length + " lines");

    defineLayout(object_renderer.current_program.uniforms, object_renderer.current_program.attribs);
  }
});

// Draw button
document.getElementById("draw").addEventListener("click", () => {
  object_renderer.draw();
});
