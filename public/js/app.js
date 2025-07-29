// TRPG 웹 애플리케이션 메인 스크립트

class TRPGApp {
    constructor() {
        this.character = {
            name: '',
            class: '',
            stats: {},
            level: 1,
            experience: 0,
            maxHp: 20,
            currentHp: 20
        };
        this.currentMonster = null;
        this.inCombat = false;
        this.gameLog = [];
        this.initEventListeners();
        this.addLogEntry('게임에 오신 것을 환영합니다!');
        this.updateCharacterDisplay();
    }

    initEventListeners() {
        // 캐릭터 생성 이벤트
        document.getElementById('generate-stats').addEventListener('click', () => {
            this.generateCharacterStats();
        });

        // 주사위 굴리기 이벤트
        document.getElementById('roll-dice').addEventListener('click', () => {
            this.rollDice();
        });

        // 빠른 주사위 굴리기
        document.querySelectorAll('.quick-roll').forEach(button => {
            button.addEventListener('click', (e) => {
                const sides = parseInt(e.target.dataset.sides);
                this.quickRoll(sides);
            });
        });

        // 로그 지우기
        document.getElementById('clear-log').addEventListener('click', () => {
            this.clearLog();
        });

        // 캐릭터 정보 업데이트
        document.getElementById('character-name').addEventListener('input', (e) => {
            this.character.name = e.target.value;
            this.updateCharacterDisplay();
        });

        document.getElementById('character-class').addEventListener('change', (e) => {
            this.character.class = e.target.value;
            this.updateCharacterDisplay();
            this.addLogEntry(`직업을 ${e.target.value}(으)로 선택했습니다.`);
        });

        // 모험 이벤트
        document.getElementById('start-encounter').addEventListener('click', () => {
            this.startEncounter();
        });

        document.getElementById('rest-character').addEventListener('click', () => {
            this.restCharacter();
        });

        document.getElementById('explore-dungeon').addEventListener('click', () => {
            this.exploreDungeon();
        });

        // 전투 이벤트
        document.getElementById('attack-btn').addEventListener('click', () => {
            this.performCombatAction('attack');
        });

        document.getElementById('defend-btn').addEventListener('click', () => {
            this.performCombatAction('defend');
        });

        document.getElementById('skill-btn').addEventListener('click', () => {
            this.performCombatAction('skill');
        });

        document.getElementById('flee-btn').addEventListener('click', () => {
            this.performCombatAction('flee');
        });
    }

    async generateCharacterStats() {
        const characterName = document.getElementById('character-name').value || '무명의 영웅';
        const characterClass = document.getElementById('character-class').value;

        try {
            const response = await fetch('/api/generate-stats', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const stats = await response.json();
            this.character.stats = stats;
            
            // HP 계산 (체력 수정자 + 기본 HP)
            const constitutionMod = this.getModifier(stats.체력);
            this.character.maxHp = 20 + (constitutionMod * 2);
            this.character.currentHp = this.character.maxHp;
            
            this.displayCharacterStats(stats);
            this.updateCharacterDisplay();
            
            this.addLogEntry(`${characterName} (${characterClass})의 능력치가 생성되었습니다!`);
            
            // 특별한 능력치에 대한 코멘트 추가
            this.checkSpecialStats(stats);
            
        } catch (error) {
            console.error('능력치 생성 오류:', error);
            this.addLogEntry('능력치 생성 중 오류가 발생했습니다.');
        }
    }

    displayCharacterStats(stats) {
        Object.entries(stats).forEach(([statName, value]) => {
            const element = document.getElementById(`stat-${statName}`);
            const modElement = document.getElementById(`mod-${statName}`);
            
            if (element) {
                element.textContent = value;
                element.parentElement.className = 'stat';
                
                // 수정자 계산 및 표시
                if (modElement) {
                    const modifier = this.getModifier(value);
                    modElement.textContent = `(${modifier >= 0 ? '+' : ''}${modifier})`;
                }
                
                // 능력치에 따른 색상 변경
                if (value >= 16) {
                    element.parentElement.classList.add('excellent');
                    element.parentElement.style.background = '#c6f6d5';
                    element.parentElement.style.borderColor = '#48bb78';
                } else if (value >= 13) {
                    element.parentElement.style.background = '#bee3f8';
                    element.parentElement.style.borderColor = '#4299e1';
                } else if (value <= 8) {
                    element.parentElement.style.background = '#fed7d7';
                    element.parentElement.style.borderColor = '#f56565';
                }
            }
        });
    }

    checkSpecialStats(stats) {
        const messages = [];
        
        Object.entries(stats).forEach(([statName, value]) => {
            if (value >= 18) {
                messages.push(`🌟 ${statName} 능력치가 최고치입니다! (${value})`);
            } else if (value <= 6) {
                messages.push(`⚠️ ${statName} 능력치가 매우 낮습니다. (${value})`);
            }
        });

        messages.forEach(message => this.addLogEntry(message));
    }

    async rollDice() {
        const count = parseInt(document.getElementById('dice-count').value);
        const sides = parseInt(document.getElementById('dice-sides').value);

        if (count <= 0 || count > 10) {
            this.addLogEntry('주사위 개수는 1~10개 사이여야 합니다.');
            return;
        }

        try {
            const response = await fetch('/api/roll-dice', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ sides, count })
            });

            const result = await response.json();
            this.displayDiceResult(result);
            this.logDiceRoll(result);
            
        } catch (error) {
            console.error('주사위 굴리기 오류:', error);
            this.addLogEntry('주사위 굴리기 중 오류가 발생했습니다.');
        }
    }

    async quickRoll(sides) {
        try {
            const response = await fetch('/api/roll-dice', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ sides, count: 1 })
            });

            const result = await response.json();
            this.displayDiceResult(result);
            this.logDiceRoll(result, true);
            
        } catch (error) {
            console.error('빠른 주사위 굴리기 오류:', error);
            this.addLogEntry('주사위 굴리기 중 오류가 발생했습니다.');
        }
    }

    displayDiceResult(result) {
        const resultsContainer = document.getElementById('roll-results');
        const resultDiv = document.createElement('div');
        resultDiv.className = 'roll-result';
        
        // 크리티컬 판정 (d20에서 20이 나오거나 1이 나오는 경우)
        if (result.sides === 20) {
            if (result.results.includes(20)) {
                resultDiv.classList.add('critical');
                resultDiv.innerHTML = `
                    <strong>🎉 크리티컬! 🎉</strong><br>
                    ${result.count}d${result.sides}: ${result.results.join(', ')} = <strong>${result.total}</strong>
                `;
            } else if (result.results.includes(1)) {
                resultDiv.classList.add('critical');
                resultDiv.innerHTML = `
                    <strong>💥 크리티컬 실패! 💥</strong><br>
                    ${result.count}d${result.sides}: ${result.results.join(', ')} = <strong>${result.total}</strong>
                `;
            } else {
                resultDiv.innerHTML = `
                    ${result.count}d${result.sides}: ${result.results.join(', ')} = <strong>${result.total}</strong>
                `;
            }
        } else {
            // 높은 굴림 판정
            const maxPossible = result.count * result.sides;
            const rollPercentage = (result.total / maxPossible) * 100;
            
            if (rollPercentage >= 80) {
                resultDiv.classList.add('success');
            }
            
            resultDiv.innerHTML = `
                ${result.count}d${result.sides}: ${result.results.join(', ')} = <strong>${result.total}</strong>
            `;
        }
        
        // 최신 결과가 위에 오도록
        resultsContainer.insertBefore(resultDiv, resultsContainer.firstChild);
        
        // 결과가 너무 많으면 오래된 것 제거
        while (resultsContainer.children.length > 5) {
            resultsContainer.removeChild(resultsContainer.lastChild);
        }
        
        // 애니메이션 효과
        resultDiv.style.opacity = '0';
        resultDiv.style.transform = 'translateY(-20px)';
        setTimeout(() => {
            resultDiv.style.transition = 'all 0.3s ease';
            resultDiv.style.opacity = '1';
            resultDiv.style.transform = 'translateY(0)';
        }, 10);
    }

    logDiceRoll(result, isQuick = false) {
        const rollType = isQuick ? '빠른 굴리기' : '주사위 굴리기';
        let message = `${rollType}: ${result.count}d${result.sides} = ${result.total}`;
        
        if (result.count > 1) {
            message += ` (${result.results.join(', ')})`;
        }
        
        // 특별한 굴림에 대한 코멘트
        if (result.sides === 20) {
            if (result.results.includes(20)) {
                message += ' 🎉 크리티컬!';
            } else if (result.results.includes(1)) {
                message += ' 💥 크리티컬 실패!';
            } else if (result.total >= 15) {
                message += ' ✨ 좋은 굴림!';
            }
        }
        
        this.addLogEntry(message);
    }

    addLogEntry(message) {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = {
            timestamp,
            message
        };
        
        this.gameLog.unshift(logEntry);
        this.updateLogDisplay();
    }

    updateLogDisplay() {
        const logContainer = document.getElementById('game-log');
        logContainer.innerHTML = '';
        
        this.gameLog.slice(0, 50).forEach(entry => { // 최대 50개 항목만 표시
            const logDiv = document.createElement('div');
            logDiv.className = 'log-entry';
            logDiv.innerHTML = `
                <span class="log-timestamp">[${entry.timestamp}]</span> ${entry.message}
            `;
            logContainer.appendChild(logDiv);
        });
        
        // 스크롤을 맨 위로
        logContainer.scrollTop = 0;
    }

    clearLog() {
        this.gameLog = [];
        this.updateLogDisplay();
        this.addLogEntry('게임 로그가 지워졌습니다.');
    }

    // 능력치 수정자 계산 (D&D 방식)
    getModifier(statValue) {
        return Math.floor((statValue - 10) / 2);
    }

    // 캐릭터 표시 업데이트
    updateCharacterDisplay() {
        const nameElement = document.getElementById('character-display-name');
        const iconElement = document.getElementById('character-icon');
        const levelElement = document.getElementById('character-level');
        const expElement = document.getElementById('character-exp');
        const hpFillElement = document.getElementById('hp-fill');
        const hpTextElement = document.getElementById('hp-text');

        // 이름 표시
        const displayName = this.character.name || '새로운 모험가';
        if (nameElement) nameElement.textContent = displayName;

        // 직업별 아이콘
        const classIcons = {
            '전사': '⚔️',
            '마법사': '🧙‍♂️',
            '도적': '🗡️',
            '성직자': '⛪',
            '궁수': '🏹'
        };
        if (iconElement) {
            iconElement.textContent = classIcons[this.character.class] || '🧑‍💼';
        }

        // 레벨과 경험치
        if (levelElement) levelElement.textContent = this.character.level;
        if (expElement) expElement.textContent = this.character.experience;

        // HP 바
        if (hpFillElement && hpTextElement) {
            const hpPercentage = (this.character.currentHp / this.character.maxHp) * 100;
            hpFillElement.style.width = `${hpPercentage}%`;
            hpTextElement.textContent = `${this.character.currentHp}/${this.character.maxHp}`;
            
            // HP에 따른 색상 변경
            if (hpPercentage <= 25) {
                hpFillElement.style.background = 'linear-gradient(90deg, #f56565, #e53e3e)';
            } else if (hpPercentage <= 50) {
                hpFillElement.style.background = 'linear-gradient(90deg, #ed8936, #dd6b20)';
            } else {
                hpFillElement.style.background = 'linear-gradient(90deg, #48bb78, #68d391)';
            }
        }
    }

    // 몬스터 조우 시작
    async startEncounter() {
        if (this.inCombat) {
            this.addLogEntry('이미 전투 중입니다!');
            return;
        }

        if (!this.character.stats.힘) {
            this.addLogEntry('먼저 캐릭터를 생성해주세요!');
            return;
        }

        try {
            const response = await fetch('/api/encounter');
            const monster = await response.json();
            
            this.currentMonster = monster;
            this.inCombat = true;
            
            this.addLogEntry(`🐺 야생의 ${monster.name}이(가) 나타났다!`);
            this.showCombatScreen();
            
        } catch (error) {
            console.error('몬스터 조우 오류:', error);
            this.addLogEntry('몬스터를 찾을 수 없습니다.');
        }
    }

    // 전투 화면 표시
    showCombatScreen() {
        const combatArea = document.getElementById('combat-area');
        const playerIcon = document.getElementById('player-combat-icon');
        const playerName = document.getElementById('player-combat-name');
        const monsterIcon = document.getElementById('monster-icon');
        const monsterName = document.getElementById('monster-name');

        combatArea.classList.remove('hidden');

        // 플레이어 정보 설정
        const classIcons = {
            '전사': '⚔️',
            '마법사': '🧙‍♂️',
            '도적': '🗡️',
            '성직자': '⛪',
            '궁수': '🏹'
        };
        
        playerIcon.textContent = classIcons[this.character.class] || '🧑‍💼';
        playerName.textContent = this.character.name || '모험가';

        // 몬스터 정보 설정
        monsterIcon.textContent = this.currentMonster.image;
        monsterName.textContent = this.currentMonster.name;

        this.updateCombatHP();
        this.clearCombatMessages();
    }

    // 전투 HP 업데이트
    updateCombatHP() {
        // 플레이어 HP
        const playerHpFill = document.getElementById('player-combat-hp');
        const playerHpText = document.getElementById('player-combat-hp-text');
        const playerHpPercentage = (this.character.currentHp / this.character.maxHp) * 100;
        
        playerHpFill.style.width = `${playerHpPercentage}%`;
        playerHpText.textContent = `${this.character.currentHp}/${this.character.maxHp}`;

        // 몬스터 HP
        const monsterHpFill = document.getElementById('monster-hp');
        const monsterHpText = document.getElementById('monster-hp-text');
        const monsterHpPercentage = (this.currentMonster.hp / this.currentMonster.maxHp) * 100;
        
        monsterHpFill.style.width = `${monsterHpPercentage}%`;
        monsterHpText.textContent = `${this.currentMonster.hp}/${this.currentMonster.maxHp}`;
    }

    // 전투 액션 수행
    async performCombatAction(action) {
        if (!this.inCombat || !this.currentMonster) {
            return;
        }

        if (action === 'flee') {
            this.fleeCombat();
            return;
        }

        try {
            const response = await fetch('/api/combat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action,
                    playerStats: this.character.stats,
                    monsterStats: this.currentMonster,
                    playerHp: this.character.currentHp,
                    monsterHp: this.currentMonster.hp
                })
            });

            const result = await response.json();
            this.processCombatResult(result);

        } catch (error) {
            console.error('전투 처리 오류:', error);
            this.addCombatMessage('전투 처리 중 오류가 발생했습니다.');
        }
    }

    // 전투 결과 처리
    processCombatResult(result) {
        // HP 업데이트
        this.character.currentHp = result.playerHp;
        this.currentMonster.hp = result.monsterHp;

        // 메시지 표시
        result.messages.forEach(message => {
            this.addCombatMessage(message);
            this.addLogEntry(message);
        });

        this.updateCombatHP();
        this.updateCharacterDisplay();

        // 전투 종료 확인
        if (result.battleEnd) {
            setTimeout(() => {
                if (result.winner === 'player') {
                    this.character.experience += result.experience;
                    this.addLogEntry(`전투에서 승리! ${result.experience} 경험치를 획득했습니다.`);
                    this.checkLevelUp();
                } else {
                    this.addLogEntry('전투에서 패배했습니다...');
                }
                this.endCombat();
            }, 2000);
        }
    }

    // 전투 메시지 추가
    addCombatMessage(message) {
        const messagesContainer = document.getElementById('combat-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'combat-message';
        messageDiv.textContent = message;

        if (message.includes('데미지')) {
            messageDiv.classList.add('damage');
        } else if (message.includes('회복')) {
            messageDiv.classList.add('heal');
        } else if (message.includes('빗나갔') || message.includes('피했')) {
            messageDiv.classList.add('miss');
        } else if (message.includes('승리')) {
            messageDiv.classList.add('victory');
        } else if (message.includes('패배')) {
            messageDiv.classList.add('defeat');
        }

        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // 전투 메시지 초기화
    clearCombatMessages() {
        const messagesContainer = document.getElementById('combat-messages');
        messagesContainer.innerHTML = '';
    }

    // 전투에서 도망
    fleeCombat() {
        const escapeChance = Math.random();
        if (escapeChance > 0.3) {
            this.addCombatMessage('성공적으로 도망쳤습니다!');
            this.addLogEntry(`${this.currentMonster.name}으로부터 도망쳤습니다.`);
            setTimeout(() => this.endCombat(), 1000);
        } else {
            this.addCombatMessage('도망치지 못했습니다!');
            // 몬스터 공격 받음
            setTimeout(() => this.performCombatAction('defend'), 1000);
        }
    }

    // 전투 종료
    endCombat() {
        this.inCombat = false;
        this.currentMonster = null;
        const combatArea = document.getElementById('combat-area');
        combatArea.classList.add('hidden');
    }

    // 레벨업 확인
    checkLevelUp() {
        const expNeeded = this.character.level * 100;
        if (this.character.experience >= expNeeded) {
            this.character.level++;
            this.character.experience -= expNeeded;
            
            // HP 증가
            const hpIncrease = Math.floor(Math.random() * 8) + 3;
            this.character.maxHp += hpIncrease;
            this.character.currentHp = this.character.maxHp;
            
            this.addLogEntry(`🎉 레벨업! 레벨 ${this.character.level}이 되었습니다! HP가 ${hpIncrease} 증가했습니다.`);
            this.updateCharacterDisplay();
        }
    }

    // 휴식
    restCharacter() {
        if (this.inCombat) {
            this.addLogEntry('전투 중에는 휴식할 수 없습니다!');
            return;
        }

        const healAmount = Math.floor(this.character.maxHp * 0.5);
        this.character.currentHp = Math.min(this.character.maxHp, this.character.currentHp + healAmount);
        
        this.addLogEntry(`😴 휴식을 취했습니다. HP가 ${healAmount} 회복되었습니다.`);
        this.updateCharacterDisplay();
    }

    // 던전 탐험
    exploreDungeon() {
        if (this.inCombat) {
            this.addLogEntry('전투 중에는 탐험할 수 없습니다!');
            return;
        }

        const events = [
            { type: 'monster', message: '어둠 속에서 무언가가 움직입니다...' },
            { type: 'treasure', message: '반짝이는 보물상자를 발견했습니다!' },
            { type: 'empty', message: '텅 빈 방을 발견했습니다.' },
            { type: 'trap', message: '함정에 걸렸습니다!' }
        ];

        const randomEvent = events[Math.floor(Math.random() * events.length)];
        this.addLogEntry(`🏰 ${randomEvent.message}`);

        switch (randomEvent.type) {
            case 'monster':
                setTimeout(() => this.startEncounter(), 1000);
                break;
            case 'treasure':
                const gold = Math.floor(Math.random() * 50) + 10;
                this.addLogEntry(`💰 ${gold} 골드를 발견했습니다!`);
                break;
            case 'trap':
                const damage = Math.floor(Math.random() * 5) + 1;
                this.character.currentHp = Math.max(1, this.character.currentHp - damage);
                this.addLogEntry(`💥 함정으로 ${damage}의 데미지를 받았습니다!`);
                this.updateCharacterDisplay();
                break;
        }
    }

    // 능력치 수정자 계산 (D&D 방식)
    getModifier(statValue) {
        return Math.floor((statValue - 10) / 2);
    }

    // 능력치 판정 굴리기
    async rollStatCheck(statName) {
        if (!this.character.stats[statName]) {
            this.addLogEntry('먼저 캐릭터 능력치를 생성해주세요.');
            return;
        }

        const statValue = this.character.stats[statName];
        const modifier = this.getModifier(statValue);
        
        try {
            const response = await fetch('/api/roll-dice', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ sides: 20, count: 1 })
            });

            const result = await response.json();
            const total = result.total + modifier;
            
            let message = `${statName} 판정: d20(${result.total}) + ${modifier} = ${total}`;
            
            if (total >= 15) {
                message += ' ✅ 성공!';
            } else if (total <= 5) {
                message += ' ❌ 실패!';
            }
            
            this.addLogEntry(message);
            
        } catch (error) {
            console.error('능력치 판정 오류:', error);
            this.addLogEntry('능력치 판정 중 오류가 발생했습니다.');
        }
    }
}

// 애플리케이션 초기화
document.addEventListener('DOMContentLoaded', () => {
    window.trpgApp = new TRPGApp();
    
    // 능력치 클릭 시 판정 굴리기 기능 추가
    document.addEventListener('click', (e) => {
        if (e.target.closest('.stat')) {
            const statElement = e.target.closest('.stat');
            const statText = statElement.textContent;
            const statName = statText.split(':')[0];
            
            if (statName && window.trpgApp.character.stats[statName]) {
                window.trpgApp.rollStatCheck(statName);
            }
        }
    });
    
    // 키보드 단축키 추가
    document.addEventListener('keydown', (e) => {
        // Ctrl + Enter로 주사위 굴리기
        if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            window.trpgApp.rollDice();
        }
        
        // Ctrl + G로 능력치 생성
        if (e.ctrlKey && e.key === 'g') {
            e.preventDefault();
            window.trpgApp.generateCharacterStats();
        }
    });
});
