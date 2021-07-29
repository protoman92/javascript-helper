import { mockSomeParameters } from "../test/utils";
import createExternalClient from "./external_client";

describe("External GraphQL client", () => {
  let client: ReturnType<typeof createExternalClient>;

  beforeEach(async () => {
    client = createExternalClient(
      ...mockSomeParameters<typeof createExternalClient>({
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
