#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import { Interpreter } from '../core/interpreter';

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
    const interpreter = new Interpreter();
    // ضفنا await عشان نستنى النتيجة لأن الدالة run بقت async
    const output = await interpreter.run(code);

    output.forEach((line) => {
      console.log(line.text);
    });
  } catch (err: any) {
    console.error('Runtime Error:', err.message);
  }
})();
