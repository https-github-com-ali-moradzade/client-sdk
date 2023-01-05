import {it, expect} from "vitest";
import {ClientSDK} from "./ClientSDK";

it("should be able to create a ClientSDK instance", () => {
    const clientSDK = new ClientSDK("123", "123", "123");
    expect(clientSDK).toBeDefined();
});
