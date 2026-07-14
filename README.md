# 주식 flow

`map_g`를 비우고 다시 만든 순수 정적 대시보드입니다.

## 핵심 원칙

- `env`, `pem`, API 키, DB 연결, 브라우저 외부 호출을 넣지 않습니다.
- 화면은 저장소 안의 `data/latest.js`와 `data/latest.json`만 읽습니다.
- 한 시간마다 갱신하고 싶으면 로컬에서 `scripts/update_snapshot.py`를 실행하면 됩니다.

## 파일 구조

- `index.html`: 메인 화면
- `styles.css`: 정적 스타일
- `app.js`: 렌더링 로직
- `data/latest.json`: 기계용 스냅샷
- `data/latest.js`: 브라우저 로더용 스냅샷
- `scripts/sample_input.json`: 수정 가능한 입력 예시
- `scripts/update_snapshot.py`: 입력 JSON을 latest 파일로 변환하는 로컬 스크립트

## 갱신 방법

```bash
python3 scripts/update_snapshot.py --input scripts/sample_input.json
```

입력 JSON을 바꾼 뒤 위 명령을 다시 실행하면 `latest.json`과 `latest.js`가 같이 갱신됩니다.

## GitHub 업로드 전 체크

- `git ls-files | rg '\.env|\.pem|\.key|\.crt|\.p12'`
- 민감 키 문자열 검사는 실제 업로드 직전에 콘솔에서 별도로 실행해 확인합니다.

위 파일 검사 결과가 비어 있어야 공개 업로드를 권장합니다.

## 주의

현재 버전은 외부 자동수집을 의도적으로 넣지 않았습니다.
외부 뉴스/금융 사이트를 주기적으로 수집하는 단계는 별도 보안 검토 후 추가하는 편이 안전합니다.
