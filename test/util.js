export const players = {}

const createMockAPI = (id) => {
    const api = () => {};
    const on = jest.fn(() => api);
    const once = jest.fn(() => api);
    const remove = jest.fn(() => api);
    const setup = jest.fn(() => api);

    Object.assign(api, { on, once, remove, setup });
    players[id] = api;

    return api;
}

export const cleanupMockLoading = () => {
    window.jwplayer = null;
}

export const mockLibrary = (id) => {
    return players[id] || createMockAPI(id);
}
