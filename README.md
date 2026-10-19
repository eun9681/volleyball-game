# 동물 배구

## 실행

```sh
npm install
npm run dev
```

기본 주소: http://127.0.0.1:5173. 소스를 수정한 뒤 서버를 다시 시작하면 빌드됩니다.
`npm run build`로 배포용 `dist/`를 생성합니다. Vercel은 이 폴더를 배포하도록 설정되어 있습니다.

## Firebase 콘솔 설정

연결 프로젝트: `volleyball-c6146`.

1. [Authentication](https://console.firebase.google.com/project/volleyball-c6146/authentication/providers) → 시작하기(처음 사용 시) → 로그인 방법(Sign-in method) → **이메일/비밀번호** → 사용 설정 → 저장을 누릅니다. 이메일 링크 로그인은 켤 필요가 없습니다.
2. Authentication → 설정(Settings) → 승인된 도메인(Authorized domains) → 도메인 추가에 `volleyball-game-gamma.vercel.app`을 입력합니다. `https://`나 경로는 입력하지 않습니다. 로컬 개발에는 `localhost`와 `127.0.0.1`도 등록합니다.
3. [Firestore Database](https://console.firebase.google.com/project/volleyball-c6146/firestore) → 데이터베이스 만들기 → Standard edition(선택 화면이 있을 경우) → 데이터베이스 ID `(default)`를 선택합니다. 한국 사용자가 주 대상이면 서울 `asia-northeast3` 위치를 선택하고, **프로덕션 모드**로 생성합니다. 이미 데이터베이스가 있으면 새로 만들지 않고 다음 단계로 이동합니다.
4. Firestore → 규칙(Rules)에서 편집기 내용을 이 프로젝트의 `firestore.rules` **전체 내용**으로 바꾸고 **게시(Publish)**를 누릅니다. `players` 컬렉션은 앱이 첫 저장 시 자동으로 생성하므로 수동 생성할 필요가 없습니다. Firebase CLI를 이미 사용한다면 `firebase deploy --only firestore:rules --project volleyball-c6146`로 적용할 수도 있습니다.
5. Analytics를 사용하려면 프로젝트의 Google Analytics 연동을 확인합니다.

위 설정은 소스 변경만으로 Firebase 콘솔에 적용되지 않습니다.

운영 주소: https://volleyball-game-gamma.vercel.app. GitHub `eun9681/volleyball-game` 저장소의 `master` 브랜치 변경이 Vercel 배포를 트리거합니다. 사이트 배포와 Firebase 규칙 게시는 별개입니다.

## 계정과 저장

- 이메일과 비밀번호(최소 6자)로 회원가입/로그인합니다. Firebase에 더 엄격한 비밀번호 정책이 있으면 해당 정책이 적용됩니다.
- 로그인한 사용자는 `players/{Firebase UID}` 문서에 닉네임, 재화, 레벨, 보유 캐릭터, 선택 스테이지와 설정을 저장합니다.
- 로그인 복원 후 클라우드 기록을 먼저 읽으며, 읽기에 실패하면 서버 기록을 덮어쓰지 않습니다. 오류는 계정 창에 표시됩니다. 연결을 복구한 뒤 다시 로그인하면 불러오기를 재시도합니다.
- 비로그인 플레이 기록과 각 계정의 기기 기록은 별도 키로 저장합니다. 기존 게스트 기록은 유지되며, 새 계정은 기본 진행 상태로 시작합니다.
- 이전 로컬 서버 계정/저장 파일은 Firebase로 자동 이전되지 않습니다.
- 규칙은 사용자별 문서 접근과 데이터 형식을 검증합니다. 재화와 보상은 클라이언트에서 계산하므로 경쟁 순위나 결제 기능을 추가할 때는 서버에서 계산해야 합니다.
- Firebase 웹 설정은 클라이언트 공개 설정입니다. 서비스 계정 개인 키는 사용하지 않습니다.

## 확인

콘솔 설정 후 회원가입 → 우편 보상 수령 → 새로고침 → 재로그인하여 재화와 캐릭터가 복원되는지 확인합니다. 다른 계정으로 로그인하면 별도 기록을 사용하고, 로그아웃하면 게스트 기록으로 돌아옵니다.

SDK 설치 및 초기화 방식: [Firebase 공식 문서](https://firebase.google.com/docs/web/setup).
