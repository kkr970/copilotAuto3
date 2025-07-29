const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// 정적 파일 제공
app.use(express.static('public'));

// JSON 파싱 미들웨어
app.use(express.json());

// 메인 페이지
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 주사위 굴리기 API
app.post('/api/roll-dice', (req, res) => {
    const { sides = 6, count = 1 } = req.body;
    const results = [];
    
    for (let i = 0; i < count; i++) {
        results.push(Math.floor(Math.random() * sides) + 1);
    }
    
    const total = results.reduce((sum, roll) => sum + roll, 0);
    
    res.json({
        results,
        total,
        sides,
        count
    });
});

// 캐릭터 능력치 생성 API
app.post('/api/generate-stats', (req, res) => {
    const stats = {};
    const statNames = ['힘', '민첩', '지능', '체력', '매력', '지혜'];
    
    statNames.forEach(stat => {
        // 4d6에서 가장 낮은 수를 제외하고 합산 (D&D 방식)
        const rolls = Array.from({length: 4}, () => Math.floor(Math.random() * 6) + 1);
        rolls.sort((a, b) => b - a);
        stats[stat] = rolls.slice(0, 3).reduce((sum, roll) => sum + roll, 0);
    });
    
    res.json(stats);
});

app.listen(PORT, () => {
    console.log(`TRPG 서버가 http://localhost:${PORT} 에서 실행 중입니다`);
});
