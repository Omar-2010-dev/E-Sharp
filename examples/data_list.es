say banner("Data Processing Test")

skills = ["Coding", "Design", "Logic", "Gaming"]
say "My Skill List: " + skills

say "Processing Skills..."
// تجربة الـ for..in loop
for s in skills {
    say "Training on: " + s
}

// تجربة الـ Progress Bar اللي إنت صممته
say "Overall Progress:"
say progress(7, 10) // هيطبع 70% بشكل جرافيك في التيرمينال

if has(skills, "Coding") {
    say emoji("check") + " Ready to build the future!"
}