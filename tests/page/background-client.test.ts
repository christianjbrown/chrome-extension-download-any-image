import { BackgroundClient } from "../../src/page/background-client";

describe("BackgroundClient", () => {
  it.each([
    [
      (client: BackgroundClient) => {
        client.picked("https://x/a.png", "A");
      },
      {
        target: "background",
        type: "save",
        url: "https://x/a.png",
        title: "A",
      },
    ],
    [
      (client: BackgroundClient) => {
        client.disarmed();
      },
      { target: "background", type: "disarmed" },
    ],
    [
      (client: BackgroundClient) => {
        client.failed("no");
      },
      { target: "background", type: "failed", error: "no" },
    ],
  ])("sends %#", (send, message) => {
    const sendMessage = vi.fn().mockResolvedValue(undefined);

    send(new BackgroundClient({ sendMessage }));

    expect(sendMessage).toHaveBeenCalledWith(message);
  });

  it("does not mind a service worker that is not there", async () => {
    const sendMessage = vi.fn().mockRejectedValue(new Error("gone"));

    new BackgroundClient({ sendMessage }).disarmed();

    await expect(sendMessage.mock.results[0]!.value).rejects.toThrow("gone");
  });
});
