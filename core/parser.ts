// E# Parser v2 - Curly brace syntax
// x = 5
// say "hello"
// if x > 3 { ... }
// while x > 0 { ... }
// loop 5 { ... }
// func name(a, b) { ... }
// class Name { ... }
// x++/--
// x += 1

import { Token, TokenType, tokenize } from './lexer';

export type ASTNode = { line: number } & (
  | { type: 'Program'; body: ASTNode[] }
  | { type: 'NumberLiteral'; value: number }
  | { type: 'StringLiteral'; value: string }
  | { type: 'BooleanLiteral'; value: boolean }
  | { type: 'NothingLiteral' }
  | { type: 'Identifier'; name: string }
  | { type: 'ThisExpr' }
  | { type: 'BinaryExpr'; op: string; left: ASTNode; right: ASTNode }
  | { type: 'UnaryExpr'; op: string; operand: ASTNode }
  | { type: 'Assignment'; name: string; value: ASTNode }
  | { type: 'VarDeclaration'; name: string; value: ASTNode } // النوع الجديد لتعريف المتغيرات
  | { type: 'SayStatement'; value: ASTNode }
  | { type: 'AskExpr'; prompt: ASTNode }
  | { type: 'IfStatement'; condition: ASTNode; thenBody: ASTNode[]; elseBody: ASTNode[] }
  | { type: 'WhileStatement'; condition: ASTNode; body: ASTNode[] }
  | { type: 'LoopStatement'; count: ASTNode; body: ASTNode[] }
  | { type: 'ForInStatement'; varName: string; iterable: ASTNode; body: ASTNode[] }
  | { type: 'FunctionDef'; name: string; params: string[]; body: ASTNode[] }
  | { type: 'ReturnStatement'; value: ASTNode | null }
  | { type: 'FunctionCall'; name: string; args: ASTNode[] }
  | { type: 'MethodCall'; object: ASTNode; method: string; args: ASTNode[] }
  | { type: 'PropertyAccess'; object: ASTNode; property: string }
  | { type: 'ClassDef'; name: string; parent: string | null; methods: ASTNode[] }
  | { type: 'NewExpr'; className: string; args: ASTNode[] }
  | { type: 'TryStatement'; tryBody: ASTNode[]; errorVar: string; catchBody: ASTNode[] }
  | { type: 'BreakStatement' }
  | { type: 'ContinueStatement' }
  // === الإضافات الجديدة ===
  | { type: 'ConditionalExpr'; condition: ASTNode; thenExpr: ASTNode; elseExpr: ASTNode } // للـ Ternary `? :`
  | { type: 'ArrowFunctionExpr'; params: string[]; body: ASTNode[] } // لدوال السهم `=>`
  | { type: 'ArrayLiteral'; elements: ASTNode[] }
  | { type: 'DictLiteral'; entries: { key: ASTNode; value: ASTNode }[] }
  | { type: 'IndexAccess'; object: ASTNode; index: ASTNode }
  | { type: 'AssignProperty'; object: ASTNode; property: string; value: ASTNode }
  | { type: 'AssignIndex'; object: ASTNode; index: ASTNode; value: ASTNode }
);

export function parse(source: string): ASTNode {
  const tokens = tokenize(source);
  let pos = 0;

  const current = (): Token => tokens[pos] || { type: TokenType.EOF, value: '', line: 0 };
  const peek = (offset = 0): Token =>
    tokens[pos + offset] || { type: TokenType.EOF, value: '', line: 0 };
  const advance = (): Token => tokens[pos++];
  const expect = (type: TokenType, msg?: string): Token => {
    const t = current();
    if (t.type !== type)
      throw new Error(`Line ${t.line}: Expected ${msg || TokenType[type]} but got '${t.value}'`);
    return advance();
  };
  const match = (type: TokenType): boolean => {
    if (current().type === type) {
      advance();
      return true;
    }
    return false;
  };

  function parseProgram(): ASTNode {
    const body: ASTNode[] = [];
    while (current().type !== TokenType.EOF) {
      body.push(parseStatement());
    }
    return { type: 'Program', body, line: 1 };
  }

  // === دوال مساعدة جديدة ===

  // دالة بتشوف هل اللي جاي ده شكل دالة سهم `(...) =>`
  function isArrowCandidate(): boolean {
    if (current().type !== TokenType.LPAREN) return false;

    // بنعد الأقواس عشان نتأكد إننا بنبص بعد القوس المقفول صح
    let parenLevel = 1;
    let i = pos + 1;
    while (i < tokens.length && parenLevel > 0) {
      if (tokens[i].type === TokenType.LPAREN) parenLevel++;
      if (tokens[i].type === TokenType.RPAREN) parenLevel--;
      i++;
    }

    // لو اللي بعد القوس هو سهم `=>` يبقى دي دالة سهم
    return tokens[i]?.type === TokenType.ARROW;
  }

  // دالة بتبني الـ AST لدالة السهم
  function parseArrowFunction(): ASTNode {
    const line = current().line;
    expect(TokenType.LPAREN, '"("');
    const params: string[] = [];
    if (current().type !== TokenType.RPAREN) {
      params.push(expect(TokenType.IDENTIFIER, 'parameter').value);
      while (match(TokenType.COMMA)) {
        params.push(expect(TokenType.IDENTIFIER, 'parameter').value);
      }
    }
    expect(TokenType.RPAREN, '")"');
    expect(TokenType.ARROW, '"=>"');

    let body: ASTNode[];
    if (current().type === TokenType.LBRACE) {
      body = parseBraceBlock(); // لو الجسم عبارة عن بلوك كامل `{...}`
    } else {
      body = [{ type: 'ReturnStatement', value: parseExpression(), line }]; // لو الجسم تعبير واحد، بنعمل return ضمني
    }
    return { type: 'ArrowFunctionExpr', params, body, line };
  }

  // Parse statements inside { }
  function parseBraceBlock(): ASTNode[] {
    expect(TokenType.LBRACE, '"{"');
    const body: ASTNode[] = [];
    while (current().type !== TokenType.RBRACE && current().type !== TokenType.EOF) {
      body.push(parseStatement());
    }
    expect(TokenType.RBRACE, '"}"');
    return body;
  }

  function parseStatement(): ASTNode {
    const t = current();
    const line = t.line;

    if (t.type === TokenType.SET) return parseVarDeclaration(); // لو لقينا set ننفذ دالة التعريف
    if (t.type === TokenType.SAY) return parseSay();
    if (t.type === TokenType.IF) return parseIf();
    if (t.type === TokenType.WHILE) return parseWhile();
    if (t.type === TokenType.LOOP) return parseLoop();
    if (t.type === TokenType.FOR) return parseFor();
    if (t.type === TokenType.FUNC) return parseFunc();
    if (t.type === TokenType.CLASS) return parseClass();
    if (t.type === TokenType.RETURN) return parseReturn();
    if (t.type === TokenType.TRY) return parseTry();
    if (t.type === TokenType.BREAK) return parseBreak();
    if (t.type === TokenType.CONTINUE) return parseContinue();

    // Assignment: this.prop = value
    if (
      t.type === TokenType.THIS &&
      peek(1).type === TokenType.DOT &&
      peek(2).type === TokenType.IDENTIFIER &&
      peek(3).type === TokenType.ASSIGN
    ) {
      advance();
      advance();
      const prop = advance().value;
      advance();
      const value = parseExpression();
      return {
        type: 'AssignProperty',
        object: { type: 'ThisExpr', line },
        property: prop,
        value,
        line
      };
    }

    // x++ or x--
    if (
      t.type === TokenType.IDENTIFIER &&
      (peek(1).type === TokenType.PLUSPLUS || peek(1).type === TokenType.MINUSMINUS)
    ) {
      const name = advance().value;
      const op = advance().type === TokenType.PLUSPLUS ? '+' : '-';
      return {
        type: 'Assignment',
        name,
        value: {
          type: 'BinaryExpr',
          op,
          left: { type: 'Identifier', name, line },
          right: { type: 'NumberLiteral', value: 1, line },
          line
        },
        line
      };
    }

    // x += val, x -= val, x *= val, x /= val
    if (
      t.type === TokenType.IDENTIFIER &&
      [TokenType.PLUSEQ, TokenType.MINUSEQ, TokenType.STAREQ, TokenType.SLASHEQ].includes(
        peek(1).type
      )
    ) {
      const name = advance().value;
      const opToken = advance();
      const op =
        opToken.type === TokenType.PLUSEQ
          ? '+'
          : opToken.type === TokenType.MINUSEQ
            ? '-'
            : opToken.type === TokenType.STAREQ
              ? '*'
              : '/';
      const value = parseExpression();
      return {
        type: 'Assignment',
        name,
        value: {
          type: 'BinaryExpr',
          op,
          left: { type: 'Identifier', name, line },
          right: value,
          line
        },
        line
      };
    }

    // Assignment: name = value
    if (t.type === TokenType.IDENTIFIER && peek(1).type === TokenType.ASSIGN) {
      const name = advance().value;
      advance();
      const value = parseExpression();
      return { type: 'Assignment', name, value, line };
    }

    // Assignment: name.prop = value OR name.prop += value OR name.prop++
    if (
      t.type === TokenType.IDENTIFIER &&
      peek(1).type === TokenType.DOT &&
      peek(2).type === TokenType.IDENTIFIER
    ) {
      const opType = peek(3).type;

      // 1. التعامل مع ++ و -- (زي player.x++)
      if (opType === TokenType.PLUSPLUS || opType === TokenType.MINUSMINUS) {
        const name = advance().value;
        advance(); // .
        const prop = advance().value;
        const op = advance().type === TokenType.PLUSPLUS ? '+' : '-';

        return {
          type: 'AssignProperty',
          object: { type: 'Identifier', name, line },
          property: prop,
          value: {
            type: 'BinaryExpr',
            op: op,
            left: {
              type: 'PropertyAccess',
              object: { type: 'Identifier', name, line },
              property: prop,
              line
            },
            right: { type: 'NumberLiteral', value: 1, line },
            line
          },
          line
        };
      }

      // 2. التعامل مع +=, -=, *=, /=, =
      if (
        [
          TokenType.ASSIGN,
          TokenType.PLUSEQ,
          TokenType.MINUSEQ,
          TokenType.STAREQ,
          TokenType.SLASHEQ
        ].includes(opType)
      ) {
        const name = advance().value;
        advance(); // .
        const prop = advance().value;
        const opTok = advance();

        let value = parseExpression();

        // لو العملية مش مجرد يساوي (=)، بنحولها لعملية حسابية
        if (opTok.type !== TokenType.ASSIGN) {
          const op =
            opTok.type === TokenType.PLUSEQ
              ? '+'
              : opTok.type === TokenType.MINUSEQ
                ? '-'
                : opTok.type === TokenType.STAREQ
                  ? '*'
                  : '/';

          value = {
            type: 'BinaryExpr',
            op,
            left: {
              type: 'PropertyAccess',
              object: { type: 'Identifier', name, line },
              property: prop,
              line
            },
            right: value,
            line
          };
        }

        return {
          type: 'AssignProperty',
          object: { type: 'Identifier', name, line },
          property: prop,
          value,
          line
        };
      }
    }

    // Index assignment: arr[0] = value OR arr[0] += value OR arr[0]++
    if (t.type === TokenType.IDENTIFIER && peek(1).type === TokenType.LBRACKET) {
      const name = advance().value;
      advance();
      const index = parseExpression();
      expect(TokenType.RBRACKET, '"]"');

      const nextT = current();

      // 1. التعامل مع ++ و -- للقوائم (زي list[0]++)
      if (nextT.type === TokenType.PLUSPLUS || nextT.type === TokenType.MINUSMINUS) {
        const op = advance().type === TokenType.PLUSPLUS ? '+' : '-';
        return {
          type: 'AssignIndex',
          object: { type: 'Identifier', name, line },
          index,
          value: {
            type: 'BinaryExpr',
            op,
            left: { type: 'IndexAccess', object: { type: 'Identifier', name, line }, index, line },
            right: { type: 'NumberLiteral', value: 1, line },
            line
          },
          line
        };
      }

      // 2. التعامل مع +=, -=, *=, /=, = للقوائم
      if (
        [
          TokenType.ASSIGN,
          TokenType.PLUSEQ,
          TokenType.MINUSEQ,
          TokenType.STAREQ,
          TokenType.SLASHEQ
        ].includes(nextT.type)
      ) {
        const opTok = advance();
        let value = parseExpression();

        if (opTok.type !== TokenType.ASSIGN) {
          const op =
            opTok.type === TokenType.PLUSEQ
              ? '+'
              : opTok.type === TokenType.MINUSEQ
                ? '-'
                : opTok.type === TokenType.STAREQ
                  ? '*'
                  : '/';
          value = {
            type: 'BinaryExpr',
            op,
            left: { type: 'IndexAccess', object: { type: 'Identifier', name, line }, index, line },
            right: value,
            line
          };
        }

        return {
          type: 'AssignIndex',
          object: { type: 'Identifier', name, line },
          index,
          value,
          line
        };
      }

      let expr: ASTNode = {
        type: 'IndexAccess',
        object: { type: 'Identifier', name, line },
        index,
        line
      };
      expr = parsePostfixContinue(expr);
      return expr;
    }

    return parseExpressionStatement();
  }

  // دالة قراءة تعريف المتغير (set x = val)
  function parseVarDeclaration(): ASTNode {
    const line = current().line;
    advance(); // نتخطى كلمة set
    const name = expect(TokenType.IDENTIFIER, 'variable name').value;
    expect(TokenType.ASSIGN, '"="');
    const value = parseExpression();
    return { type: 'VarDeclaration', name, value, line };
  }

  function parseSay(): ASTNode {
    const line = current().line;
    advance();
    return { type: 'SayStatement', value: parseExpression(), line };
  }

  function parseIf(): ASTNode {
    const line = current().line;
    advance(); // if
    const condition = parseExpression();
    const thenBody = parseBraceBlock();
    let elseBody: ASTNode[] = [];
    if (match(TokenType.ELSE)) {
      if (current().type === TokenType.IF) {
        // else if → nested if inside elseBody
        elseBody = [parseIf()];
      } else {
        elseBody = parseBraceBlock();
      }
    }
    return { type: 'IfStatement', condition, thenBody, elseBody, line };
  }

  function parseWhile(): ASTNode {
    const line = current().line;
    advance();
    const condition = parseExpression();
    const body = parseBraceBlock();
    return { type: 'WhileStatement', condition, body, line };
  }

  function parseLoop(): ASTNode {
    const line = current().line;
    advance();
    const count = parseExpression();
    const body = parseBraceBlock();
    return { type: 'LoopStatement', count, body, line };
  }

  function parseFor(): ASTNode {
    const line = current().line;
    advance(); // for
    const varName = expect(TokenType.IDENTIFIER, 'variable name').value;
    expect(TokenType.IN, '"in"');
    const iterable = parseExpression();
    const body = parseBraceBlock();
    return { type: 'ForInStatement', varName, iterable, body, line };
  }

  function parseFunc(): ASTNode {
    const line = current().line;
    advance();
    const name = expect(TokenType.IDENTIFIER, 'function name').value;
    expect(TokenType.LPAREN, '"("');
    const params: string[] = [];
    if (current().type !== TokenType.RPAREN) {
      params.push(expect(TokenType.IDENTIFIER, 'parameter').value);
      while (match(TokenType.COMMA)) params.push(expect(TokenType.IDENTIFIER, 'parameter').value);
    }
    expect(TokenType.RPAREN, '")"');
    const body = parseBraceBlock();
    return { type: 'FunctionDef', name, params, body, line };
  }

  function parseClass(): ASTNode {
    const line = current().line;
    advance();
    const name = expect(TokenType.IDENTIFIER, 'class name').value;
    let parent: string | null = null;
    if (match(TokenType.EXTENDS)) parent = expect(TokenType.IDENTIFIER, 'parent class').value;
    expect(TokenType.LBRACE, '"{"');

    const methods: ASTNode[] = [];
    while (current().type !== TokenType.RBRACE && current().type !== TokenType.EOF) {
      if (current().type === TokenType.FUNC) {
        const mLine = current().line;
        advance();
        const mname = expect(TokenType.IDENTIFIER, 'method name').value;
        expect(TokenType.LPAREN, '"("');
        const params: string[] = [];
        if (current().type !== TokenType.RPAREN) {
          params.push(expect(TokenType.IDENTIFIER, 'parameter').value);
          while (match(TokenType.COMMA))
            params.push(expect(TokenType.IDENTIFIER, 'parameter').value);
        }
        expect(TokenType.RPAREN, '")"');
        const body = parseBraceBlock();
        methods.push({ type: 'FunctionDef', name: mname, params, body, line: mLine });
      } else {
        throw new Error(
          `Line ${current().line}: Expected 'func' inside class, got '${current().value}'`
        );
      }
    }
    expect(TokenType.RBRACE, '"}"');
    return { type: 'ClassDef', name, parent, methods, line };
  }

  function parseReturn(): ASTNode {
    const line = current().line;
    advance();
    const t = current();
    if (t.type === TokenType.RBRACE || t.type === TokenType.EOF)
      return { type: 'ReturnStatement', value: null, line };
    return { type: 'ReturnStatement', value: parseExpression(), line };
  }

  function parseTry(): ASTNode {
    const line = current().line;
    advance();
    const tryBody = parseBraceBlock();
    expect(TokenType.CATCH, '"catch"');
    let errorVar = 'err';
    if (current().type === TokenType.IDENTIFIER) errorVar = advance().value;
    const catchBody = parseBraceBlock();
    return { type: 'TryStatement', tryBody, errorVar, catchBody, line };
  }

  // دالتين جداد عشان break و continue
  function parseBreak(): ASTNode {
    const line = current().line;
    advance(); // نتخطى كلمة break
    return { type: 'BreakStatement', line };
  }

  function parseContinue(): ASTNode {
    const line = current().line;
    advance(); // نتخطى كلمة continue
    return { type: 'ContinueStatement', line };
  }

  function parseExpressionStatement(): ASTNode {
    return parseExpression();
  }

  function parseExpression(): ASTNode {
    return parseConditional();
  }

  // دالة جديدة بتعالج الـ Ternary Operator
  function parseConditional(): ASTNode {
    let expr = parseOr();
    if (match(TokenType.QUESTION)) {
      const line = tokens[pos - 1].line;
      const thenExpr = parseExpression();
      expect(TokenType.COLON, '":" for ternary operator');
      const elseExpr = parseConditional(); // عشان نسمح بـ a ? b : c ? d : e
      return { type: 'ConditionalExpr', condition: expr, thenExpr, elseExpr, line };
    }
    return expr;
  }

  function parseOr(): ASTNode {
    let left = parseAnd();
    while (current().type === TokenType.OR) {
      const t = advance();
      left = { type: 'BinaryExpr', op: 'or', left, right: parseAnd(), line: t.line };
    }
    return left;
  }

  function parseAnd(): ASTNode {
    let left = parseNot();
    while (current().type === TokenType.AND) {
      const t = advance();
      left = { type: 'BinaryExpr', op: 'and', left, right: parseNot(), line: t.line };
    }
    return left;
  }

  function parseNot(): ASTNode {
    if (current().type === TokenType.NOT) {
      const t = advance();
      return { type: 'UnaryExpr', op: 'not', operand: parseNot(), line: t.line };
    }
    return parseComparison();
  }

  function parseComparison(): ASTNode {
    let left = parseAddition();
    while (
      [
        TokenType.EQ,
        TokenType.NEQ,
        TokenType.LT,
        TokenType.GT,
        TokenType.LTE,
        TokenType.GTE
      ].includes(current().type)
    ) {
      const t = advance();
      const op =
        t.type === TokenType.EQ
          ? '=='
          : t.type === TokenType.NEQ
            ? '!='
            : t.type === TokenType.LT
              ? '<'
              : t.type === TokenType.GT
                ? '>'
                : t.type === TokenType.LTE
                  ? '<='
                  : '>=';
      left = { type: 'BinaryExpr', op, left, right: parseAddition(), line: t.line };
    }
    return left;
  }

  function parseAddition(): ASTNode {
    let left = parseMultiplication();
    while (current().type === TokenType.PLUS || current().type === TokenType.MINUS) {
      const t = advance();
      const op = t.type === TokenType.PLUS ? '+' : '-';
      left = { type: 'BinaryExpr', op, left, right: parseMultiplication(), line: t.line };
    }
    return left;
  }

  function parseMultiplication(): ASTNode {
    let left = parseUnary();
    while (
      current().type === TokenType.STAR ||
      current().type === TokenType.SLASH ||
      current().type === TokenType.PERCENT
    ) {
      const t = advance();
      const op = t.type === TokenType.STAR ? '*' : t.type === TokenType.SLASH ? '/' : '%';
      left = { type: 'BinaryExpr', op, left, right: parseUnary(), line: t.line };
    }
    return left;
  }

  function parseUnary(): ASTNode {
    if (current().type === TokenType.MINUS) {
      const t = advance();
      return { type: 'UnaryExpr', op: '-', operand: parseUnary(), line: t.line };
    }
    return parsePostfix();
  }

  function parsePostfixContinue(expr: ASTNode): ASTNode {
    while (true) {
      if (current().type === TokenType.DOT && peek(1).type === TokenType.IDENTIFIER) {
        const line = current().line;
        advance();
        const prop = advance().value;
        if (current().type === TokenType.LPAREN) {
          advance();
          const args: ASTNode[] = [];
          if (current().type !== TokenType.RPAREN) {
            args.push(parseExpression());
            while (match(TokenType.COMMA)) args.push(parseExpression());
          }
          expect(TokenType.RPAREN, '")"');
          expr = { type: 'MethodCall', object: expr, method: prop, args, line };
        } else {
          expr = { type: 'PropertyAccess', object: expr, property: prop, line };
        }
      } else if (current().type === TokenType.LBRACKET) {
        const line = current().line;
        advance();
        const index = parseExpression();
        expect(TokenType.RBRACKET, '"]"');
        expr = { type: 'IndexAccess', object: expr, index, line };
      } else break;
    }
    return expr;
  }

  function parsePostfix(): ASTNode {
    let expr = parsePrimary();
    return parsePostfixContinue(expr);
  }

  function parsePrimary(): ASTNode {
    const t = current();
    const line = t.line;

    if (t.type === TokenType.NUMBER) {
      advance();
      return { type: 'NumberLiteral', value: parseFloat(t.value), line };
    }
    if (t.type === TokenType.STRING) {
      advance();
      return { type: 'StringLiteral', value: t.value, line };
    }
    if (t.type === TokenType.TRUE) {
      advance();
      return { type: 'BooleanLiteral', value: true, line };
    }
    if (t.type === TokenType.FALSE) {
      advance();
      return { type: 'BooleanLiteral', value: false, line };
    }
    if (t.type === TokenType.NOTHING) {
      advance();
      return { type: 'NothingLiteral', line };
    }
    if (t.type === TokenType.THIS) {
      advance();
      return { type: 'ThisExpr', line };
    }

    if (t.type === TokenType.ASK) {
      advance();
      return { type: 'AskExpr', prompt: parseExpression(), line };
    }

    if (t.type === TokenType.NEW) {
      advance();
      const cls = expect(TokenType.IDENTIFIER, 'class name').value;
      const args: ASTNode[] = [];
      if (match(TokenType.LPAREN)) {
        if (current().type !== TokenType.RPAREN) {
          args.push(parseExpression());
          while (match(TokenType.COMMA)) args.push(parseExpression());
        }
        expect(TokenType.RPAREN, '")"');
      }
      return { type: 'NewExpr', className: cls, args, line };
    }

    if (t.type === TokenType.LBRACKET) {
      advance();
      const elements: ASTNode[] = [];
      if (current().type !== TokenType.RBRACKET) {
        elements.push(parseExpression());
        while (match(TokenType.COMMA)) elements.push(parseExpression());
      }
      expect(TokenType.RBRACKET, '"]"');
      return { type: 'ArrayLiteral', elements, line };
    }

    // Dict literal — only parse { as dict if next token suggests key:value
    if (t.type === TokenType.LBRACE) {
      // Look ahead: if it's {} or "key": pattern, treat as dict
      if (
        peek(1).type === TokenType.RBRACE ||
        (peek(1).type === TokenType.STRING && peek(2).type === TokenType.COLON) ||
        (peek(1).type === TokenType.IDENTIFIER && peek(2).type === TokenType.COLON)
      ) {
        advance();
        const entries: { key: ASTNode; value: ASTNode }[] = [];
        if (current().type !== TokenType.RBRACE) {
          const key = parseExpression();
          expect(TokenType.COLON, '":"');
          const value = parseExpression();
          entries.push({ key, value });
          while (match(TokenType.COMMA)) {
            const k = parseExpression();
            expect(TokenType.COLON, '":"');
            const v = parseExpression();
            entries.push({ key: k, value: v });
          }
        }
        expect(TokenType.RBRACE, '"}"');
        return { type: 'DictLiteral', entries, line };
      }
    }

    if (t.type === TokenType.LPAREN) {
      // هنا بنستخدم الدالة المساعدة عشان نعرف هل ده قوس عادي ولا بداية دالة سهم
      if (isArrowCandidate()) {
        return parseArrowFunction();
      }
      // لو مش دالة سهم، يبقى ده تعبير عادي بين قوسين
      advance();
      const expr = parseExpression();
      expect(TokenType.RPAREN, '")"');
      return expr;
    }

    if (t.type === TokenType.IDENTIFIER) {
      const name = advance().value;
      if (current().type === TokenType.LPAREN) {
        advance();
        const args: ASTNode[] = [];
        if (current().type !== TokenType.RPAREN) {
          args.push(parseExpression());
          while (match(TokenType.COMMA)) args.push(parseExpression());
        }
        expect(TokenType.RPAREN, '")"');
        return { type: 'FunctionCall', name, args, line };
      }
      return { type: 'Identifier', name, line };
    }

    throw new Error(`Line ${t.line}: Unexpected '${t.value}'`);
  }

  return parseProgram();
}
