---
name: webassembly-patterns
description: Use this skill when integrating WebAssembly into applications. Covers WASM compilation, memory management, interop with JavaScript/TypeScript, and performance optimization for compute-intensive tasks.
triggers: [WebAssembly, WASM, wasm, AssemblyScript, Rust WASM, C++ WASM, performance optimization, native code in browser]
origin: starter-pack
---

# WebAssembly Patterns

Patterns for integrating WebAssembly into web applications.

## When to Activate

- Performance-critical code (image processing, crypto, physics)
- Porting C/C++/Rust libraries to the browser
- Running native code in web apps
- Implementing compilers/transpilers in the browser
- Processing large datasets client-side

## Basic Setup

### Rust + wasm-pack

```rust
// src/lib.rs
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn fibonacci(n: u32) -> u32 {
    match n {
        0 => 0,
        1 => 1,
        _ => fibonacci(n - 1) + fibonacci(n - 2),
    }
}

#[wasm_bindgen]
pub struct ImageProcessor {
    width: u32,
    height: u32,
    data: Vec<u8>,
}

#[wasm_bindgen]
impl ImageProcessor {
    #[wasm_bindgen(constructor)]
    pub fn new(width: u32, height: u32, data: &[u8]) -> Self {
        Self {
            width,
            height,
            data: data.to_vec(),
        }
    }
    
    pub fn grayscale(&mut self) {
        for chunk in self.data.chunks_exact_mut(4) {
            let avg = ((chunk[0] as u16 + chunk[1] as u16 + chunk[2] as u16) / 3) as u8;
            chunk[0] = avg;
            chunk[1] = avg;
            chunk[2] = avg;
        }
    }
    
    pub fn data_ptr(&self) -> *const u8 {
        self.data.as_ptr()
    }
}
```

### Build & Use

```bash
# Build
wasm-pack build --target web

# Or for Node.js
wasm-pack build --target nodejs
```

```typescript
import init, { fibonacci, ImageProcessor } from './pkg/my_wasm.js';

async function run() {
  await init();
  
  // Simple function
  console.log(fibonacci(40)); // Fast!
  
  // Image processing
  const imageData = canvas.getImageData(0, 0, width, height);
  const processor = new ImageProcessor(width, height, imageData.data);
  processor.grayscale();
  
  // Get processed data back
  const ptr = processor.data_ptr();
  const memory = new Uint8Array(wasmMemory.buffer, ptr, width * height * 4);
  imageData.data.set(memory);
  ctx.putImageData(imageData, 0, 0);
}
```

## AssemblyScript (TypeScript-like)

```typescript
// assembly/index.ts
export function add(a: i32, b: i32): i32 {
  return a + b;
}

export class Matrix {
  rows: i32;
  cols: i32;
  data: Float64Array;
  
  constructor(rows: i32, cols: i32) {
    this.rows = rows;
    this.cols = cols;
    this.data = new Float64Array(rows * cols);
  }
  
  multiply(other: Matrix): Matrix {
    const result = new Matrix(this.rows, other.cols);
    for (let i: i32 = 0; i < this.rows; i++) {
      for (let j: i32 = 0; j < other.cols; j++) {
        let sum: f64 = 0;
        for (let k: i32 = 0; k < this.cols; k++) {
          sum += this.data[i * this.cols + k] * other.data[k * other.cols + j];
        }
        result.data[i * other.cols + j] = sum;
      }
    }
    return result;
  }
}
```

```bash
asc assembly/index.ts --outFile build/module.wasm --optimize
```

## Memory Management

### Shared Memory

```typescript
// Allocate memory in WASM
const memory = new WebAssembly.Memory({ initial: 256, maximum: 512 });

// Share with JavaScript
const importObject = {
  env: { memory }
};

const { instance } = await WebAssembly.instantiate(buffer, importObject);

// Read/write from JS
const view = new Uint8Array(memory.buffer);
view[0] = 42;
console.log(view[0]); // 42
```

### Growth Handling

```typescript
memory.grow(1); // Add 1 page (64KB)

// After growth, buffer reference may be invalid
const buffer = memory.buffer;
const view = new Uint8Array(buffer);

// If memory grows, recreate views
if (memory.buffer !== buffer) {
  view = new Uint8Array(memory.buffer);
}
```

## JavaScript Interop

### Calling JS from WASM

```rust
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
extern "C" {
    fn alert(s: &str);
    
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

#[wasm_bindgen]
pub fn greet(name: &str) {
    log(&format!("Hello, {}!", name));
    alert(&format!("Welcome, {}!", name));
}
```

### Callbacks

```rust
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct Callback {
    func: js_sys::Function,
}

#[wasm_bindgen]
impl Callback {
    pub fn call(&self, arg: &str) {
        let this = js_sys::global();
        let _ = this.dyn_ref::<js_sys::Object>()
            .unwrap()
            .call1(&this, &JsValue::from_str(arg));
    }
}
```

## Performance Patterns

### Web Workers

```typescript
// main.ts
const worker = new Worker('wasm-worker.js');

worker.postMessage({ data: largeArray });
worker.onmessage = (e) => {
  console.log('Result:', e.data.result);
};

// wasm-worker.js
import init, { compute } from './pkg/my_wasm.js';

self.onmessage = async (e) => {
  await init();
  const result = compute(e.data);
  self.postMessage({ result });
};
```

### Parallel Processing

```typescript
// Split work across multiple workers
async function parallelCompute(data: Float32Array, workers: number): Promise<Float32Array> {
  const chunkSize = Math.ceil(data.length / workers);
  const promises: Promise<Float32Array>[] = [];
  
  for (let i = 0; i < workers; i++) {
    const start = i * chunkSize;
    const chunk = data.slice(start, start + chunkSize);
    promises.push(processChunk(chunk));
  }
  
  const results = await Promise.all(promises);
  return Float32Array.from(results.flat());
}
```

## Anti-Patterns

1. **Not initializing** → WASM functions won't work
2. **Ignoring memory limits** → OOM crashes
3. **No error handling** → WASM panics are hard to debug
4. **Over-optimizing** → JS might be fast enough
5. **Missing type conversions** → WASM/JS type mismatches

## Related Skills

- `typescript-advanced-patterns` — for WASM type safety
- `performance-optimizer` — for WASM performance tuning

## Related Agents

- `performance-optimizer` — for WASM optimization
