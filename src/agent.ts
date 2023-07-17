import Api from "./api.ts";

export default class Agent<T> {
  #getter: () => Promise<T>;
  #refresh: number;
  #currentPromise!: Promise<T>;

  public constructor(getter: () => Promise<T>, refreshMs: number) {
    this.#getter = getter;
    this.#refresh = refreshMs;

    const init = () => {
      this.#currentPromise = getter();
    };

    init();
    setInterval(init, refreshMs);
  }

  public get(): Promise<T> {
    return this.#currentPromise;
  }
}
