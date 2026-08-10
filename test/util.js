export const players = {}

const createMockAPI = (id) => {
    const api = () => {};
    const on = jest.fn(() => api);
    const once = jest.fn(() => api);
    const off = jest.fn(() => api);
    const remove = jest.fn(() => api);
    const setup = jest.fn(() => api);
    const load = jest.fn(() => api);

    Object.assign(api, { on, once, off, remove, setup, load });
    players[id] = api;

    return api;
}

export const mockLibrary = (id) => {
    return players[id] || createMockAPI(id);
}
