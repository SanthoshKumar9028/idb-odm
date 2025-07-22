import { describe, it, expect } from "vitest";
import { BaseQueryExecutor } from ".";

describe("BaseQueryExecutor", () => {
    const queryExecutor = new BaseQueryExecutor();

    const mockIdb: any = {
        transaction: () => ({
            objectStore() {
                return {
                    getAll() {
                        const event = { onsuccess(...params: any[]) { } };
                        setTimeout(() => event.onsuccess({ result: [{ one: 1 }] }), 0);
                        return event;
                    }
                }
            }
        })
    }

    it("should throw error", async () => {
        await expect(queryExecutor.find({ $query: "" })).rejects.toThrowError();
        await expect(queryExecutor.find({ $query: "" }, { idb: mockIdb, storeNames: "" })).rejects.toThrowError();
    });

    describe("find", () => {
        it("should return array", async () => {
            const data = await queryExecutor.find({ $query: "" }, { idb: mockIdb, storeNames: "test" });
            expect(data).toEqual([{ one: 1 }]);
        });
    })

    describe("findById", () => {
        const mockIdb: any = {
            transaction: () => ({
                objectStore() {
                    return {
                        getAll() {
                            const event = { onsuccess(...params: any[]) { } };
                            setTimeout(() => event.onsuccess({ result: { one: 1 } }), 0);
                            return event;
                        }
                    }
                }
            })
        }

        it("should return value", async () => {
            const data = await queryExecutor.find({ $query: "" }, { idb: mockIdb, storeNames: "test" });
            expect(data).toEqual({ one: 1 });
        });
    })
})