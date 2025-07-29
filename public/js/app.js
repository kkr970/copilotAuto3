// TRPG 웹 애플리케이션 메인 스크립트

class TRPGApp {
    constructor() {
        this.character = {
            name: '',
            class: '',
            stats: {}
        };
        this.gameLog = [];
        this.initEventListeners();
        this.addLogEntry('게임에 오신 것을 환영합니다!');
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
        });

        document.getElementById('character-class').addEventListener('change', (e) => {
            this.character.class = e.target.value;
            this.addLogEntry(`직업을 ${e.target.value}(으)로 선택했습니다.`);
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
            this.displayCharacterStats(stats);
            
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
            if (element) {
                element.textContent = value;
                element.parentElement.className = 'stat';
                
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
