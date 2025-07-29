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

// 몬스터 데이터 가져오기 API
app.get('/api/monsters', (req, res) => {
    const monsters = [
        {
            id: 1,
            name: '고블린',
            hp: 15,
            maxHp: 15,
            attack: 8,
            defense: 2,
            image: '👹',
            description: '작고 사악한 녹색 괴물'
        },
        {
            id: 2,
            name: '오크',
            hp: 25,
            maxHp: 25,
            attack: 12,
            defense: 4,
            image: '👺',
            description: '크고 강한 야만족'
        },
        {
            id: 3,
            name: '스켈레톤',
            hp: 18,
            maxHp: 18,
            attack: 10,
            defense: 3,
            image: '💀',
            description: '되살아난 해골 전사'
        },
        {
            id: 4,
            name: '드래곤',
            hp: 50,
            maxHp: 50,
            attack: 20,
            defense: 8,
            image: '🐉',
            description: '전설의 화염 용'
        }
    ];
    
    res.json(monsters);
});

// 랜덤 몬스터 조우 API
app.get('/api/encounter', (req, res) => {
    const monsters = [
        { id: 1, name: '고블린', hp: 15, maxHp: 15, attack: 8, defense: 2, image: '👹' },
        { id: 2, name: '오크', hp: 25, maxHp: 25, attack: 12, defense: 4, image: '👺' },
        { id: 3, name: '스켈레톤', hp: 18, maxHp: 18, attack: 10, defense: 3, image: '💀' }
    ];
    
    const randomMonster = monsters[Math.floor(Math.random() * monsters.length)];
    res.json(randomMonster);
});

// 전투 액션 처리 API
app.post('/api/combat', (req, res) => {
    const { action, playerStats, monsterStats, playerHp, monsterHp } = req.body;
    
    let result = {
        playerAction: action,
        playerDamage: 0,
        monsterDamage: 0,
        playerHp: playerHp,
        monsterHp: monsterHp,
        battleEnd: false,
        winner: null,
        messages: []
    };
    
    // 플레이어 공격
    if (action === 'attack') {
        const attackRoll = Math.floor(Math.random() * 20) + 1;
        const strengthMod = Math.floor((playerStats.힘 - 10) / 2);
        const totalAttack = attackRoll + strengthMod;
        
        if (totalAttack >= monsterStats.defense + 10) {
            const damage = Math.floor(Math.random() * 8) + 1 + strengthMod;
            result.playerDamage = Math.max(1, damage);
            result.monsterHp = Math.max(0, monsterHp - result.playerDamage);
            result.messages.push(`공격 성공! ${result.playerDamage}의 데미지를 입혔습니다.`);
        } else {
            result.messages.push('공격이 빗나갔습니다!');
        }
    }
    
    // 몬스터가 살아있으면 반격
    if (result.monsterHp > 0) {
        const monsterAttackRoll = Math.floor(Math.random() * 20) + 1;
        const constitutionMod = Math.floor((playerStats.체력 - 10) / 2);
        const playerDefense = 10 + constitutionMod;
        
        if (monsterAttackRoll >= playerDefense) {
            const damage = Math.floor(Math.random() * monsterStats.attack) + 1;
            result.monsterDamage = damage;
            result.playerHp = Math.max(0, playerHp - damage);
            result.messages.push(`${monsterStats.name}이(가) ${damage}의 데미지를 입혔습니다!`);
        } else {
            result.messages.push(`${monsterStats.name}의 공격을 피했습니다!`);
        }
    }
    
    // 전투 종료 확인
    if (result.playerHp <= 0) {
        result.battleEnd = true;
        result.winner = 'monster';
        result.messages.push('패배했습니다... 게임 오버!');
    } else if (result.monsterHp <= 0) {
        result.battleEnd = true;
        result.winner = 'player';
        const exp = monsterStats.maxHp * 2;
        result.experience = exp;
        result.messages.push(`승리했습니다! ${exp} 경험치를 획득했습니다!`);
    }
    
    res.json(result);
});

app.listen(PORT, () => {
    console.log(`TRPG 서버가 http://localhost:${PORT} 에서 실행 중입니다`);
});
