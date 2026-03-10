set secretNum = random(1, 100)
set guess = 0 // تعريف مبدئي، أي قيمة غير صحيحة عشان اللوب يبدأ

say "I'm thinking of a number between 1 and 100."

// اللوب هيستمر طول ما التخمين غلط
while guess != secretNum {
  // بنسأل عن الرقم جوه اللوب، مرة واحدة بس في كل لفة
  guess = toNum(ask "What is your guess?")

  // بنشيك على التخمين وندي تلميح
  if guess > secretNum {
    say "Too high! Try a lower number."
  } else if guess < secretNum {
    say "Too low! Try a higher number."
  }

}

// لما اللوب يخلص، يبقى أكيد التخمين صح
say "Correct! The number was '"+ secretNum +"'. You got it! 🎉"
