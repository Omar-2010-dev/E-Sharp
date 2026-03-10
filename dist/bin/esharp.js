#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const interpreter_1 = require("../core/interpreter");
const filePath = process.argv[2];
if (!filePath) {
    console.log('Usage: esharp <file.es>');
    process.exit(1);
}
if (!fs.existsSync(filePath)) {
    console.log('File not found:', filePath);
    process.exit(1);
}
const code = fs.readFileSync(path.resolve(filePath), 'utf8');
// عملنا دالة async فورية التنفيذ (IIFE) عشان نقدر نستخدم await
(async () => {
    try {
        const interpreter = new interpreter_1.Interpreter();
        // ضفنا await عشان نستنى النتيجة لأن الدالة run بقت async
        const output = await interpreter.run(code);
        output.forEach((line) => {
            console.log(line.text);
        });
    }
    catch (err) {
        console.error('Runtime Error:', err.message);
    }
})();
