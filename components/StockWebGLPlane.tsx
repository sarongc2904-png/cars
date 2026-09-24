"use client";

import { useEffect, useRef } from "react";
import { useScroll } from "@/lib/motion/scroll/scroll-context";

const vertexShaderSource = `
attribute vec2 aPosition;
varying vec2 vUv;

void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

const fragmentShaderSource = `
precision mediump float;

uniform sampler2D uCurrent;
uniform sampler2D uNext;
uniform float uProgress;
uniform float uVelocity;
uniform float uTime;
uniform float uCurrentAspect;
uniform float uNextAspect;
uniform float uPlaneAspect;
uniform vec2 uPointer;

varying vec2 vUv;

vec2 coverUv(vec2 uv, float imageAspect, float planeAspect) {
  vec2 scale = planeAspect > imageAspect
    ? vec2(1.0, imageAspect / planeAspect)
    : vec2(planeAspect / imageAspect, 1.0);
  return (uv - 0.5) * scale + 0.5;
}

float randomNoise(vec2 point) {
  return fract(sin(dot(point, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  float progress = smoothstep(0.0, 1.0, clamp(uProgress, 0.0, 1.0));
  float velocity = clamp(uVelocity, -1.0, 1.0);
  float wave = sin((vUv.y * 16.0) + (uTime * 0.7) + (vUv.x * 3.0)) * 0.012;
  float grain = (randomNoise(vUv * 90.0 + uTime * 0.03) - 0.5) * abs(velocity) * 0.035;
  float smear = velocity * (0.055 + grain);
  float zoomOut = 1.0 + progress * 0.075;
  float zoomIn = 1.075 - progress * 0.075;

  vec2 currentUv = coverUv(vUv, uCurrentAspect, uPlaneAspect);
  vec2 nextUv = coverUv(vUv, uNextAspect, uPlaneAspect);
  currentUv = (currentUv - 0.5) / zoomOut + 0.5;
  nextUv = (nextUv - 0.5) / zoomIn + 0.5;

  currentUv += vec2(smear + wave * velocity, progress * 0.09);
  nextUv += vec2(-smear + wave * (1.0 - progress), -(1.0 - progress) * 0.09);
  currentUv += uPointer * 0.012;
  nextUv += uPointer * 0.008;

  float transitionEdge = progress * 1.4 - 0.2;
  float slant = vUv.y + (vUv.x - 0.5) * 0.16 + wave + grain;
  float reveal = 1.0 - smoothstep(transitionEdge - 0.2, transitionEdge + 0.2, slant);

  vec3 currentColor = texture2D(uCurrent, clamp(currentUv, 0.002, 0.998)).rgb;
  vec3 nextColor = texture2D(uNext, clamp(nextUv, 0.002, 0.998)).rgb;
  vec3 color = mix(currentColor, nextColor, reveal);

  gl_FragColor = vec4(color, 1.0);
}
`;

function compileShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Unable to create WebGL shader");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) ?? "Unknown shader compilation error";
    gl.deleteShader(shader);
    throw new Error(message);
  }
  return shader;
}

function createProgram(gl: WebGLRenderingContext) {
  const vertex = compileShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
  const program = gl.createProgram();
  if (!program) throw new Error("Unable to create WebGL program");
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program) ?? "Unknown WebGL link error";
    gl.deleteProgram(program);
    throw new Error(message);
  }
  return program;
}

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Unable to load ${source}`));
    image.src = source;
  });
}

export function StockWebGLPlane({ images }: { images: string[] }) {
  /*
   * The document no longer scrolls: `html, body { overflow: hidden }` and a
   * dedicated `.lenis` element is the only scroll container, so `window.scrollY`
   * is always 0. The offset comes from the single Lenis instance, mirrored into
   * a ref so the long-lived render closure always calls the latest getter.
   */
  const { getScroll } = useScroll();
  const getScrollRef = useRef(getScroll);
  useEffect(() => {
    getScrollRef.current = getScroll;
  }, [getScroll]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const section = canvas?.closest<HTMLElement>("[data-stock-list]");
    if (!canvas || !section || images.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const gl = canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      depth: false,
      powerPreference: "high-performance",
    });
    if (!gl) return;

    let disposed = false;
    let frame = 0;
    let active = true;
    let ready = false;
    let lastScrollY = getScrollRef.current();
    let smoothedVelocity = 0;
    const pointer = { x: 0, y: 0 };
    const textures: WebGLTexture[] = [];
    const aspects: number[] = [];
    let program: WebGLProgram | null = null;
    let buffer: WebGLBuffer | null = null;

    const clearReadyState = () => {
      ready = false;
      section.removeAttribute("data-webgl-ready");
    };

    const handleContextLost = (event: Event) => {
      event.preventDefault();
      clearReadyState();
      window.cancelAnimationFrame(frame);
    };

    canvas.addEventListener("webglcontextlost", handleContextLost);

    const observer = new IntersectionObserver(
      ([entry]) => {
        active = entry?.isIntersecting ?? false;
      },
      { rootMargin: "100% 0px" },
    );
    observer.observe(section);

    const handlePointer = (event: PointerEvent) => {
      pointer.x = (event.clientX / Math.max(window.innerWidth, 1) - 0.5) * 2;
      pointer.y = (event.clientY / Math.max(window.innerHeight, 1) - 0.5) * -2;
    };
    window.addEventListener("pointermove", handlePointer, { passive: true });

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, window.innerWidth < 901 ? 1.25 : 1.5);
      const width = Math.max(1, Math.round(canvas.clientWidth * dpr));
      const height = Math.max(1, Math.round(canvas.clientHeight * dpr));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }
    };
    window.addEventListener("resize", resize, { passive: true });
    resize();

    void Promise.all(images.map(loadImage)).then((loadedImages) => {
      if (disposed) return;

      try {
        program = createProgram(gl);
        buffer = gl.createBuffer();
        if (!buffer) throw new Error("Unable to create WebGL buffer");
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(
          gl.ARRAY_BUFFER,
          new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
          gl.STATIC_DRAW,
        );

        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
        loadedImages.forEach((image) => {
          const texture = gl.createTexture();
          if (!texture) throw new Error("Unable to create WebGL texture");
          gl.bindTexture(gl.TEXTURE_2D, texture);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
          textures.push(texture);
          aspects.push(image.naturalWidth / image.naturalHeight);
        });

        gl.useProgram(program);
        const positionLocation = gl.getAttribLocation(program, "aPosition");
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

        const uniforms = {
          current: gl.getUniformLocation(program, "uCurrent"),
          next: gl.getUniformLocation(program, "uNext"),
          progress: gl.getUniformLocation(program, "uProgress"),
          velocity: gl.getUniformLocation(program, "uVelocity"),
          time: gl.getUniformLocation(program, "uTime"),
          currentAspect: gl.getUniformLocation(program, "uCurrentAspect"),
          nextAspect: gl.getUniformLocation(program, "uNextAspect"),
          planeAspect: gl.getUniformLocation(program, "uPlaneAspect"),
          pointer: gl.getUniformLocation(program, "uPointer"),
        };

        const render = (time: number) => {
          if (disposed) return;
          const currentScrollY = getScrollRef.current();
          const rawVelocity = (currentScrollY - lastScrollY) / Math.max(window.innerHeight * 0.12, 1);
          smoothedVelocity += (rawVelocity - smoothedVelocity) * 0.12;
          lastScrollY = currentScrollY;

          if (active) {
            const rect = section.getBoundingClientRect();
            const travel = Math.max(section.offsetHeight - window.innerHeight, 1);
            const totalProgress = Math.min(1, Math.max(0, -rect.top / travel));
            const scaled = totalProgress * (textures.length - 1);
            const currentIndex = Math.min(Math.floor(scaled), textures.length - 2);
            const nextIndex = currentIndex + 1;
            const progress = Math.min(1, Math.max(0, scaled - currentIndex));

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, textures[currentIndex]);
            gl.uniform1i(uniforms.current, 0);
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, textures[nextIndex]);
            gl.uniform1i(uniforms.next, 1);
            gl.uniform1f(uniforms.progress, progress);
            gl.uniform1f(uniforms.velocity, smoothedVelocity);
            gl.uniform1f(uniforms.time, time * 0.001);
            gl.uniform1f(uniforms.currentAspect, aspects[currentIndex]);
            gl.uniform1f(uniforms.nextAspect, aspects[nextIndex]);
            gl.uniform1f(uniforms.planeAspect, canvas.width / Math.max(canvas.height, 1));
            gl.uniform2f(uniforms.pointer, pointer.x, pointer.y);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

            if (!ready) {
              ready = true;
              section.setAttribute("data-webgl-ready", "true");
            }
          }

          frame = window.requestAnimationFrame(render);
        };

        frame = window.requestAnimationFrame(render);
      } catch {
        clearReadyState();
      }
    }).catch(clearReadyState);

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", handlePointer);
      observer.disconnect();
      canvas.removeEventListener("webglcontextlost", handleContextLost);
      clearReadyState();
      textures.forEach((texture) => gl.deleteTexture(texture));
      if (buffer) gl.deleteBuffer(buffer);
      if (program) gl.deleteProgram(program);
    };
  }, [images]);

  return (
    <div className="stock-webgl-plane" aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  );
}
