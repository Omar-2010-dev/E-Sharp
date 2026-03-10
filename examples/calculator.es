
say banner("E# Smart Calculator")

// الـ ask في E# بتطلع النص بلون سماوي جميل
n1 = ask "Enter first number: "
n2 = ask "Enter second number: "

// تحويل المدخلات لأرقام عشان نقدر نجمعهم
result = add(toNum(n1), toNum(n2))

say "Calculation Result: " + result

if result > 50 {
    say emoji("cool") + " That's a big number!"
} else {
    say "Small and simple, just like E#!"
}