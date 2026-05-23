# DRT (Demand-Responsive Transit) & Logistics Platform

이 프로젝트는 여객과 물류를 동시에 처리하는 수요응답형 교통(DRT) 통합 웹 플랫폼입니다. 차량 호출부터 최적화된 경로 배차, 물류 적재까지 관리할 수 있도록 구성되어 있습니다.

## 📂 프로젝트 구조

프로젝트는 크게 3가지 주요 폴더로 나뉘어 있습니다:

- **`backend/`**: FastAPI 기반의 파이썬 백엔드 서버
- **`frontend/`**: 관리자 및 기본 데스크톱 환경을 위한 웹 프론트엔드 (React / Vite)
- **`user_app/`**: 실제 사용자가 모바일 및 웹 환경에서 사용할 DRT 호출 앱 (React / Vite)

## 🚀 로컬 환경 실행 방법

이 프로젝트가 완벽하게 통신하며 동작하려면 **백엔드, 프론트엔드, 사용자 앱을 각각 별도의 터미널에서 실행**해야 합니다.

### 1. 백엔드 (FastAPI) 서버 실행

데이터베이스 통신 및 경로 최적화 API를 제공합니다.

```bash
cd backend

# 가상환경이 없다면 생성 후 활성화
python -m venv venv
venv\Scripts\activate  # Windows 기준

# 의존성 패키지 설치
pip install -r requirements.txt

# uvicorn을 통한 서버 실행 (기본 포트: 8000)
uvicorn main:app --reload
```

### 2. 관리자 웹 프론트엔드 실행

```bash
cd frontend
npm install
npm run dev
```
> 💡 기본적으로 `http://localhost:5173` 에서 실행됩니다.

### 3. 사용자 호출 앱 (User App) 실행

```bash
cd user_app
npm install
npm run dev
```
> 💡 이미 `frontend`가 5173 포트를 점유하고 있다면, `user_app`은 자동으로 `http://localhost:5174` 에서 실행됩니다. 
> 
> 관리자와 사용자의 화면을 동시에 띄워두고 테스트하시려면 브라우저에서 **5173** 포트와 **5174** 포트를 각각 열어 확인하시면 됩니다.

## ⚙️ 참고 사항

- 백엔드, 프론트엔드, DB가 유기적으로 통신하며, 정보의 기준(Source of Truth)은 프론트엔드에 맞춰져 있습니다.
- 환경 변수(`.env`), 대용량 데이터 파일(`.csv`, DB 파일 등)은 `.gitignore`에 의해 깃헙 저장소에 올라가지 않습니다. 로컬 환경에서 별도로 셋업해 주셔야 합니다.
