# 🚀 E# (English-Sharp)

**The Ultimate, Comprehensive Guide to the E# Programming Language**

[![VS Code Marketplace](https://img.shields.io/badge/VS%20Code-Extension-blue?logo=visual-studio-code)](https://marketplace.visualstudio.com/items?itemName=OmarAlaa.esharp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Made in Egypt](https://img.shields.io/badge/Made%20in-Egypt-green)](https://github.com/Omar-2010-dev)

**E#** is a high-level, dynamically-typed language designed by **Omar Alaa** 🇪🇬 to combine the power of C# with the simplicity of plain English. It features a built-in game engine, extensive math libraries, and a "Zero-Boilerplate" philosophy.

## 🚀 Getting Started & How to Run

E# is fully integrated with **VS Code** and the **Code Runner** extension for a seamless experience.

### 1. Installation

1. Install the **[E# Language Extension](https://marketplace.visualstudio.com/items?itemName=OmarAlaa.esharp)** from the VS Code Marketplace.
2. Clone this repository to get the `esharp-runtime`.
3. Run `npm install` inside the runtime folder to install dependencies (like Raylib).

### 2. Running Code (One-Click)

If you have the **Code Runner** extension installed:

1. Open any `.es` file.
2. Click the **Run** button (Triangle icon) or press `Ctrl+Alt+N`.
3. The extension is pre-configured to handle `.es` files using the E# interpreter.

## 📑 Table of Contents

1. [Basic Syntax](#basic-syntax)
2. [Data Types](#data-types)
3. [Control Flow](#control-flow)
4. [Functional & OOP](#functional--oop)
5. [Standard Library (Built-ins)](#standard-library)
6. [Game Engine & Graphics](#game-engine)
7. [File System & Utilities](#file-system)

---

## 🛠️ Basic Syntax

### Variables

In E#, variables are created by direct assignment. They are global by default.

```esharp
score = 100
name = "Player1"
isReady = true
```

> Use the `set` keyword only when you want to define a **Local Variable** inside a function or a block.

### Comments

```esharp
// This is a single-line comment
```

---

## 💎 Data Types

- **Number**: `10`, `-5.5`
- **String**: `"Hello E#"`
- **Boolean**: `true`, `false`
- **List**: `[1, 2, "three"]`
- **Dictionary**: `{ "hp": 100, "speed": 5 }`
- **Nothing**: `nothing` (Equivalent to null/none)

---

## 🎮 Control Flow

### Conditions

```esharp
if x > 10 {
    say "Large"
} else if x == 10 {
    say "Perfect"
} else {
    say "Small"
}
```

### Loops

```esharp
// Repeat N times
loop 10 { say "Hello" }

// Conditional loop
while x < 5 { x += 1 }

// Iteration loop
for item in list { say item }
```

---

## 🏗️ Functional & OOP

### Functions

```esharp
func greet(user) {
    return "Hello " + user
}
```

### Classes

```esharp
class Player {
    func init(name) {
        this.name = name
    }
}
hero = new Player("Omar")
```

---

## 📚 Standard Library (Built-ins)

### 📢 Core Functions

| Function      | Description                          |
| :------------ | :----------------------------------- |
| `say(text)`   | Prints text to the console/screen.   |
| `ask(prompt)` | Gets input from the user.            |
| `type(val)`   | Returns the data type of the value.  |
| `length(val)` | Returns length of string or list.    |
| `wait(ms)`    | Pauses execution for N milliseconds. |

### 🔢 Math Module

| Function                                    | Description                               |
| :------------------------------------------ | :---------------------------------------- |
| `abs(n)`, `round(n)`, `floor(n)`, `ceil(n)` | Standard rounding and absolute functions. |
| `max(a, b)`, `min(a, b)`                    | Returns the larger or smaller value.      |
| `sqrt(n)`, `power(base, exp)`               | Square root and power functions.          |
| `random(min, max)`                          | Generates a random number.                |
| `clamp(val, min, max)`                      | Keeps a value within a specific range.    |
| `isEven(n)`, `isOdd(n)`                     | Boolean checks for numbers.               |
| `sum(list)`, `average(list)`                | Quick math on lists.                      |

### 🔤 String Module

| Function               | Description                          |
| :--------------------- | :----------------------------------- |
| `upper(s)`, `lower(s)` | Change case.                         |
| `trim(s)`              | Removes whitespace from ends.        |
| `reverse(s)`           | Reverses the string.                 |
| `split(s, delimiter)`  | Splits string into a list.           |
| `has(s, sub)`          | Checks if string contains substring. |
| `replace(s, old, new)` | Replaces text within string.         |

### 📋 List Module

| Function             | Description                            |
| :------------------- | :------------------------------------- |
| `push(list, item)`   | Adds item to the end.                  |
| `pop(list)`          | Removes and returns the last item.     |
| `sort(list)`         | Sorts a list numerically.              |
| `remove(list, item)` | Removes a specific item from the list. |
| `unique(list)`       | Removes duplicates.                    |
| `range(start, end)`  | Creates a list of numbers.             |

---

## 🕹️ Game Engine (Native Raylib)

E# comes with a built-in 2D engine.

### Window & Rendering

- `showWindow(w, h, title)`: Opens the game window.
- `clearWindow(color)`: Clears the background.
- `drawRect(x, y, w, h, color)`: Draws a rectangle.
- `drawCircle(x, y, r, color)`: Draws a circle.
- `drawText(txt, x, y, size, color)`: Renders text.
- `endFrame()`: Vital function to process frames and prevent crashes.
- `closeWindow()`: Closes the engine.

### Input & Physics

- `getMouseX()`, `getMouseY()`: Mouse coordinates.
- `isKeyDown(key)`, `isMouseButtonPressed(btn)`: Input detection.
- `getDeltaTime()`: Time passed since last frame.
- `getDistance(obj1, obj2)`: Distance between two objects.
- `getAngle(obj1, obj2)`: Rotation angle towards target.
- `lerp(start, end, amt)`: Linear interpolation for smooth movement.
- `checkCollision(rect1, rect2)`: AABB collision check.

### 🖥️ UI Drawing
- `drawUIText(txt, x, y, size, color)`: Renders text that is fixed to the screen (does not move with the camera).

---

## 📂 File System & Utilities

- `readFile(path)`: Returns content of a file.
- `writeFile(path, content)`: Creates/Overwrites a file.
- `appendFile(path, content)`: Adds text to the end of a file.
- `now()`, `time()`, `today()`: Get current date and time.
- `emoji(name)`: Returns specific emojis (e.g., `emoji("fire")`).
- `banner(text)`: Prints a stylish visual banner in the console.

---

## 🛡️ Error Handling

```esharp
try {
    // Dangerous code
} catch error {
    say "Something went wrong: " + error
}
```

---

**E#** - Empowering developers with the simplicity of English and the sharpness of C#.
Created with ❤️ by **Omar Alaa**.
