<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# TRPG 웹 애플리케이션 프로젝트

이 프로젝트는 Node.js와 Express를 사용한 간단한 TRPG(테이블탑 롤플레잉 게임) 웹 애플리케이션입니다.

## 프로젝트 구조
- `server.js`: Express 서버 메인 파일
- `public/`: 정적 파일 디렉토리
  - `index.html`: 메인 HTML 페이지
  - `css/style.css`: 스타일시트
  - `js/app.js`: 클라이언트 사이드 JavaScript

## 주요 기능
- 캐릭터 능력치 생성 (D&D 방식의 4d6 drop lowest)
- 다양한 주사위 굴리기 (d4, d6, d8, d10, d12, d20, d100)
- 게임 로그 시스템
- 반응형 웹 디자인

## 개발 가이드라인
- ES6+ JavaScript 문법 사용
- 모던 CSS (Grid, Flexbox) 활용
- RESTful API 설계
- 클라이언트-서버 분리 아키텍처
