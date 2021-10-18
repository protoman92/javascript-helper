import runOnce from "./run_once"

import * as run_once from "./run_once"
describe("Run once", () => {
  it("Should run function only once", async () => {
    // Setup
    let callCount = 0;

    const fn = runOnce(async () => {
      callCount += 1;
      return callCount;
    });

    // When && Then
    const result1 = await fn();
    const result2 = await fn();
    expect(result1).toEqual(1);
    expect(result2).toEqual(1);
  });
});

// @ponicode
describe("run_once.default", () => {
    test("0", () => {
        let callFunction: any = () => {
            run_once.default(() => true)
        }
    
        expect(callFunction).not.toThrow()
    })

    test("1", () => {
        let callFunction: any = () => {
            run_once.default(() => 0)
        }
    
        expect(callFunction).not.toThrow()
    })

    test("2", () => {
        let callFunction: any = () => {
            run_once.default(() => "return callback value")
        }
    
        expect(callFunction).not.toThrow()
    })

    test("3", () => {
        let callFunction: any = () => {
            run_once.default(() => false)
        }
    
        expect(callFunction).not.toThrow()
    })

    test("4", () => {
        let callFunction: any = () => {
            run_once.default(() => -5.48)
        }
    
        expect(callFunction).not.toThrow()
    })

    test("5", () => {
        let callFunction: any = () => {
            run_once.default(() => -Infinity)
        }
    
        expect(callFunction).not.toThrow()
    })
})
