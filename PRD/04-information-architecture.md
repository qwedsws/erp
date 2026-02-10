# 4. 화면 구조 (Information Architecture)

```
/                           # 메인 대시보드
├── /sales                  # 영업 관리
│   ├── /quotes             # 견적 목록
│   │   ├── /new            # 견적 등록
│   │   └── /[id]           # 견적 상세
│   ├── /orders             # 수주 목록
│   │   ├── /new            # 수주 등록
│   │   └── /[id]           # 수주 상세
│   └── /customers          # 고객 관리
│       ├── /new
│       └── /[id]
│
├── /projects               # 프로젝트(금형) 관리
│   ├── /                   # 프로젝트 목록 (칸반/목록 뷰 + 캘린더 링크)
│   ├── /calendar           # 프로젝트 캘린더 (월별 일정 뷰, 납기/시작/완료 이벤트, 기간 바 차트)
│   ├── /[id]               # 프로젝트 상세
│   │   ├── /design         # 설계 공정 현황 (산출물, 진행률)
│   │   ├── /bom            # BOM 관리
│   │   ├── /process        # 전체 공정 계획 (설계+가공+조립)
│   │   ├── /schedule       # 일정
│   │   ├── /quality        # 품질/검사
│   │   ├── /cost           # 원가
│   │   └── /files          # 도면/파일
│   └── /gantt              # 전체 프로젝트 간트 차트
│
├── /design                 # 설계 관리 (독립 메뉴)
│   ├── /processes          # 설계 공정 현황 (전체 프로젝트 설계 공정 대시보드)
│   ├── /manage             # 설계 공정 관리 (프로젝트 그리드 카드 → 모달로 공정 추가/삭제)
│   ├── /assignments        # 업무 배정 (설계자 배정/재배정, 일괄 배정)
│   ├── /workload           # 설계 통계 (공정 분포 차트, 설계자별 비교, 프로젝트 진행률)
│   ├── /bom                # BOM 관리
│   └── /changes            # 설계 변경 관리 (ECR/ECO)
│
├── /production             # 생산 관리
│   ├── /work-orders        # 작업 지시 목록 (설계+가공 통합)
│   │   └── /[id]           # 작업 지시 상세
│   ├── /schedule           # 설비 스케줄 (간트)
│   ├── /design-schedule    # 설계자 스케줄 (간트)
│   ├── /outsource          # 외주 관리
│   │   └── /[id]
│   └── /dashboard          # 현장 대시보드
│
├── /materials              # 자재/구매
│   ├── /inventory          # 재고 현황 (KPI + DataTable)
│   ├── /items              # 자재 마스터 (품목 목록)
│   │   ├── /new            # 품목 등록
│   │   └── /[id]           # 품목 상세 (기본정보 + 재고 + 입출고 이력)
│   ├── /suppliers          # 거래처 관리 (공급업체 CRUD)
│   │   ├── /new            # 거래처 등록
│   │   └── /[id]           # 거래처 상세 (발주이력 + 공급품목)
│   ├── /purchase-requests   # 구매요청 관리
│   │   └── /new            # 구매요청 등록
│   ├── /purchase-orders    # 발주 관리
│   │   ├── /new            # 발주 등록 (품목 라인 동적 추가)
│   │   └── /[id]           # 발주 상세 (품목 + 입고이력 + 상태변경)
│   ├── /receiving          # 입고 관리
│   │   └── /new            # 입고 등록 (발주기반/직접 입고)
│   └── /statistics         # 자재/구매 통계
│
├── /quality                # 품질 관리
│   ├── /inspections        # 검사 관리
│   ├── /tryouts            # 트라이아웃
│   │   └── /[id]
│   └── /claims             # 클레임/불량
│
├── /facilities             # 설비 관리
│   ├── /machines           # 설비 목록
│   │   └── /[id]
│   └── /maintenance        # 보전 관리
│
├── /cost                   # 원가 분석
│   ├── /projects           # 프로젝트별 원가
│   └── /analysis           # 원가 분석 리포트
│
├── /statistics             # 통계/분석
│   ├── /sales              # 영업 통계 (매출 추이, 고객별, 입금 분석)
│   ├── /production         # 생산 통계 (납기 준수율, 가동률, 공정 분석)
│   ├── /quality            # 품질 통계 (불량률, T/O 분석, 클레임)
│   ├── /cost               # 원가 통계 (수익성, 원가율, 적자 분석)
│   ├── /materials          # 자재 통계 (소비 추이, 재고 회전율)
│   └── /executive          # 경영 종합 통계 (KPI 대시보드, 월간 리포트)
│
├── /accounting             # 회계/정산
│   ├── /item-policies      # 품목 회계처리항목/기본계정 정책
│   ├── /journals           # 전표 조회 (자동/수동)
│   ├── /general-ledger     # 총계정원장
│   ├── /sales-ledger       # 매출 보조원장 (AR)
│   ├── /purchase-ledger    # 매입 보조원장 (AP)
│   ├── /receivables        # 미수금 현황/에이징
│   ├── /payables           # 미지급금 현황/에이징
│   └── /closing            # 월마감
│
└── /admin                  # 시스템 관리
    ├── /users              # 사용자 관리
    ├── /roles              # 역할/권한 관리
    ├── /codes              # 공통 코드 관리
    └── /data-integrity     # 데이터 정합성 점검 (project_id 누락률, 상태 불일치, 문서 연결)
```

---

