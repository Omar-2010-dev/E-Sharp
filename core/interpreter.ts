// ==================\\
// E#
// ESHARP
// ENGLISH-SHARP
// EASY -  AND  - FAST
// ==================\\

import { ASTNode, parse } from './parser';
import * as fs from 'fs';

// === تعريفات عشان TypeScript يفهم إننا بنستخدم حاجات Node.js ===
declare const require: any;
declare const process: any;
declare const Buffer: any;
// ============================================================

// كلاس للإشارة للرجوع من دالة (Return)
class ReturnSignal {
  constructor(public value: unknown) {}
}

// كلاسات جديدة عشان نتحكم في الـ loops
class BreakSignal {}
class ContinueSignal {}

// كلاس للأخطاء الخاصة بـ E#
class ESharpError extends Error {
  constructor(
    msg: string,
    public line?: number
  ) {
    super(msg);
    this.name = 'E#';
  }
}

export interface OutputLine {
  text: string;
  type: 'output' | 'error' | 'info' | 'input';
}

// تعريف شكل الدالة في اللغة
interface ESharpFunction {
  __type: 'function';
  name: string;
  params: string[];
  body: ASTNode[];
  closure: Environment;
}

// تعريف شكل الكلاس
interface ESharpClass {
  name: string;
  parent: string | null;
  methods: Map<string, { params: string[]; body: ASTNode[] }>;
}

// تعريف شكل الكائن (Instance)
interface ESharpInstance {
  __type: 'instance';
  className: string;
  props: Record<string, unknown>;
}

// بيئة العمل (Environment) لتخزين المتغيرات
class Environment {
  private vars = new Map<string, unknown>();
  constructor(public parent: Environment | null = null) {}

  get(name: string): unknown {
    if (this.vars.has(name)) return this.vars.get(name);
    if (this.parent) return this.parent.get(name);
    throw new ESharpError(`'${name}' is not defined`);
  }

  set(name: string, value: unknown) {
    if (!this.vars.has(name) && this.parent?.has(name)) this.parent.set(name, value);
    else this.vars.set(name, value);
  }

  has(name: string): boolean {
    return this.vars.has(name) || (this.parent?.has(name) ?? false);
  }

  define(name: string, value: unknown) {
    this.vars.set(name, value);
  }
}

// دالة السؤال (Blocking) لأننا بنحتاجها توقف التنفيذ لحد ما اليوزر يكتب
function handleAsk(promptText: string): string {
  process.stdout.write('\x1b[36m' + promptText + ' \x1b[0m'); // لون سماوي للسؤال
  const buffer = Buffer.alloc(1024);
  try {
    const bytesRead = fs.readSync(0, buffer, 0, 1024, null);
    if (bytesRead === 0) return '';
    return buffer
      .toString('utf8', 0, bytesRead)
      .replace(/[\r\n]/g, '')
      .trim();
  } catch (e) {
    return '';
  }
}

export class Interpreter {
  private output: OutputLine[] = [];
  private env: Environment;
  private classes = new Map<string, ESharpClass>();
  private steps = 0;
  private maxSteps = 5000000; // زودنا الحد الأقصى عشان الألعاب التقيلة
  private loopDepth = 0; // متغير جديد عشان نعرف إحنا جوه loop ولا لأ

  // === متغيرات الكاميرا (Camera State) ===
  private cameraTarget: any = null;
  private cameraOffset = { x: 0, y: 0 };
  private cameraZoom = 1.0;
  private cameraLerpAmount = 0.05;
  private camera2D: any = null; // Raylib Camera2D object

  // === متغيرات المحرك (Engine State) ===
  private engineEntities: any[] = [];
  private staticColliders: any[] = [];
  private rigidbodies: { entity: any; gravityScale: number }[] = [];
  private uiDrawQueue: any[] = []; // <-- طابور جديد عشان أوامر رسم الـ UI

  constructor() {
    this.env = new Environment();
    this.loopDepth = 0;
    this.builtins();
  }

  // دالة مساعدة عشان نجيب الخصائص من كائن E# سواء كان قاموس أو instance
  private getProps(o: any) {
    return o && o.__type === 'instance' ? o.props : o;
  }

  // تعريف الدوال الجاهزة في اللغة
  private builtins() {
    // 🎮 Raylib Integration
    let r: any; // هنحمل المكتبة لما نحتاجها

    // دالة مساعدة لتحويل النص للون Raylib
    const getColor = (name: unknown) => {
      if (!r) return { r: 255, g: 255, b: 255, a: 255 }; // Default White
      const colorStr = String(name).toLowerCase();

      // 1. دعم أكواد الـ Hex زي "#ff0000"
      if (colorStr.startsWith('#')) {
        let hex = colorStr.slice(1);
        if (hex.length === 3) {
          hex = hex
            .split('')
            .map((char) => char + char)
            .join('');
        }
        if (hex.length === 6 || hex.length === 8) {
          const rVal = parseInt(hex.substring(0, 2), 16);
          const gVal = parseInt(hex.substring(2, 4), 16);
          const bVal = parseInt(hex.substring(4, 6), 16);
          const aVal = hex.length === 8 ? parseInt(hex.substring(6, 8), 16) : 255;
          if (!isNaN(rVal) && !isNaN(gVal) && !isNaN(bVal) && !isNaN(aVal)) {
            return { r: rVal, g: gVal, b: bVal, a: aVal };
          }
        }
      }

      // 2. لو مش Hex، دور على اسم اللون في Raylib
      return r[colorStr.toUpperCase()] || r.WHITE;
    };

    // دالة مساعدة لتحويل اسم الزرار لرقم Raylib
    const getKey = (name: unknown) => {
      if (!r) return 0;
      const k = String(name).toUpperCase();
      // Mapping common names
      if (k === 'SPACE') return r.KEY_SPACE;
      if (k === 'UP') return r.KEY_UP;
      if (k === 'DOWN') return r.KEY_DOWN;
      if (k === 'LEFT') return r.KEY_LEFT;
      if (k === 'RIGHT') return r.KEY_RIGHT;
      if (k === 'ENTER') return r.KEY_ENTER;
      if (k === 'ESC' || k === 'ESCAPE') return r.KEY_ESCAPE;
      // Single letters like 'W', 'A', 'S', 'D'
      if (k.length === 1) return k.charCodeAt(0);
      // Fallback: try to find KEY_{NAME} in raylib object
      return r['KEY_' + k] || 0;
    };

    const b: Record<string, (...a: unknown[]) => unknown | Promise<unknown>> = {
      // 📏 Length & Type
      length: (v) => (typeof v === 'string' ? v.length : Array.isArray(v) ? v.length : 0),
      type: (v) => {
        if (v === null) return 'nothing';
        if (typeof v === 'number') return 'number';
        if (typeof v === 'string') return 'string';
        if (typeof v === 'boolean') return 'boolean';
        if (Array.isArray(v)) return 'list';
        if ((v as ESharpInstance)?.__type === 'instance') return 'object';
        return 'dict';
      },

      // ⏳ Wait Function (Async)
      // دلوقتي بقت بتستخدم Promise عشان متهنجش الـ CPU
      wait: async (ms) => {
        this.steps = 0; // تصفير العداد عشان اللوب يكمل للأبد
        const milliseconds = Number(ms);
        if (isNaN(milliseconds)) return;
        await new Promise((resolve) => setTimeout(resolve, milliseconds));
        return null;
      },

      // 🔤 String functions
      upper: (v) => String(v).toUpperCase(),
      lower: (v) => String(v).toLowerCase(),
      trim: (v) => String(v).trim(),
      reverse: (v) => {
        if (typeof v === 'string') return v.split('').reverse().join('');
        if (Array.isArray(v)) return [...v].reverse();
        return v;
      },
      startsWith: (v, s) => String(v).startsWith(String(s)),
      endsWith: (v, s) => String(v).endsWith(String(s)),
      replace: (v, old, nw) => String(v).split(String(old)).join(String(nw)),
      slice: (v, a, b2) => {
        const s = Array.isArray(v) ? v : String(v);
        return s.slice(Number(a), b2 != null ? Number(b2) : undefined);
      },
      charAt: (v, i) => String(v).charAt(Number(i)),

      // 🔢 Conversion
      toNum: (v) => {
        const n = Number(v);
        if (isNaN(n)) throw new ESharpError(`Can't convert '${v}' to number`);
        return n;
      },
      toStr: (v) => this.str(v),

      // 🧮 Math
      add: (a, b) => Number(a) + Number(b),
      subtract: (a, b) => Number(a) - Number(b),
      sub: (a, b) => Number(a) - Number(b), // Alias
      multiply: (a, b) => Number(a) * Number(b),
      mul: (a, b) => Number(a) * Number(b), // Alias
      divide: (a, b) => Number(a) / Number(b),
      div: (a, b) => Number(a) / Number(b), // Alias
      round: (v) => Math.round(Number(v)),
      floor: (v) => Math.floor(Number(v)),
      ceil: (v) => Math.ceil(Number(v)),
      abs: (v) => Math.abs(Number(v)),
      max: (a, b) => Math.max(Number(a), Number(b)),
      min: (a, b) => Math.min(Number(a), Number(b)),
      sqrt: (v) => Math.sqrt(Number(v)),
      power: (a, b) => Math.pow(Number(a), Number(b)),
      // --- 📐 دوال المثلثات (بتاخد الزاوية بالدرجات) ---
      // بتحسب جيب الزاوية (sine)
      sin: (degrees) => Math.sin((Number(degrees) * Math.PI) / 180),
      // بتحسب جيب تمام الزاوية (cosine)
      cos: (degrees) => Math.cos((Number(degrees) * Math.PI) / 180),
      // بتحسب ظل الزاوية (tangent)
      tan: (degrees) => Math.tan((Number(degrees) * Math.PI) / 180),
      sum: (...args) => {
        const arr = Array.isArray(args[0]) ? args[0] : args;
        return (arr as number[]).reduce((a, b) => Number(a) + Number(b), 0);
      },
      average: (...args) => {
        const arr = (Array.isArray(args[0]) ? args[0] : args) as number[];
        return arr.reduce((a, b) => Number(a) + Number(b), 0) / arr.length;
      },
      clamp: (v, lo, hi) => Math.min(Math.max(Number(v), Number(lo)), Number(hi)),
      isEven: (v) => Number(v) % 2 === 0,
      isOdd: (v) => Number(v) % 2 !== 0,

      // 🎲 Random (Unified)
      // دمجنا rand و random في دالة واحدة ذكية
      random: (min, max) => {
        // لو مدخل واحد بس، رجع رقم صحيح بين 0 والمدخل ده
        if (min !== undefined && max === undefined) {
          return Math.floor(Math.random() * (Number(min) + 1));
        }
        // لو مفيش مدخلات، رجع رقم عشري بين 0 و 1
        if (min === undefined && max === undefined) return Math.random();
        // لو فيه مدخلات، رجع رقم صحيح بينهم
        if (min !== undefined && max !== undefined) {
          return Math.floor(Math.random() * (Number(max) - Number(min) + 1)) + Number(min);
        }
        throw new ESharpError('random() takes 0, 1, or 2 arguments');
      },

      randomize: (arr) => {
        if (!Array.isArray(arr)) throw new ESharpError('randomize needs a list');
        const shuffled = [...arr];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
      },
      pick: (arr) => {
        if (!Array.isArray(arr)) throw new ESharpError('pick needs a list');
        return arr[Math.floor(Math.random() * arr.length)] ?? null;
      },
      coinFlip: () => (Math.random() < 0.5 ? 'heads' : 'tails'),
      dice: () => Math.floor(Math.random() * 6) + 1,

      // 📦 List functions
      push: (arr, val) => {
        if (Array.isArray(arr)) {
          arr.push(val);
          return arr;
        }
        throw new ESharpError('push needs a list');
      },
      pop: (arr) => {
        if (Array.isArray(arr)) return arr.pop() ?? null;
        throw new ESharpError('pop needs a list');
      },
      join: (arr, sep) => (Array.isArray(arr) ? arr.join(String(sep ?? ', ')) : ''),
      split: (s, sep) => String(s).split(String(sep)),
      has: (c, i) =>
        typeof c === 'string' ? c.includes(String(i)) : Array.isArray(c) ? c.includes(i) : false,
      indexOf: (c, i) => {
        if (typeof c === 'string') return c.indexOf(String(i));
        if (Array.isArray(c)) return c.indexOf(i);
        return -1;
      },
      sort: (arr) => {
        if (!Array.isArray(arr)) throw new ESharpError('sort needs a list');
        return [...arr].sort((a, b) => Number(a) - Number(b));
      },
      unique: (arr) => {
        if (!Array.isArray(arr)) throw new ESharpError('unique needs a list');
        return [...new Set(arr)];
      },
      // دالة جديدة بتمسح أول عنصر بيقابله قيمته زي القيمة اللي باعتها
      remove: (arr, val) => {
        if (!Array.isArray(arr)) throw new ESharpError('remove needs a list');
        const index = arr.indexOf(val);
        if (index > -1) {
          arr.splice(index, 1);
        }
        return arr;
      },
      flat: (arr) => {
        if (!Array.isArray(arr)) throw new ESharpError('flat needs a list');
        return arr.flat();
      },
      count: (arr, val) => {
        if (!Array.isArray(arr)) throw new ESharpError('count needs a list');
        return arr.filter((x) => x === val).length;
      },
      insert: (arr, i, val) => {
        if (!Array.isArray(arr)) throw new ESharpError('insert needs a list');
        arr.splice(Number(i), 0, val);
        return arr;
      },
      range: (a, b2) => {
        const start = b2 !== undefined ? Number(a) : 0;
        const end = b2 !== undefined ? Number(b2) : Number(a);
        const result: number[] = [];
        for (let i = start; i < end; i++) result.push(i);
        return result;
      },
      fill: (val, n) => Array(Number(n)).fill(val),
      zip: (a, b) => {
        if (!Array.isArray(a) || !Array.isArray(b)) throw new ESharpError('zip needs two lists');
        return a.map((v, i) => [v, b[i] ?? null]);
      },

      // 🏗️ List generators
      createNumList: (len) => {
        const n = Number(len);
        return Array.from({ length: n }, (_, i) => i + 1);
      },
      createRandomNumList: (len, maxVal) => {
        const n = Number(len);
        const mx = Number(maxVal ?? 100);
        return Array.from({ length: n }, () => Math.floor(Math.random() * mx) + 1);
      },

      // 🔑 Dict functions
      keys: (o) =>
        o && typeof o === 'object' && !Array.isArray(o)
          ? Object.keys(o as Record<string, unknown>)
          : [],
      values: (o) =>
        o && typeof o === 'object' && !Array.isArray(o)
          ? Object.values(o as Record<string, unknown>)
          : [],

      // 🎨 Fun & Emoji
      emoji: (name) => {
        const map: Record<string, string> = {
          happy: '😊',
          sad: '😢',
          love: '❤️',
          star: '⭐',
          fire: '🔥',
          rocket: '🚀',
          cool: '😎',
          party: '🎉',
          check: '✅',
          x: '❌',
          wave: '👋',
          thumbsUp: '👍',
          clap: '👏',
          think: '🤔',
          laugh: '😂',
          heart: '💖',
          sun: '☀️',
          moon: '🌙',
          rain: '🌧️',
          snow: '❄️',
          cat: '🐱',
          dog: '🐶',
          fish: '🐟',
          bird: '🐦',
          tree: '🌳',
          pizza: '🍕',
          apple: '🍎',
          cake: '🎂',
          coffee: '☕',
          gem: '💎'
        };
        return map[String(name)] ?? '❓';
      },
      repeat_text: (text, n) => {
        return Array(Number(n)).fill(String(text)).join('');
      },
      repeat: (text, n) => Array(Number(n)).fill(String(text)).join(''), // Alias
      progress: (current, total) => {
        const pct = Math.round((Number(current) / Number(total)) * 10);
        return (
          '█'.repeat(pct) +
          '░'.repeat(10 - pct) +
          ` ${Math.round((Number(current) / Number(total)) * 100)}%`
        );
      },
      sparkle: (text) => `✨ ${text} ✨`,
      banner: (text) => {
        const line = '═'.repeat(String(text).length + 4);
        return `╔${line}╗\n║  ${text}  ║\n╚${line}╝`;
      },

      // 🕐 Time
      now: () => Date.now(),
      time: () => new Date().toLocaleTimeString(),
      today: () => new Date().toLocaleDateString(),

      // Console helpers
      log: (v) => console.log(v),

      // 📂 File System (File I/O)
      readFile: (path) => {
        try {
          return fs.readFileSync(String(path), 'utf8');
        } catch (e) {
          throw new ESharpError(`[File Error]: Could not read file at '${path}'`);
        }
      },
      writeFile: (path, content) => {
        try {
          fs.writeFileSync(String(path), String(content), 'utf8');
          return true;
        } catch (e) {
          throw new ESharpError(`[File Error]: Could not write to file at '${path}'`);
        }
      },
      appendFile: (path, content) => {
        try {
          fs.appendFileSync(String(path), String(content), 'utf8');
          return true;
        } catch (e) {
          throw new ESharpError(`[File Error]: Could not append to file at '${path}'`);
        }
      },
      exists: (path) => fs.existsSync(String(path)),
      deleteFile: (path) => {
        try {
          if (fs.existsSync(String(path))) {
            fs.unlinkSync(String(path));
            return true;
          }
          return false;
        } catch (e) {
          throw new ESharpError(`[File Error]: Could not delete file at '${path}'`);
        }
      },

      // 🎨 Graphics (Native Raylib)
      showWindow: (w, h, title) => {
        try {
          r = require('raylib');
        } catch (e) {
          throw new ESharpError('Raylib not found! Run: npm install raylib');
        }
        r.InitWindow(Number(w), Number(h), String(title));
        r.SetTargetFPS(60); // 60 FPS Target

        // --- تهيئة الكاميرا ---
        this.camera2D = {
          target: { x: Number(w) / 2, y: Number(h) / 2 },
          offset: { x: Number(w) / 2, y: Number(h) / 2 },
          rotation: 0.0,
          zoom: 1.0
        };
        this.cameraTarget = null;
        this.cameraOffset = { x: 0, y: 0 };
        this.cameraZoom = 1.0;
        this.cameraLerpAmount = 0.05; // قيمة افتراضية للحركة الناعمة

        return null;
      },
      measureText: (text, fontSize) => {
        if (!r) throw new ESharpError('Raylib not initialized. Call showWindow() first.');
        return r.MeasureText(String(text), Number(fontSize));
      },

      drawRect: (x, y, w, h, color, rotation = 0) => {
        if (!r) throw new ESharpError('Raylib not initialized. Call showWindow() first.');

        const centerX = Number(x);
        const centerY = Number(y);
        const width = Number(w);
        const height = Number(h);
        const rot = Number(rotation);

        // دايمًا بنعتبر (x, y) هي مركز المستطيل، حتى لو مفيش دوران
        const rect = {
          x: centerX,
          y: centerY,
          width: width,
          height: height
        };

        const origin = { x: width / 2, y: height / 2 };

        r.DrawRectanglePro(rect, origin, isFinite(rot) ? rot : 0, getColor(color));

        return null;
      },

      drawCircle: (x, y, rad, color) => {
        if (!r) throw new ESharpError('Raylib not initialized. Call showWindow() first.');
        r.DrawCircle(Number(x), Number(y), Number(rad), getColor(color));
        return null;
      },
      drawText: (text, x, y, size, color, align) => {
        if (!r) throw new ESharpError('Raylib not initialized. Call showWindow() first.');
        const textStr = String(text);
        let posX = Number(x);
        const fontSize = Number(size);

        if (align === 'center') {
          const textWidth = r.MeasureText(textStr, fontSize);
          posX = posX - textWidth / 2;
        } else if (align === 'right') {
          const textWidth = r.MeasureText(textStr, fontSize);
          posX = posX - textWidth;
        }

        r.DrawText(textStr, posX, Number(y), fontSize, getColor(color));
        return null;
      },
      clearWindow: (color) => {
        if (!r) throw new ESharpError('Raylib not initialized. Call showWindow() first.');

        // --- تحديث الكاميرا كل فريم ---
        if (this.camera2D) {
          // 1. لو فيه هدف، حرك الكاميرا ناحيته بسلاسة
          if (this.cameraTarget) {
            const targetProps = this.getProps(this.cameraTarget);
            const targetX =
              Number(targetProps?.x || 0) + Number(targetProps?.w || targetProps?.width || 0) / 2;
            const targetY =
              Number(targetProps?.y || 0) + Number(targetProps?.h || targetProps?.height || 0) / 2;

            // بنستخدم دالة lerp عشان الحركة تبقى ناعمة
            this.camera2D.target.x = b.lerp(
              this.camera2D.target.x,
              targetX,
              this.cameraLerpAmount
            ) as number;
            this.camera2D.target.y = b.lerp(
              this.camera2D.target.y,
              targetY,
              this.cameraLerpAmount
            ) as number;
          }
          // 2. تطبيق الزووم والإزاحة
          // تعديل: بنعمل Lerp للزووم كمان عشان يبقى ناعم زي الحركة بالظبط
          this.camera2D.zoom = b.lerp(
            this.camera2D.zoom,
            this.cameraZoom,
            this.cameraLerpAmount
          ) as number;

          const screenWidth = r.GetScreenWidth();
          const screenHeight = r.GetScreenHeight();
          this.camera2D.offset = {
            x: screenWidth / 2 + this.cameraOffset.x,
            y: screenHeight / 2 + this.cameraOffset.y
          };
        }

        r.BeginDrawing(); // Start Frame
        if (this.camera2D) r.BeginMode2D(this.camera2D); // شغل وضع الكاميرا
        r.ClearBackground(getColor(color));
        return null;
      },
      endFrame: () => {
        if (!r) throw new ESharpError('Raylib not initialized. Call showWindow() first.');
        this.steps = 0; // تصفير العداد في كل فريم

        if (this.camera2D) r.EndMode2D(); // اقفل وضع الكاميرا

        // --- 🎨 معالجة أوامر رسم الـ UI ---
        // هنا بنرسم كل حاجة في طابور الـ UI بعد ما قفلنا وضع الكاميرا
        for (const cmd of this.uiDrawQueue) {
          if (cmd.type === 'text') {
            // بنستدعي منطق الرسم الأصلي بتاع drawText
            const [text, x, y, size, color, align] = cmd.args;
            const textStr = String(text);
            let posX = Number(x);
            const fontSize = Number(size);
            if (align === 'center') posX -= r.MeasureText(textStr, fontSize) / 2;
            else if (align === 'right') posX -= r.MeasureText(textStr, fontSize);
            r.DrawText(textStr, posX, Number(y), fontSize, getColor(color));
          }
        }
        this.uiDrawQueue = []; // بنفضي الطابور عشان الفريم الجاي

        r.EndDrawing(); // End Frame (Swap Buffers)
        return null;
      },

      isWindowOpen: () => (r ? !r.WindowShouldClose() : false),
      // دالة جديدة بتشوف لو المستخدم طلب يقفل الشاشة
      shouldClose: () => (r ? r.WindowShouldClose() : true),
      // دالة بتقفل الشاشة بنفسها
      closeWindow: () => {
        if (r) {
          // Don't throw error if window not open
          r.CloseWindow();
        }
        return null;
      },

      // ⏱️ Delta Time
      // بترجع الوقت اللي عدى بين الفريم والفريم اللي قبله (مهم عشان الحركة الناعمة)
      getDeltaTime: () => (r ? r.GetFrameTime() : 0),

      // 💥 Collision Detection (AABB)
      // دالة بتشوف هل جسمين خبطوا في بعض ولا لأ
      checkCollision: (obj1, obj2) => {
        // دالة مساعدة عشان نطلع الأبعاد سواء كان كلاس أو قاموس عادي
        const getRect = (o: any) => {
          const data = o && o.__type === 'instance' ? o.props : o;
          return {
            x: Number(data?.x || 0),
            y: Number(data?.y || 0),
            w: Number(data?.w || data?.width || 0), // تدعم w أو width
            h: Number(data?.h || data?.height || 0) // تدعم h أو height
          };
        };

        const r1 = getRect(obj1);
        const r2 = getRect(obj2);

        // معادلة التصادم AABB Logic
        return r1.x < r2.x + r2.w && r1.x + r1.w > r2.x && r1.y < r2.y + r2.h && r1.y + r1.h > r2.y;
      },

      // --- 📏 حسابات رياضية ذكية ---
      // بتجيب المسافة بين كائنين بدل ما المبرمج يكتب معادلة الجذر التربيعي
      getDistance: (obj1, obj2) => {
        const o1 = this.getProps(obj1);
        const o2 = this.getProps(obj2);
        const dx = Number(o2?.x || 0) - Number(o1?.x || 0);
        const dy = Number(o2?.y || 0) - Number(o1?.y || 0);
        return Math.sqrt(dx * dx + dy * dy);
      },

      // بتجيب الزاوية المطلوبة عشان كائن "يبص" للتاني (مثلاً رصاصة رايحة للماوس)
      getAngle: (obj1, obj2) => {
        const o1 = this.getProps(obj1);
        const o2 = this.getProps(obj2);
        const dx = Number(o2?.x || 0) - Number(o1?.x || 0);
        const dy = Number(o2?.y || 0) - Number(o1?.y || 0);
        // بنرجع الزاوية بالدرجات (degrees) عشان أسهل في التعامل
        return Math.atan2(dy, dx) * (180 / Math.PI);
      },

      // الحركة الناعمة (Lerp) - بتخلي الكائن يتحرك بسلاسة مش "نط"
      lerp: (start, end, amount) => {
        const amt = Math.max(0, Math.min(1, Number(amount))); // نتأكد إن القيمة بين 0 و 1
        return Number(start) + (Number(end) - Number(start)) * amt;
      },

      // --- 💥 تصادم متطور ---
      // تصادم الدوائر (محتاج x, y, radius)
      checkCircleCollision: (c1, c2) => {
        if (!r) return false;
        const o1 = this.getProps(c1);
        const o2 = this.getProps(c2);
        const center1 = { x: Number(o1?.x || 0), y: Number(o1?.y || 0) };
        const radius1 = Number(o1?.radius || 0);
        const center2 = { x: Number(o2?.x || 0), y: Number(o2?.y || 0) };
        const radius2 = Number(o2?.radius || 0);
        return r.CheckCollisionCircles(center1, radius1, center2, radius2);
      },

      // هل النقطة (الماوس مثلاً) جوه مربع؟ (مفيدة جداً للأزرار)
      isPointInRect: (px, py, rect) => {
        const x = Number(px);
        const y = Number(py);
        const r_props = this.getProps(rect);
        const rx = Number(r_props?.x || 0);
        const ry = Number(r_props?.y || 0);
        const rw = Number(r_props?.w || r_props?.width || 0);
        const rh = Number(r_props?.h || r_props?.height || 0);
        return x >= rx && x < rx + rw && y >= ry && y < ry + rh;
      },

      // --- 🧠 حركة ذكية ومعلومات الشاشة ---
      // بتحرك كائن ناحية كائن تاني، بالسرعة المحددة في الكائن الأول (obj1.speed)
      moveToward: (obj1, obj2) => {
        const o1 = this.getProps(obj1);
        const o2 = this.getProps(obj2);
        if (!r || !o1 || !o2) return null;

        const speed = Number(o1.speed || 0);
        if (speed === 0) return null;

        const dt = r.GetFrameTime(); // بنستخدم دلتا تايم عشان الحركة تبقى ناعمة

        const dx = Number(o2.x || 0) - Number(o1.x || 0);
        const dy = Number(o2.y || 0) - Number(o1.y || 0);
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0) {
          const moveAmount = speed * dt;
          // عشان الكائن ميعديش الهدف ويفضل يرتعش، لو المسافة الباقية أقل من اللي هيتحركه، بنلزقه في الهدف وخلاص
          if (dist <= moveAmount) {
            o1.x = Number(o2.x || 0);
            o1.y = Number(o2.y || 0);
          } else {
            const dirX = dx / dist;
            const dirY = dy / dist;
            o1.x = Number(o1.x || 0) + dirX * moveAmount;
            o1.y = Number(o1.y || 0) + dirY * moveAmount;
          }
        }
        return null; // الدالة دي بتعدل الكائن نفسه، مش بترجع قيمة
      },
      getScreenWidth: () => (r ? r.GetScreenWidth() : 0),
      getScreenHeight: () => (r ? r.GetScreenHeight() : 0),
      // 🎮 Input (Keyboard & Mouse)
      isKeyDown: (key) => (r ? r.IsKeyDown(getKey(key)) : false),
      isKeyPressed: (key) => (r ? r.IsKeyPressed(getKey(key)) : false),
      getMouseX: () => (r ? r.GetMouseX() : 0),
      getMouseY: () => (r ? r.GetMouseY() : 0),
      isMouseDown: (btn) => (r ? r.IsMouseButtonDown(Number(btn ?? 0)) : false),

      // ==========================================
      // 🚀 E# PRO PHYSICS ENGINE (Unity Style)
      // ==========================================
      createEntity: (x, y, w, h, color) => {
        const ent = {
          x: Number(x),
          y: Number(y),
          w: Number(w),
          h: Number(h),
          color: String(color),
          vx: 0,
          vy: 0,
          isGrounded: false,
          bounciness: 0
        };
        this.engineEntities.push(ent);
        return ent;
      },

      addRigidbody: (entity, gravityScale) => {
        const ent = this.getProps(entity);
        if (ent) this.rigidbodies.push({ entity: ent, gravityScale: Number(gravityScale) });
        return null;
      },

      addStaticCollider: (...args) => {
        // ذكاء اصطناعي في التعامل مع المدخلات:
        // 1. لو بعت كائن Entity واحد: addStaticCollider(player)
        if (args.length === 1) {
          const ent = this.getProps(args[0]);
          if (ent) this.staticColliders.push(ent);
        }
        // 2. لو بعت الأبعاد يدوي: addStaticCollider(x, y, w, h, color)
        else if (args.length >= 4) {
          this.staticColliders.push({
            x: Number(args[0]),
            y: Number(args[1]),
            w: Number(args[2]),
            h: Number(args[3]),
            color: String(args[4] || '#2c3e50'),
            _isRaw: true // علامة عشان نعرف إن ده مش Entity كامل
          });
        }
        return null;
      },

      engineStep: (deltaTime) => {
        // 1. معالجة الـ dt التلقائية (زي ما إنت عملتها بالظبط، عاش!)
        const rawDt =
          deltaTime !== undefined && deltaTime !== null
            ? Number(deltaTime)
            : r
              ? r.GetFrameTime()
              : 0;
        const dt = Number(rawDt);

        if (!isFinite(dt) || dt <= 0) return null;

        const aabb = (r1: any, r2: any) =>
          r1.x < r2.x + r2.w && r1.x + r1.w > r2.x && r1.y < r2.y + r2.h && r1.y + r1.h > r2.y;

        for (const rb of this.rigidbodies) {
          const ent = rb.entity;
          ent.vy += rb.gravityScale * dt;

          let groundTouch = false;

          // --- الحركة الأفقية X ---
          ent.x += ent.vx * dt;
          for (const col of this.staticColliders) {
            if (ent === col) continue;
            if (aabb(ent, col)) {
              if (ent.vx > 0) ent.x = col.x - ent.w;
              else if (ent.vx < 0) ent.x = col.x + col.w;
              ent.vx = 0;
            }
          }

          // --- الحركة الرأسية Y ---
          ent.y += ent.vy * dt;
          for (const col of this.staticColliders) {
            if (ent === col) continue;
            if (aabb(ent, col)) {
              if (ent.vy > 0) {
                ent.y = col.y - ent.h;
                if (ent.bounciness > 0 && ent.vy > 50) {
                  ent.vy = -ent.vy * ent.bounciness;
                } else {
                  ent.vy = 0;
                  groundTouch = true;
                }
              } else if (ent.vy < 0) {
                ent.y = col.y + col.h;
                ent.vy = 0;
              }
            }
          }
          ent.isGrounded = groundTouch;
        }

        // 2. الرسم الاحترافي ونظام الـ Preview (الـ Graph الصغير)
        if (r) {
          // رسم المصادمات الثابتة
          this.staticColliders.forEach((c) => {
            if (c._isRaw) r.DrawRectangle(c.x, c.y, c.w, c.h, getColor(c.color));
          });

          // رسم الكائنات مع نظام الـ Graph
          this.engineEntities.forEach((e) => {
            // رسم الكائن نفسه
            r.DrawRectangle(e.x, e.y, e.w, e.h, getColor(e.color));
          });
        }
        return null;
      },

      // ==========================================
      // � واجهة المستخدم (UI)
      // ==========================================
      // دالة جديدة بترسم نص ثابت على الشاشة مبيتحركش مع الكاميرا
      drawUIText: (text, x, y, size, color, align) => {
        this.uiDrawQueue.push({ type: 'text', args: [text, x, y, size, color, align] });
        return null;
      },

      // ==========================================
      // �🎥 نظام الكاميرا الذكي
      // ==========================================
      setCameraTarget: (target) => {
        this.cameraTarget = target;
        // لما بنحدد هدف جديد، بنخلي الكاميرا تنط عليه فوراً أول مرة عشان متبدأش من مكان بعيد
        if (this.cameraTarget && this.camera2D) {
          const targetProps = this.getProps(this.cameraTarget);
          const targetX =
            Number(targetProps?.x || 0) + Number(targetProps?.w || targetProps?.width || 0) / 2;
          const targetY =
            Number(targetProps?.y || 0) + Number(targetProps?.h || targetProps?.height || 0) / 2;
          this.camera2D.target = { x: targetX, y: targetY };
        }
        return null;
      },
      setCameraOffset: (x, y) => {
        this.cameraOffset = { x: Number(x), y: Number(y) };
        return null;
      },
      setCameraZoom: (zoom) => {
        this.cameraZoom = Math.max(0.1, Number(zoom)); // بنمنع الزووم يبقى صفر أو سالب
        return null;
      },
      setCameraLerp: (amount) => {
        // بنحدد القيمة بين 0 (مفيش حركة) و 1 (حركة فورية)
        this.cameraLerpAmount = Math.max(0, Math.min(1, Number(amount)));
        return null;
      },
      resetCamera: () => {
        this.cameraTarget = null;
        this.cameraOffset = { x: 0, y: 0 };
        this.cameraZoom = 1.0;
        this.cameraLerpAmount = 0.05;
        if (this.camera2D && r) {
          this.camera2D.target = { x: r.GetScreenWidth() / 2, y: r.GetScreenHeight() / 2 };
          this.camera2D.zoom = 1.0;
        }
        return null;
      }
    };

    for (const [k, fn] of Object.entries(b))
      this.env.define(k, { __type: 'builtin' as const, fn, name: k });
  }

  getOutput() {
    return this.output;
  }

  // دالة جديدة لتنسيق وتلوين المخرجات في التيرمينال 🎨
  private format(v: unknown): string {
    // Nothing -> لون رمادي
    if (v === null || v === undefined) return '\x1b[90mnothing\x1b[0m';
    // Boolean -> لون بنفسجي فاتح (Bright Magenta)
    if (typeof v === 'boolean') return v ? '\x1b[95mtrue\x1b[0m' : '\x1b[95mfalse\x1b[0m';
    // Number -> لون أصفر فاتح (Bright Yellow)
    if (typeof v === 'number') return `\x1b[93m${v}\x1b[0m`;
    // String -> لون أخضر فاتح (Bright Green)
    if (typeof v === 'string') return `\x1b[92m${v}\x1b[0m`;
    // List -> تلوين العناصر اللي جواها بشكل متكرر
    if (Array.isArray(v)) return '[' + v.map((x) => this.format(x)).join(', ') + ']';
    // Object -> تلوين القيم
    if (typeof v === 'object') {
      const o = v as Record<string, unknown>;
      // الكلاسات والدوال -> لون سماوي
      if (o.__type === 'instance') return `\x1b[36m<${(v as ESharpInstance).className}>\x1b[0m`;
      if (o.__type === 'function') return `\x1b[36m<func ${(v as ESharpFunction).name}>\x1b[0m`;
      if (o.__type === 'builtin') return `\x1b[36m<${(o as { name: string }).name}>\x1b[0m`;
      return (
        '{' +
        Object.entries(o)
          .map(([k, v2]) => `${k}: ${this.format(v2)}`)
          .join(', ') +
        '}'
      );
    }
    return String(v);
  }

  private str(v: unknown): string {
    if (v === null || v === undefined) return 'nothing';
    if (typeof v === 'boolean') return v ? 'true' : 'false';
    if (Array.isArray(v)) return '[' + v.map((x) => this.str(x)).join(', ') + ']';
    if (typeof v === 'object') {
      const o = v as Record<string, unknown>;
      if (o.__type === 'instance') return `<${(v as ESharpInstance).className}>`;
      if (o.__type === 'function') return `<func ${(v as ESharpFunction).name}>`;
      if (o.__type === 'builtin') return `<${(o as { name: string }).name}>`;
      return (
        '{' +
        Object.entries(o)
          .map(([k, v2]) => `${k}: ${this.str(v2)}`)
          .join(', ') +
        '}'
      );
    }
    return String(v);
  }

  // الدالة الرئيسية بقت Async
  async run(source: string): Promise<OutputLine[]> {
    this.output = [];
    this.steps = 0;
    this.loopDepth = 0; // تصفير الـ depth مع كل run

    // تصفير المحرك مع كل Run
    this.engineEntities = [];
    this.rigidbodies = [];
    this.staticColliders = [];
    this.uiDrawQueue = [];

    try {
      const ast = parse(source);
      await this.block((ast as { body: ASTNode[] }).body, this.env);
    } catch (e) {
      if (!(e instanceof ReturnSignal)) {
        // تلوين الخطأ بالأحمر
        const err = e as ESharpError;
        const lineNum = err.line;
        let msg = `\x1b[31m[E# Error]`;
        if (lineNum) msg += ` at line ${lineNum}`;
        msg += `: ${err.message}\x1b[0m`;

        // console.log(msg); // وقفنا الطباعة المباشرة هنا عشان الـ CLI بيطبع النتيجة في الآخر
        this.output.push({ text: msg, type: 'error' });

        // طباعة سطر الكود اللي فيه المشكلة لو عرفنا رقم السطر
        if (lineNum) {
          const lines = source.split('\n');
          if (lines[lineNum - 1]) {
            const codeLine = `\x1b[90m${lineNum} | \x1b[0m${lines[lineNum - 1].trim()}`;
            // console.log(codeLine);
            this.output.push({ text: codeLine, type: 'info' });
          }
        }
      }
    }
    return this.output;
  }

  private check() {
    if (++this.steps > this.maxSteps) throw new ESharpError('Too many steps (infinite loop?)');
  }

  // تنفيذ البلوك بقى Async
  private async block(stmts: ASTNode[], env: Environment): Promise<unknown> {
    let r: unknown = null;
    for (const s of stmts) {
      this.check();
      r = await this.exec(s, env);
    }
    return r;
  }

  // تنفيذ الأوامر بقى Async
  private async exec(node: ASTNode, env: Environment): Promise<unknown> {
    this.check();
    try {
      return await this.execSafe(node, env);
    } catch (e) {
      // لو الخطأ ملوش رقم سطر، بنحطله رقم السطر الحالي
      if (e instanceof ESharpError && !e.line) e.line = node.line;
      throw e;
    }
  }

  private async execSafe(node: ASTNode, env: Environment): Promise<unknown> {
    switch (node.type) {
      case 'Program':
        return this.block(node.body, env);
      case 'NumberLiteral':
        return node.value;
      case 'StringLiteral':
        return node.value;
      case 'BooleanLiteral':
        return node.value;
      case 'NothingLiteral':
        return null;
      case 'ThisExpr':
        return env.get('this');
      case 'Identifier':
        return env.get(node.name);

      case 'Assignment': {
        const v = await this.exec(node.value, env);
        env.set(node.name, v);
        return v;
      }

      case 'VarDeclaration': {
        const v = await this.exec(node.value, env);
        // هنا بنستخدم define عشان نعرف المتغير في البيئة الحالية بس (Scope)
        env.define(node.name, v);
        return v;
      }

      case 'SayStatement': {
        const v = await this.exec(node.value, env);
        // بنستخدم دالة format الجديدة عشان تطبع كل حاجة بلونها الصح
        console.log(this.format(v));
        return null;
      }

      case 'AskExpr': {
        const p = this.str(await this.exec(node.prompt, env));
        return handleAsk(p);
      }

      case 'IfStatement': {
        if (this.truthy(await this.exec(node.condition, env)))
          // بنعمل بيئة جديدة (Scope) عشان المتغيرات اللي بـ set جوه الـ if متطلعش بره
          return this.block(node.thenBody, new Environment(env));
        return this.block(node.elseBody, new Environment(env));
      }

      case 'WhileStatement': {
        this.loopDepth++;
        try {
          while (this.truthy(await this.exec(node.condition, env))) {
            this.check();
            try {
              await this.block(node.body, new Environment(env));
            } catch (err) {
              if (err instanceof ContinueSignal) continue; // كمل اللفة الجاية
              if (err instanceof BreakSignal) break; // اخرج من اللوب
              throw err; // لو أي خطأ تاني، ارميه لفوق
            }
          }
        } finally {
          this.loopDepth--;
        }
        return null;
      }

      case 'LoopStatement': {
        const n = Number(await this.exec(node.count, env));
        this.loopDepth++;
        try {
          for (let i = 0; i < n; i++) {
            this.check();
            try {
              await this.block(node.body, new Environment(env));
            } catch (err) {
              if (err instanceof ContinueSignal) continue;
              if (err instanceof BreakSignal) break;
              throw err;
            }
          }
        } finally {
          this.loopDepth--;
        }
        return null;
      }

      case 'ForInStatement': {
        const iterable = await this.exec(node.iterable, env);
        if (!Array.isArray(iterable) && typeof iterable !== 'string') {
          throw new ESharpError('for..in needs a list or string');
        }

        this.loopDepth++;
        try {
          for (const item of iterable) {
            this.check();
            // بنعمل Scope جديد لكل لفة في اللوب
            const scope = new Environment(env);
            scope.set(node.varName, item);
            try {
              await this.block(node.body, scope);
            } catch (err) {
              if (err instanceof ContinueSignal) continue;
              if (err instanceof BreakSignal) break;
              throw err;
            }
          }
        } finally {
          this.loopDepth--;
        }
        return null;
      }

      case 'FunctionDef': {
        const fn: ESharpFunction = {
          __type: 'function',
          name: node.name,
          params: node.params,
          body: node.body,
          closure: env
        };
        env.define(node.name, fn);
        return fn;
      }

      case 'ReturnStatement':
        throw new ReturnSignal(node.value ? await this.exec(node.value, env) : null);

      case 'BreakStatement': {
        if (this.loopDepth === 0)
          throw new ESharpError("'break' is only allowed inside a loop", node.line);
        throw new BreakSignal();
      }

      case 'ContinueStatement': {
        if (this.loopDepth === 0)
          throw new ESharpError("'continue' is only allowed inside a loop", node.line);
        throw new ContinueSignal();
      }

      case 'FunctionCall': {
        const fn = env.get(node.name) as Record<string, unknown>;
        if (!fn || typeof fn !== 'object')
          throw new ESharpError(`'${node.name}' is not a function`);

        // لازم نستنى كل الـ arguments تتحسب الأول
        const args = await Promise.all(node.args.map((a) => this.exec(a, env)));

        if (fn.__type === 'builtin') {
          // لو الدالة Builtin ممكن تكون Async (زي wait) أو Sync
          const result = (fn as { fn: Function }).fn(...args);
          if (result instanceof Promise) return await result;
          return result;
        }
        if (fn.__type === 'function') {
          const f = fn as unknown as ESharpFunction;
          const e = new Environment(f.closure);
          f.params.forEach((p, i) => e.define(p, args[i] ?? null));
          try {
            await this.block(f.body, e);
          } catch (err) {
            if (err instanceof ReturnSignal) return err.value;
            throw err;
          }
          return null;
        }
        throw new ESharpError(`'${node.name}' is not callable`);
      }

      case 'MethodCall': {
        const obj = await this.exec(node.object, env);
        const args = await Promise.all(node.args.map((a) => this.exec(a, env)));

        if (Array.isArray(obj)) return this.arrMethod(obj, node.method, args);
        if (typeof obj === 'string') return this.strMethod(obj, node.method, args);
        if (obj && typeof obj === 'object' && (obj as ESharpInstance).__type === 'instance')
          return this.instMethod(obj as ESharpInstance, node.method, args, env);

        throw new ESharpError(`Can't call '${node.method}' on ${this.str(obj)}`);
      }

      case 'PropertyAccess': {
        const obj = await this.exec(node.object, env);
        if (obj && typeof obj === 'object' && (obj as ESharpInstance).__type === 'instance')
          return (obj as ESharpInstance).props[node.property] ?? null;
        if (obj && typeof obj === 'object' && !Array.isArray(obj))
          return (obj as Record<string, unknown>)[node.property] ?? null;

        if (Array.isArray(obj) && node.property === 'length') return obj.length;
        if (typeof obj === 'string' && node.property === 'length') return obj.length;
        throw new ESharpError(`Can't access '${node.property}' on ${this.str(obj)}`);
      }

      case 'ClassDef': {
        const methods = new Map<string, { params: string[]; body: ASTNode[] }>();
        for (const m of node.methods)
          if (m.type === 'FunctionDef') methods.set(m.name, { params: m.params, body: m.body });
        this.classes.set(node.name, { name: node.name, parent: node.parent, methods });
        return null;
      }

      case 'NewExpr': {
        const cls = this.classes.get(node.className);
        if (!cls) throw new ESharpError(`Class '${node.className}' not found`);
        const inst: ESharpInstance = { __type: 'instance', className: node.className, props: {} };
        const init = this.findMethod(cls, 'init');
        if (init) {
          const args = await Promise.all(node.args.map((a) => this.exec(a, env)));
          const e = new Environment(env);
          e.define('this', inst);
          init.params.forEach((p, i) => e.define(p, args[i] ?? null));
          try {
            await this.block(init.body, e);
          } catch (err) {
            if (!(err instanceof ReturnSignal)) throw err;
          }
        }
        return inst;
      }

      case 'TryStatement': {
        try {
          return await this.block(node.tryBody, new Environment(env));
        } catch (e) {
          if (e instanceof ReturnSignal) throw e;
          const ce = new Environment(env);
          ce.define(node.errorVar, String((e as Error).message || e));
          return await this.block(node.catchBody, ce);
        }
      }

      case 'ArrayLiteral':
        return Promise.all(node.elements.map((e) => this.exec(e, env)));

      case 'DictLiteral': {
        const d: Record<string, unknown> = {};
        for (const e of node.entries) {
          // تعديل ذكي: لو المفتاح عبارة عن Identifier (اسم)، بنستخدم اسمه كنص (زي JS)
          // ده بيحل مشكلة { x: 400 } اللي كانت بتضرب عشان x مش متغير
          if (e.key.type === 'Identifier') {
            d[e.key.name] = await this.exec(e.value, env);
          } else {
            d[String(await this.exec(e.key, env))] = await this.exec(e.value, env);
          }
        }
        return d;
      }

      case 'ConditionalExpr': {
        const cond = await this.exec(node.condition, env);
        if (this.truthy(cond)) {
          return this.exec(node.thenExpr, env);
        } else {
          return this.exec(node.elseExpr, env);
        }
      }

      case 'ArrowFunctionExpr': {
        const fn: ESharpFunction = {
          __type: 'function',
          name: '(anonymous)',
          params: node.params,
          body: node.body,
          closure: env
        };
        return fn;
      }

      case 'IndexAccess': {
        const obj = await this.exec(node.object, env);
        const idx = await this.exec(node.index, env);
        if (Array.isArray(obj)) return obj[Number(idx)] ?? null;
        if (typeof obj === 'string') return obj[Number(idx)] ?? '';
        if (obj && typeof obj === 'object')
          return (obj as Record<string, unknown>)[String(idx)] ?? null;
        throw new ESharpError(`Can't index ${this.str(obj)}`);
      }

      case 'AssignProperty': {
        const obj = await this.exec(node.object, env);
        const v = await this.exec(node.value, env);
        if (obj && typeof obj === 'object' && (obj as ESharpInstance).__type === 'instance') {
          (obj as ESharpInstance).props[node.property] = v;
          return v;
        }

        if (obj && typeof obj === 'object') {
          (obj as Record<string, unknown>)[node.property] = v;
          return v;
        }
        throw new ESharpError(`Can't set '${node.property}' on ${this.str(obj)}`);
      }

      case 'AssignIndex': {
        const obj = await this.exec(node.object, env);
        const idx = await this.exec(node.index, env);
        const v = await this.exec(node.value, env);
        if (Array.isArray(obj)) {
          obj[Number(idx)] = v;
          return v;
        }
        if (obj && typeof obj === 'object') {
          (obj as Record<string, unknown>)[String(idx)] = v;
          return v;
        }
        throw new ESharpError(`Can't index-assign ${this.str(obj)}`);
      }

      case 'BinaryExpr':
        return this.binary(
          node.op,
          await this.exec(node.left, env),
          await this.exec(node.right, env)
        );

      case 'UnaryExpr': {
        const val = await this.exec(node.operand, env);
        if (node.op === '-') return -Number(val);
        if (node.op === 'not') return !this.truthy(val);
        throw new ESharpError(`Unknown op '${node.op}'`);
      }

      default:
        throw new ESharpError(`Unknown: ${(node as ASTNode).type}`);
    }
  }

  private binary(op: string, l: unknown, r: unknown): unknown {
    if (op === '+')
      return typeof l === 'string' || typeof r === 'string'
        ? String(l) + String(r)
        : Number(l) + Number(r);
    if (op === '-') return Number(l) - Number(r);
    if (op === '*') return Number(l) * Number(r);
    if (op === '/') {
      if (Number(r) === 0) throw new ESharpError('Division by zero!');
      return Number(l) / Number(r);
    }
    if (op === '%') return Number(l) % Number(r);
    if (op === '==') return l === r;
    if (op === '!=') return l !== r;
    if (op === '<') return Number(l) < Number(r);
    if (op === '>') return Number(l) > Number(r);
    if (op === '<=') return Number(l) <= Number(r);
    if (op === '>=') return Number(l) >= Number(r);
    if (op === 'and') return this.truthy(l) && this.truthy(r);
    if (op === 'or') return this.truthy(l) || this.truthy(r);
    throw new ESharpError(`Unknown op '${op}'`);
  }

  private truthy(v: unknown) {
    return v !== null && v !== undefined && v !== false && v !== 0 && v !== '';
  }

  private findMethod(cls: ESharpClass, name: string): { params: string[]; body: ASTNode[] } | null {
    if (cls.methods.has(name)) return cls.methods.get(name)!;
    if (cls.parent) {
      const p = this.classes.get(cls.parent);
      if (p) return this.findMethod(p, name);
    }
    return null;
  }

  private async instMethod(
    inst: ESharpInstance,
    method: string,
    args: unknown[],
    env: Environment
  ): Promise<unknown> {
    const cls = this.classes.get(inst.className);
    if (!cls) throw new ESharpError(`Class '${inst.className}' not found`);
    const m = this.findMethod(cls, method);
    if (!m) throw new ESharpError(`No method '${method}' on '${inst.className}'`);
    const e = new Environment(env);
    e.define('this', inst);
    m.params.forEach((p, i) => e.define(p, args[i] ?? null));
    try {
      await this.block(m.body, e);
    } catch (err) {
      if (err instanceof ReturnSignal) return err.value;
      throw err;
    }
    return null;
  }

  private arrMethod(arr: unknown[], m: string, args: unknown[]): unknown {
    if (m === 'push') {
      (arr as unknown[]).push(args[0]);
      return arr;
    }
    if (m === 'pop') return (arr as unknown[]).pop() ?? null;
    if (m === 'join') return (arr as unknown[]).join(String(args[0] ?? ','));
    if (m === 'reverse') return [...(arr as unknown[])].reverse();
    // خلينا sort هنا زي sort العالمية، بترتب أرقام
    if (m === 'sort') {
      return [...(arr as any[])].sort((a, b) => Number(a) - Number(b));
    }
    // ضفنا دالة الحذف هنا برضه عشان تبقى موجودة كـ method
    if (m === 'remove') {
      const val = args[0];
      const index = (arr as unknown[]).indexOf(val);
      if (index > -1) {
        (arr as unknown[]).splice(index, 1);
      }
      return arr;
    }
    throw new ESharpError(`No list method '${m}'`);
  }

  private strMethod(s: string, m: string, args: unknown[]): unknown {
    if (m === 'upper') return s.toUpperCase();
    if (m === 'lower') return s.toLowerCase();
    if (m === 'trim') return s.trim();
    if (m === 'split') return s.split(String(args[0] ?? ' '));
    if (m === 'has') return s.includes(String(args[0])); // has هي نفسها includes
    if (m === 'startsWith') return s.startsWith(String(args[0]));
    if (m === 'endsWith') return s.endsWith(String(args[0]));
    if (m === 'replace') return s.replace(String(args[0]), String(args[1]));
    if (m === 'slice')
      return s.slice(Number(args[0]), args[1] != null ? Number(args[1]) : undefined);
    throw new ESharpError(`No string method '${m}'`);
  }
} 
