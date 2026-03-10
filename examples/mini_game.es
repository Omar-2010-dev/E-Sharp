// فتح نافذة اللعبة
showWindow(800, 600, "E# Game Engine - Player Move")

// تعريف متغيرات اللاعب
player = { x: 400, y: 300, speed: 300 }

while shouldClose() == false {
    // تلوين الخلفية
    clearWindow("white")
    
    // حساب الـ Delta Time عشان الحركة تبقى ناعمة (Frame Independent)
    dt = getDeltaTime()
    moveStep = player.speed * dt

    // التحكم بالأسهم (نستخدم الأسماء اللي إنت عرفتها في getKey)
    if isKeyDown("right") { player.x += moveStep }
    if isKeyDown("left")  { player.x -= moveStep }
    if isKeyDown("up")    { player.y -= moveStep }
    if isKeyDown("down")  { player.y += moveStep }

    // رسم اللاعب (دايرة زرقاء)
    drawCircle(player.x, player.y, 30, "blue")
    
    // كتابة تعليمات على الشاشة
    drawText("Use ARROWS to move the player!", 20, 20, 25, "darkgray")
    
    endFrame()
}

closeWindow()