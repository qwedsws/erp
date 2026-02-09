# 13. 아키텍처

> 상세 문서: [`clean_architecture.md`](../clean_architecture.md)

MoldERP는 **클린 아키텍처(Clean Architecture)** 원칙을 적용하여 비즈니스 로직을 UI와 인프라로부터 분리한다.

### 13.1 레이어 구조

```
Presentation (Pages/Components)
  ↓
Hooks (React 브리지)
  ↓
Store (Zustand — 얇은 캐시, 비즈니스 로직 없음)
  ↓
Infrastructure (Repository 구현체, DI Container)
  ↓
Domain (Entities, Ports, Services, Use Cases)
```

- **Domain**: 순수 TypeScript. React·Zustand·Supabase 의존성 없음. 엔티티 타입, Repository 인터페이스(Port), 비즈니스 규칙(Service), 워크플로우(Use Case) 정의.
- **Infrastructure**: Domain Port의 구현체. Mock(개발용)과 Supabase(프로덕션) 두 벌 유지. DI Container로 교체.
- **Store**: Zustand Slice로 분리. 데이터 캐시와 로딩 상태만 관리. `addOrder`, `updateProject` 등의 비즈니스 메서드 없음.
- **Hooks**: Use Case를 호출하고 Store를 구독하여 React 컴포넌트에 데이터를 제공하는 브리지.
- **Presentation**: Next.js 페이지와 컴포넌트. Hook만 사용하여 데이터 접근.

### 13.2 핵심 원칙

| 원칙 | 설명 |
|------|------|
| 의존성 역전 | Domain이 Infrastructure를 모른다. Port(인터페이스)로 소통 |
| 단일 책임 | Store=캐시, UseCase=워크플로우, Service=비즈니스 규칙 |
| 교체 가능성 | DI Container에서 Mock ↔ Supabase 한 줄 교체 |
| 점진적 마이그레이션 | 현재 모놀리식 Store와 공존하면서 모듈 단위 전환 |

---

