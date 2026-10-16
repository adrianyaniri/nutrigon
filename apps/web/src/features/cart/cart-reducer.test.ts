import { describe, expect, it } from "vitest";
import { cartReducer, countCartItems, initialCartState } from "./cart-reducer";

describe("cartReducer", () => {
  it("adds a new product with quantity 1", () => {
    const state = cartReducer(initialCartState, { type: "add", branchSlug: "centro", productId: "a" });
    expect(state).toEqual({ branchSlug: "centro", lines: [{ productId: "a", quantity: 1 }] });
  });

  it("increments quantity when the product is already in the cart", () => {
    let state = cartReducer(initialCartState, { type: "add", branchSlug: "centro", productId: "a" });
    state = cartReducer(state, { type: "add", branchSlug: "centro", productId: "a" });
    expect(state.lines).toEqual([{ productId: "a", quantity: 2 }]);
    expect(countCartItems(state)).toBe(2);
  });

  it("resets the cart when adding from a different branch", () => {
    let state = cartReducer(initialCartState, { type: "add", branchSlug: "centro", productId: "a" });
    state = cartReducer(state, { type: "add", branchSlug: "norte", productId: "b" });
    expect(state).toEqual({ branchSlug: "norte", lines: [{ productId: "b", quantity: 1 }] });
  });

  it("removes a product line and clears the cart", () => {
    let state = cartReducer(initialCartState, { type: "add", branchSlug: "centro", productId: "a" });
    state = cartReducer(state, { type: "add", branchSlug: "centro", productId: "b" });
    state = cartReducer(state, { type: "remove", productId: "a" });
    expect(state.lines).toEqual([{ productId: "b", quantity: 1 }]);
    expect(cartReducer(state, { type: "clear" })).toEqual(initialCartState);
  });

  it("decrements quantity when quantity > 1", () => {
    let state = cartReducer(initialCartState, { type: "add", branchSlug: "centro", productId: "a" });
    state = cartReducer(state, { type: "add", branchSlug: "centro", productId: "a" });
    state = cartReducer(state, { type: "decrement", productId: "a" });
    expect(state.lines).toEqual([{ productId: "a", quantity: 1 }]);
  });

  it("removes product when decrementing quantity of 1", () => {
    let state = cartReducer(initialCartState, { type: "add", branchSlug: "centro", productId: "a" });
    state = cartReducer(state, { type: "decrement", productId: "a" });
    expect(state.lines).toEqual([]);
  });

  it("sets explicit quantity and removes product when quantity <= 0", () => {
    let state = cartReducer(initialCartState, { type: "add", branchSlug: "centro", productId: "a" });
    state = cartReducer(state, { type: "setQuantity", productId: "a", quantity: 5 });
    expect(state.lines).toEqual([{ productId: "a", quantity: 5 }]);
    state = cartReducer(state, { type: "setQuantity", productId: "a", quantity: 0 });
    expect(state.lines).toEqual([]);
  });
});

