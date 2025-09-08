# Architecture Principles
- Prefer simple, composable modules; avoid global state.
- Backend: Node 22.x, AWS CDK v2, least‑privilege IAM.
- React: Type‑safe components, no implicit any, hooks over classes.
- Observability: logs with correlation IDs; avoid noisy logs.
- Public APIs: validate input, consistent errors, rate‑limit capable.
