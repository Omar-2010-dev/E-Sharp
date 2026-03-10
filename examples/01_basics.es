banner "Welcome to E#"

name = ask "What is your name?"
say "Hello, " + name + "!"

loop 3 {
    say "E# is easy and fast!"
}

numbers = [10, 20, 30]
say "Total numbers: " + toStr(length(numbers))