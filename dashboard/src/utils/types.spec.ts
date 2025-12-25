import type { Nullable, QueryParams, Range, User } from "./types";

describe("utils/types.ts", () => {
  it("defines expected type shapes", () => {
    expectTypeOf<Range>().toEqualTypeOf<{ from: string; to: string }>();
    expectTypeOf<Nullable<number>>().toEqualTypeOf<number | null>();
    expectTypeOf<QueryParams>().toEqualTypeOf<
      Record<string, string | number | boolean | undefined>
    >();
    expectTypeOf<User>().toHaveProperty("userId");
    expectTypeOf<User>().toHaveProperty("username");
  });
});
