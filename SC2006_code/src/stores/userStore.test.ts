import { createPinia, setActivePinia } from 'pinia';
import { useUserStore } from './userStore';
import { beforeEach, test, expect, describe } from 'vitest';

describe.sequential('userStore', async () => {

beforeEach(async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    const userStore = useUserStore();
    await userStore.initUser();
});

test('login', async () => {
    const userStore = useUserStore();
    userStore.initUser();
    await userStore.loginUser("authtest@gmail.com","123456");
    expect(userStore.user).not.toBe(null);
    if (userStore.user) {
        expect(userStore.user.id).toBe("898d1840-7f38-4624-af1b-f8e15d26144a");
    }
})

test('change password', async () => {
    const userStore = useUserStore();
    userStore.initUser();
    await userStore.updateUserAccount({password: "654321"});
    await userStore.loginUser("authtest@gmail.com","654321");
    expect(userStore.user).not.toBe(null);
    if (userStore.user) {
        expect(userStore.user.id).toBe("898d1840-7f38-4624-af1b-f8e15d26144a");
    }
    
    
})

test('change password back', async () => {
    const userStore = useUserStore();
    userStore.initUser();
    await userStore.updateUserAccount({password: "123456"});
    await userStore.loginUser("authtest@gmail.com","123456");
    expect(userStore.user).not.toBe(null);
    if (userStore.user) {
        expect(userStore.user.id).toBe("898d1840-7f38-4624-af1b-f8e15d26144a");
    }
})

test('log out', async () => {
    const userStore = useUserStore();
    userStore.initUser();
    await userStore.logoutUser();
    expect(userStore.user).toBe(null);
});

});