"use strict";
(() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
    get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
  }) : x)(function(x) {
    if (typeof require !== "undefined") return require.apply(this, arguments);
    throw Error('Dynamic require of "' + x + '" is not supported');
  });
  var __esm = (fn, res) => function __init() {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  };
  var __commonJS = (cb, mod) => function __require2() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };

  // core/lexer.ts
  function tokenize(source) {
    const tokens = [];
    let pos = 0;
    let line = 1;
    const peek = () => pos < source.length ? source[pos] : "\0";
    while (pos < source.length) {
      const ch = source[pos];
      if (ch === " " || ch === "	" || ch === "\r" || ch === "\n") {
        if (ch === "\n") line++;
        pos++;
        continue;
      }
      if (ch === "/" && source[pos + 1] === "/") {
        while (pos < source.length && source[pos] !== "\n") pos++;
        continue;
      }
      if (ch >= "0" && ch <= "9") {
        let num = "";
        while (pos < source.length && (source[pos] >= "0" && source[pos] <= "9" || source[pos] === ".")) num += source[pos++];
        tokens.push({ type: 0 /* NUMBER */, value: num, line });
        continue;
      }
      if (ch === '"' || ch === "'") {
        const q = source[pos++];
        let str = "";
        while (pos < source.length && source[pos] !== q) {
          if (source[pos] === "\\") {
            pos++;
            str += source[pos++];
          } else str += source[pos++];
        }
        if (pos < source.length) pos++;
        tokens.push({ type: 1 /* STRING */, value: str, line });
        continue;
      }
      if (ch >= "a" && ch <= "z" || ch >= "A" && ch <= "Z" || ch === "_") {
        let id = "";
        while (pos < source.length && (source[pos] >= "a" && source[pos] <= "z" || source[pos] >= "A" && source[pos] <= "Z" || source[pos] >= "0" && source[pos] <= "9" || source[pos] === "_")) id += source[pos++];
        const lower = id.toLowerCase();
        if (lower === "divided") {
          const saved = pos;
          while (pos < source.length && source[pos] === " ") pos++;
          let next = "";
          while (pos < source.length && source[pos] >= "a" && source[pos] <= "z") next += source[pos++];
          if (next.toLowerCase() === "by") {
            tokens.push({ type: 7 /* SLASH */, value: "divided by", line });
            continue;
          }
          pos = saved;
        }
        if (lower === "less" || lower === "greater" || lower === "not" || lower === "equals") {
          const saved = pos;
          while (pos < source.length && source[pos] === " ") pos++;
          let next = "";
          while (pos < source.length && source[pos] >= "a" && source[pos] <= "z") next += source[pos++];
          const nl = next.toLowerCase();
          if (lower === "less" && nl === "than") {
            tokens.push({ type: 17 /* LT */, value: "less than", line });
            continue;
          }
          if (lower === "greater" && nl === "than") {
            tokens.push({ type: 18 /* GT */, value: "greater than", line });
            continue;
          }
          if (lower === "not" && nl === "equals") {
            tokens.push({ type: 16 /* NEQ */, value: "not equals", line });
            continue;
          }
          if ((lower === "greater" || lower === "less") && nl === "or") {
            const saved2 = pos;
            while (pos < source.length && source[pos] === " ") pos++;
            let eq = "";
            while (pos < source.length && source[pos] >= "a" && source[pos] <= "z") eq += source[pos++];
            if (eq.toLowerCase() === "equal") {
              tokens.push({ type: lower === "greater" ? 20 /* GTE */ : 19 /* LTE */, value: `${lower} or equal`, line });
              continue;
            }
            pos = saved2;
          }
          if (lower === "equals") {
            tokens.push({ type: 15 /* EQ */, value: "equals", line });
            continue;
          }
          pos = saved;
        }
        const kw = KEYWORDS[lower];
        tokens.push({ type: kw !== void 0 ? kw : 3 /* IDENTIFIER */, value: kw !== void 0 ? lower : id, line });
        continue;
      }
      pos++;
      switch (ch) {
        case "?":
          tokens.push({ type: 54 /* QUESTION */, value: "?", line });
          break;
        case ".":
          tokens.push({ type: 33 /* DOT */, value: ".", line });
          break;
        case ",":
          tokens.push({ type: 25 /* COMMA */, value: ",", line });
          break;
        case "(":
          tokens.push({ type: 26 /* LPAREN */, value: "(", line });
          break;
        case ")":
          tokens.push({ type: 27 /* RPAREN */, value: ")", line });
          break;
        case "[":
          tokens.push({ type: 28 /* LBRACKET */, value: "[", line });
          break;
        case "]":
          tokens.push({ type: 29 /* RBRACKET */, value: "]", line });
          break;
        case "{":
          tokens.push({ type: 30 /* LBRACE */, value: "{", line });
          break;
        case "}":
          tokens.push({ type: 31 /* RBRACE */, value: "}", line });
          break;
        case ":":
          tokens.push({ type: 32 /* COLON */, value: ":", line });
          break;
        case "+":
          if (peek() === "+") {
            pos++;
            tokens.push({ type: 9 /* PLUSPLUS */, value: "++", line });
          } else if (peek() === "=") {
            pos++;
            tokens.push({ type: 11 /* PLUSEQ */, value: "+=", line });
          } else tokens.push({ type: 4 /* PLUS */, value: "+", line });
          break;
        case "-":
          if (peek() === "-") {
            pos++;
            tokens.push({ type: 10 /* MINUSMINUS */, value: "--", line });
          } else if (peek() === "=") {
            pos++;
            tokens.push({ type: 12 /* MINUSEQ */, value: "-=", line });
          } else tokens.push({ type: 5 /* MINUS */, value: "-", line });
          break;
        case "*":
          if (peek() === "=") {
            pos++;
            tokens.push({ type: 13 /* STAREQ */, value: "*=", line });
          } else tokens.push({ type: 6 /* STAR */, value: "*", line });
          break;
        case "/":
          if (peek() === "=") {
            pos++;
            tokens.push({ type: 14 /* SLASHEQ */, value: "/=", line });
          } else tokens.push({ type: 7 /* SLASH */, value: "/", line });
          break;
        case "%":
          tokens.push({ type: 8 /* PERCENT */, value: "%", line });
          break;
        case "=":
          if (peek() === "=") {
            pos++;
            tokens.push({ type: 15 /* EQ */, value: "==", line });
          } else tokens.push({ type: 24 /* ASSIGN */, value: "=", line });
          break;
        case "!":
          if (peek() === "=") {
            pos++;
            tokens.push({ type: 16 /* NEQ */, value: "!=", line });
          } else if (peek() === ">") {
            pos++;
            tokens.push({ type: 55 /* ARROW */, value: "=>", line });
          } else tokens.push({ type: 23 /* NOT */, value: "!", line });
          break;
        case "<":
          if (peek() === "=") {
            pos++;
            tokens.push({ type: 19 /* LTE */, value: "<=", line });
          } else tokens.push({ type: 17 /* LT */, value: "<", line });
          break;
        case ">":
          if (peek() === "=") {
            pos++;
            tokens.push({ type: 20 /* GTE */, value: ">=", line });
          } else tokens.push({ type: 18 /* GT */, value: ">", line });
          break;
        case "&":
          if (peek() === "&") {
            pos++;
            tokens.push({ type: 21 /* AND */, value: "&&", line });
          }
          break;
        case "|":
          if (peek() === "|") {
            pos++;
            tokens.push({ type: 22 /* OR */, value: "||", line });
          }
          break;
      }
    }
    tokens.push({ type: 56 /* EOF */, value: "", line });
    return tokens;
  }
  var TokenType, KEYWORDS;
  var init_lexer = __esm({
    "core/lexer.ts"() {
      "use strict";
      TokenType = /* @__PURE__ */ ((TokenType2) => {
        TokenType2[TokenType2["NUMBER"] = 0] = "NUMBER";
        TokenType2[TokenType2["STRING"] = 1] = "STRING";
        TokenType2[TokenType2["BOOLEAN"] = 2] = "BOOLEAN";
        TokenType2[TokenType2["IDENTIFIER"] = 3] = "IDENTIFIER";
        TokenType2[TokenType2["PLUS"] = 4] = "PLUS";
        TokenType2[TokenType2["MINUS"] = 5] = "MINUS";
        TokenType2[TokenType2["STAR"] = 6] = "STAR";
        TokenType2[TokenType2["SLASH"] = 7] = "SLASH";
        TokenType2[TokenType2["PERCENT"] = 8] = "PERCENT";
        TokenType2[TokenType2["PLUSPLUS"] = 9] = "PLUSPLUS";
        TokenType2[TokenType2["MINUSMINUS"] = 10] = "MINUSMINUS";
        TokenType2[TokenType2["PLUSEQ"] = 11] = "PLUSEQ";
        TokenType2[TokenType2["MINUSEQ"] = 12] = "MINUSEQ";
        TokenType2[TokenType2["STAREQ"] = 13] = "STAREQ";
        TokenType2[TokenType2["SLASHEQ"] = 14] = "SLASHEQ";
        TokenType2[TokenType2["EQ"] = 15] = "EQ";
        TokenType2[TokenType2["NEQ"] = 16] = "NEQ";
        TokenType2[TokenType2["LT"] = 17] = "LT";
        TokenType2[TokenType2["GT"] = 18] = "GT";
        TokenType2[TokenType2["LTE"] = 19] = "LTE";
        TokenType2[TokenType2["GTE"] = 20] = "GTE";
        TokenType2[TokenType2["AND"] = 21] = "AND";
        TokenType2[TokenType2["OR"] = 22] = "OR";
        TokenType2[TokenType2["NOT"] = 23] = "NOT";
        TokenType2[TokenType2["ASSIGN"] = 24] = "ASSIGN";
        TokenType2[TokenType2["COMMA"] = 25] = "COMMA";
        TokenType2[TokenType2["LPAREN"] = 26] = "LPAREN";
        TokenType2[TokenType2["RPAREN"] = 27] = "RPAREN";
        TokenType2[TokenType2["LBRACKET"] = 28] = "LBRACKET";
        TokenType2[TokenType2["RBRACKET"] = 29] = "RBRACKET";
        TokenType2[TokenType2["LBRACE"] = 30] = "LBRACE";
        TokenType2[TokenType2["RBRACE"] = 31] = "RBRACE";
        TokenType2[TokenType2["COLON"] = 32] = "COLON";
        TokenType2[TokenType2["DOT"] = 33] = "DOT";
        TokenType2[TokenType2["SAY"] = 34] = "SAY";
        TokenType2[TokenType2["ASK"] = 35] = "ASK";
        TokenType2[TokenType2["IF"] = 36] = "IF";
        TokenType2[TokenType2["ELSE"] = 37] = "ELSE";
        TokenType2[TokenType2["WHILE"] = 38] = "WHILE";
        TokenType2[TokenType2["LOOP"] = 39] = "LOOP";
        TokenType2[TokenType2["FOR"] = 40] = "FOR";
        TokenType2[TokenType2["IN"] = 41] = "IN";
        TokenType2[TokenType2["FUNC"] = 42] = "FUNC";
        TokenType2[TokenType2["RETURN"] = 43] = "RETURN";
        TokenType2[TokenType2["CLASS"] = 44] = "CLASS";
        TokenType2[TokenType2["NEW"] = 45] = "NEW";
        TokenType2[TokenType2["THIS"] = 46] = "THIS";
        TokenType2[TokenType2["EXTENDS"] = 47] = "EXTENDS";
        TokenType2[TokenType2["TRY"] = 48] = "TRY";
        TokenType2[TokenType2["CATCH"] = 49] = "CATCH";
        TokenType2[TokenType2["END"] = 50] = "END";
        TokenType2[TokenType2["TRUE"] = 51] = "TRUE";
        TokenType2[TokenType2["FALSE"] = 52] = "FALSE";
        TokenType2[TokenType2["NOTHING"] = 53] = "NOTHING";
        TokenType2[TokenType2["QUESTION"] = 54] = "QUESTION";
        TokenType2[TokenType2["ARROW"] = 55] = "ARROW";
        TokenType2[TokenType2["EOF"] = 56] = "EOF";
        return TokenType2;
      })(TokenType || {});
      KEYWORDS = {
        say: 34 /* SAY */,
        ask: 35 /* ASK */,
        if: 36 /* IF */,
        else: 37 /* ELSE */,
        while: 38 /* WHILE */,
        loop: 39 /* LOOP */,
        for: 40 /* FOR */,
        in: 41 /* IN */,
        func: 42 /* FUNC */,
        return: 43 /* RETURN */,
        class: 44 /* CLASS */,
        new: 45 /* NEW */,
        this: 46 /* THIS */,
        extends: 47 /* EXTENDS */,
        try: 48 /* TRY */,
        catch: 49 /* CATCH */,
        end: 50 /* END */,
        true: 51 /* TRUE */,
        false: 52 /* FALSE */,
        nothing: 53 /* NOTHING */,
        and: 21 /* AND */,
        or: 22 /* OR */,
        not: 23 /* NOT */,
        plus: 4 /* PLUS */,
        minus: 5 /* MINUS */,
        mod: 8 /* PERCENT */,
        times: 6 /* STAR */
      };
    }
  });

  // core/parser.ts
  function parse(source) {
    const tokens = tokenize(source);
    let pos = 0;
    const current = () => tokens[pos] || { type: 56 /* EOF */, value: "", line: 0 };
    const peek = (offset = 0) => tokens[pos + offset] || { type: 56 /* EOF */, value: "", line: 0 };
    const advance = () => tokens[pos++];
    const expect = (type, msg) => {
      const t = current();
      if (t.type !== type) throw new Error(`Line ${t.line}: Expected ${msg || TokenType[type]} but got '${t.value}'`);
      return advance();
    };
    const match = (type) => {
      if (current().type === type) {
        advance();
        return true;
      }
      return false;
    };
    function parseProgram() {
      const body = [];
      while (current().type !== 56 /* EOF */) {
        body.push(parseStatement());
      }
      return { type: "Program", body };
    }
    function isArrowCandidate() {
      if (current().type !== 26 /* LPAREN */) return false;
      let parenLevel = 1;
      let i = pos + 1;
      while (i < tokens.length && parenLevel > 0) {
        if (tokens[i].type === 26 /* LPAREN */) parenLevel++;
        if (tokens[i].type === 27 /* RPAREN */) parenLevel--;
        i++;
      }
      return tokens[i]?.type === 55 /* ARROW */;
    }
    function parseArrowFunction() {
      expect(26 /* LPAREN */, '"("');
      const params = [];
      if (current().type !== 27 /* RPAREN */) {
        params.push(expect(3 /* IDENTIFIER */, "parameter").value);
        while (match(25 /* COMMA */)) {
          params.push(expect(3 /* IDENTIFIER */, "parameter").value);
        }
      }
      expect(27 /* RPAREN */, '")"');
      expect(55 /* ARROW */, '"=>"');
      let body;
      if (current().type === 30 /* LBRACE */) {
        body = parseBraceBlock();
      } else {
        body = [{ type: "ReturnStatement", value: parseExpression() }];
      }
      return { type: "ArrowFunctionExpr", params, body };
    }
    function parseBraceBlock() {
      expect(30 /* LBRACE */, '"{"');
      const body = [];
      while (current().type !== 31 /* RBRACE */ && current().type !== 56 /* EOF */) {
        body.push(parseStatement());
      }
      expect(31 /* RBRACE */, '"}"');
      return body;
    }
    function parseStatement() {
      const t = current();
      if (t.type === 34 /* SAY */) return parseSay();
      if (t.type === 36 /* IF */) return parseIf();
      if (t.type === 38 /* WHILE */) return parseWhile();
      if (t.type === 39 /* LOOP */) return parseLoop();
      if (t.type === 40 /* FOR */) return parseFor();
      if (t.type === 42 /* FUNC */) return parseFunc();
      if (t.type === 44 /* CLASS */) return parseClass();
      if (t.type === 43 /* RETURN */) return parseReturn();
      if (t.type === 48 /* TRY */) return parseTry();
      if (t.type === 46 /* THIS */ && peek(1).type === 33 /* DOT */ && peek(2).type === 3 /* IDENTIFIER */ && peek(3).type === 24 /* ASSIGN */) {
        advance();
        advance();
        const prop = advance().value;
        advance();
        const value = parseExpression();
        return { type: "AssignProperty", object: { type: "ThisExpr" }, property: prop, value };
      }
      if (t.type === 3 /* IDENTIFIER */ && (peek(1).type === 9 /* PLUSPLUS */ || peek(1).type === 10 /* MINUSMINUS */)) {
        const name = advance().value;
        const op = advance().type === 9 /* PLUSPLUS */ ? "+" : "-";
        return { type: "Assignment", name, value: { type: "BinaryExpr", op, left: { type: "Identifier", name }, right: { type: "NumberLiteral", value: 1 } } };
      }
      if (t.type === 3 /* IDENTIFIER */ && [11 /* PLUSEQ */, 12 /* MINUSEQ */, 13 /* STAREQ */, 14 /* SLASHEQ */].includes(peek(1).type)) {
        const name = advance().value;
        const opToken = advance();
        const op = opToken.type === 11 /* PLUSEQ */ ? "+" : opToken.type === 12 /* MINUSEQ */ ? "-" : opToken.type === 13 /* STAREQ */ ? "*" : "/";
        const value = parseExpression();
        return { type: "Assignment", name, value: { type: "BinaryExpr", op, left: { type: "Identifier", name }, right: value } };
      }
      if (t.type === 3 /* IDENTIFIER */ && peek(1).type === 24 /* ASSIGN */) {
        const name = advance().value;
        advance();
        const value = parseExpression();
        return { type: "Assignment", name, value };
      }
      if (t.type === 3 /* IDENTIFIER */ && peek(1).type === 33 /* DOT */ && peek(2).type === 3 /* IDENTIFIER */ && peek(3).type === 24 /* ASSIGN */) {
        const name = advance().value;
        advance();
        const prop = advance().value;
        advance();
        const value = parseExpression();
        return { type: "AssignProperty", object: { type: "Identifier", name }, property: prop, value };
      }
      if (t.type === 3 /* IDENTIFIER */ && peek(1).type === 28 /* LBRACKET */) {
        const name = advance().value;
        advance();
        const index = parseExpression();
        expect(29 /* RBRACKET */, '"]"');
        if (match(24 /* ASSIGN */)) {
          const value = parseExpression();
          return { type: "AssignIndex", object: { type: "Identifier", name }, index, value };
        }
        let expr = { type: "IndexAccess", object: { type: "Identifier", name }, index };
        expr = parsePostfixContinue(expr);
        return expr;
      }
      return parseExpressionStatement();
    }
    function parseSay() {
      advance();
      return { type: "SayStatement", value: parseExpression() };
    }
    function parseIf() {
      advance();
      const condition = parseExpression();
      const thenBody = parseBraceBlock();
      let elseBody = [];
      if (match(37 /* ELSE */)) {
        if (current().type === 36 /* IF */) {
          elseBody = [parseIf()];
        } else {
          elseBody = parseBraceBlock();
        }
      }
      return { type: "IfStatement", condition, thenBody, elseBody };
    }
    function parseWhile() {
      advance();
      const condition = parseExpression();
      const body = parseBraceBlock();
      return { type: "WhileStatement", condition, body };
    }
    function parseLoop() {
      advance();
      const count = parseExpression();
      const body = parseBraceBlock();
      return { type: "LoopStatement", count, body };
    }
    function parseFor() {
      advance();
      const varName = expect(3 /* IDENTIFIER */, "variable name").value;
      expect(41 /* IN */, '"in"');
      const iterable = parseExpression();
      const body = parseBraceBlock();
      return { type: "ForInStatement", varName, iterable, body };
    }
    function parseFunc() {
      advance();
      const name = expect(3 /* IDENTIFIER */, "function name").value;
      expect(26 /* LPAREN */, '"("');
      const params = [];
      if (current().type !== 27 /* RPAREN */) {
        params.push(expect(3 /* IDENTIFIER */, "parameter").value);
        while (match(25 /* COMMA */)) params.push(expect(3 /* IDENTIFIER */, "parameter").value);
      }
      expect(27 /* RPAREN */, '")"');
      const body = parseBraceBlock();
      return { type: "FunctionDef", name, params, body };
    }
    function parseClass() {
      advance();
      const name = expect(3 /* IDENTIFIER */, "class name").value;
      let parent = null;
      if (match(47 /* EXTENDS */)) parent = expect(3 /* IDENTIFIER */, "parent class").value;
      expect(30 /* LBRACE */, '"{"');
      const methods = [];
      while (current().type !== 31 /* RBRACE */ && current().type !== 56 /* EOF */) {
        if (current().type === 42 /* FUNC */) {
          advance();
          const mname = expect(3 /* IDENTIFIER */, "method name").value;
          expect(26 /* LPAREN */, '"("');
          const params = [];
          if (current().type !== 27 /* RPAREN */) {
            params.push(expect(3 /* IDENTIFIER */, "parameter").value);
            while (match(25 /* COMMA */)) params.push(expect(3 /* IDENTIFIER */, "parameter").value);
          }
          expect(27 /* RPAREN */, '")"');
          const body = parseBraceBlock();
          methods.push({ type: "FunctionDef", name: mname, params, body });
        } else {
          throw new Error(`Line ${current().line}: Expected 'func' inside class, got '${current().value}'`);
        }
      }
      expect(31 /* RBRACE */, '"}"');
      return { type: "ClassDef", name, parent, methods };
    }
    function parseReturn() {
      advance();
      const t = current();
      if (t.type === 31 /* RBRACE */ || t.type === 56 /* EOF */) return { type: "ReturnStatement", value: null };
      return { type: "ReturnStatement", value: parseExpression() };
    }
    function parseTry() {
      advance();
      const tryBody = parseBraceBlock();
      expect(49 /* CATCH */, '"catch"');
      let errorVar = "err";
      if (current().type === 3 /* IDENTIFIER */) errorVar = advance().value;
      const catchBody = parseBraceBlock();
      return { type: "TryStatement", tryBody, errorVar, catchBody };
    }
    function parseExpressionStatement() {
      return parseExpression();
    }
    function parseExpression() {
      return parseConditional();
    }
    function parseConditional() {
      let expr = parseOr();
      if (match(54 /* QUESTION */)) {
        const thenExpr = parseExpression();
        expect(32 /* COLON */, '":" for ternary operator');
        const elseExpr = parseConditional();
        return { type: "ConditionalExpr", condition: expr, thenExpr, elseExpr };
      }
      return expr;
    }
    function parseOr() {
      let left = parseAnd();
      while (current().type === 22 /* OR */) {
        advance();
        left = { type: "BinaryExpr", op: "or", left, right: parseAnd() };
      }
      return left;
    }
    function parseAnd() {
      let left = parseNot();
      while (current().type === 21 /* AND */) {
        advance();
        left = { type: "BinaryExpr", op: "and", left, right: parseNot() };
      }
      return left;
    }
    function parseNot() {
      if (current().type === 23 /* NOT */) {
        advance();
        return { type: "UnaryExpr", op: "not", operand: parseNot() };
      }
      return parseComparison();
    }
    function parseComparison() {
      let left = parseAddition();
      while ([15 /* EQ */, 16 /* NEQ */, 17 /* LT */, 18 /* GT */, 19 /* LTE */, 20 /* GTE */, 24 /* ASSIGN */].includes(current().type)) {
        const t = advance();
        const op = t.type === 15 /* EQ */ || t.type === 24 /* ASSIGN */ ? "==" : t.type === 16 /* NEQ */ ? "!=" : t.type === 17 /* LT */ ? "<" : t.type === 18 /* GT */ ? ">" : t.type === 19 /* LTE */ ? "<=" : ">=";
        left = { type: "BinaryExpr", op, left, right: parseAddition() };
      }
      return left;
    }
    function parseAddition() {
      let left = parseMultiplication();
      while (current().type === 4 /* PLUS */ || current().type === 5 /* MINUS */) {
        const op = advance().type === 4 /* PLUS */ ? "+" : "-";
        left = { type: "BinaryExpr", op, left, right: parseMultiplication() };
      }
      return left;
    }
    function parseMultiplication() {
      let left = parseUnary();
      while (current().type === 6 /* STAR */ || current().type === 7 /* SLASH */ || current().type === 8 /* PERCENT */) {
        const t = advance();
        const op = t.type === 6 /* STAR */ ? "*" : t.type === 7 /* SLASH */ ? "/" : "%";
        left = { type: "BinaryExpr", op, left, right: parseUnary() };
      }
      return left;
    }
    function parseUnary() {
      if (current().type === 5 /* MINUS */) {
        advance();
        return { type: "UnaryExpr", op: "-", operand: parseUnary() };
      }
      return parsePostfix();
    }
    function parsePostfixContinue(expr) {
      while (true) {
        if (current().type === 33 /* DOT */ && peek(1).type === 3 /* IDENTIFIER */) {
          advance();
          const prop = advance().value;
          if (current().type === 26 /* LPAREN */) {
            advance();
            const args = [];
            if (current().type !== 27 /* RPAREN */) {
              args.push(parseExpression());
              while (match(25 /* COMMA */)) args.push(parseExpression());
            }
            expect(27 /* RPAREN */, '")"');
            expr = { type: "MethodCall", object: expr, method: prop, args };
          } else {
            expr = { type: "PropertyAccess", object: expr, property: prop };
          }
        } else if (current().type === 28 /* LBRACKET */) {
          advance();
          const index = parseExpression();
          expect(29 /* RBRACKET */, '"]"');
          expr = { type: "IndexAccess", object: expr, index };
        } else break;
      }
      return expr;
    }
    function parsePostfix() {
      let expr = parsePrimary();
      return parsePostfixContinue(expr);
    }
    function parsePrimary() {
      const t = current();
      if (t.type === 0 /* NUMBER */) {
        advance();
        return { type: "NumberLiteral", value: parseFloat(t.value) };
      }
      if (t.type === 1 /* STRING */) {
        advance();
        return { type: "StringLiteral", value: t.value };
      }
      if (t.type === 51 /* TRUE */) {
        advance();
        return { type: "BooleanLiteral", value: true };
      }
      if (t.type === 52 /* FALSE */) {
        advance();
        return { type: "BooleanLiteral", value: false };
      }
      if (t.type === 53 /* NOTHING */) {
        advance();
        return { type: "NothingLiteral" };
      }
      if (t.type === 46 /* THIS */) {
        advance();
        return { type: "ThisExpr" };
      }
      if (t.type === 35 /* ASK */) {
        advance();
        return { type: "AskExpr", prompt: parseExpression() };
      }
      if (t.type === 45 /* NEW */) {
        advance();
        const cls = expect(3 /* IDENTIFIER */, "class name").value;
        const args = [];
        if (match(26 /* LPAREN */)) {
          if (current().type !== 27 /* RPAREN */) {
            args.push(parseExpression());
            while (match(25 /* COMMA */)) args.push(parseExpression());
          }
          expect(27 /* RPAREN */, '")"');
        }
        return { type: "NewExpr", className: cls, args };
      }
      if (t.type === 28 /* LBRACKET */) {
        advance();
        const elements = [];
        if (current().type !== 29 /* RBRACKET */) {
          elements.push(parseExpression());
          while (match(25 /* COMMA */)) elements.push(parseExpression());
        }
        expect(29 /* RBRACKET */, '"]"');
        return { type: "ArrayLiteral", elements };
      }
      if (t.type === 30 /* LBRACE */) {
        if (peek(1).type === 31 /* RBRACE */ || peek(1).type === 1 /* STRING */ && peek(2).type === 32 /* COLON */ || peek(1).type === 3 /* IDENTIFIER */ && peek(2).type === 32 /* COLON */) {
          advance();
          const entries = [];
          if (current().type !== 31 /* RBRACE */) {
            const key = parseExpression();
            expect(32 /* COLON */, '":"');
            const value = parseExpression();
            entries.push({ key, value });
            while (match(25 /* COMMA */)) {
              const k = parseExpression();
              expect(32 /* COLON */, '":"');
              const v = parseExpression();
              entries.push({ key: k, value: v });
            }
          }
          expect(31 /* RBRACE */, '"}"');
          return { type: "DictLiteral", entries };
        }
      }
      if (t.type === 26 /* LPAREN */) {
        if (isArrowCandidate()) {
          return parseArrowFunction();
        }
        advance();
        const expr = parseExpression();
        expect(27 /* RPAREN */, '")"');
        return expr;
      }
      if (t.type === 3 /* IDENTIFIER */) {
        const name = advance().value;
        if (current().type === 26 /* LPAREN */) {
          advance();
          const args = [];
          if (current().type !== 27 /* RPAREN */) {
            args.push(parseExpression());
            while (match(25 /* COMMA */)) args.push(parseExpression());
          }
          expect(27 /* RPAREN */, '")"');
          return { type: "FunctionCall", name, args };
        }
        return { type: "Identifier", name };
      }
      throw new Error(`Line ${t.line}: Unexpected '${t.value}'`);
    }
    return parseProgram();
  }
  var init_parser = __esm({
    "core/parser.ts"() {
      "use strict";
      init_lexer();
    }
  });

  // core/interpreter.ts
  function handleAsk(promptText) {
    if (isBrowser) {
      return window.prompt(promptText) || "";
    }
    process.stdout.write(promptText + " ");
    const buffer = Buffer.alloc(1024);
    try {
      const bytesRead = fs ? fs.readSync(0, buffer, 0, 1024, null) : 0;
      if (bytesRead === 0) return "";
      return buffer.toString("utf8", 0, bytesRead).replace(/[\r\n]/g, "").trim();
    } catch (e) {
      return "";
    }
  }
  var fs, isBrowser, ReturnSignal, ESharpError, ESharpElement, Environment, Interpreter;
  var init_interpreter = __esm({
    "core/interpreter.ts"() {
      "use strict";
      init_parser();
      try {
        fs = __require("fs");
      } catch (e) {
        fs = null;
      }
      isBrowser = typeof window !== "undefined" && typeof document !== "undefined";
      ReturnSignal = class {
        constructor(value) {
          this.value = value;
        }
      };
      ESharpError = class extends Error {
        constructor(msg) {
          super(msg);
          this.name = "E#";
        }
      };
      ESharpElement = class _ESharpElement {
        constructor(el) {
          this.el = el;
          this.__type = "element";
        }
        // دوال التعامل مع العنصر
        setText(txt) {
          this.el.textContent = txt;
        }
        getText() {
          return this.el.textContent || "";
        }
        setHtml(html) {
          this.el.innerHTML = html;
        }
        getHtml() {
          return this.el.innerHTML;
        }
        setValue(val) {
          this.el.value = val;
        }
        getValue() {
          return this.el.value;
        }
        // التعامل مع الـ Events
        on(event, handler, interpreter) {
          this.el.addEventListener(event, (e) => {
            const eventObj = {
              target: new _ESharpElement(e.target),
              key: e.key,
              x: e.clientX,
              y: e.clientY,
              stop: () => {
                e.preventDefault();
                e.stopPropagation();
              }
            };
            interpreter.callFunction(handler, [eventObj]);
          });
        }
        // الستايل
        style(prop, val) {
          this.el.style.setProperty(prop, val);
        }
        getStyle(prop) {
          return getComputedStyle(this.el).getPropertyValue(prop);
        }
        // الكلاسات
        addClass(cls) {
          this.el.classList.add(cls);
        }
        removeClass(cls) {
          this.el.classList.remove(cls);
        }
        toggleClass(cls) {
          this.el.classList.toggle(cls);
        }
        hasClass(cls) {
          return this.el.classList.contains(cls);
        }
        // التحكم في الشجرة (DOM Tree)
        append(child) {
          this.el.appendChild(child.el);
        }
        prepend(child) {
          this.el.prepend(child.el);
        }
        remove() {
          this.el.remove();
        }
        // الأنيميشن البسيط
        animate(props, duration) {
          const keyframes = {};
          for (const key in props) keyframes[key] = props[key];
          this.el.animate([keyframes], { duration: Number(duration), fill: "forwards" });
        }
        // المقارنة
        equals(other) {
          return this.el === other.el;
        }
      };
      Environment = class {
        constructor(parent = null) {
          this.parent = parent;
          this.vars = /* @__PURE__ */ new Map();
        }
        get(name) {
          if (this.vars.has(name)) return this.vars.get(name);
          if (this.parent) return this.parent.get(name);
          throw new ESharpError(`'${name}' is not defined`);
        }
        set(name, value) {
          if (!this.vars.has(name) && this.parent?.has(name)) this.parent.set(name, value);
          else this.vars.set(name, value);
        }
        has(name) {
          return this.vars.has(name) || (this.parent?.has(name) ?? false);
        }
        define(name, value) {
          this.vars.set(name, value);
        }
      };
      Interpreter = class {
        constructor() {
          this.output = [];
          this.classes = /* @__PURE__ */ new Map();
          this.steps = 0;
          this.maxSteps = 1e5;
          this.env = new Environment();
          this.builtins();
        }
        builtins() {
          const b = {
            // 📏 Length & Type
            length: (v) => typeof v === "string" ? v.length : Array.isArray(v) ? v.length : 0,
            type: (v) => {
              if (v === null) return "nothing";
              if (typeof v === "number") return "number";
              if (typeof v === "string") return "string";
              if (typeof v === "boolean") return "boolean";
              if (Array.isArray(v)) return "list";
              if (v?.__type === "instance") return "object";
              if (v instanceof ESharpElement) return "element";
              return "dict";
            },
            // ⏳ Wait Function
            wait: (ms) => {
              const milliseconds = Number(ms);
              if (isNaN(milliseconds)) return;
              const start = Date.now();
              while (Date.now() - start < milliseconds) {
              }
              return null;
            },
            // 🔤 String functions
            upper: (v) => String(v).toUpperCase(),
            lower: (v) => String(v).toLowerCase(),
            trim: (v) => String(v).trim(),
            reverse: (v) => {
              if (typeof v === "string") return v.split("").reverse().join("");
              if (Array.isArray(v)) return [...v].reverse();
              return v;
            },
            startsWith: (v, s) => String(v).startsWith(String(s)),
            endsWith: (v, s) => String(v).endsWith(String(s)),
            replace: (v, old, nw) => String(v).split(String(old)).join(String(nw)),
            slice: (v, a, b2) => {
              const s = Array.isArray(v) ? v : String(v);
              return s.slice(Number(a), b2 != null ? Number(b2) : void 0);
            },
            charAt: (v, i) => String(v).charAt(Number(i)),
            // 🔢 Conversion
            // صلحنا الأسماء عشان تبقى زي اللي في الإكستنشن بالظبط
            toNum: (v) => {
              const n = Number(v);
              if (isNaN(n)) throw new ESharpError(`Can't convert '${v}' to number`);
              return n;
            },
            toStr: (v) => this.str(v),
            // 🧮 Math
            round: (v) => Math.round(Number(v)),
            floor: (v) => Math.floor(Number(v)),
            ceil: (v) => Math.ceil(Number(v)),
            abs: (v) => Math.abs(Number(v)),
            max: (a, b2) => Math.max(Number(a), Number(b2)),
            min: (a, b2) => Math.min(Number(a), Number(b2)),
            sqrt: (v) => Math.sqrt(Number(v)),
            power: (a, b2) => Math.pow(Number(a), Number(b2)),
            add: (a, b2) => Number(a) + Number(b2),
            subtract: (a, b2) => Number(a) - Number(b2),
            multiply: (a, b2) => Number(a) * Number(b2),
            divide: (a, b2) => {
              if (Number(b2) === 0) throw new ESharpError("Division by zero!");
              return Number(a) / Number(b2);
            },
            sum: (...args) => {
              const arr = Array.isArray(args[0]) ? args[0] : args;
              return arr.reduce((a, b2) => Number(a) + Number(b2), 0);
            },
            average: (...args) => {
              const arr = Array.isArray(args[0]) ? args[0] : args;
              return arr.reduce((a, b2) => Number(a) + Number(b2), 0) / arr.length;
            },
            clamp: (v, lo, hi) => Math.min(Math.max(Number(v), Number(lo)), Number(hi)),
            isEven: (v) => Number(v) % 2 === 0,
            isOdd: (v) => Number(v) % 2 !== 0,
            // 🎲 Random
            random: (a, b2) => {
              if (a === void 0) return Math.random();
              return Math.floor(Math.random() * (Number(b2) - Number(a) + 1)) + Number(a);
            },
            rand: (a, b2) => Math.floor(Math.random() * (Number(b2) - Number(a) + 1)) + Number(a),
            randomize: (arr) => {
              if (!Array.isArray(arr)) throw new ESharpError("randomize needs a list");
              const shuffled = [...arr];
              for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
              }
              return shuffled;
            },
            pick: (arr) => {
              if (!Array.isArray(arr)) throw new ESharpError("pick needs a list");
              return arr[Math.floor(Math.random() * arr.length)] ?? null;
            },
            coinFlip: () => Math.random() < 0.5 ? "heads" : "tails",
            dice: () => Math.floor(Math.random() * 6) + 1,
            // 📦 List functions
            push: (arr, val) => {
              if (Array.isArray(arr)) {
                arr.push(val);
                return arr;
              }
              throw new ESharpError("push needs a list");
            },
            pop: (arr) => {
              if (Array.isArray(arr)) return arr.pop() ?? null;
              throw new ESharpError("pop needs a list");
            },
            join: (arr, sep) => Array.isArray(arr) ? arr.join(String(sep ?? ", ")) : "",
            split: (s, sep) => String(s).split(String(sep)),
            has: (c, i) => typeof c === "string" ? c.includes(String(i)) : Array.isArray(c) ? c.includes(i) : false,
            indexOf: (c, i) => {
              if (typeof c === "string") return c.indexOf(String(i));
              if (Array.isArray(c)) return c.indexOf(i);
              return -1;
            },
            sort: (arr) => {
              if (!Array.isArray(arr)) throw new ESharpError("sort needs a list");
              return [...arr].sort((a, b2) => Number(a) - Number(b2));
            },
            unique: (arr) => {
              if (!Array.isArray(arr)) throw new ESharpError("unique needs a list");
              return [...new Set(arr)];
            },
            flat: (arr) => {
              if (!Array.isArray(arr)) throw new ESharpError("flat needs a list");
              return arr.flat();
            },
            count: (arr, val) => {
              if (!Array.isArray(arr)) throw new ESharpError("count needs a list");
              return arr.filter((x) => x === val).length;
            },
            insert: (arr, i, val) => {
              if (!Array.isArray(arr)) throw new ESharpError("insert needs a list");
              arr.splice(Number(i), 0, val);
              return arr;
            },
            range: (a, b2) => {
              const start = b2 !== void 0 ? Number(a) : 0;
              const end = b2 !== void 0 ? Number(b2) : Number(a);
              const result = [];
              for (let i = start; i < end; i++) result.push(i);
              return result;
            },
            fill: (val, n) => Array(Number(n)).fill(val),
            zip: (a, b2) => {
              if (!Array.isArray(a) || !Array.isArray(b2)) throw new ESharpError("zip needs two lists");
              return a.map((v, i) => [v, b2[i] ?? null]);
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
            keys: (o) => o && typeof o === "object" && !Array.isArray(o) ? Object.keys(o) : [],
            values: (o) => o && typeof o === "object" && !Array.isArray(o) ? Object.values(o) : [],
            // 🎨 Fun & Emoji
            emoji: (name) => {
              const map = {
                happy: "\u{1F60A}",
                sad: "\u{1F622}",
                love: "\u2764\uFE0F",
                star: "\u2B50",
                fire: "\u{1F525}",
                rocket: "\u{1F680}",
                cool: "\u{1F60E}",
                party: "\u{1F389}",
                check: "\u2705",
                x: "\u274C",
                wave: "\u{1F44B}",
                thumbsUp: "\u{1F44D}",
                clap: "\u{1F44F}",
                think: "\u{1F914}",
                laugh: "\u{1F602}",
                heart: "\u{1F496}",
                sun: "\u2600\uFE0F",
                moon: "\u{1F319}",
                rain: "\u{1F327}\uFE0F",
                snow: "\u2744\uFE0F",
                cat: "\u{1F431}",
                dog: "\u{1F436}",
                fish: "\u{1F41F}",
                bird: "\u{1F426}",
                tree: "\u{1F333}",
                pizza: "\u{1F355}",
                apple: "\u{1F34E}",
                cake: "\u{1F382}",
                coffee: "\u2615",
                gem: "\u{1F48E}"
              };
              return map[String(name)] ?? "\u2753";
            },
            repeat_text: (text, n) => {
              return Array(Number(n)).fill(String(text)).join("");
            },
            progress: (current, total) => {
              const pct = Math.round(Number(current) / Number(total) * 10);
              return "\u2588".repeat(pct) + "\u2591".repeat(10 - pct) + ` ${Math.round(Number(current) / Number(total) * 100)}%`;
            },
            sparkle: (text) => `\u2728 ${text} \u2728`,
            banner: (text) => {
              const line = "\u2550".repeat(String(text).length + 4);
              return `\u2554${line}\u2557
\u2551  ${text}  \u2551
\u255A${line}\u255D`;
            },
            // 🕐 Time
            now: () => Date.now(),
            time: () => (/* @__PURE__ */ new Date()).toLocaleTimeString(),
            today: () => (/* @__PURE__ */ new Date()).toLocaleDateString(),
            // === 🌐 Web & DOM Built-ins (بتشتغل بس في المتصفح) ===
            // 1. Element Selection
            grab: (sel) => {
              if (!isBrowser) return null;
              const el = document.querySelector(String(sel));
              return el ? new ESharpElement(el) : null;
            },
            grabAll: (sel) => {
              if (!isBrowser) return [];
              const els = document.querySelectorAll(String(sel));
              return Array.from(els).map((e) => new ESharpElement(e));
            },
            grabId: (id) => {
              if (!isBrowser) return null;
              const el = document.getElementById(String(id));
              return el ? new ESharpElement(el) : null;
            },
            // 2. Element Creation
            create: (tag) => {
              if (!isBrowser) return null;
              return new ESharpElement(document.createElement(String(tag)));
            },
            // 3. Browser Dialogs
            alert: (msg) => isBrowser ? window.alert(String(msg)) : console.log("ALERT:", msg),
            confirm: (msg) => isBrowser ? window.confirm(String(msg)) : false,
            // 4. Storage (LocalStorage)
            save: (key, val) => isBrowser ? localStorage.setItem(String(key), JSON.stringify(val)) : null,
            load: (key) => {
              if (!isBrowser) return null;
              const val = localStorage.getItem(String(key));
              return val ? JSON.parse(val) : null;
            },
            // دالة remove الذكية: بتشتغل مع القوائم ومع التخزين
            remove: (a, b2) => {
              if (Array.isArray(a)) {
                const i = a.indexOf(b2);
                if (i !== -1) a.splice(i, 1);
                return a;
              }
              if (isBrowser) localStorage.removeItem(String(a));
              return null;
            },
            clearStorage: () => isBrowser ? localStorage.clear() : null,
            // 5. Timers
            // بنستخدم setTimeout بس بنخليها تقبل دالة E#
            delay: (ms, fn) => {
              if (!isBrowser) return;
              setTimeout(() => this.callFunction(fn, []), Number(ms));
            },
            // دالة repeat الذكية: بتشتغل كـ Timer أو تكرار نصوص
            repeat: (a, b2) => {
              if (b2 && typeof b2 === "object" && b2.__type === "function") {
                if (!isBrowser) return;
                return setInterval(() => this.callFunction(b2, []), Number(a));
              }
              return String(a).repeat(Number(b2));
            },
            stopTimer: (id) => isBrowser ? clearInterval(Number(id)) : null,
            // 6. HTTP Requests (Synchronous-like for simplicity)
            // عشان نحافظ على سهولة اللغة، هنستخدم XMLHttpRequest بشكل متزامن (Sync)
            // ده مش أحسن حاجة للأداء بس بيخلي الكود سهل جداً للمبتدئين
            fetchJSON: (url) => {
              if (!isBrowser) return null;
              const xhr = new XMLHttpRequest();
              xhr.open("GET", String(url), false);
              xhr.send(null);
              if (xhr.status >= 200 && xhr.status < 300) {
                return JSON.parse(xhr.responseText);
              }
              return null;
            },
            post: (url, data) => {
              if (!isBrowser) return null;
              const xhr = new XMLHttpRequest();
              xhr.open("POST", String(url), false);
              xhr.setRequestHeader("Content-Type", "application/json");
              xhr.send(JSON.stringify(data));
              return {
                status: xhr.status,
                ok: xhr.status >= 200 && xhr.status < 300,
                data: JSON.parse(xhr.responseText || "{}")
              };
            },
            // 7. CSS Injection
            addCSS: (css) => {
              if (!isBrowser) return;
              const style = document.createElement("style");
              style.textContent = String(css);
              document.head.appendChild(style);
            },
            // 8. Console
            log: (v) => console.log(v),
            warn: (v) => console.warn(v),
            error: (v) => console.error(v)
          };
          if (isBrowser) {
            this.env.define("body", new ESharpElement(document.body));
            this.env.define("head", new ESharpElement(document.head));
            this.env.define("window", { __type: "builtin", name: "window" });
          }
          for (const [k, fn] of Object.entries(b))
            this.env.define(k, { __type: "builtin", fn, name: k });
        }
        getOutput() {
          return this.output;
        }
        str(v) {
          if (v === null || v === void 0) return "nothing";
          if (typeof v === "boolean") return v ? "true" : "false";
          if (Array.isArray(v)) return "[" + v.map((x) => this.str(x)).join(", ") + "]";
          if (typeof v === "object") {
            const o = v;
            if (o.__type === "instance") return `<${v.className}>`;
            if (v instanceof ESharpElement)
              return `<${v.el.tagName.toLowerCase()}#${v.el.id || ""}.${v.el.className.replace(/ /g, ".")}>`;
            if (o.__type === "function") return `<func ${v.name}>`;
            if (o.__type === "builtin") return `<${o.name}>`;
            return "{" + Object.entries(o).map(([k, v2]) => `${k}: ${this.str(v2)}`).join(", ") + "}";
          }
          return String(v);
        }
        // دالة مساعدة لتشغيل دوال E# من الـ JS (للـ Events والـ Timers)
        callFunction(fn, args) {
          if (!fn || typeof fn !== "object") return;
          if (fn.__type === "function") {
            const f = fn;
            const e = new Environment(f.closure);
            f.params.forEach((p, i) => e.define(p, args[i] ?? null));
            try {
              this.block(f.body, e);
            } catch (err) {
              if (err instanceof ReturnSignal) return;
              console.error(err);
            }
          }
        }
        run(source) {
          this.output = [];
          this.steps = 0;
          try {
            const ast = parse(source);
            this.block(ast.body, this.env);
          } catch (e) {
            if (!(e instanceof ReturnSignal))
              this.output.push({ text: String(e.message || e), type: "error" });
          }
          return this.output;
        }
        check() {
          if (++this.steps > this.maxSteps) throw new ESharpError("Too many steps (infinite loop?)");
        }
        block(stmts, env) {
          let r = null;
          for (const s of stmts) {
            this.check();
            r = this.exec(s, env);
          }
          return r;
        }
        exec(node, env) {
          this.check();
          switch (node.type) {
            case "Program":
              return this.block(node.body, env);
            case "NumberLiteral":
              return node.value;
            case "StringLiteral":
              return node.value;
            case "BooleanLiteral":
              return node.value;
            case "NothingLiteral":
              return null;
            case "ThisExpr":
              return env.get("this");
            case "Identifier":
              return env.get(node.name);
            case "Assignment": {
              const v = this.exec(node.value, env);
              env.set(node.name, v);
              return v;
            }
            case "SayStatement": {
              const v = this.exec(node.value, env);
              const textToPrint = this.str(v);
              console.log(textToPrint);
              return null;
            }
            case "AskExpr": {
              const p = this.str(this.exec(node.prompt, env));
              return handleAsk(p);
            }
            case "IfStatement": {
              if (this.truthy(this.exec(node.condition, env))) return this.block(node.thenBody, env);
              return this.block(node.elseBody, env);
            }
            case "WhileStatement": {
              while (this.truthy(this.exec(node.condition, env))) {
                this.check();
                this.block(node.body, env);
              }
              return null;
            }
            case "LoopStatement": {
              const n = Number(this.exec(node.count, env));
              for (let i = 0; i < n; i++) {
                this.check();
                this.block(node.body, env);
              }
              return null;
            }
            case "ForInStatement": {
              const iterable = this.exec(node.iterable, env);
              if (Array.isArray(iterable)) {
                for (const item of iterable) {
                  this.check();
                  env.set(node.varName, item);
                  this.block(node.body, env);
                }
              } else if (typeof iterable === "string") {
                for (const ch of iterable) {
                  this.check();
                  env.set(node.varName, ch);
                  this.block(node.body, env);
                }
              } else {
                throw new ESharpError("for..in needs a list or string");
              }
              return null;
            }
            case "FunctionDef": {
              const fn = {
                __type: "function",
                name: node.name,
                params: node.params,
                body: node.body,
                closure: env
              };
              env.define(node.name, fn);
              return fn;
            }
            case "ReturnStatement":
              throw new ReturnSignal(node.value ? this.exec(node.value, env) : null);
            case "FunctionCall": {
              const fn = env.get(node.name);
              if (!fn || typeof fn !== "object")
                throw new ESharpError(`'${node.name}' is not a function`);
              const args = node.args.map((a) => this.exec(a, env));
              if (fn.__type === "builtin") return fn.fn(...args);
              if (fn.__type === "function") {
                const f = fn;
                const e = new Environment(f.closure);
                f.params.forEach((p, i) => e.define(p, args[i] ?? null));
                try {
                  this.block(f.body, e);
                } catch (err) {
                  if (err instanceof ReturnSignal) return err.value;
                  throw err;
                }
                return null;
              }
              throw new ESharpError(`'${node.name}' is not callable`);
            }
            case "MethodCall": {
              const obj = this.exec(node.object, env);
              const args = node.args.map((a) => this.exec(a, env));
              if (Array.isArray(obj)) return this.arrMethod(obj, node.method, args);
              if (typeof obj === "string") return this.strMethod(obj, node.method, args);
              if (obj && typeof obj === "object" && obj.__type === "instance")
                return this.instMethod(obj, node.method, args, env);
              if (obj instanceof ESharpElement) {
                return this.elementMethod(obj, node.method, args, env);
              }
              throw new ESharpError(`Can't call '${node.method}' on ${this.str(obj)}`);
            }
            case "PropertyAccess": {
              const obj = this.exec(node.object, env);
              if (obj && typeof obj === "object" && obj.__type === "instance")
                return obj.props[node.property] ?? null;
              if (obj && typeof obj === "object" && !Array.isArray(obj))
                return obj[node.property] ?? null;
              if (obj instanceof ESharpElement) {
                const el = obj;
                if (node.property === "text") return el.getText();
                if (node.property === "html") return el.getHtml();
                if (node.property === "value") return el.getValue();
                if (node.property === "id") return el.el.id;
              }
              if (Array.isArray(obj) && node.property === "length") return obj.length;
              if (typeof obj === "string" && node.property === "length") return obj.length;
              throw new ESharpError(`Can't access '${node.property}' on ${this.str(obj)}`);
            }
            case "ClassDef": {
              const methods = /* @__PURE__ */ new Map();
              for (const m of node.methods)
                if (m.type === "FunctionDef") methods.set(m.name, { params: m.params, body: m.body });
              this.classes.set(node.name, { name: node.name, parent: node.parent, methods });
              return null;
            }
            case "NewExpr": {
              const cls = this.classes.get(node.className);
              if (!cls) throw new ESharpError(`Class '${node.className}' not found`);
              const inst = { __type: "instance", className: node.className, props: {} };
              const init = this.findMethod(cls, "init");
              if (init) {
                const args = node.args.map((a) => this.exec(a, env));
                const e = new Environment(env);
                e.define("this", inst);
                init.params.forEach((p, i) => e.define(p, args[i] ?? null));
                try {
                  this.block(init.body, e);
                } catch (err) {
                  if (!(err instanceof ReturnSignal)) throw err;
                }
              }
              return inst;
            }
            case "TryStatement": {
              try {
                return this.block(node.tryBody, env);
              } catch (e) {
                if (e instanceof ReturnSignal) throw e;
                const ce = new Environment(env);
                ce.define(node.errorVar, String(e.message || e));
                return this.block(node.catchBody, ce);
              }
            }
            case "ArrayLiteral":
              return node.elements.map((e) => this.exec(e, env));
            case "DictLiteral": {
              const d = {};
              for (const e of node.entries) d[String(this.exec(e.key, env))] = this.exec(e.value, env);
              return d;
            }
            // === تنفيذ الإضافات الجديدة ===
            case "ConditionalExpr": {
              const cond = this.exec(node.condition, env);
              if (this.truthy(cond)) {
                return this.exec(node.thenExpr, env);
              } else {
                return this.exec(node.elseExpr, env);
              }
            }
            case "ArrowFunctionExpr": {
              const fn = {
                __type: "function",
                name: "(anonymous)",
                // دالة بدون اسم
                params: node.params,
                body: node.body,
                closure: env
                // أهم حاجة: بتحفظ الـ environment اللي اتعملت فيه
              };
              return fn;
            }
            case "IndexAccess": {
              const obj = this.exec(node.object, env);
              const idx = this.exec(node.index, env);
              if (Array.isArray(obj)) return obj[Number(idx)] ?? null;
              if (typeof obj === "string") return obj[Number(idx)] ?? "";
              if (obj && typeof obj === "object")
                return obj[String(idx)] ?? null;
              throw new ESharpError(`Can't index ${this.str(obj)}`);
            }
            case "AssignProperty": {
              const obj = this.exec(node.object, env);
              const v = this.exec(node.value, env);
              if (obj && typeof obj === "object" && obj.__type === "instance") {
                obj.props[node.property] = v;
                return v;
              }
              if (obj instanceof ESharpElement) {
                const el = obj;
                if (node.property === "text") el.setText(String(v));
                else if (node.property === "html") el.setHtml(String(v));
                else if (node.property === "value") el.setValue(String(v));
                else if (node.property === "id") el.el.id = String(v);
                return v;
              }
              if (obj && typeof obj === "object") {
                obj[node.property] = v;
                return v;
              }
              throw new ESharpError(`Can't set '${node.property}' on ${this.str(obj)}`);
            }
            case "AssignIndex": {
              const obj = this.exec(node.object, env);
              const idx = this.exec(node.index, env);
              const v = this.exec(node.value, env);
              if (Array.isArray(obj)) {
                obj[Number(idx)] = v;
                return v;
              }
              if (obj && typeof obj === "object") {
                obj[String(idx)] = v;
                return v;
              }
              throw new ESharpError(`Can't index-assign ${this.str(obj)}`);
            }
            case "BinaryExpr":
              return this.binary(node.op, this.exec(node.left, env), this.exec(node.right, env));
            case "UnaryExpr": {
              const val = this.exec(node.operand, env);
              if (node.op === "-") return -Number(val);
              if (node.op === "not") return !this.truthy(val);
              throw new ESharpError(`Unknown op '${node.op}'`);
            }
            default:
              throw new ESharpError(`Unknown: ${node.type}`);
          }
        }
        binary(op, l, r) {
          if (op === "+")
            return typeof l === "string" || typeof r === "string" ? String(l) + String(r) : Number(l) + Number(r);
          if (op === "-") return Number(l) - Number(r);
          if (op === "*") return Number(l) * Number(r);
          if (op === "/") {
            if (Number(r) === 0) throw new ESharpError("Division by zero!");
            return Number(l) / Number(r);
          }
          if (op === "%") return Number(l) % Number(r);
          if (op === "==") return l === r;
          if (op === "!=") return l !== r;
          if (op === "<") return Number(l) < Number(r);
          if (op === ">") return Number(l) > Number(r);
          if (op === "<=") return Number(l) <= Number(r);
          if (op === ">=") return Number(l) >= Number(r);
          if (op === "and") return this.truthy(l) && this.truthy(r);
          if (op === "or") return this.truthy(l) || this.truthy(r);
          throw new ESharpError(`Unknown op '${op}'`);
        }
        truthy(v) {
          return v !== null && v !== void 0 && v !== false && v !== 0 && v !== "";
        }
        findMethod(cls, name) {
          if (cls.methods.has(name)) return cls.methods.get(name);
          if (cls.parent) {
            const p = this.classes.get(cls.parent);
            if (p) return this.findMethod(p, name);
          }
          return null;
        }
        instMethod(inst, method, args, env) {
          const cls = this.classes.get(inst.className);
          if (!cls) throw new ESharpError(`Class '${inst.className}' not found`);
          const m = this.findMethod(cls, method);
          if (!m) throw new ESharpError(`No method '${method}' on '${inst.className}'`);
          const e = new Environment(env);
          e.define("this", inst);
          m.params.forEach((p, i) => e.define(p, args[i] ?? null));
          try {
            this.block(m.body, e);
          } catch (err) {
            if (err instanceof ReturnSignal) return err.value;
            throw err;
          }
          return null;
        }
        arrMethod(arr, m, args) {
          if (m === "push") {
            arr.push(args[0]);
            return arr;
          }
          if (m === "pop") return arr.pop() ?? null;
          if (m === "join") return arr.join(String(args[0] ?? ","));
          if (m === "reverse") return [...arr].reverse();
          if (m === "sort") return [...arr].sort();
          throw new ESharpError(`No list method '${m}'`);
        }
        strMethod(s, m, args) {
          if (m === "upper") return s.toUpperCase();
          if (m === "lower") return s.toLowerCase();
          if (m === "trim") return s.trim();
          if (m === "split") return s.split(String(args[0] ?? " "));
          if (m === "has") return s.includes(String(args[0]));
          if (m === "replace") return s.replace(String(args[0]), String(args[1]));
          if (m === "slice")
            return s.slice(Number(args[0]), args[1] != null ? Number(args[1]) : void 0);
          throw new ESharpError(`No string method '${m}'`);
        }
        elementMethod(el, m, args, env) {
          if (m === "on") {
            el.on(String(args[0]), args[1], this);
            return null;
          }
          if (m === "style") {
            el.style(String(args[0]), String(args[1]));
            return null;
          }
          if (m === "styles") {
            const styles = args[0];
            for (const k in styles) el.style(k, String(styles[k]));
            return null;
          }
          if (m === "addClass") {
            el.addClass(String(args[0]));
            return null;
          }
          if (m === "removeClass") {
            el.removeClass(String(args[0]));
            return null;
          }
          if (m === "toggleClass") {
            el.toggleClass(String(args[0]));
            return null;
          }
          if (m === "append") {
            if (args[0] instanceof ESharpElement) el.append(args[0]);
            return null;
          }
          if (m === "remove") {
            el.remove();
            return null;
          }
          if (m === "animate") {
            el.animate(args[0], Number(args[1]));
            return null;
          }
          if (m === "setAttr") {
            el.el.setAttribute(String(args[0]), String(args[1]));
            return null;
          }
          if (m === "attr") {
            return el.el.getAttribute(String(args[0]));
          }
          throw new ESharpError(`No element method '${m}'`);
        }
      };
    }
  });

  // core/browser-runtime.ts
  var require_browser_runtime = __commonJS({
    "core/browser-runtime.ts"() {
      init_interpreter();
      window.esharpInterpreter = new Interpreter();
      async function runESharp() {
        console.log("\u{1F680} E# Runtime Initialized");
        const interpreter = window.esharpInterpreter;
        const scripts = document.querySelectorAll('script[type="text/esharp"]');
        for (const script of Array.from(scripts)) {
          let code = "";
          if (script.hasAttribute("src")) {
            const src = script.getAttribute("src");
            if (src) {
              try {
                const res = await fetch(src);
                code = await res.text();
              } catch (e) {
                console.error(`Failed to load E# script: ${src}`, e);
              }
            }
          } else {
            code = script.textContent || "";
          }
          if (code.trim()) {
            interpreter.run(code);
          }
        }
      }
      window.addEventListener("DOMContentLoaded", runESharp);
    }
  });
  require_browser_runtime();
})();
