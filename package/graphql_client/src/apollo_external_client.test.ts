import { mockSomeParameters } from "@haipham/javascript-helper-test-utils";
import { createApolloGraphQLClient } from "./apollo_external_client";

describe("External GraphQL client", () => {
  let client: ReturnType<typeof createApolloGraphQLClient>;

  beforeEach(async () => {
    client = createApolloGraphQLClient(
      ...mockSomeParameters<typeof createApolloGraphQLClient>({
        cache: {},
        link: {},
      })
    );
  });

  it("Should retry when requested by interceptor", async () => {
    // Setup
    const error = new Error("some-error");
    const maxCallCount = 5;
    const requestWithoutInterceptors = jest.fn();
    let callCount = 0;

    requestWithoutInterceptors.mockImplementation(async () => {
      callCount += 1;
      throw error;
    });

    client.requestWithoutInterceptors = requestWithoutInterceptors;

    client.useErrorInterceptor(async () => {
      if (callCount < maxCallCount) return { type: "RETRY" };
      return { type: "NOOP" };
    });

    try {
      // When
      await client.request(...mockSomeParameters<typeof client["request"]>({}));
    } catch (caughtError) {
      expect(caughtError).toEqual(error);
    } finally {
      // Then
      expect(callCount).toEqual(maxCallCount);
      expect(requestWithoutInterceptors.mock.calls).toMatchSnapshot();
    }
  });
});
