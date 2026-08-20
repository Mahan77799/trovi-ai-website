/**
 * Trovi AI signature liquid orb
 * ---------------------------------
 * Uses the approved painted orb as a texture, then animates only the liquid
 * below the stationary glass edge and centre play control.
 * No framework or external WebGL library is required.
 */
(function () {
  'use strict';

  var scriptUrl = (document.currentScript && document.currentScript.src) ||
    new URL('js/liquid-orbs.js', window.location.href).href;

  var prefersReducedMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var VERTEX_SHADER = [
    'attribute vec2 aPosition;',
    'varying vec2 vUv;',
    'void main(){',
    '  vUv = aPosition * 0.5 + 0.5;',
    '  gl_Position = vec4(aPosition, 0.0, 1.0);',
    '}'
  ].join('\n');

  var FRAGMENT_SHADER = [
    'precision highp float;',
    'uniform sampler2D uTexture;',
    'uniform float uTime;',
    'uniform vec2 uResolution;',
    'varying vec2 vUv;',
    '',
    'float hash21(vec2 p){',
    '  p = fract(p * vec2(123.34, 345.45));',
    '  p += dot(p, p + 34.345);',
    '  return fract(p.x * p.y);',
    '}',
    '',
    'float noise2(vec2 p){',
    '  vec2 i = floor(p);',
    '  vec2 f = fract(p);',
    '  f = f*f*(3.0-2.0*f);',
    '  float a = hash21(i);',
    '  float b = hash21(i + vec2(1.0,0.0));',
    '  float c = hash21(i + vec2(0.0,1.0));',
    '  float d = hash21(i + vec2(1.0,1.0));',
    '  return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);',
    '}',
    '',
    'float fbm(vec2 p){',
    '  float value = 0.0;',
    '  float amplitude = 0.5;',
    '  mat2 turn = mat2(0.80,-0.60,0.60,0.80);',
    '  for(int i=0;i<5;i++){',
    '    value += amplitude * noise2(p);',
    '    p = turn * p * 2.02 + 9.73;',
    '    amplitude *= 0.5;',
    '  }',
    '  return value;',
    '}',
    '',
    'mat2 rotate2d(float a){',
    '  float s = sin(a);',
    '  float c = cos(a);',
    '  return mat2(c,-s,s,c);',
    '}',
    '',
    'vec2 keepInside(vec2 uv){',
    '  vec2 p = uv - 0.5;',
    '  float r = length(p);',
    '  if(r > 0.493){ p *= 0.493 / max(r,0.0001); }',
    '  return p + 0.5;',
    '}',
    '',
    'void main(){',
    '  vec2 uv = vUv;',
    '  vec2 p = uv - 0.5;',
    '  p.x *= uResolution.x / max(uResolution.y,1.0);',
    '  float radius = length(p);',
    '  float normalizedRadius = radius / 0.5;',
    '  float aa = 2.2 / min(uResolution.x,uResolution.y);',
    '  float circleMask = 1.0 - smoothstep(0.497-aa,0.497+aa,radius);',
    '  if(circleMask <= 0.0) discard;',
    '',
    '  vec4 original = texture2D(uTexture,uv);',
    '  float t = uTime;',
    '',
    '  // The outside glass and the play button never move.',
    '  float edgeLock = smoothstep(0.72,0.965,normalizedRadius);',
    '  float centreLock = 1.0 - smoothstep(0.115,0.205,normalizedRadius);',
    '  float liquidMask = (1.0-edgeLock) * (1.0-centreLock);',
    '',
    '  float n1 = fbm(p*2.65 + vec2(t*0.105,-t*0.071));',
    '  float n2 = fbm(p*3.85 + vec2(-t*0.079,t*0.093) + 4.7);',
    '  float n3 = fbm(p*5.10 + vec2(t*0.051,t*0.066) + 12.2);',
    '  float angle = atan(p.y,p.x);',
    '',
    '  // Flow A: a slow clockwise ocean current.',
    '  vec2 qa = uv-0.5;',
    '  float swirlA = 0.22*sin(t*0.34 + normalizedRadius*4.7) + (n1-0.5)*0.28;',
    '  qa = rotate2d(swirlA*liquidMask)*qa;',
    '  qa += vec2(n2-0.5,n1-0.5)*0.050*liquidMask;',
    '  qa.y += 0.018*sin(qa.x*8.0+t*0.43+n3*2.0)*liquidMask;',
    '  vec2 uvA = keepInside(qa+0.5);',
    '',
    '  // Flow B begins vertically flipped, then folds in the opposite direction.',
    '  vec2 qb = vec2(uv.x,1.0-uv.y)-0.5;',
    '  float swirlB = -0.18*sin(t*0.29 + normalizedRadius*5.3 + 1.7) + (n2-0.5)*0.24;',
    '  qb = rotate2d(swirlB*liquidMask)*qb;',
    '  qb += vec2(-(n1-0.5),n3-0.5)*0.044*liquidMask;',
    '  qb.x += 0.020*sin(qb.y*7.0-t*0.39+n2*2.5)*liquidMask;',
    '  vec2 uvB = keepInside(qb+0.5);',
    '',
    '  // Flow C is a diagonal fold used sparingly to exchange blue and gold areas.',
    '  vec2 qc = uv-0.5;',
    '  float diagonalTurn = 1.68 + 0.13*sin(t*0.22+n3*2.0);',
    '  qc = rotate2d(diagonalTurn*liquidMask)*qc;',
    '  qc += vec2(n3-0.5,-(n2-0.5))*0.032*liquidMask;',
    '  vec2 uvC = keepInside(qc+0.5);',
    '',
    '  vec3 colorA = texture2D(uTexture,uvA).rgb;',
    '  vec3 colorB = texture2D(uTexture,uvB).rgb;',
    '  vec3 colorC = texture2D(uTexture,uvC).rgb;',
    '',
    '  // Large moving chambers. The transitions are soft enough to look liquid,',
    '  // but firm enough to keep the source palette clean rather than muddy.',
    '  float chamberOne = 0.5 + 0.5*sin(angle*2.15 + t*0.38 + n1*4.2 - normalizedRadius*1.8);',
    '  chamberOne = smoothstep(0.28,0.72,chamberOne);',
    '  float chamberTwo = 0.5 + 0.5*sin(angle*3.05 - t*0.31 + n2*3.7 + normalizedRadius*2.5);',
    '  chamberTwo = smoothstep(0.38,0.78,chamberTwo);',
    '',
    '  vec3 liquid = mix(colorA,colorB,chamberOne*0.78*liquidMask);',
    '  liquid = mix(liquid,colorC,chamberTwo*0.34*liquidMask);',
    '',
    '  // Fine moving luminous lines appear wherever the liquid folds tightly.',
    '  float lineA = exp(-pow((chamberOne-0.50)/0.055,2.0))*liquidMask;',
    '  float lineB = exp(-pow((chamberTwo-0.50)/0.047,2.0))*liquidMask;',
    '  float flowLine = exp(-pow((n3-0.515)/0.034,2.0))*liquidMask;',
    '  vec3 cyanLine = vec3(0.32,0.91,1.0);',
    '  vec3 ivoryLine = vec3(1.0,0.965,0.84);',
    '  liquid += cyanLine*lineA*0.22;',
    '  liquid += ivoryLine*lineB*0.18;',
    '  liquid += mix(cyanLine,ivoryLine,0.5+0.5*sin(angle+t*0.2))*flowLine*0.12;',
    '',
    '  // A restrained moving light reflection changes the colour impression',
    '  // without adding blur or turning the orb into a neon glow.',
    '  vec2 movingLight = vec2(-0.20+0.22*sin(t*0.23),0.24+0.12*cos(t*0.19));',
    '  float sweep = pow(max(0.0,1.0-length(p-movingLight)*1.65),4.0)*liquidMask;',
    '  liquid += vec3(0.88,0.97,1.0)*sweep*0.13;',
    '',
    '  // Keep the approved artwork perfectly stationary at the glass edge and centre.',
    '  vec3 finalColor = mix(liquid,original.rgb,edgeLock);',
    '  finalColor = mix(finalColor,original.rgb,centreLock);',
    '',
    '  // Stationary glass finish and edge refraction.',
    '  float sphereZ = sqrt(max(0.0,1.0-normalizedRadius*normalizedRadius));',
    '  vec3 normal = normalize(vec3(p/0.5,sphereZ));',
    '  float fresnel = pow(1.0-max(normal.z,0.0),3.1);',
    '  finalColor = mix(finalColor,vec3(0.78,0.94,1.0),fresnel*0.12);',
    '  float fixedGlint = pow(max(dot(normal,normalize(vec3(-0.49,0.66,0.56))),0.0),64.0);',
    '  finalColor += fixedGlint*0.15;',
    '',
    '  // Preserve clarity and saturation at small card sizes.',
    '  float luma = dot(finalColor,vec3(0.2126,0.7152,0.0722));',
    '  finalColor = mix(vec3(luma),finalColor,1.075);',
    '  finalColor = (finalColor-0.5)*1.035+0.5;',
    '  finalColor = pow(max(finalColor,0.0),vec3(0.97));',
    '',
    '  gl_FragColor = vec4(finalColor,circleMask*original.a);',
    '}'
  ].join('\n');

  function compileShader(gl, type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Trovi orb shader error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  function createProgram(gl) {
    var vertex = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    var fragment = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!vertex || !fragment) return null;

    var program = gl.createProgram();
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Trovi orb link error:', gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
      return null;
    }
    return program;
  }

  function mountOrb(host) {
    if (!host || host.dataset.webglOrbMounted === 'true') return null;

    var fallback = host.querySelector('.rr-orb-media');
    var canvas = document.createElement('canvas');
    canvas.className = 'trovi-orb-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    host.insertBefore(canvas, host.firstChild);

    var options = {
      alpha: true,
      antialias: true,
      premultipliedAlpha: false,
      powerPreference: 'high-performance'
    };
    var gl = canvas.getContext('webgl2', options) || canvas.getContext('webgl', options);
    if (!gl) {
      canvas.remove();
      return null;
    }

    var program = createProgram(gl);
    if (!program) {
      canvas.remove();
      return null;
    }

    var positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]),
      gl.STATIC_DRAW
    );

    var aPosition = gl.getAttribLocation(program, 'aPosition');
    var uTexture = gl.getUniformLocation(program, 'uTexture');
    var uTime = gl.getUniformLocation(program, 'uTime');
    var uResolution = gl.getUniformLocation(program, 'uResolution');

    gl.useProgram(program);
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);

    var ready = false;
    var firstFrameShown = false;
    var isVisible = true;
    var lastWidth = 0;
    var lastHeight = 0;

    var image = new Image();
    image.decoding = 'async';
    image.onload = function () {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      ready = true;
    };
    image.onerror = function () {
      console.error('Trovi orb texture could not load:', image.src);
      canvas.remove();
    };
    image.src = new URL('../assets/planets/trovi-signature-liquid-orb.png', scriptUrl).href;

    function resize() {
      var rect = host.getBoundingClientRect();
      var dpr = Math.min(window.devicePixelRatio || 1, 3);
      var width = Math.max(1, Math.round(rect.width * dpr));
      var height = Math.max(1, Math.round(rect.height * dpr));
      if (width !== lastWidth || height !== lastHeight) {
        lastWidth = width;
        lastHeight = height;
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }
      return [width, height];
    }

    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) {
        isVisible = !!(entries[0] && entries[0].isIntersecting);
      }, { rootMargin: '160px' });
      observer.observe(host);
    }

    return {
      render: function (seconds) {
        if (!ready || !isVisible) return;
        var size = resize();
        gl.useProgram(program);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(uTexture, 0);
        gl.uniform1f(uTime, prefersReducedMotion ? 0 : seconds);
        gl.uniform2f(uResolution, size[0], size[1]);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        // Hide the fallback only after a real animated frame is on screen.
        if (!firstFrameShown) {
          firstFrameShown = true;
          host.dataset.webglOrbMounted = 'true';
          requestAnimationFrame(function () {
            if (fallback) fallback.style.opacity = '0';
          });
        }
      }
    };
  }

  function start() {
    var orbs = [];
    Array.prototype.forEach.call(
      document.querySelectorAll('.rr-agent-orb--ocean'),
      function (host) {
        var orb = mountOrb(host);
        if (orb) orbs.push(orb);
      }
    );

    if (!orbs.length) return;
    var startedAt = performance.now();

    function frame(now) {
      var seconds = (now - startedAt) * 0.001;
      orbs.forEach(function (orb) { orb.render(seconds); });
      if (!prefersReducedMotion) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
}());
