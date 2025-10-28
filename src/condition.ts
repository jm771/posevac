export enum Matcher {
  Wild,
  Zero,
  One,
  NotZero,
  NotOne,
}

export const MATCHER_LABELS = {
  [Matcher.Wild]: "*",
  [Matcher.Zero]: "0",
  [Matcher.One]: "1",
  [Matcher.NotZero]: "!0",
  [Matcher.NotOne]: "!1",
};

function matcherMatches(matcher: Matcher, value: unknown) {
  switch (matcher) {
    case Matcher.Wild:
      return true;
    case Matcher.Zero:
      return value === 0;
    case Matcher.One:
      return value === 1;
    case Matcher.NotZero:
      return value !== 0;
    case Matcher.NotOne:
      return value !== 1;
  }
}

export class Condition {
  matchers: Matcher[];

  constructor(matchers: Matcher[]) {
    this.matchers = matchers;
  }

  matches(values: unknown | unknown[]) {
    if (this.matchers.length === 0) {
      return true;
    }

    if (values instanceof Array) {
      if (values.length == this.matchers.length) {
        return values.every((val, index) =>
          matcherMatches(this.matchers[index], val)
        );
      }
    } else {
      if (this.matchers.length == 1) {
        return matcherMatches(this.matchers[0], values);
      }
    }

    return false;
  }
}
